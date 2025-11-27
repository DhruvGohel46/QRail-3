#!/usr/bin/env python3
"""
Railway User Management System

Handles user authentication and role-based access control with an XML-backed
users database. Designed to be null-safe against malformed XML so that missing
child elements never cause 'NoneType' attribute errors.
"""

import xml.etree.ElementTree as ET
from datetime import datetime
import os
from typing import Optional, Dict, Any, List


class RailwayUserManager:
    """User management system with role-based access control using XML storage"""

    def __init__(self, users_xml_file: str = r"C:\QRail\users_database.xml"):
        self.users_xml_file = users_xml_file
        self.tree: Optional[ET.ElementTree] = None
        self.root: Optional[ET.Element] = None

        # Permissions per role
        self.role_permissions = {
            "manufacturer": {
                "can_scan_qr": True,
                "can_view_asset_details": True,
                "can_add_maintenance": True,
                "can_add_new_assets": True,
                "can_generate_qr": True,
                "can_delete_assets": False,
                "can_view_all_assets": False,
            },
            "worker": {
                "can_scan_qr": True,
                "can_view_asset_details": True,
                "can_add_maintenance": True,
                "can_add_new_assets": False,
                "can_generate_qr": False,
                "can_delete_assets": False,
                "can_view_all_assets": False,
            },
            "engineer": {
                "can_scan_qr": True,
                "can_view_asset_details": True,
                "can_add_maintenance": True,
                "can_add_new_assets": False,
                "can_generate_qr": False,
                "can_delete_assets": True,      # ONLY admin & engineer can delete
                "can_view_all_assets": False,
            },
            "admin": {  # Engineer or Admin
                "can_scan_qr": True,
                "can_view_asset_details": True,
                "can_add_maintenance": True,
                "can_add_new_assets": True,
                "can_generate_qr": True,
                "can_delete_assets": True,      # ONLY admin & engineer can delete
                "can_view_all_assets": True,    # Full list with details
                "can_manage_users": True,       # Approve/reject registrations
            },
        }

        self.load_users_database()

    def _users_container(self) -> Optional[ET.Element]:
        """Safely get users container, creating it if needed"""
        if self.root is None:
            return None
        users = self.root.find("users")
        if users is None:
            users = ET.SubElement(self.root, "users")
            self.save_users_database()
        return users

    def load_users_database(self) -> None:
        """Load or create users database without seeding default users"""
        try:
            # Try to load existing database
            if os.path.exists(self.users_xml_file):
                self.tree = ET.parse(self.users_xml_file)
                self.root = self.tree.getroot()
                
                # If root tag is wrong, normalize it
                if self.root.tag != "users_database":
                    old_root = self.root
                    self.root = ET.Element("users_database")
                    self.root.set("version", "1.0")
                    self.root.set("created", datetime.now().isoformat())
                    
                    # Preserve existing users if any
                    users = old_root.find("users")
                    if users is not None:
                        new_users = ET.SubElement(self.root, "users")
                        for user in users:
                            new_users.append(user)
                    else:
                        ET.SubElement(self.root, "users")
                    
                    self.tree._setroot(self.root)
                    self.save_users_database()
            else:
                # Create new empty database
                print(f"Creating new users database at: {self.users_xml_file}")
                self.root = ET.Element("users_database")
                self.root.set("version", "1.0")
                self.root.set("created", datetime.now().isoformat())
                ET.SubElement(self.root, "users")  # Create empty users container
                self.tree = ET.ElementTree(self.root)
                self.save_users_database()
                
        except ET.ParseError as e:
            print(f"XML Parse Error: {e}. Creating new database.")
            self._create_new_database()
        except Exception as e:
            print(f"Error: {e}. Creating new database.")
            self._create_new_database()

    def _create_new_database(self) -> None:
        """Create a new empty database structure"""
        self.root = ET.Element("users_database")
        self.root.set("version", "1.0")
        self.root.set("created", datetime.now().isoformat())
        ET.SubElement(self.root, "users")
        self.tree = ET.ElementTree(self.root)
        self.save_users_database()

    def save_users_database(self) -> bool:
        """Save users database with proper XML formatting"""
        if self.root is None:
            return False
        try:
            self._prettify_xml(self.root)
            with open(self.users_xml_file, "w", encoding="utf-8") as f:
                f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                f.write(ET.tostring(self.root, encoding="unicode"))
            return True
        except Exception as e:
            print(f"Error saving database: {e}")
            return False

    @staticmethod
    def _prettify_xml(element: ET.Element, level: int = 0) -> None:
        """Format XML with proper indentation"""
        indent = "\n" + level * "  "
        if len(element):
            if not element.text or not element.text.strip():
                element.text = indent + "  "
            if not element.tail or not element.tail.strip():
                element.tail = indent
            for child in element:
                RailwayUserManager._prettify_xml(child, level + 1)
            if not child.tail or not child.tail.strip():
                child.tail = indent
        else:
            if level and (not element.tail or not element.tail.strip()):
                element.tail = indent

    @staticmethod
    def _get_text(parent: ET.Element, tag: str, default: Optional[str] = None) -> Optional[str]:
        """Safely get element text with default value"""
        elem = parent.find(tag)
        return elem.text.strip() if elem is not None and elem.text is not None else default

    @staticmethod
    def _set_text(parent: ET.Element, tag: str, value: str) -> ET.Element:
        """Set element text, creating element if needed"""
        elem = parent.find(tag)
        if elem is None:
            elem = ET.SubElement(parent, tag)
        elem.text = value
        return elem

    def check_permission(self, user_role: Optional[str], permission: str) -> bool:
        """Check if role has specific permission"""
        if not user_role:
            return False
        return self.role_permissions.get(user_role, {}).get(permission, False)

    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user and return session data if successful"""
        users = self._users_container()
        if users is None:
            return None

        for user in users.findall("user"):
            if (self._get_text(user, "username") == username and 
                self._get_text(user, "password") == password):
                
                # Check if user is active
                active = (self._get_text(user, "active", "true") or "true").lower() == "true"
                if not active:
                    return None

                # Update last login
                self._set_text(user, "last_login", datetime.now().isoformat())
                self.save_users_database()

                # Get user data
                role = self._get_text(user, "role", "worker") or "worker"
                return {
                    "id": user.get("id"),
                    "username": username,
                    "role": role,
                    "name": self._get_text(user, "name", username) or username,
                    "email": self._get_text(user, "email", "") or "",
                    "permissions": self.role_permissions.get(role, {})
                }
        return None

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user data by username"""
        users = self._users_container()
        if users is None:
            return None

        for user in users.findall("user"):
            if self._get_text(user, "username") == username:
                return {
                    "id": user.get("id"),
                    "username": username,
                    "role": self._get_text(user, "role"),
                    "name": self._get_text(user, "name"),
                    "email": self._get_text(user, "email"),
                    "active": self._get_text(user, "active"),
                    "created_date": self._get_text(user, "created_date"),
                    "last_login": self._get_text(user, "last_login")
                }
        return None

    def add_user(self, user_data: Dict[str, Any]) -> int:
        """Add new user, ensuring unique username"""
        users = self._users_container()
        if users is None:
            raise ValueError("Database not properly initialized")

        # Check username uniqueness
        username = user_data.get("username")
        if not username:
            raise ValueError("Username is required")

        for user in users.findall("user"):
            if self._get_text(user, "username") == username:
                raise ValueError(f"Username already exists: {username}")

        # Generate new ID
        existing_ids = []
        for user in users.findall("user"):
            try:
                existing_ids.append(int(user.get("id", "0")))
            except ValueError:
                continue
        new_id = max(existing_ids, default=0) + 1

        # Create user element
        user = ET.SubElement(users, "user")
        user.set("id", str(new_id))

        # Set user fields
        for field in ["username", "password", "role", "name", "email"]:
            self._set_text(user, field, str(user_data.get(field, "") or ""))

        # Set system fields
        self._set_text(user, "created_date", datetime.now().strftime("%Y-%m-%d"))
        self._set_text(user, "last_login", "")
        self._set_text(user, "active", str(user_data.get("active", "true")).lower())

        self.save_users_database()
        return new_id

    def delete_user(self, username: str) -> bool:
        """Delete user by username"""
        users = self._users_container()
        if users is None:
            return False

        for user in users.findall("user"):
            if self._get_text(user, "username") == username:
                users.remove(user)
                self.save_users_database()
                return True
        return False

    def update_user(self, username: str, updates: Dict[str, Any]) -> bool:
        """Update user fields"""
        users = self._users_container()
        if users is None:
            return False

        for user in users.findall("user"):
            if self._get_text(user, "username") == username:
                for field, value in updates.items():
                    if field in ["password", "role", "name", "email", "active"]:
                        if field == "active":
                            value = str(value).lower()
                        self._set_text(user, field, str(value))
                self.save_users_database()
                return True
        return False

    def delete_user(self, username: str) -> bool:
        """Delete user by username"""
        users = self._users_container()
        if users is None:
            return False
        
        for user in users.findall("user"):
            if self._get_text(user, "username") == username:
                users.remove(user)
                self.save_users_database()
                return True
        
        return False

    def create_admin_user(self, user_data: Dict[str, Any]) -> int:
        """Create a new admin user directly (bypasses approval)"""
        users = self._users_container()
        if users is None:
            raise ValueError("Database not properly initialized")
        
        # Check username uniqueness
        username = user_data.get("username")
        if not username:
            raise ValueError("Username is required")
        
        for user in users.findall("user"):
            if self._get_text(user, "username") == username:
                raise ValueError(f"Username already exists: {username}")
        
        # Generate new ID
        existing_ids = []
        for user in users.findall("user"):
            try:
                existing_ids.append(int(user.get("id", "0")))
            except ValueError:
                continue
        
        new_id = max(existing_ids, default=0) + 1
        
        # Create user element
        user = ET.SubElement(users, "user")
        user.set("id", str(new_id))
        
        # Set user fields
        required_fields = ["username", "password", "name", "email"]
        for field in required_fields:
            if not user_data.get(field):
                raise ValueError(f"{field} is required")
            self._set_text(user, field, str(user_data.get(field)))
        
        # Force admin role
        self._set_text(user, "role", "admin")
        
        # Set system fields - active by default
        self._set_text(user, "created_date", datetime.now().strftime("%Y-%m-%d"))
        self._set_text(user, "last_login", "")
        self._set_text(user, "active", "true")
        
        self.save_users_database()
        return new_id

    def get_all_users(self, include_pending: bool = False) -> List[Dict[str, Any]]:
        """Get list of all users
        
        Args:
            include_pending (bool): Whether to include pending users in the result
            
        Returns:
            List of user dictionaries including both active and optionally pending users
        """
        users = self._users_container()
        if users is None:
            return []

        user_list = []
        for user in users.findall("user"):
            active = self._get_text(user, "active", "true")
            # Include user if they are active or if we want pending users
            if active.lower() == "true" or (include_pending and active.lower() == "pending"):
                user_list.append({
                    "id": user.get("id"),
                    "username": self._get_text(user, "username"),
                    "role": self._get_text(user, "role"),
                    "name": self._get_text(user, "name"),
                    "email": self._get_text(user, "email"),
                    "active": active,
                    "created_date": self._get_text(user, "created_date"),
                    "last_login": self._get_text(user, "last_login")
                })
        return user_list

    def approve_user(self, username: str) -> bool:
        """Approve a pending user registration
        
        Args:
            username: The username of the pending user to approve
            
        Returns:
            bool: True if user was found and approved, False otherwise
        """
        users = self._users_container()
        if users is None:
            return False
            
        for user in users.findall("user"):
            if (self._get_text(user, "username") == username and 
                self._get_text(user, "active") == "pending"):
                self._set_text(user, "active", "true")
                self.save_users_database()
                return True
        return False

    def reject_user(self, username: str) -> bool:
        """Reject a pending user registration
        
        Args:
            username: The username of the pending user to reject
            
        Returns:
            bool: True if user was found and rejected, False otherwise
        """
        users = self._users_container()
        if users is None:
            return False
            
        for user in users.findall("user"):
            if (self._get_text(user, "username") == username and 
                self._get_text(user, "active") == "pending"):
                users.remove(user)
                self.save_users_database()
                return True
        return False

    def check_credentials_status(self, username: str, password: str) -> Dict[str, bool]:
        """Check if credentials match and user status (active/pending)
        
        Args:
            username: The username to check
            password: The password to check
            
        Returns:
            Dict containing 'matches' (if credentials are correct) and 'active' (if user is active)
        """
        users = self._users_container()
        if users is None:
            return {"matches": False, "active": False}

        for user in users.findall("user"):
            if (self._get_text(user, "username") == username and 
                self._get_text(user, "password") == password):
                active = self._get_text(user, "active", "true")
                return {
                    "matches": True,
                    "active": active.lower() == "true"
                }
        return {"matches": False, "active": False}

    def list_pending_users(self) -> List[Dict[str, Any]]:
        """Get list of users with pending status
        
        Returns:
            List of pending user dictionaries
        """
        users = self._users_container()
        if users is None:
            return []

        pending_users = []
        for user in users.findall("user"):
            if self._get_text(user, "active") == "pending":
                pending_users.append({
                    "id": user.get("id"),
                    "username": self._get_text(user, "username"),
                    "role": self._get_text(user, "role"),
                    "name": self._get_text(user, "name"),
                    "email": self._get_text(user, "email"),
                    "created_date": self._get_text(user, "created_date")
                })
        return pending_users

    def create_pending_user(self, user_data: Dict[str, Any]) -> int:
        """Create a new pending user that requires admin approval
        
        Args:
            user_data: Dictionary containing user information (username, password, role, name, email)
            
        Returns:
            int: The ID of the newly created user
            
        Raises:
            ValueError: If required fields are missing or username already exists
        """
        users = self._users_container()
        if users is None:
            raise ValueError("Database not properly initialized")
        
        # Check required fields
        required_fields = ["username", "password", "role", "name", "email"]
        missing = [f for f in required_fields if not user_data.get(f)]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        
        # Check username uniqueness
        username = user_data.get("username")
        for user in users.findall("user"):
            if self._get_text(user, "username") == username:
                raise ValueError(f"Username already exists: {username}")
        
        # Generate new ID
        existing_ids = []
        for user in users.findall("user"):
            try:
                existing_ids.append(int(user.get("id", "0")))
            except ValueError:
                continue
        new_id = max(existing_ids, default=0) + 1
        
        # Create user element
        user = ET.SubElement(users, "user")
        user.set("id", str(new_id))
        
        # Set user fields
        for field in required_fields:
            self._set_text(user, field, str(user_data[field]))
        
        # Set system fields
        self._set_text(user, "created_date", datetime.now().strftime("%Y-%m-%d"))
        self._set_text(user, "last_login", "")
        self._set_text(user, "active", "pending")  # Set as pending for admin approval
        
        self.save_users_database()
        return new_id
        