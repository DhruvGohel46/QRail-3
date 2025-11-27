# backend/qr_generator.py
import segno
import json
import base64
import hashlib
import os
from datetime import datetime
from pathlib import Path

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

class RailwayQRGenerator:
    def __init__(self, output_dir=None):
        if output_dir is None:
            # Get the current file's directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Set output directory relative to backend
            output_dir = os.path.join(current_dir, "qr_codes")
        
        # Convert to Path object and ensure it's absolute
        self.output_dir = Path(output_dir).absolute()
        # Create directory if it doesn't exist
        self.output_dir.mkdir(exist_ok=True, parents=True)
        
        print(f"QR Generator initialized. Output directory: {self.output_dir}")
    
    def generate_signature(self, payload_data):
        """Generate digital signature for payload integrity"""
        payload_str = json.dumps(payload_data, sort_keys=True)
        signature_hash = hashlib.sha256(payload_str.encode()).hexdigest()
        return base64.b64encode(signature_hash[:16].encode()).decode()[:16]
    
    def create_payload(self, asset_data):
        """Create compact JSON payload according to SIH specification"""
        # Normalize asset data keys for consistency
        normalized_asset = {
            "aid": asset_data.get("asset_id") or asset_data.get("assetId"),
            "type": asset_data.get("type"),
            "mfg": asset_data.get("manufacturer") or asset_data.get("manufacturer_id"),
            "mfd": asset_data.get("mfgDate") or asset_data.get("manufacturing_date"),
        }
        
        payload = {
            "v": 1,  # Version
            "aid": normalized_asset["aid"],  # Asset ID (consistent key)
            "tp": normalized_asset["type"],  # Type (track/sleeper)
            "mfg": normalized_asset["mfg"],  # Manufacturer ID
            "mfd": normalized_asset["mfd"],  # Manufacturing date
        }
        
        # Add installation date if available
        if asset_data.get("installation_date"):
            payload["inst"] = asset_data["installation_date"]
        
        # Generate signature for verification
        signature_data = {
            "aid": payload["aid"],
            "tp": payload["tp"],
            "mfg": payload["mfg"],
            "mfd": payload["mfd"]
        }
        payload["sig"] = self.generate_signature(signature_data)
        
        return payload
    
    def generate_qr_code(self, asset_data, error_correction="H", output_format="PNG"):
        """
        Generate QR code using segno with high error correction for harsh field conditions
        """
        try:
            # Create payload
            payload = self.create_payload(asset_data)
            payload_json = json.dumps(payload, separators=(',', ':'))  # Compact JSON
            print(f"Generating QR for payload: {payload_json}")

            # Set error correction level at creation
            error_level = error_correction.lower() if error_correction else 'h'
            qr = segno.make_qr(payload_json, error=error_level)

            # Generate base filename components
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_asset_id = ''.join(c if c.isalnum() else '_' for c in asset_data['asset_id'])
            
            # For PDF, we'll need a different path for the temporary PNG
            if output_format.upper() == "PDF":
                temp_filename = f"qr_{safe_asset_id}_{timestamp}_temp.png"
                filename = f"qr_{safe_asset_id}_{timestamp}.pdf"
            else:
                filename = f"qr_{safe_asset_id}_{timestamp}.{output_format.lower()}"
            
            # Ensure absolute filepath
            filepath = self.output_dir / filename
            filepath_str = str(filepath)
            
            print(f"Generating QR code for asset {asset_data['asset_id']}")
            print(f"Output path: {filepath_str}")

            # Save QR code based on format
            if output_format.upper() == "PNG":
                # PNG for preview and general use
                qr.save(
                    filepath_str,
                    scale=8,        # Size multiplier
                    border=4,       # Border size in modules
                    dark='black',   # Dark module color
                    light='white'   # Light module color
                )
            elif output_format.upper() == "SVG":
                # SVG for laser engraving (vector format)
                qr.save(
                    filepath_str,
                    scale=8,
                    border=4,
                    unit='mm',  # Physical units for laser
                    dark='black',
                    light='white'
                )
            elif output_format.upper() == "EPS":
                # EPS for professional printing
                qr.save(
                    filepath_str,
                    scale=8,
                    border=4,
                    dark='black',
                    light='white'
                )
            elif output_format.upper() == "PDF":
                if not PDF_SUPPORT:
                    raise Exception("PDF generation is not available. Please install reportlab package.")
                
                # First save QR as PNG with high quality
                temp_png_path = self.output_dir / temp_filename
                qr.save(
                    str(temp_png_path),
                    scale=10,
                    border=4,
                    dark='black',
                    light='white'
                )
                
                try:
                    # Create basic PDF with minimal formatting to ensure reliability
                    from reportlab.platypus import SimpleDocTemplate, Image, Paragraph, Spacer
                    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                    from reportlab.lib.pagesizes import A4
                    from reportlab.lib.units import mm
                    
                    # Create document with simple error handling
                    doc = SimpleDocTemplate(
                        filepath_str,
                        pagesize=A4,
                        rightMargin=20*mm,
                        leftMargin=20*mm,
                        topMargin=20*mm,
                        bottomMargin=20*mm
                    )
                    
                    # Prepare content
                    styles = getSampleStyleSheet()
                    story = []
                    
                    # Add title
                    title_style = ParagraphStyle(
                        'CustomTitle',
                        parent=styles['Heading1'],
                        fontSize=16,
                        spaceAfter=30
                    )
                    story.append(Paragraph("Railway Asset QR Code", title_style))
                    story.append(Spacer(1, 10*mm))
                    
                    # Add QR code
                    qr_img = Image(str(temp_png_path), width=100*mm, height=100*mm)
                    story.append(qr_img)
                    story.append(Spacer(1, 10*mm))
                    
                    # Add asset details
                    details = [
                        ("Asset ID", asset_data.get("asset_id", "N/A")),
                        ("Type", asset_data.get("type", "N/A")),
                        ("Manufacturer ID", asset_data.get("manufacturer_id", asset_data.get("manufacturer", "N/A"))),
                        ("Manufacturing Date", asset_data.get("manufacturing_date", asset_data.get("mfgDate", "N/A"))),
                        ("Status", asset_data.get("status", "N/A")),
                        ("Installation Date", asset_data.get("installation_date", "Not Installed"))
                    ]
                    
                    for label, value in details:
                        text = f"<b>{label}:</b> {value}"
                        p = Paragraph(text, styles["Normal"])
                        story.append(p)
                        story.append(Spacer(1, 2*mm))
                    
                    # Add generation date
                    story.append(Spacer(1, 10*mm))
                    gen_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    story.append(Paragraph(f"<i>Generated on: {gen_date}</i>", styles["Normal"]))
                    
                    # Build the PDF - this actually writes the content
                    doc.build(story)
                    
                    # Verify file was created and has content
                    if not os.path.exists(filepath_str):
                        raise FileNotFoundError("PDF file was not created")
                    
                    if os.path.getsize(filepath_str) == 0:
                        raise ValueError("PDF file is empty")
                        
                finally:
                    # Clean up temporary PNG file
                    try:
                        if os.path.exists(str(temp_png_path)):
                            os.remove(str(temp_png_path))
                    except Exception as e:
                        print(f"Warning: Could not remove temporary file: {e}")

            # Verify file was created successfully
            if not filepath.exists():
                raise FileNotFoundError(f"Failed to create QR code file at {filepath_str}")

            print(f"✅ QR code generated successfully: {filename}")
            
            return {
                "success": True,
                "filepath": filepath_str,
                "filename": filename,
                "payload": payload,
                "qr_version": qr.version,
                "error_correction": error_correction,
                "modules": qr.symbol_size,  # tuple (width, height)
                "format": output_format.lower(),
                "file_size": os.path.getsize(filepath_str)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_qr_payload(self, payload_json):
        """Verify QR payload integrity using signature"""
        try:
            # Parse payload, handle both string and dict input
            if isinstance(payload_json, str):
                payload = json.loads(payload_json)
            else:
                payload = payload_json

            # Ensure we have aid instead of assetId
            if "assetId" in payload and "aid" not in payload:
                payload["aid"] = payload.pop("assetId")
            
            # Extract signature
            received_sig = payload.get("sig")
            if not received_sig:
                return {"valid": False, "error": "No signature found"}
            
            # Generate expected signature
            verification_data = {
                "aid": payload["aid"],  # Using consistent 'aid' key
                "tp": payload.get("tp") or payload.get("type"),
                "mfg": payload.get("mfg") or payload.get("manufacturer"),
                "mfd": payload.get("mfd") or payload.get("mfgDate")
            }
            expected_sig = self.generate_signature(verification_data)
            
            # Compare signatures
            is_valid = received_sig == expected_sig
            
            # Normalize the response payload
            normalized_payload = {
                "aid": payload["aid"],  # Always use 'aid'
                "tp": verification_data["tp"],
                "mfg": verification_data["mfg"],
                "mfd": verification_data["mfd"],
                "sig": received_sig,
            }
            
            return {
                "valid": is_valid,
                "payload": normalized_payload,
                "verification_data": verification_data
            }
            
        except json.JSONDecodeError:
            return {"valid": False, "error": "Invalid JSON payload"}
        except Exception as e:
            return {"valid": False, "error": str(e)}


