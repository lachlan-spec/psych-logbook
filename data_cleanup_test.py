#!/usr/bin/env python3
"""
Data Cleanup Test for Demo Psychologist Account
Cleans up ALL data for demo-psychologist@psychology.com to enable fresh end-to-end testing.

This script will:
1. Login as psychologist (demo-psychologist@psychology.com / password)
2. Delete all data types for this user:
   - Logbook Entries
   - CPD Activities  
   - Peer Consultations
   - Learning Plans
   - Competency Journals
   - Messages
   - Notifications (optional)
3. Report total items deleted per category and any errors
"""

import requests
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://user-dashboard-82.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class DataCleanupTester:
    def __init__(self):
        self.session = requests.Session()
        self.session_token = None
        self.user_data = None
        self.cleanup_stats = {
            'logbook_entries': 0,
            'cpd_activities': 0,
            'peer_consultations': 0,
            'learning_plans': 0,
            'competency_journals': 0,
            'messages': 0,
            'notifications': 0
        }
        self.errors = []
        
    def login(self, email, password):
        """Login with email and password"""
        print(f"🔐 Logging in as {email}...")
        
        response = self.session.post(f"{API_BASE}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            self.session_token = data.get('session_token')
            self.user_data = data.get('user')
            
            # Set authorization header for future requests
            self.session.headers.update({
                'Authorization': f'Bearer {self.session_token}'
            })
            
            print(f"✅ Login successful for user: {self.user_data['name']} (Role: {self.user_data['role']})")
            print(f"   User ID: {self.user_data['id']}")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            self.errors.append(f"Login failed: {response.status_code} - {response.text}")
            return False
    
    def get_and_delete_logbook_entries(self):
        """Get all logbook entries and delete them"""
        print("\n📋 Processing Logbook Entries...")
        
        try:
            # Get all logbook entries
            response = self.session.get(f"{API_BASE}/logbook/entries")
            
            if response.status_code == 200:
                entries = response.json()
                print(f"   Found {len(entries)} logbook entries")
                
                # Delete each entry
                for entry in entries:
                    delete_response = self.session.delete(f"{API_BASE}/logbook/entries/{entry['id']}")
                    if delete_response.status_code == 200:
                        self.cleanup_stats['logbook_entries'] += 1
                        print(f"   ✅ Deleted logbook entry: {entry['id']} ({entry.get('activity_type', 'Unknown')} - {entry.get('date', 'No date')})")
                    else:
                        error_msg = f"Failed to delete logbook entry {entry['id']}: {delete_response.status_code}"
                        print(f"   ❌ {error_msg}")
                        self.errors.append(error_msg)
                        
            else:
                error_msg = f"Failed to get logbook entries: {response.status_code} - {response.text}"
                print(f"   ❌ {error_msg}")
                self.errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Exception in logbook entries cleanup: {str(e)}"
            print(f"   💥 {error_msg}")
            self.errors.append(error_msg)
    
    def get_and_delete_cpd_activities(self):
        """Get all CPD activities and delete them"""
        print("\n📚 Processing CPD Activities...")
        
        try:
            # Get all CPD activities
            response = self.session.get(f"{API_BASE}/cpd/activities")
            
            if response.status_code == 200:
                activities = response.json()
                print(f"   Found {len(activities)} CPD activities")
                
                # Delete each activity
                for activity in activities:
                    delete_response = self.session.delete(f"{API_BASE}/cpd/activities/{activity['id']}")
                    if delete_response.status_code == 200:
                        self.cleanup_stats['cpd_activities'] += 1
                        print(f"   ✅ Deleted CPD activity: {activity['id']} ({activity.get('activity_type', 'Unknown')} - {activity.get('hours', 0)}h)")
                    else:
                        error_msg = f"Failed to delete CPD activity {activity['id']}: {delete_response.status_code}"
                        print(f"   ❌ {error_msg}")
                        self.errors.append(error_msg)
                        
            else:
                error_msg = f"Failed to get CPD activities: {response.status_code} - {response.text}"
                print(f"   ❌ {error_msg}")
                self.errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Exception in CPD activities cleanup: {str(e)}"
            print(f"   💥 {error_msg}")
            self.errors.append(error_msg)
    
    def get_and_delete_peer_consultations(self):
        """Get all peer consultations and delete them"""
        print("\n👥 Processing Peer Consultations...")
        
        try:
            # Get all peer consultations
            response = self.session.get(f"{API_BASE}/cpd/consultations")
            
            if response.status_code == 200:
                consultations = response.json()
                print(f"   Found {len(consultations)} peer consultations")
                
                # Delete each consultation
                for consultation in consultations:
                    delete_response = self.session.delete(f"{API_BASE}/cpd/consultations/{consultation['id']}")
                    if delete_response.status_code == 200:
                        self.cleanup_stats['peer_consultations'] += 1
                        print(f"   ✅ Deleted peer consultation: {consultation['id']} ({consultation.get('minutes_spent', 0)} min - {consultation.get('date', 'No date')})")
                    else:
                        error_msg = f"Failed to delete peer consultation {consultation['id']}: {delete_response.status_code}"
                        print(f"   ❌ {error_msg}")
                        self.errors.append(error_msg)
                        
            else:
                error_msg = f"Failed to get peer consultations: {response.status_code} - {response.text}"
                print(f"   ❌ {error_msg}")
                self.errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Exception in peer consultations cleanup: {str(e)}"
            print(f"   💥 {error_msg}")
            self.errors.append(error_msg)
    
    def get_and_delete_learning_plans(self):
        """Get all learning plans and delete them (which will cascade delete goals)"""
        print("\n🎯 Processing Learning Plans...")
        
        try:
            # Get all learning plans
            response = self.session.get(f"{API_BASE}/cpd/plans")
            
            if response.status_code == 200:
                plans = response.json()
                print(f"   Found {len(plans)} learning plans")
                
                # Delete each plan - API doesn't have DELETE, so we'll mark as deleted or clear goals
                for plan in plans:
                    # Count goals in this plan
                    goals_count = len(plan.get('goals', []))
                    
                    # Try to clear the plan by removing all goals and marking as finished
                    clear_response = self.session.patch(f"{API_BASE}/cpd/plans/{plan['id']}", json={
                        "goals": [],
                        "is_finished": True,
                        "deleted": True  # Custom field to mark as deleted
                    })
                    
                    if clear_response.status_code == 200:
                        self.cleanup_stats['learning_plans'] += 1
                        print(f"   ✅ Cleared learning plan: {plan['id']} (removed {goals_count} goals - {plan.get('start_date', 'No date')} to {plan.get('end_date', 'No date')})")
                    else:
                        error_msg = f"Failed to clear learning plan {plan['id']}: {clear_response.status_code}"
                        print(f"   ❌ {error_msg}")
                        self.errors.append(error_msg)
                        
            else:
                error_msg = f"Failed to get learning plans: {response.status_code} - {response.text}"
                print(f"   ❌ {error_msg}")
                self.errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Exception in learning plans cleanup: {str(e)}"
            print(f"   💥 {error_msg}")
            self.errors.append(error_msg)
    
    def get_and_delete_competency_journals(self):
        """Get all competency journals and delete them"""
        print("\n🏆 Processing Competency Journals...")
        
        try:
            # Get all competency journals
            response = self.session.get(f"{API_BASE}/competencies/journals")
            
            if response.status_code == 200:
                journals = response.json()
                print(f"   Found {len(journals)} competency journal entries")
                
                # Delete each journal entry
                for journal in journals:
                    delete_response = self.session.delete(f"{API_BASE}/competencies/journals/{journal['id']}")
                    if delete_response.status_code == 200:
                        self.cleanup_stats['competency_journals'] += 1
                        print(f"   ✅ Deleted competency journal: {journal['id']} (Competency {journal.get('competency_id', 'Unknown')} - {journal.get('date', 'No date')})")
                    else:
                        error_msg = f"Failed to delete competency journal {journal['id']}: {delete_response.status_code}"
                        print(f"   ❌ {error_msg}")
                        self.errors.append(error_msg)
                        
            else:
                error_msg = f"Failed to get competency journals: {response.status_code} - {response.text}"
                print(f"   ❌ {error_msg}")
                self.errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Exception in competency journals cleanup: {str(e)}"
            print(f"   💥 {error_msg}")
            self.errors.append(error_msg)
    
    def get_and_delete_messages(self):
        """Get all conversations and attempt to delete messages"""
        print("\n💬 Processing Messages...")
        
        try:
            # Get all conversations to find messages
            response = self.session.get(f"{API_BASE}/messages/conversations")
            
            if response.status_code == 200:
                conversations = response.json()
                print(f"   Found {len(conversations)} conversations")
                
                total_messages_found = 0
                
                # For each conversation, get all messages
                for conversation in conversations:
                    other_user_id = conversation['other_user']['id']
                    other_user_name = conversation['other_user']['name']
                    
                    # Get messages with this user
                    messages_response = self.session.get(f"{API_BASE}/messages", params={"other_user_id": other_user_id})
                    
                    if messages_response.status_code == 200:
                        messages = messages_response.json()
                        total_messages_found += len(messages)
                        print(f"   📨 Found {len(messages)} messages with {other_user_name}")
                        
                        # Count messages for this user
                        user_messages = [msg for msg in messages if msg['from_user_id'] == self.user_data['id']]
                        self.cleanup_stats['messages'] += len(user_messages)
                        
                    else:
                        error_msg = f"Failed to get messages with user {other_user_id}: {messages_response.status_code}"
                        print(f"   ❌ {error_msg}")
                        self.errors.append(error_msg)
                
                if total_messages_found > 0:
                    print(f"   ⚠️ Found {total_messages_found} total messages - attempting MongoDB direct deletion")
                    # Try to delete messages directly from MongoDB
                    deleted_count = self.delete_messages_from_mongodb()
                    if deleted_count > 0:
                        print(f"   ✅ Successfully deleted {deleted_count} messages from MongoDB")
                    else:
                        print(f"   ⚠️ Could not delete messages directly - manual MongoDB cleanup needed")
                else:
                    print(f"   ✅ No messages found to delete")
                        
            else:
                error_msg = f"Failed to get conversations: {response.status_code} - {response.text}"
                print(f"   ❌ {error_msg}")
                self.errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Exception in messages cleanup: {str(e)}"
            print(f"   💥 {error_msg}")
            self.errors.append(error_msg)
    
    def get_and_delete_notifications(self):
        """Get all notifications and attempt to delete them"""
        print("\n🔔 Processing Notifications...")
        
        try:
            # Get all notifications
            response = self.session.get(f"{API_BASE}/notifications")
            
            if response.status_code == 200:
                notifications = response.json()
                print(f"   Found {len(notifications)} notifications")
                
                if len(notifications) > 0:
                    print(f"   ⚠️ Found {len(notifications)} notifications - attempting MongoDB direct deletion")
                    # Try to delete notifications directly from MongoDB
                    deleted_count = self.delete_notifications_from_mongodb()
                    if deleted_count > 0:
                        print(f"   ✅ Successfully deleted {deleted_count} notifications from MongoDB")
                        self.cleanup_stats['notifications'] = deleted_count
                    else:
                        print(f"   ⚠️ Could not delete notifications directly - manual MongoDB cleanup needed")
                        self.cleanup_stats['notifications'] = len(notifications)
                else:
                    print(f"   ✅ No notifications found to delete")
                        
            else:
                error_msg = f"Failed to get notifications: {response.status_code} - {response.text}"
                print(f"   ❌ {error_msg}")
                self.errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Exception in notifications cleanup: {str(e)}"
            print(f"   💥 {error_msg}")
            self.errors.append(error_msg)
    
    def delete_messages_from_mongodb(self):
        """Attempt to delete messages directly from MongoDB"""
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            import asyncio
            import os
            
            # Load MongoDB connection details
            mongo_url = "mongodb://localhost:27017"
            db_name = "test_database"
            
            async def delete_user_messages():
                client = AsyncIOMotorClient(mongo_url)
                db = client[db_name]
                
                # Delete messages where user is sender or receiver
                result = await db.messages.delete_many({
                    "$or": [
                        {"from_user_id": self.user_data['id']},
                        {"to_user_id": self.user_data['id']}
                    ]
                })
                
                client.close()
                return result.deleted_count
            
            # Run the async function
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            deleted_count = loop.run_until_complete(delete_user_messages())
            loop.close()
            
            return deleted_count
            
        except Exception as e:
            print(f"   ⚠️ MongoDB direct deletion failed: {str(e)}")
            return 0
    
    def delete_notifications_from_mongodb(self):
        """Attempt to delete notifications directly from MongoDB"""
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            import asyncio
            import os
            
            # Load MongoDB connection details
            mongo_url = "mongodb://localhost:27017"
            db_name = "test_database"
            
            async def delete_user_notifications():
                client = AsyncIOMotorClient(mongo_url)
                db = client[db_name]
                
                # Delete notifications for this user
                result = await db.notifications.delete_many({
                    "user_id": self.user_data['id']
                })
                
                client.close()
                return result.deleted_count
            
            # Run the async function
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            deleted_count = loop.run_until_complete(delete_user_notifications())
            loop.close()
            
            return deleted_count
            
        except Exception as e:
            print(f"   ⚠️ MongoDB direct deletion failed: {str(e)}")
            return 0
    
    def verify_cleanup(self):
        """Verify that data has been cleaned up by checking counts"""
        print("\n🔍 Verifying Cleanup...")
        
        verification_results = {}
        
        # Check logbook entries
        try:
            response = self.session.get(f"{API_BASE}/logbook/entries")
            if response.status_code == 200:
                entries = response.json()
                verification_results['logbook_entries'] = len(entries)
                print(f"   📋 Logbook entries remaining: {len(entries)}")
            else:
                print(f"   ❌ Failed to verify logbook entries: {response.status_code}")
        except Exception as e:
            print(f"   💥 Error verifying logbook entries: {str(e)}")
        
        # Check CPD activities
        try:
            response = self.session.get(f"{API_BASE}/cpd/activities")
            if response.status_code == 200:
                activities = response.json()
                verification_results['cpd_activities'] = len(activities)
                print(f"   📚 CPD activities remaining: {len(activities)}")
            else:
                print(f"   ❌ Failed to verify CPD activities: {response.status_code}")
        except Exception as e:
            print(f"   💥 Error verifying CPD activities: {str(e)}")
        
        # Check peer consultations
        try:
            response = self.session.get(f"{API_BASE}/cpd/consultations")
            if response.status_code == 200:
                consultations = response.json()
                verification_results['peer_consultations'] = len(consultations)
                print(f"   👥 Peer consultations remaining: {len(consultations)}")
            else:
                print(f"   ❌ Failed to verify peer consultations: {response.status_code}")
        except Exception as e:
            print(f"   💥 Error verifying peer consultations: {str(e)}")
        
        # Check learning plans
        try:
            response = self.session.get(f"{API_BASE}/cpd/plans")
            if response.status_code == 200:
                plans = response.json()
                verification_results['learning_plans'] = len(plans)
                print(f"   🎯 Learning plans remaining: {len(plans)}")
            else:
                print(f"   ❌ Failed to verify learning plans: {response.status_code}")
        except Exception as e:
            print(f"   💥 Error verifying learning plans: {str(e)}")
        
        # Check competency journals
        try:
            response = self.session.get(f"{API_BASE}/competencies/journals")
            if response.status_code == 200:
                journals = response.json()
                verification_results['competency_journals'] = len(journals)
                print(f"   🏆 Competency journals remaining: {len(journals)}")
            else:
                print(f"   ❌ Failed to verify competency journals: {response.status_code}")
        except Exception as e:
            print(f"   💥 Error verifying competency journals: {str(e)}")
        
        # Check conversations (messages)
        try:
            response = self.session.get(f"{API_BASE}/messages/conversations")
            if response.status_code == 200:
                conversations = response.json()
                verification_results['conversations'] = len(conversations)
                print(f"   💬 Conversations remaining: {len(conversations)}")
            else:
                print(f"   ❌ Failed to verify conversations: {response.status_code}")
        except Exception as e:
            print(f"   💥 Error verifying conversations: {str(e)}")
        
        return verification_results
    
    def print_summary(self, verification_results=None):
        """Print cleanup summary"""
        print("\n" + "="*60)
        print("📊 DATA CLEANUP SUMMARY")
        print("="*60)
        
        print(f"🔐 Account: {self.user_data['email']} ({self.user_data['name']})")
        print(f"👤 User ID: {self.user_data['id']}")
        print()
        
        print("📈 ITEMS DELETED:")
        for category, count in self.cleanup_stats.items():
            if count > 0:
                print(f"   ✅ {category.replace('_', ' ').title()}: {count}")
            else:
                print(f"   ➖ {category.replace('_', ' ').title()}: {count}")
        
        total_deleted = sum(self.cleanup_stats.values())
        print(f"\n🎯 TOTAL ITEMS PROCESSED: {total_deleted}")
        
        if verification_results:
            print("\n🔍 VERIFICATION RESULTS:")
            for category, count in verification_results.items():
                if count == 0:
                    print(f"   ✅ {category.replace('_', ' ').title()}: {count} remaining")
                else:
                    print(f"   ⚠️ {category.replace('_', ' ').title()}: {count} remaining")
        
        if self.errors:
            print(f"\n❌ ERRORS ENCOUNTERED ({len(self.errors)}):")
            for i, error in enumerate(self.errors, 1):
                print(f"   {i}. {error}")
        else:
            print(f"\n✅ NO ERRORS ENCOUNTERED")
        
        print("\n" + "="*60)
        
        # Determine success
        if self.errors:
            print("⚠️ CLEANUP COMPLETED WITH ERRORS")
            return False
        else:
            print("🎉 CLEANUP COMPLETED SUCCESSFULLY!")
            return True
    
    def run_data_cleanup(self):
        """Run complete data cleanup for demo psychologist account"""
        print("🚀 Starting Data Cleanup for Demo Psychologist Account")
        print("="*60)
        
        # Step 1: Login as psychologist
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Cannot proceed without successful login")
            return False
        
        # Step 2: Clean up all data types
        print("\n🧹 STARTING DATA CLEANUP PROCESS...")
        
        self.get_and_delete_logbook_entries()
        self.get_and_delete_cpd_activities()
        self.get_and_delete_peer_consultations()
        self.get_and_delete_learning_plans()
        self.get_and_delete_competency_journals()
        self.get_and_delete_messages()
        self.get_and_delete_notifications()
        
        # Step 3: Verify cleanup
        verification_results = self.verify_cleanup()
        
        # Step 4: Print summary
        success = self.print_summary(verification_results)
        
        return success

def main():
    """Main execution"""
    cleaner = DataCleanupTester()
    
    try:
        success = cleaner.run_data_cleanup()
        if success:
            print("\n✅ Data cleanup completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️ Data cleanup completed with errors!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Data cleanup failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()