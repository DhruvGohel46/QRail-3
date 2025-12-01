from flask import Flask, request, jsonify, send_file, send_from_directory, session
from flask_cors import CORS
from functools import wraps
from datetime import datetime
import os
import sys
import traceback
import random
import secrets
import logging
import base64
import ollama
from email_sender import send_email_smtp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

qrail_path = os.environ.get('QRail')
if qrail_path:
    sys.path.insert(0, qrail_path)

# Internal modules
from railway_xml_db import RailwayXMLDatabase
from railway_user_manager import RailwayUserManager
from qr_reader import RailwayQRReader

# Optional QR generator
try:
    from qr_generator import RailwayQRGenerator
    QR_GEN_AVAILABLE = True
except Exception:
    QR_GEN_AVAILABLE = False

# -----------------------------------------------------------------------------
# App setup
# -----------------------------------------------------------------------------
# Point Flask to the React build output under Frontend/build
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REACT_BUILD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "Frontend", "build"))

app = Flask(
    __name__,
    static_folder=REACT_BUILD_DIR,
    static_url_path="",
    template_folder=REACT_BUILD_DIR,
)

# Enable CORS with credentials support for React dev server
CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

# Secret key for sessions
app.secret_key = '678ca0f01584d2f7a836a947a7b9590266459ecc9f09204659926d23c07067ed'

# Session cookie configuration
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
app.config["SESSION_COOKIE_SECURE"] = os.getenv("SESSION_COOKIE_SECURE", "0") == "1"  # Set to "1" in production with HTTPS

# -----------------------------------------------------------------------------
# Services
# -----------------------------------------------------------------------------
db = RailwayXMLDatabase()
user_manager = RailwayUserManager()
qr_reader = RailwayQRReader()
qr_generator = RailwayQRGenerator() if QR_GEN_AVAILABLE else None

# OTP storage (simple in-memory store). For production use persistent store.
# The user requested a variable named 'otp' to store the sent 6-digit number.
otp = None
otp_store = {}         # map email -> otp
verified_emails = set()  # emails that have verified OTP


# Email sending is delegated to backend/email_sender.py -> send_email_smtp

# -----------------------------------------------------------------------------
# Helpers: auth and permissions
# -----------------------------------------------------------------------------
def require_auth(f):
    @wraps(f)
    def _wrap(*args, **kwargs):
        if "user" not in session:
            return jsonify(success=False, error="Authentication required"), 401
        return f(*args, **kwargs)
    return _wrap

def require_permission(permission):
    def decorator(f):
        @wraps(f)
        def _wrap(*args, **kwargs):
            if "user" not in session:
                return jsonify(success=False, error="Authentication required"), 401
            role = session["user"].get("role")
            if not user_manager.check_permission(role, permission):
                return jsonify(success=False, error="Permission denied"), 403
            return f(*args, **kwargs)
        return _wrap
    return decorator

# -----------------------------------------------------------------------------
# Static + health
# -----------------------------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    """Serve React SPA entry point"""
    try:
        return send_from_directory(REACT_BUILD_DIR, "index.html")
    except Exception:
        return jsonify(
            success=True,
            message="Backend running; React build not found. Run 'npm run build' in frontend folder.",
        )

@app.route("/health", methods=["GET"])
def health():
    try:
        assets = db.get_all_assets()
        return jsonify(
            status="healthy",
            timestamp=datetime.now().isoformat(),
            qr_generator_available=QR_GEN_AVAILABLE,
            assets_count=len(assets),
        )
    except Exception as e:
        return jsonify(
            status="degraded",
            timestamp=datetime.now().isoformat(),
            error=str(e),
            qr_generator_available=QR_GEN_AVAILABLE,
        ), 500

# Serve SPA routes and static assets
@app.route('/<path:path>')
def static_proxy(path):
    try:
        full_path = os.path.join(REACT_BUILD_DIR, path)
        if os.path.isfile(full_path):
            return send_from_directory(REACT_BUILD_DIR, path)
        # If not a file, serve SPA index for client-side routing
        return send_from_directory(REACT_BUILD_DIR, 'index.html')
    except Exception:
        return jsonify(
            success=False,
            error="Asset not found and SPA index unavailable. Build the frontend."
        ), 404

# -----------------------------------------------------------------------------
# Authentication
# -----------------------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json(force=True)
        username = data.get("username")
        password = data.get("password")
        requested_role = data.get("role")

        if not username or not password:
            return jsonify(success=False, error="Username and password required"), 400

        if not requested_role:
            return jsonify(success=False, error="User type (role) is required"), 400

        user = user_manager.authenticate_user(username, password)
        if not user:
            # Check if pending approval
            status = user_manager.check_credentials_status(username, password)
            if status.get("matches") and not status.get("active"):
                return jsonify(success=False, error="Your account is pending admin approval"), 403
            return jsonify(success=False, error="Invalid credentials"), 401

        # Verify role matches
        if requested_role not in ("manufacturer", "engineer", "worker", "admin"):
            return jsonify(success=False, error="Invalid user type selected"), 400

        if requested_role != user.get("role"):
            return jsonify(success=False, error=f"User '{username}' is not associated with the '{requested_role}' role"), 403

        session["user"] = user
        return jsonify(success=True, user=user, message=f"Welcome {user['name']} ({user['role']})")

    except Exception as e:
        return jsonify(success=False, error=str(e)), 500


@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    """Generate and send a 6-digit OTP to the provided email address."""
    try:
        data = request.get_json(force=True)
        email = data.get("email")
        if not email:
            return jsonify(success=False, error="email is required"), 400

        # Generate 6-digit OTP
        import random as _rand
        global otp
        otp = f"{_rand.randint(0, 999999):06d}"
        otp_store[email] = otp

        # Send email
        subject = "Your QRail verification code"
        body = f"Your QRail verification code is: {otp}\nIt will expire shortly."
        sent = send_email_smtp(email, subject, body)

        if not sent:
            # In development, if SMTP is not configured, log the OTP. Only return the OTP
            # in the API response if explicitly enabled via env SHOW_OTP_IN_RESPONSE=1
            logger.info("OTP for %s (not emailed): %s", email, otp)
            if os.getenv('SHOW_OTP_IN_RESPONSE', '0').lower() in ('1', 'true', 'yes'):
                return jsonify(success=True, otp=otp, message="OTP generated (SMTP not configured and returned for dev)")
            return jsonify(success=True, message="OTP generated (not emailed)")

        return jsonify(success=True, message="OTP sent to email")
    except Exception as e:
        logger.error(f"Error sending OTP: %s", e)
        return jsonify(success=False, error=str(e)), 500


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    """Verify submitted OTP for the given email."""
    try:
        data = request.get_json(force=True)
        email = data.get("email")
        otp_input = data.get("otp")
        if not email or not otp_input:
            return jsonify(success=False, error="email and otp are required"), 400

        expected = otp_store.get(email)
        # Also accept last sent otp variable for compatibility
        if expected is None and 'otp' in globals():
            expected = globals().get('otp')

        if expected and str(otp_input).strip() == str(expected).strip():
            verified_emails.add(email)
            # clear stored otp for email
            otp_store.pop(email, None)
            globals()['otp'] = None
            return jsonify(success=True, message="OTP verified")

        return jsonify(success=False, error="Invalid OTP"), 400
    except Exception as e:
        logger.error(f"Error verifying OTP: %s", e)
        return jsonify(success=False, error=str(e)), 500


@app.route("/api/test-email", methods=["POST"])
def test_email():
    """Diagnostic endpoint: check SMTP env and attempt to connect/login.

    Returns masked SMTP configuration and connection/login test result.
    POST payload (optional): { "to": "you@domain.com" }
    """
    try:
        payload = request.get_json(silent=True) or {}
        to_addr = payload.get("to") or os.getenv("SMTP_FROM") or os.getenv("SMTP_USER")

        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass_present = bool(os.getenv("SMTP_PASS"))

        config = {
            "smtp_host": smtp_host,
            "smtp_port": smtp_port,
            "smtp_user_present": bool(smtp_user),
            "smtp_pass_present": smtp_pass_present,
            "smtp_from": os.getenv("SMTP_FROM", smtp_user)
        }

        # Try to connect and login to SMTP to get actionable error
        import smtplib, ssl
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls(context=context)
                if not smtp_user or not os.getenv("SMTP_PASS"):
                    # can't login without credentials; report config status
                    return jsonify(success=True, config=config, test="no-credentials", message="SMTP reachable but credentials missing" )
                server.login(smtp_user, os.getenv("SMTP_PASS"))
                # optionally send a tiny test message (but avoid sending unsolicited mail)
            return jsonify(success=True, config=config, test="ok", message="SMTP login successful")
        except Exception as smtp_ex:
            # Return exception message to help debug (avoid leaking password)
            logger.exception("SMTP test failed")
            return jsonify(success=False, config=config, error=str(smtp_ex)), 200

    except Exception as e:
        logger.exception("Error in test-email endpoint")
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json(force=True)
        required = ["username", "password", "role", "name", "email"]
        missing = [f for f in required if not data.get(f)]

        if missing:
            return jsonify(success=False, error=f"Missing fields: {', '.join(missing)}"), 400

        if data.get("role") not in ("manufacturer", "engineer", "worker", "admin"):
            return jsonify(success=False, error="Invalid role"), 400

        # Require OTP verification before creating the pending user
        email = data.get("email")
        if email not in verified_emails:
            return jsonify(success=False, error="Email not verified. Please verify OTP before registering."), 400

        # Remove verification mark after use
        verified_emails.discard(email)

        new_id = user_manager.create_pending_user(data)
        return jsonify(success=True, id=new_id, message="Registration submitted. Await admin approval."), 201

    except ValueError as ve:
        return jsonify(success=False, error=str(ve)), 400
    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify(success=True, message="Logged out successfully")

@app.route("/api/check-session", methods=["GET"])
def check_session():
    """Check if user is authenticated"""
    if "user" in session:
        return jsonify(authenticated=True, user=session["user"])
    return jsonify(authenticated=False)

@app.route("/api/profile", methods=["GET"])
@require_auth
def profile():
    return jsonify(success=True, user=session["user"])

# -----------------------------------------------------------------------------
# Admin: user management
# -----------------------------------------------------------------------------

@app.route("/api/admin/users", methods=["GET"])
@require_permission("can_manage_users")
def list_all_users():
    """Get all active users and pending users separately"""
    try:
        all_users = user_manager.get_all_users(include_pending=True)
        
        # Separate into active and pending
        active_users = [u for u in all_users if u.get("active", "").lower() == "true"]
        pending_users = [u for u in all_users if u.get("active", "").lower() == "pending"]
        
        return jsonify(
            success=True, 
            active_users=active_users,
            pending_users=pending_users
        )
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/admin/pending-users", methods=["GET"])
@require_permission("can_manage_users")
def list_pending_users():
    """Get pending users (keep for backward compatibility)"""
    try:
        users = user_manager.list_pending_users()
        return jsonify(success=True, users=users)
    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/admin/approve-user", methods=["POST"])
@require_permission("can_manage_users")
def approve_user():
    try:
        data = request.get_json(force=True)
        username = data.get("username")
        if not username:
            return jsonify(success=False, error="username is required"), 400
        
        # Get user details before approval (for email)
        all_users = user_manager.get_all_users(include_pending=True)
        user = next((u for u in all_users if u.get("username") == username), None)
        
        if not user:
            return jsonify(success=False, error="User not found"), 404
        
        # Approve the user
        if not user_manager.approve_user(username):
            return jsonify(success=False, error="Failed to approve user"), 500
        
        # Send approval email
        user_email = user.get("email")
        user_name = user.get("name", username)
        
        if user_email:
            subject = "QRail Registration Approved ✅"
            body = f'''Dear {user_name},

Congratulations! Your registration request for QRail has been approved by the administrator.

Username: {username}
Role: {user.get("role", "N/A")}

You can now log in to the QRail system using your credentials.

Best regards,
QRail Admin Team
'''
            try:
                send_email_smtp(user_email, subject, body)
                logger.info(f"Approval email sent to {user_email}")
            except Exception as email_error:
                logger.error(f"Failed to send approval email: {email_error}")
        
        return jsonify(success=True, message=f"Approved {username}")
    except Exception as e:
        logger.error(f"Error approving user: {e}")
        return jsonify(success=False, error=str(e)), 500


@app.route("/api/admin/reject-user", methods=["POST"])
@require_permission("can_manage_users")
def reject_user():
    try:
        data = request.get_json(force=True)
        username = data.get("username")
        if not username:
            return jsonify(success=False, error="username is required"), 400
        
        # Get user details before rejection (for email)
        all_users = user_manager.get_all_users(include_pending=True)
        user = next((u for u in all_users if u.get("username") == username), None)
        
        if not user:
            return jsonify(success=False, error="User not found"), 404
        
        # Reject the user
        if not user_manager.reject_user(username):
            return jsonify(success=False, error="Failed to reject user"), 500
        
        # Send rejection email
        user_email = user.get("email")
        user_name = user.get("name", username)
        
        if user_email:
            subject = "QRail Registration Request Update"
            body = f'''Dear {user_name},

We regret to inform you that your registration request for QRail has been reviewed and not approved at this time.

Username: {username}
Role: {user.get("role", "N/A")}

Thank you for your interest in QRail.

If you have any questions or would like to reapply, please contact the administrator.

Best regards,
QRail Admin Team
'''
            try:
                send_email_smtp(user_email, subject, body)
                logger.info(f"Rejection email sent to {user_email}")
            except Exception as email_error:
                logger.error(f"Failed to send rejection email: {email_error}")
        
        return jsonify(success=True, message=f"Rejected {username}")
    except Exception as e:
        logger.error(f"Error rejecting user: {e}")
        return jsonify(success=False, error=str(e)), 500


@app.route("/api/admin/delete-user", methods=["DELETE"])
@require_permission("can_manage_users")
def delete_user():
    """Delete an active user"""
    try:
        data = request.get_json(force=True)
        username = data.get("username")
        if not username:
            return jsonify(success=False, error="username is required"), 400
        
        # Prevent deleting yourself
        if session["user"].get("username") == username:
            return jsonify(success=False, error="Cannot delete your own account"), 400
        
        # Get user details before deletion (for email)
        all_users = user_manager.get_all_users(include_pending=True)
        user = next((u for u in all_users if u.get("username") == username), None)
        
        if not user:
            return jsonify(success=False, error="User not found"), 404
        
        # Delete the user
        if not user_manager.delete_user(username):
            return jsonify(success=False, error="Failed to delete user"), 500
        
        # Send deletion email
        user_email = user.get("email")
        user_name = user.get("name", username)
        
        if user_email:
            subject = "QRail Account Deletion Notice"
            body = f'''Dear {user_name},

This is to inform you that your QRail account has been deleted by the administrator.

Username: {username}
Role: {user.get("role", "N/A")}

Your access to the QRail system has been removed. If you believe this was done in error, please contact the administrator.

Best regards,
QRail Admin Team
'''
            try:
                send_email_smtp(user_email, subject, body)
                logger.info(f"Deletion email sent to {user_email}")
            except Exception as email_error:
                logger.error(f"Failed to send deletion email: {email_error}")
        
        return jsonify(success=True, message=f"User {username} deleted successfully")
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/admin/create-admin", methods=["POST"])
@require_permission("can_manage_users")
def create_admin():
    """Create a new admin user"""
    try:
        data = request.get_json(force=True)
        
        required = ["username", "password", "name", "email"]
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify(success=False, error=f"Missing fields: {', '.join(missing)}"), 400
        
        new_id = user_manager.create_admin_user(data)
        
        return jsonify(
            success=True, 
            id=new_id, 
            message=f"Admin user '{data.get('username')}' created successfully"
        ), 201
        
    except ValueError as ve:
        return jsonify(success=False, error=str(ve)), 400
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        return jsonify(success=False, error=str(e)), 500

# -----------------------------------------------------------------------------
# QR scanning
# -----------------------------------------------------------------------------
@app.route("/api/scan-qr", methods=["POST"])
@require_permission("can_scan_qr")
def scan_qr():
    """Scan QR from text/JSON data"""
    try:
        data = request.get_json(force=True)
        qr_data = data.get("qr_data")

        if not qr_data:
            return jsonify(success=False, error="QR data is required"), 400

        # Parse QR payload
        import json
        try:
            payload = json.loads(qr_data)
        except:
            payload = {"data": qr_data}

        asset_id = payload.get("aid") or payload.get("asset_id")
        
        if asset_id:
            asset_el = db.find_asset(asset_id)
            asset = db.get_asset_dict(asset_el) if asset_el is not None else None
            return jsonify(success=True, asset=asset, assetId=asset_id, payload=payload)
        
        return jsonify(success=False, error="No asset ID found in QR data"), 400

    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/scan-qr-file", methods=["POST"])
@require_permission("can_scan_qr")
def scan_qr_file():
    """Scan QR from uploaded image file"""
    try:
        if "file" not in request.files and "qr_image" not in request.files:
            return jsonify(success=False, error="No file provided"), 400

        file = request.files.get("file") or request.files.get("qr_image")

        if file.filename == "":
            return jsonify(success=False, error="No file selected"), 400

        # Read image data
        image_bytes = file.read()
        if len(image_bytes) == 0:
            return jsonify(success=False, error="Empty file uploaded"), 400

        # Check dependencies
        if not qr_reader.dependencies_available:
            return jsonify(
                success=False,
                error="QR detection libraries not available. Install: pip install opencv-python pyzbar"
            ), 500

        # Scan QR
        success, qr_data, payload = qr_reader.read_qr_from_bytes(image_bytes)

        if not success:
            return jsonify(success=False, error="No QR code detected in image"), 400

        # Get asset if available
        asset_id = payload.get("aid") or payload.get("asset_id") if payload else None
        asset = None

        if asset_id:
            asset_el = db.find_asset(asset_id)
            asset = db.get_asset_dict(asset_el) if asset_el is not None else None

        return jsonify(
            success=True,
            data=qr_data,
            assetId=asset_id,
            payload=payload,
            asset=asset
        )

    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, error=str(e)), 500



# -----------------------------------------------------------------------------
# Assets
# -----------------------------------------------------------------------------
def generate_unique_asset_id(asset_type, manufacturer_id, existing_ids=None):
    """Generate unique Asset ID: [3-char type][date][last4 mfg_id][4-digit random]"""
    if existing_ids is None:
        existing_ids = set()

    asset_type_code = str(asset_type)[:3].upper().ljust(3, '0')
    current_date = datetime.now().strftime("%Y%m%d")
    manufacturer_suffix = str(manufacturer_id)[-4:].zfill(4)

    max_attempts = 10000
    for _ in range(max_attempts):
        random_suffix = f"{random.randint(0, 9999):04d}"
        asset_id = f"{asset_type_code}{current_date}{manufacturer_suffix}{random_suffix}"
        if asset_id not in existing_ids:
            return asset_id

    raise Exception(f"Could not generate unique asset ID after {max_attempts} attempts")

@app.route("/api/assets", methods=["GET"])
@require_auth
def get_assets():
    """Get all assets with optional filtering"""
    try:
        filters = {}
        for key in ("type", "status", "manufacturer_id", "asset_id"):
            val = request.args.get(key)
            if val:
                filters[key] = val

        if filters:
            assets = db.search_assets(**filters)
        else:
            assets = db.get_all_assets()

        # Ensure default values
        for asset in assets:
            if 'status' not in asset or not asset['status']:
                asset['status'] = 'pending'
            if 'qr_generated' not in asset:
                asset['qr_generated'] = False

        return jsonify(success=True, assets=assets, count=len(assets))

    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/assets", methods=["POST"])
@require_permission("can_add_new_assets")
def create_asset():
    """Create new asset with auto-generated ID"""
    try:
        data = request.get_json(force=True)
        required = ["type", "manufacturer_id", "manufacturing_date"]
        missing = [f for f in required if not data.get(f)]

        if missing:
            return jsonify(success=False, error=f"Missing required fields: {', '.join(missing)}"), 400

        # Generate unique asset ID
        existing_assets = db.get_all_assets()
        existing_ids = {asset.get("asset_id") for asset in existing_assets if asset.get("asset_id")}
        
        generated_asset_id = generate_unique_asset_id(
            data["type"],
            data["manufacturer_id"],
            existing_ids
        )

        data["asset_id"] = generated_asset_id
        
        # Set defaults
        if "status" not in data:
            data["status"] = "Active"

        new_id = db.add_asset(data)
        asset_el = db.find_asset(data["asset_id"])
        asset = db.get_asset_dict(asset_el) if asset_el is not None else None

        return jsonify(
            success=True,
            asset=asset,
            id=new_id,
            generated_asset_id=generated_asset_id,
            message=f"Asset created with ID: {generated_asset_id}"
        ), 201

    except ValueError as ve:
        return jsonify(success=False, error=str(ve)), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/assets/<asset_id>", methods=["PUT"])
@require_permission("can_add_new_assets")
def update_asset(asset_id):
    try:
        updates = request.get_json(force=True)
        db.update_asset(asset_id, updates)
        asset_el = db.find_asset(asset_id)
        asset = db.get_asset_dict(asset_el) if asset_el is not None else None

        if not asset:
            return jsonify(success=False, error="Asset not found"), 404

        return jsonify(success=True, asset=asset)

    except ValueError as ve:
        return jsonify(success=False, error=str(ve)), 404
    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/assets/<asset_id>", methods=["DELETE"])
@require_permission("can_delete_assets")
def delete_asset(asset_id):
    try:
        deleted_maint = db.delete_asset(asset_id)
        return jsonify(
            success=True,
            message=f"Asset deleted along with {deleted_maint} maintenance records"
        )

    except ValueError as ve:
        return jsonify(success=False, error=str(ve)), 404
    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

# -----------------------------------------------------------------------------
# Maintenance
# -----------------------------------------------------------------------------
@app.route("/api/maintenance", methods=["GET"])
def get_maintenance_records():
    """Get all maintenance records"""
    try:
        records = []
        maint_elem = db.root.find("maintenance_records")
        for record in maint_elem.findall("maintenance_record"):
            rec_dict = {"id": record.get("id")}
            for child in record:
                rec_dict[child.tag] = child.text
            records.append(rec_dict)
        return jsonify(success=True, records=records)
    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/maintenance", methods=["POST"])
@require_permission("can_add_maintenance")
def create_maintenance():
    """Optimized maintenance record creation"""
    try:
        data = request.get_json(force=True)
        
        # Quick validation
        asset_id = data.get("asset_id")
        description = data.get("description")
        
        if not asset_id or not description:
            return jsonify(success=False, error="assetId and description are required"), 400
        
        # Fast asset validation (don't parse full XML if not needed)
        asset_el = db.find_asset(asset_id)
        if asset_el is None:
            return jsonify(success=False, error="Asset not found"), 404
        
        # Get operator from session
        operator = session["user"].get("username", "unknown")
        
        # Build minimal maintenance record
        payload = {
            "asset_id": asset_id,
            "maintenance_type": data.get("maintenanceType", "General"),
            "operator": data.get("performedBy", operator),
            "description": description,
            "date": data.get("date") or datetime.now().strftime("%Y-%m-%d"),
            "status":  "completed",
        }
        
        # Fast insert
        rec_id = db.add_maintenance_record(payload)
        
        return jsonify(
            success=True, 
            record={**payload, "id": rec_id},
            message="Maintenance record created successfully"
        ), 201
        
    except ValueError as ve:
        return jsonify(success=False, error=str(ve)), 400
    except Exception as e:
        logger.error(f"Maintenance creation error: {e}")
        return jsonify(success=False, error=str(e)), 500


@app.route("/api/scan-qr-frame", methods=["POST"])
@require_permission("can_scan_qr")
def scan_qr_frame():
    """Optimized QR frame scanning for real-time detection"""
    try:
        data = request.get_json(force=True)
        image_data = data.get("image")
        
        if not image_data:
            return jsonify(success=False, error="Image data required"), 400
        
        if not qr_reader.dependencies_available:
            return jsonify(success=False, error="QR detection unavailable"), 500
        
        # Fast base64 decode
        import base64
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            return jsonify(success=False, error=f"Invalid image: {str(e)}"), 400
        
        # Fast QR scan
        success, qr_data, payload = qr_reader.read_qr_from_bytes(image_bytes)
        
        if not success:
            # Just return success=False for no QR detected - normal during scanning
            return jsonify(success=False), 200
        
        # Quick asset lookup if asset ID present
        asset_id = payload.get("aid") or payload.get("asset_id") if payload else None
        if not asset_id:
            logger.info("❌ QR detected but no asset ID found")
            # If no asset ID found, treat as no valid QR
            return jsonify(success=False), 200
        
        # Quick asset lookup
        asset_el = db.find_asset(asset_id)
        if asset_el is None:
            logger.info(f"❌ Asset ID {asset_id} not found in database")
            return jsonify(success=False, error="Asset not found"), 404
            
        asset = db.get_asset_dict(asset_el)
        logger.info(f"✅ Asset found: {asset_id}")
        
        # Return success with complete asset data
        return jsonify(
            success=True,
            data=qr_data,
            assetId=asset_id,
            payload=payload,
            asset=asset,
            message=f"Asset {asset_id} found"
        )
        
    except Exception as e:
        logger.error(f"QR frame scan error: {e}")
        return jsonify(success=False, error=str(e)), 500

# -----------------------------------------------------------------------------
# AI Enhancement & Speech Processing
# -----------------------------------------------------------------------------

# Import speech processor
from speech_processor import SpeechProcessor, get_supported_languages

# Initialize speech processor
speech_processor = SpeechProcessor()
if speech_processor.is_available():
    logger.info("✓ Speech recognition initialized")
else:
    logger.warning("⚠ Speech recognition not available. Install Vosk model.")


@app.route("/api/speech/languages", methods=["GET"])
def get_speech_languages():
    """Get list of supported speech recognition languages"""
    try:
        languages = get_supported_languages()
        return jsonify(success=True, languages=languages)
    except Exception as e:
        logger.error(f"Error fetching languages: {e}")
        return jsonify(success=False, error=str(e)), 500


@app.route("/api/speech/process-audio", methods=["POST"])
@require_auth
def process_audio():
    """
    Process audio using Vosk - returns ONLY recognized text (no AI enhancement)
    User can then choose to enhance with AI separately
    
    Expects: { "audio": "base64_data", "language": "en" }
    Returns: { "success": true, "recognized_text": "..." }
    """
    try:
        # Check if speech processor is available
        if not speech_processor.is_available():
            return jsonify(
                success=False,
                error="Speech recognition not available. Please download and configure Vosk model.",
                error_type="MODEL_NOT_LOADED"
            ), 500
        
        # Get request data
        data = request.get_json(force=True)
        audio_base64 = data.get("audio", "")
        language = data.get("language", "en")
        
        if not audio_base64:
            return jsonify(
                success=False,
                error="No audio data provided"
            ), 400
        
        # Process speech recognition ONLY (no AI enhancement)
        logger.info(f"Processing speech audio (language: {language})")
        
        try:
            recognized_text = speech_processor.process_audio_base64(audio_base64)
        except ValueError as ve:
            logger.warning(f"Audio processing error: {ve}")
            return jsonify(
                success=False,
                error=str(ve),
                error_type="EMPTY_AUDIO"
            ), 400
        except Exception as recog_error:
            logger.error(f"Speech recognition failed: {recog_error}")
            return jsonify(
                success=False,
                error=f"Speech recognition failed: {str(recog_error)}",
                error_type="RECOGNITION_ERROR"
            ), 500
        
        logger.info(f"✓ Speech recognized: {recognized_text[:100]}...")
        
        # Return ONLY the recognized text (user will decide to enhance or not)
        return jsonify(
            success=True,
            recognized_text=recognized_text,
            language=language
        )
        
    except Exception as e:
        logger.error(f"Speech processing error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify(
            success=False,
            error=str(e),
            error_type="PROCESSING_ERROR"
        ), 500


@app.route("/api/ai/enhance-description", methods=["POST"])
@require_auth
def enhance_description():
    """
    Enhance maintenance description using local Llama 3.2 model via Ollama
    This is called SEPARATELY when user clicks "Enhance with AI" button
    
    Expects: { "description": "text to enhance" }
    Returns: { "success": true, "enhanced_description": "..." }
    """
    try:
        data = request.get_json(force=True)
        description = data.get("description", "").strip()
        
        if not description:
            return jsonify(success=False, error="Description is required"), 400
        
        # System prompt for professional maintenance description enhancement
        system_prompt = """You are a professional railway maintenance technician and technical writer.
Your task is to rewrite the following maintenance note into a concise, technical, and actionable description for the maintenance log. Write so that a future maintenance worker can clearly understand the fault, the work already done, and the current status without any extra or imagined details.

Strict rules:
- Preserve all facts, component names, asset IDs, coach numbers, locations, dates, and measurements exactly as written. Do not add new information, causes, or actions that are not explicitly mentioned.
- Focus only on: 1) issue/fault or condition observed, 2) action taken or work performed, 3) outcome/current status.
- Remove casual language, opinions, apologies, and guesses. Use clear, direct, technical language in active voice and short sentences.
- If the note includes no work done, only describe the reported issue and known status. Do not invent repairs or conclusions.
- If something is unclear in the original text, keep it minimal and use neutral wording such as "reported issue" or "symptoms not confirmed".
- Keep the final text under 150 words in a single short paragraph.
- Output must be plain text only (no bullets, no markdown).
- Wrap the final rewritten text inside <description></description> tags and do not add any other text.

Now rewrite this maintenance description following the rules above:
{description}

Input Text:"""
        
        user_prompt = f"Rewrite this maintenance description professionally and wrap it in <description></description> tags:\n\n{description}"
        
        logger.info("Calling Ollama Llama 3.2 model for description enhancement")
        
        try:
            # Call local Ollama instance (default port 11434)
            response = ollama.chat(
                model='llama3.2:3b',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_prompt}
                ],
                options={
                    'temperature': 0.3,  # Lower temperature for more focused output
                    'num_predict': 250,  # Limit response length
                }
            )
            
            raw_response = response['message']['content'].strip()
            logger.info(f"Raw Llama response: {raw_response}")
            
            # Extract text between <description></description> tags
            import re
            match = re.search(r'<description>(.+?)</description>', raw_response, re.DOTALL | re.IGNORECASE)
            
            if match:
                enhanced_description = match.group(1).strip()
            else:
                # Fallback: use entire response and clean it
                logger.warning("Description tags not found, used fallback cleaning")
                enhanced_description = raw_response
                
                # Remove markdown headers, bullets, and extra formatting
                enhanced_description = re.sub(r'\*\*(.+?)\*\*', r'\1', enhanced_description)  # Remove bold
                enhanced_description = re.sub(r'^#+\s+.*$', '', enhanced_description, flags=re.MULTILINE)  # Remove headers
                enhanced_description = re.sub(r'^\s*[-•]\s*', '', enhanced_description, flags=re.MULTILINE)  # Remove bullets
                enhanced_description = re.sub(r'\n{3,}', '\n\n', enhanced_description, flags=re.MULTILINE)  # Remove excessive newlines
                enhanced_description = enhanced_description.strip()
            
            # Final cleanup
            enhanced_description = ' '.join(enhanced_description.split())  # Normalize whitespace
            
            return jsonify(
                success=True,
                enhanced_description=enhanced_description,
                original_description=description
            )
            
        except Exception as ollama_error:
            error_msg = str(ollama_error)
            logger.error(f"Ollama error: {error_msg}")
            
            # Check if it's a connection error
            if "connection" in error_msg.lower() or "refused" in error_msg.lower():
                return jsonify(
                    success=False,
                    error="Local AI model is offline. Please ensure Ollama is running.",
                    error_type="OLLAMA_OFFLINE"
                ), 503
            else:
                return jsonify(
                    success=False,
                    error=f"AI enhancement failed: {error_msg}",
                    error_type="OLLAMA_ERROR"
                ), 500
                
    except Exception as e:
        logger.error(f"Error in enhance_description: {e}")
        import traceback
        traceback.print_exc()
        return jsonify(success=False, error=str(e)), 500

# -----------------------------------------------------------------------------
# Reports
# -----------------------------------------------------------------------------
@app.route("/api/reports/stats", methods=["GET"])
@require_auth
def get_reports_stats():
    """Get statistics for reports dashboard"""
    try:
        assets = db.get_all_assets()
        active_assets = [a for a in assets if str(a.get("status", "")).lower() == "active"]
        
        all_maintenance = []
        for a in assets:
            aid = a.get("asset_id")
            if aid:
                all_maintenance.extend(db.get_asset_maintenance(aid))
        
        # Count scanned today (maintenance records from today)
        today = datetime.now().strftime("%Y-%m-%d")
        scanned_today = sum(1 for m in all_maintenance if m.get("date") == today)
        
        # Count users (if user_manager has this method)
        try:
            all_users = user_manager.list_all_users() if hasattr(user_manager, 'list_all_users') else []
            users_count = len(all_users)
        except:
            users_count = 0

        stats = {
            "totalAssets": len(assets),
            "activeAssets": len(active_assets),
            "maintenanceRecords": len(all_maintenance),
            "users": users_count,
            "scannedToday": scanned_today
        }

        return jsonify(success=True, stats=stats)

    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

@app.route("/api/reports/export", methods=["GET"])
@require_auth
def export_reports():
    """Export data as CSV or XML"""
    try:
        format_type = request.args.get("format", "excel").lower()
        
        assets = db.get_all_assets()
        
        if format_type == "excel":
            from openpyxl import Workbook
            import io
            
            wb = Workbook()
            ws = wb.active
            ws.title = "Assets"
            
            # Write header
            headers = ["Asset ID", "Type", "Status", "Manufacturer ID", "Manufacturing Date"]
            ws.append(headers)
            
            # Write data
            for asset in assets:
                ws.append([
                    asset.get("asset_id", ""),
                    asset.get("type", ""),
                    asset.get("status", ""),
                    asset.get("manufacturer_id", ""),
                    asset.get("manufacturing_date", "")
                ])
            
            # Auto-adjust column widths
            for column in ws.columns:
                max_length = 0
                column = [cell for cell in column]
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = (max_length + 2)
                ws.column_dimensions[column[0].column_letter].width = adjusted_width
            
            # Save to bytes
            excel_file = io.BytesIO()
            wb.save(excel_file)
            excel_file.seek(0)
            
            return excel_file.getvalue(), 200, {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=assets_export.xlsx'
            }
        
        elif format_type == "xml":
            # Return XML from database
            return db.export_to_xml(), 200, {
                'Content-Type': 'application/xml',
                'Content-Disposition': 'attachment; filename=assets_export.xml'
            }
        
        else:
            return jsonify(success=False, error="Invalid format. Use 'excel' or 'xml'"), 400

    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

# -----------------------------------------------------------------------------
# Error handlers
# -----------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(_):
    return jsonify(error="Not Found", message="The requested endpoint does not exist"), 404

@app.errorhandler(500)
def internal_error(_):
    return jsonify(error="Internal Server Error", message="Something went wrong on the server"), 500

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "1") == "1"  # Enable debug in development
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting QRail Backend Server")
    print(f"📍 Running on http://localhost:{port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"🔐 Secret key: {'SET' if app.secret_key else 'NOT SET'}")
    print(f"📦 QR Generator: {'Available' if QR_GEN_AVAILABLE else 'Not Available'}")
    
    app.run(debug=debug, host=host, port=port)
