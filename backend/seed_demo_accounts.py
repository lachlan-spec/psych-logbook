#!/usr/bin/env python3
"""
Seed demo accounts for Psychology Portal
Creates demo psychologist and supervisor accounts with realistic data
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def seed_demo_accounts():
    """Create demo accounts with sample data"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🌱 Seeding Psychology Portal Demo Accounts...")
    print(f"   Database: {DB_NAME}")
    print(f"   MongoDB: {MONGO_URL}")
    print()
    
    # Demo accounts
    demo_accounts = [
        {
            "id": str(uuid.uuid4()),
            "email": "demo-psychologist@psychology.com",
            "name": "Dr. Sarah Chen",
            "password": hash_password("password"),
            "role": "psychologist",
            "picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "demo-supervisor@psychology.com",
            "name": "Prof. Michael Roberts",
            "password": hash_password("password"),
            "role": "supervisor",
            "picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Check if accounts already exist and delete them
    for account in demo_accounts:
        existing = await db.users.find_one({"email": account["email"]})
        if existing:
            await db.users.delete_one({"email": account["email"]})
            await db.user_sessions.delete_many({"user_id": existing.get("id")})
            print(f"   🗑️  Removed existing {account['role']}: {account['email']}")
    
    # Insert demo accounts
    await db.users.insert_many(demo_accounts)
    
    psychologist = demo_accounts[0]
    supervisor = demo_accounts[1]
    
    print()
    print("✅ Demo Accounts Created:")
    print()
    print(f"   👨‍🎓 Psychologist Account")
    print(f"      Email: {psychologist['email']}")
    print(f"      Password: password")
    print(f"      Name: {psychologist['name']}")
    print()
    print(f"   👨‍🏫 Supervisor Account")
    print(f"      Email: {supervisor['email']}")
    print(f"      Password: password")
    print(f"      Name: {supervisor['name']}")
    print()
    
    # Create connection between them (accepted)
    connection = {
        "id": str(uuid.uuid4()),
        "psychologist_id": psychologist["id"],
        "supervisor_id": supervisor["id"],
        "status": "accepted",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove existing connection if any
    await db.connections.delete_many({
        "psychologist_id": psychologist["id"],
        "supervisor_id": supervisor["id"]
    })
    
    await db.connections.insert_one(connection)
    print("   🔗 Connection created between psychologist and supervisor")
    print()
    
    # Create sample logbook year for psychologist
    current_year = datetime.now().year
    logbook_year = {
        "id": str(uuid.uuid4()),
        "user_id": psychologist["id"],
        "year": str(current_year),
        "start_date": f"{current_year}-01-01",
        "end_date": f"{current_year}-12-31",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove existing year
    await db.logbook_years.delete_many({
        "user_id": psychologist["id"],
        "year": str(current_year)
    })
    
    await db.logbook_years.insert_one(logbook_year)
    print(f"   📅 Logbook year {current_year} created")
    
    # Create sample logbook entries
    sample_entries = [
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "logbook_id": logbook_year["id"],
            "date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
            "duration": 3.5,
            "activity_type": "Individual Therapy Session",
            "notes": "CBT session with client presenting anxiety symptoms. Applied cognitive restructuring techniques.",
            "reflections": "Client showed good engagement. Need to follow up on homework exercises next session.",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "logbook_id": logbook_year["id"],
            "date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
            "duration": 2.0,
            "activity_type": "Assessment",
            "notes": "Initial psychological assessment for new client. Completed DASS-21 and clinical interview.",
            "reflections": "Clear presentation of depressive symptoms. Recommended 8-week treatment plan.",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "logbook_id": logbook_year["id"],
            "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "duration": 1.5,
            "activity_type": "Supervision",
            "notes": "Weekly supervision session with Prof. Roberts. Discussed complex case management.",
            "reflections": "Valuable feedback on therapeutic approach. Will implement suggested modifications.",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.logbook_entries.insert_many(sample_entries)
    print(f"   📝 Created {len(sample_entries)} sample logbook entries")
    
    # Create CPD year
    cpd_year = {
        "id": str(uuid.uuid4()),
        "user_id": psychologist["id"],
        "year": str(current_year),
        "cpd_hours_required": 30,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cpd_years.delete_many({
        "user_id": psychologist["id"],
        "year": str(current_year)
    })
    
    await db.cpd_years.insert_one(cpd_year)
    print(f"   📚 CPD year {current_year} created")
    
    # Create sample CPD activities
    cpd_activities = [
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "year_id": cpd_year["id"],
            "activity_type": "Workshop",
            "hours": 6.0,
            "description": "Trauma-Informed Practice Workshop - Evidence-based approaches to trauma therapy",
            "reflection": "Excellent workshop. Learned new techniques for working with PTSD clients.",
            "date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "year_id": cpd_year["id"],
            "activity_type": "Reading",
            "hours": 4.0,
            "description": "Recent research on ACT interventions for anxiety disorders",
            "reflection": "Will incorporate some of these approaches into current practice.",
            "date": (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "year_id": cpd_year["id"],
            "activity_type": "Online Course",
            "hours": 8.0,
            "description": "Advanced DBT Skills Training - Dialectical Behavior Therapy certification",
            "reflection": "Comprehensive course. Enhanced understanding of emotion regulation strategies.",
            "date": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.cpd_activities.insert_many(cpd_activities)
    print(f"   🎓 Created {len(cpd_activities)} sample CPD activities ({sum(a['hours'] for a in cpd_activities)} hours)")
    
    # Create sample competency journals
    competency_journals = [
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "competency_id": "0",
            "entry": "Maintained strict confidentiality protocols in today's session. Client disclosed sensitive information about family dynamics. Ensured proper documentation and informed consent processes were followed.",
            "date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "competency_id": "1",
            "entry": "Completed comprehensive biopsychosocial assessment for new client. Used structured clinical interview and standardized measures (DASS-21, GAD-7). Formulated preliminary case conceptualization using CBT framework.",
            "date": (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": psychologist["id"],
            "competency_id": "2",
            "entry": "Implemented exposure therapy protocol for client with social anxiety. Carefully graded exposure hierarchy and provided psychoeducation on anxiety response. Client reported reduced avoidance behaviors.",
            "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.competency_journals.insert_many(competency_journals)
    print(f"   ⭐ Created {len(competency_journals)} competency journal entries")
    
    print()
    print("=" * 60)
    print("✅ Demo accounts seeded successfully!")
    print("=" * 60)
    print()
    print("📋 Quick Summary:")
    print(f"   • Total logbook hours: {sum(e['duration'] for e in sample_entries)} hours")
    print(f"   • CPD hours completed: {sum(a['hours'] for a in cpd_activities)}/30 hours")
    print(f"   • Competency journals: {len(competency_journals)} entries")
    print(f"   • Connection: Psychologist ↔ Supervisor (Active)")
    print()
    print("🚀 You can now login with:")
    print(f"   Email: demo-psychologist@psychology.com")
    print(f"   Password: password")
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_demo_accounts())
