#!/usr/bin/env python3
"""
Database Seed Script for Psych Logbook
======================================

This script imports data from seed_data/*.json files into MongoDB.
Use this when deploying to a new environment (e.g., Azure).

Usage:
    1. Export data from existing deployment:
       - Login as admin on your live site
       - Go to: https://your-site.com/api/admin/export-data
       - Save the JSON response to seed_data/export.json
    
    2. Run this script:
       MONGO_URL="your-mongodb-connection-string" python seed_database.py

    Or with environment variables already set:
       python seed_database.py
"""

import asyncio
import json
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Password hashing (same as server.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def seed_database():
    # Get MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'psychology_portal')
    
    print(f"🔌 Connecting to MongoDB...")
    print(f"   Database: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=30000)
    db = client[db_name]
    
    # Check for export file (try live_data_export.json first, then export.json)
    export_file = None
    for candidate in ['seed_data/live_data_export.json', 'seed_data/export.json']:
        if os.path.exists(candidate):
            export_file = candidate
            break
    
    if not export_file:
        print("❌ No export file found!")
        print("\nExpected files:")
        print("  - seed_data/live_data_export.json")
        print("  - seed_data/export.json")
        print("\nTo create the export file:")
        print("1. Login as admin on your live site")
        print("2. Visit: https://your-site.com/api/admin/export-data")
        print("3. Save the JSON response to seed_data/live_data_export.json")
        sys.exit(1)
    
    # Load export data
    print(f"\n📂 Loading data from {export_file}...")
    with open(export_file, 'r') as f:
        export_data = json.load(f)
    
    print(f"   Exported at: {export_data.get('exported_at', 'Unknown')}")
    
    collections_data = export_data.get('collections', {})
    
    # Import each collection
    for collection_name, documents in collections_data.items():
        if not documents:
            print(f"⏭️  Skipping {collection_name} (empty)")
            continue
        
        collection = db[collection_name]
        
        # Clear existing data (optional - comment out to append)
        await collection.delete_many({})
        
        # Special handling for users - need to hash passwords
        if collection_name == 'users':
            for doc in documents:
                # Set default password if not present (users will need to reset)
                if 'password' not in doc or not doc['password']:
                    doc['password'] = hash_password('changeme123')
        
        # Insert documents
        if documents:
            await collection.insert_many(documents)
            print(f"✅ Imported {len(documents)} documents into {collection_name}")
    
    # Create admin user if not exists
    admin = await db.users.find_one({"email": "admin"})
    if not admin:
        print("\n🔐 Creating admin user...")
        admin_user = {
            "id": "admin-" + os.urandom(8).hex(),
            "email": "admin",
            "name": "Administrator",
            "role": "psychologist",
            "password": hash_password("admin"),
            "competency_journal_enabled": True,
            "practice_logbook_enabled": True,
            "created_at": "2024-01-01T00:00:00Z"
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin user created (username: admin, password: admin)")
    else:
        print("\n✅ Admin user already exists")
    
    print("\n🎉 Database seeding complete!")
    print("\n⚠️  IMPORTANT: Users should change their passwords after first login!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
