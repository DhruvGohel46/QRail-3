#!/usr/bin/env python3
"""
Railway XML Database Manager Module
==================================
Complete database management system for railway asset tracking.

This module provides the RailwayXMLDatabase class for managing
XML-based railway asset databases with full CRUD operations.

"""

import xml.etree.ElementTree as ET
from datetime import datetime
import json
import os
from datetime import datetime
class RailwayXMLDatabase:
    """XML Database manager for railway assets with comprehensive operations"""

    def __init__(self, xml_file: str = r"C:\QRail\railway_assets.xml"):
        self.xml_file = xml_file
        self.tree = None
        self.root = None
        self.load_database()

    def load_database(self):
        """Load XML database from file"""
        try:
            if os.path.exists(self.xml_file):
                self.tree = ET.parse(self.xml_file)
                self.root = self.tree.getroot()
                print(f"✅ Database loaded: {self.xml_file}")
            else:
                print(f"❌ Database file not found: {self.xml_file}")
                print("💡 Run 'python generate_railway_database.py' to create a new database")
                self.create_empty_database()
        except ET.ParseError as e:
            print(f"❌ XML parsing error: {e}")
            self.create_empty_database()
        except Exception as e:
            print(f"❌ Error loading database: {e}")
            self.create_empty_database()

    def create_empty_database(self):
        """Create new empty database structure"""
        self.root = ET.Element("railway_asset_database")
        self.root.set("version", "1.0")
        self.root.set("created", datetime.now().isoformat())

        ET.SubElement(self.root, "assets")
        ET.SubElement(self.root, "maintenance_records")
        ET.SubElement(self.root, "manufacturers")

        self.tree = ET.ElementTree(self.root)
        self.save_database()
        print("🆕 Created new empty database")

    def save_database(self):
        """Save database to XML file with proper formatting"""
        try:
            self._prettify_xml(self.root)
       

            with open(self.xml_file, 'w', encoding='utf-8') as f:
                f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                f.write(ET.tostring(self.root, encoding='unicode'))
            return True
        except Exception as e:
            print(f"❌ Error saving database: {e}")
            return False

    def _prettify_xml(self, element, level=0):
        indent = "\n" + level * "  "
        if len(element):
            if not element.text or not element.text.strip():
                element.text = indent + "  "
            if not element.tail or not element.tail.strip():
                element.tail = indent
            for child in element:
                self._prettify_xml(child, level + 1)
            if not child.tail or not child.tail.strip():
                child.tail = indent
        else:
            if level and (not element.tail or not element.tail.strip()):
                element.tail = indent

    def add_asset(self, asset_data):
        """Add new railway asset to database"""
        assets_elem = self.root.find("assets")

        existing_ids = [int(asset.get("id", 0)) for asset in assets_elem.findall("asset")]
        new_id = max(existing_ids, default=0) + 1

        required_fields = ["asset_id", "type", "manufacturer_id", "manufacturing_date"]
        for field in required_fields:
            if field not in asset_data or not asset_data[field]:
                raise ValueError(f"Missing required field: {field}")

        if self.find_asset(asset_data["asset_id"]):
            raise ValueError(f"Asset ID already exists: {asset_data['asset_id']}")

        asset_elem = ET.SubElement(assets_elem, "asset")
        asset_elem.set("id", str(new_id))

        for key, value in asset_data.items():
            elem = ET.SubElement(asset_elem, key)
            elem.text = str(value) if value else ""

        if "status" not in asset_data:
            status_elem = ET.SubElement(asset_elem, "status")
            status_elem.text = "manufactured"

        if "qr_generated" not in asset_data:
            qr_elem = ET.SubElement(asset_elem, "qr_generated")
            qr_elem.text = "false"

        self.save_database()
        return new_id

    def update_asset(self, asset_id, updates):
        """Update existing asset with new data"""
        asset = self.find_asset(asset_id)
        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")

        for key, value in updates.items():
            elem = asset.find(key)
            if elem is not None:
                elem.text = str(value) if value else ""
            else:
                new_elem = ET.SubElement(asset, key)
                new_elem.text = str(value) if value else ""

        self.save_database()
        return True

    def delete_asset(self, asset_id):
        """Delete asset and related maintenance records"""
        assets_elem = self.root.find("assets")
        asset = self.find_asset(asset_id)

        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")

        assets_elem.remove(asset)

        maint_elem = self.root.find("maintenance_records")
        records_to_remove = []

        for record in maint_elem.findall("maintenance_record"):
            if record.find("asset_id").text == asset_id:
                records_to_remove.append(record)

        for record in records_to_remove:
            maint_elem.remove(record)

        self.save_database()
        return len(records_to_remove)

    def find_asset(self, asset_id):
        """Find asset by asset_id"""
        assets = self.root.find("assets")
        for asset in assets.findall("asset"):
            if asset.find("asset_id").text == asset_id:
                return asset
        return None

    def get_asset_dict(self, asset_element):
        """Convert asset XML element to dictionary"""
        asset_dict = {"id": asset_element.get("id")}
        for child in asset_element:
            asset_dict[child.tag] = child.text
        return asset_dict

    def get_all_assets(self):
        """Get all assets as list of dictionaries"""
        assets = []
        assets_elem = self.root.find("assets")

        for asset in assets_elem.findall("asset"):
            assets.append(self.get_asset_dict(asset))

        return assets

    def search_assets(self, **criteria):
        """Search assets by multiple criteria"""
        matching_assets = []
        assets_elem = self.root.find("assets")

        for asset in assets_elem.findall("asset"):
            match = True
            for key, value in criteria.items():
                asset_field = asset.find(key)
                if asset_field is None or asset_field.text != str(value):
                    match = False
                    break
            if match:
                matching_assets.append(self.get_asset_dict(asset))

        return matching_assets

    def add_maintenance_record(self, maintenance_data):
        """Add maintenance record for asset"""
        maint_elem = self.root.find("maintenance_records")

        if not self.find_asset(maintenance_data.get("asset_id", "")):
            raise ValueError(f"Asset not found: {maintenance_data.get('asset_id', '')}")

        existing_ids = [int(record.get("id", 0)) for record in maint_elem.findall("maintenance_record")]
        new_id = max(existing_ids, default=0) + 1

        record_elem = ET.SubElement(maint_elem, "maintenance_record")
        record_elem.set("id", str(new_id))

        for key, value in maintenance_data.items():
            elem = ET.SubElement(record_elem, key)
            elem.text = str(value) if value else ""

        if "date" not in maintenance_data:
            date_elem = ET.SubElement(record_elem, "date")
            date_elem.text = datetime.now().strftime("%Y-%m-%d")

        self.save_database()
        return new_id

    def get_asset_maintenance(self, asset_id):
        """Get all maintenance records for specific asset"""
        records = []
        maint_elem = self.root.find("maintenance_records")

        for record in maint_elem.findall("maintenance_record"):
            if record.find("asset_id").text == asset_id:
                record_dict = {"id": record.get("id")}
                for child in record:
                    record_dict[child.tag] = child.text
                records.append(record_dict)

        return records

    def get_database_stats(self):
        """Get comprehensive database statistics"""
        assets = self.get_all_assets()
        maint_records = self.root.find("maintenance_records").findall("maintenance_record")
        manufacturers = self.root.find("manufacturers").findall("manufacturer")

        asset_types = {}
        asset_status = {}
        qr_generated = {"true": 0, "false": 0}

        for asset in assets:
            asset_type = asset.get("type", "unknown")
            asset_types[asset_type] = asset_types.get(asset_type, 0) + 1
            status = asset.get("status", "unknown")
            asset_status[status] = asset_status.get(status, 0) + 1
            qr_status = asset.get("qr_generated", "false")
            qr_generated[qr_status] = qr_generated.get(qr_status, 0) + 1

        return {
            "total_assets": len(assets),
            "total_maintenance_records": len(maint_records),
            "total_manufacturers": len(manufacturers),
            "asset_types": asset_types,
            "asset_status": asset_status,
            "qr_generated": qr_generated
        }

    def export_to_json(self, output_file="railway_assets.json"):
        """Export database to JSON format"""
        data = {
            "database_info": {
                "version": self.root.get("version"),
                "created": self.root.get("created"),
                "exported": datetime.now().isoformat(),
                "source_file": self.xml_file
            },
            "assets": self.get_all_assets(),
            "maintenance_records": [],
            "manufacturers": []
        }

        maint_elem = self.root.find("maintenance_records")
        for record in maint_elem.findall("maintenance_record"):
            record_dict = {"id": record.get("id")}
            for child in record:
                record_dict[child.tag] = child.text
            data["maintenance_records"].append(record_dict)

        mfg_elem = self.root.find("manufacturers")
        for mfg in mfg_elem.findall("manufacturer"):
            mfg_dict = {"id": mfg.get("id")}
            for child in mfg:
                mfg_dict[child.tag] = child.text
            data["manufacturers"].append(mfg_dict)

        with open(output_file, 'w', encoding='utf-8') as f:
            import json
            json.dump(data, f, indent=2, ensure_ascii=False)

        return data

    def export_to_xml(self):
        """Export database to properly formatted XML string"""
        self._prettify_xml(self.root)
        xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml_content = ET.tostring(self.root, encoding='unicode')
        return xml_declaration + xml_content


