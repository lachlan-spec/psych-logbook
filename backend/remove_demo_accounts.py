#!/usr/bin/env python3
"""
Remove demo accounts from production database
Use this script to clean demo accounts from deployed/production environment
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

DEMO_EMAILS = [
    "demo-psychologist@psychology.com",
    "demo-supervisor@psychology.com"
]

async def remove_demo_accounts():
    """Remove demo accounts and all their associated data"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🧹 Removing Demo Accounts from Psychology Portal...")
    print(f"   Database: {DB_NAME}")
    print(f"   MongoDB: {MONGO_URL}")
    print()
    
    # Get demo user IDs
    demo_user_ids = []
    for email in DEMO_EMAILS:
        user = await db.users.find_one({"email": email}, {"_id": 0, "id": 1})
        if user:
            demo_user_ids.append(user["id"])
            print(f"   Found demo account: {email}")
    
    if not demo_user_ids:
        print("✅ No demo accounts found in database")
        return
    
    print(f"\n🗑️  Removing {len(demo_user_ids)} demo accounts and their data...")
    
    # Remove users
    result = await db.users.delete_many({"email": {"$in": DEMO_EMAILS}})
    print(f"   ✓ Deleted {result.deleted_count} demo users")
    
    # Remove sessions
    result = await db.user_sessions.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} sessions")
    
    # Remove connections
    result = await db.connections.delete_many({
        "$or": [
            {"psychologist_id": {"$in": demo_user_ids}},
            {"supervisor_id": {"$in": demo_user_ids}}
        ]
    })
    print(f"   ✓ Deleted {result.deleted_count} connections")
    
    # Remove logbook years
    result = await db.logbook_years.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} logbook years")
    
    # Remove logbook entries
    result = await db.logbook_entries.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} logbook entries")
    
    # Remove logbook signatures
    result = await db.logbook_signatures.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} logbook signatures")
    
    # Remove CPD years
    result = await db.cpd_years.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} CPD years")
    
    # Remove CPD activities
    result = await db.cpd_activities.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} CPD activities")
    
    # Remove CPD plans
    result = await db.cpd_plans.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} CPD plans")
    
    # Remove peer consultations
    result = await db.peer_consultations.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} peer consultations")
    
    # Remove competency journals
    result = await db.competency_journals.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} competency journals")
    
    # Remove messages
    result = await db.messages.delete_many({
        "$or": [
            {"from_user_id": {"$in": demo_user_ids}},
            {"to_user_id": {"$in": demo_user_ids}}
        ]
    })
    print(f"   ✓ Deleted {result.deleted_count} messages")
    
    # Remove notifications
    result = await db.notifications.delete_many({"user_id": {"$in": demo_user_ids}})
    print(f"   ✓ Deleted {result.deleted_count} notifications")
    
    print("\n✅ Demo accounts and all associated data removed successfully!")
    print("   Production database is now clean.")

if __name__ == "__main__":
    asyncio.run(remove_demo_accounts())
