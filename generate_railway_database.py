#!/usr/bin/env python3
"""
Railway XML Database Generator
=============================
Command-line tool to generate XML database for railway asset management system.

Usage:
    python generate_railway_database.py [options]

Options:
    --output, -o        Output XML filename (default: railway_assets.xml)
    --samples, -s       Number of sample assets to generate (default: 10)
    --verbose, -v       Enable verbose output
    --help, -h          Show this help message

Author: Dhruv Gohel
Date: September 2025
"""

import xml.etree.ElementTree as ET
import argparse
import sys
import os
from datetime import datetime, timedelta
import random

class RailwayDatabaseGenerator:
    """Generate comprehensive XML database for railway assets"""

    def __init__(self, output_file="railway_assets.xml", verbose=False):
        self.output_file = output_file
        self.verbose = verbose
        self.asset_counter = 1
        self.maintenance_counter = 1

        self.asset_types = {
            "track": {
                "materials": ["Steel Rail", "Continuous Welded Rail", "Jointed Rail"],
                "weight_range": (50.0, 80.0),
                "length_range": (10.0, 25.0),
                "prefix": "TRK"
            },
            "sleeper": {
                "materials": ["Concrete", "Steel", "Composite", "Wooden"],
                "weight_range": (250.0, 400.0),
                "length_range": (2.5, 3.0),
                "prefix": "SLP"
            },
            "signal": {
                "materials": ["Aluminum Alloy", "Steel Frame", "LED Display"],
                "weight_range": (30.0, 60.0),
                "length_range": (3.0, 5.0),
                "prefix": "SIG"
            },
            "bridge": {
                "materials": ["Reinforced Concrete", "Steel Truss", "Composite"],
                "weight_range": (5000.0, 20000.0),
                "length_range": (15.0, 100.0),
                "prefix": "BRG"
            },
            "switch": {
                "materials": ["High Carbon Steel", "Manganese Steel"],
                "weight_range": (200.0, 500.0),
                "length_range": (5.0, 12.0),
                "prefix": "SWT"
            }
        }

        self.manufacturers = [
            {
                "id": "MFG-101",
                "name": "Indian Railways Manufacturing Ltd",
                "location": "New Delhi, Delhi",
                "contact": "+91-11-23456789",
                "specialization": "Railway Infrastructure Components"
            },
            {
                "id": "MFG-102",
                "name": "Steel Authority of India Ltd (SAIL)",
                "location": "Bokaro, Jharkhand",
                "contact": "+91-6542-234567",
                "specialization": "Steel Rails and Track Components"
            },
            {
                "id": "MFG-103",
                "name": "Railway Signal Engineering Corp",
                "location": "Secunderabad, Telangana",
                "contact": "+91-40-27894561",
                "specialization": "Railway Signaling and Communication"
            },
            {
                "id": "MFG-104",
                "name": "Concrete Sleeper Industries",
                "location": "Gwalior, Madhya Pradesh",
                "contact": "+91-751-2345678",
                "specialization": "Prestressed Concrete Railway Sleepers"
            },
            {
                "id": "MFG-105",
                "name": "Bridge Construction Corp",
                "location": "Pune, Maharashtra",
                "contact": "+91-20-12345678",
                "specialization": "Railway Bridge Construction"
            }
        ]

        self.locations = [
            "Section A-1 to A-5", "Section B-12 to B-18", "Junction C-5",
            "Bridge Point D-23", "Signal Box E-7", "Maintenance Yard F-14",
            "Station Platform G-3", "Crossing Point H-19", "Tunnel Entry J-8",
            "Depot Storage K-25", "Workshop Area L-11", "Control Room M-4"
        ]

        self.maintenance_types = [
            "inspection", "repair", "replacement", "calibration", 
            "cleaning", "lubrication", "testing", "upgrade"
        ]

        self.operators = [
            "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sunita Patel",
            "Vikram Rao", "Kavita Reddy", "Suresh Gupta", "Meera Nair",
            "Ravi Verma", "Pooja Jain", "Manoj Tiwari", "Sneha Agarwal"
        ]

    def log(self, message):
        if self.verbose:
            print(f"[INFO] {message}")

    def generate_asset_id(self, asset_type):
        prefix = self.asset_types[asset_type]["prefix"]
        year = datetime.now().year
        asset_id = f"{prefix}-{year}-{self.asset_counter:06d}"
        self.asset_counter += 1
        return asset_id

    def generate_random_asset(self, asset_type):
        config = self.asset_types[asset_type]

        manufacturing_date = datetime.now() - timedelta(days=random.randint(30, 365))
        installation_date = manufacturing_date + timedelta(days=random.randint(1, 90))

        weight = round(random.uniform(*config["weight_range"]), 2)
        length = round(random.uniform(*config["length_range"]), 1)
        material = random.choice(config["materials"])

        status_options = ["manufactured", "shipped", "installed", "maintenance", "retired"]
        status = random.choice(status_options)
        if (datetime.now() - manufacturing_date).days < 30:
            status = "manufactured"
            installation_date = None

        asset_data = {
            "asset_id": self.generate_asset_id(asset_type),
            "type": asset_type,
            "manufacturer_id": random.choice(self.manufacturers)["id"],
            "manufacturing_date": manufacturing_date.strftime("%Y-%m-%d"),
            "installation_date": installation_date.strftime("%Y-%m-%d") if installation_date else "",
            "status": status,
            "qr_generated": str(random.choice([True, False])).lower(),
            "location": random.choice(self.locations),
            "material": material,
            "weight": str(weight),
            "length": str(length)
        }
        return asset_data

    def generate_maintenance_record(self, asset_id):
        maintenance_date = datetime.now() - timedelta(days=random.randint(1, 180))

        maintenance_data = {
            "asset_id": asset_id,
            "maintenance_type": random.choice(self.maintenance_types),
            "operator": random.choice(self.operators),
            "description": f"{random.choice(self.maintenance_types).title()} of {asset_id.split('-')[0].lower()} component",
            "date": maintenance_date.strftime("%Y-%m-%d"),
            "status": random.choice(["completed", "in_progress", "scheduled"]),
            "findings": random.choice([
                "Component in good condition",
                "Minor wear observed, monitoring required",
                "Replacement recommended within 6 months",
                "Calibration completed successfully",
                "Cleaning and lubrication performed",
                "No issues detected during inspection"
            ])
        }
        return maintenance_data

    def create_xml_database(self, num_assets=10):
        self.log(f"Creating XML database with {num_assets} sample assets...")

        root = ET.Element("railway_asset_database")
        root.set("version", "1.0")
        root.set("created", datetime.now().isoformat())
        root.set("generator", "Railway Database Generator v1.0")

        assets_elem = ET.SubElement(root, "assets")
        generated_assets = []

        asset_types_list = list(self.asset_types.keys())
        assets_per_type = num_assets // len(asset_types_list)
        remaining_assets = num_assets % len(asset_types_list)

        for i, asset_type in enumerate(asset_types_list):
            count = assets_per_type + (1 if i < remaining_assets else 0)
            for _ in range(count):
                asset_data = self.generate_random_asset(asset_type)
                generated_assets.append(asset_data["asset_id"])
                asset_elem = ET.SubElement(assets_elem, "asset")
                asset_elem.set("id", str(len(generated_assets)))
                for key, value in asset_data.items():
                    elem = ET.SubElement(asset_elem, key)
                    elem.text = str(value)
                self.log(f"Generated asset: {asset_data['asset_id']}")

        maintenance_elem = ET.SubElement(root, "maintenance_records")

        num_maintenance = int(len(generated_assets) * 0.6)
        selected_assets = random.sample(generated_assets, num_maintenance)

        for asset_id in selected_assets:
            num_records = random.randint(1,3)
            for _ in range(num_records):
                maint_data = self.generate_maintenance_record(asset_id)
                maint_record = ET.SubElement(maintenance_elem, "maintenance_record")
                maint_record.set("id", str(self.maintenance_counter))
                self.maintenance_counter += 1
                for key, value in maint_data.items():
                    elem = ET.SubElement(maint_record, key)
                    elem.text = str(value)
                self.log(f"Generated maintenance record for: {asset_id}")

        manufacturers_elem = ET.SubElement(root, "manufacturers")
        for mfg_data in self.manufacturers:
            mfg_elem = ET.SubElement(manufacturers_elem, "manufacturer")
            mfg_elem.set("id", mfg_data["id"])
            for key, value in mfg_data.items():
                if key != "id":
                    elem = ET.SubElement(mfg_elem, key)
                    elem.text = str(value)
        self.log(f"Added {len(self.manufacturers)} manufacturers to database")

        return root

    def prettify_xml(self, element, level=0):
        indent = "\n" + level * "  "
        if len(element):
            if not element.text or not element.text.strip():
                element.text = indent + "  "
            if not element.tail or not element.tail.strip():
                element.tail = indent
            for child in element:
                self.prettify_xml(child, level + 1)
            if not child.tail or not child.tail.strip():
                child.tail = indent
        else:
            if level and (not element.tail or not element.tail.strip()):
                element.tail = indent

    def save_database(self, root):
        self.log(f"Saving database to: {self.output_file}")
        self.prettify_xml(root)
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                f.write(ET.tostring(root, encoding='unicode'))
            file_size = os.path.getsize(self.output_file)
            print(f"✅ Database successfully created: {self.output_file}")
            print(f"📁 File size: {file_size:,} bytes")
            return True
        except Exception as e:
            print(f"❌ Error saving database: {e}")
            return False

    def generate_stats(self, root):
        assets = root.find("assets").findall("asset")
        maintenance_records = root.find("maintenance_records").findall("maintenance_record")
        manufacturers = root.find("manufacturers").findall("manufacturer")

        asset_types_count = {}
        for asset in assets:
            asset_type = asset.find("type").text
            asset_types_count[asset_type] = asset_types_count.get(asset_type, 0) + 1

        status_count = {}
        for asset in assets:
            status = asset.find("status").text
            status_count[status] = status_count.get(status, 0) + 1

        print(f"\n📊 Database Statistics:")
        print(f"{'='*40}")
        print(f"Total Assets: {len(assets)}")
        print(f"Maintenance Records: {len(maintenance_records)}")
        print(f"Manufacturers: {len(manufacturers)}")
        print(f"\n🔧 Asset Types:")
        for asset_type, count in asset_types_count.items():
            print(f"  • {asset_type.title()}: {count}")
        print(f"\n📈 Asset Status:")
        for status, count in status_count.items():
            print(f"  • {status.title()}: {count}")

def main():
    parser = argparse.ArgumentParser(
        description="Generate XML database for railway asset management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_railway_database.py
  python generate_railway_database.py --samples 50 --verbose
  python generate_railway_database.py -o custom_db.xml -s 25 -v
        """
    )
    parser.add_argument('--output', '-o', default='railway_assets.xml', help='Output XML filename (default: railway_assets.xml)')
    parser.add_argument('--samples', '-s', type=int, default=10, help='Number of sample assets to generate (default: 10)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    args = parser.parse_args()

    if args.samples < 1:
        print("❌ Error: Number of samples must be at least 1")
        sys.exit(1)
    if args.samples > 1000:
        print("⚠️  Warning: Generating more than 1000 assets may take some time")

    print("🚂 Railway XML Database Generator")
    print("="*50)
    print(f"Output file: {args.output}")
    print(f"Sample assets: {args.samples}")
    print(f"Verbose mode: {'Enabled' if args.verbose else 'Disabled'}\n")

    generator = RailwayDatabaseGenerator(args.output, args.verbose)
    xml_root = generator.create_xml_database(args.samples)
    if generator.save_database(xml_root):
        generator.generate_stats(xml_root)
        print(f"\n🎉 Database generation completed successfully!")
    else:
        print("❌ Failed to save database")
        sys.exit(1)

if __name__ == "__main__":
    main()
