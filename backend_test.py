#!/usr/bin/env python3
"""
Backend API Testing for Psychology App Fixes
Tests the backend APIs that support:
1. Peer Consultations functionality (empty string fix)
2. Unified Supervisor View with 3 tabs (Logbook, CPD, Competencies)
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://regipro.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class PsychologyAppTester:
    def __init__(self):
        self.session = requests.Session()
        self.session_token = None
        self.user_data = None
        self.logbook_id = None
        self.cpd_year_id = None
        self.created_entries = []
        self.created_consultations = []
        self.created_activities = []
        self.created_journals = []
        
    def login(self, email, password):
        """Login with email and password"""
        print(f"🔐 Testing login with {email}...")
        
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
            
            print(f"✅ Login successful for user: {self.user_data['name']}")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def get_logbook_years(self):
        """Get logbook years for the user"""
        print("📅 Getting logbook years...")
        
        response = self.session.get(f"{API_BASE}/logbook/years")
        
        if response.status_code == 200:
            years = response.json()
            print(f"✅ Found {len(years)} logbook years")
            
            if years:
                # Use the first available logbook year
                self.logbook_id = years[0]['id']
                print(f"📋 Using logbook ID: {self.logbook_id} for year: {years[0]['year']}")
                return years
            else:
                # Create a new logbook year for testing
                print("📝 No logbook years found, creating one for testing...")
                return self.create_test_logbook_year()
        else:
            print(f"❌ Failed to get logbook years: {response.status_code} - {response.text}")
            return None
    
    def create_test_logbook_year(self):
        """Create a test logbook year"""
        current_year = datetime.now().year
        year_data = {
            "year": f"Test Year {current_year}",
            "start_date": f"{current_year}-01-01",
            "end_date": f"{current_year}-12-31"
        }
        
        response = self.session.post(f"{API_BASE}/logbook/years", json=year_data)
        
        if response.status_code == 200:
            year = response.json()
            self.logbook_id = year['id']
            print(f"✅ Created test logbook year: {year['year']}")
            return [year]
        else:
            print(f"❌ Failed to create logbook year: {response.status_code} - {response.text}")
            return None
    
    def get_logbook_stats(self):
        """Get logbook statistics"""
        if not self.logbook_id:
            print("❌ No logbook ID available for stats")
            return None
            
        print(f"📊 Getting logbook stats for logbook ID: {self.logbook_id}...")
        
        response = self.session.get(f"{API_BASE}/logbook/stats/{self.logbook_id}")
        
        if response.status_code == 200:
            stats = response.json()
            print("✅ Logbook stats retrieved successfully:")
            
            # Verify required keys
            required_keys = ["Direct Client Contact", "Supervision", "Other", "CPD", "total"]
            missing_keys = [key for key in required_keys if key not in stats]
            
            if missing_keys:
                print(f"❌ Missing required keys in stats: {missing_keys}")
                return None
            
            # Verify all values are numbers
            for key, value in stats.items():
                if not isinstance(value, (int, float)):
                    print(f"❌ Stats value for '{key}' is not a number: {value} (type: {type(value)})")
                    return None
                print(f"   {key}: {value} hours")
            
            print("✅ All stats keys present and values are numbers")
            return stats
        else:
            print(f"❌ Failed to get logbook stats: {response.status_code} - {response.text}")
            return None
    
    def create_logbook_entry(self, activity_type, duration, notes=""):
        """Create a logbook entry"""
        if not self.logbook_id:
            print("❌ No logbook ID available for creating entry")
            return None
            
        entry_data = {
            "logbook_id": self.logbook_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "duration": duration,
            "activity_type": activity_type,
            "notes": notes,
            "reflections": ""
        }
        
        print(f"📝 Creating logbook entry: {activity_type} ({duration} hours)")
        
        response = self.session.post(f"{API_BASE}/logbook/entries", json=entry_data)
        
        if response.status_code == 200:
            entry = response.json()
            self.created_entries.append(entry['id'])
            print(f"✅ Created entry: {activity_type} - {duration} hours")
            return entry
        else:
            print(f"❌ Failed to create entry: {response.status_code} - {response.text}")
            return None
    
    def update_logbook_year(self, year_id, new_name):
        """Update logbook year name"""
        print(f"✏️ Updating logbook year {year_id} with new name: {new_name}")
        
        response = self.session.patch(f"{API_BASE}/logbook/years/{year_id}", json={
            "year": new_name
        })
        
        if response.status_code == 200:
            updated_year = response.json()
            print(f"✅ Updated logbook year successfully: {updated_year['year']}")
            return updated_year
        else:
            print(f"❌ Failed to update logbook year: {response.status_code} - {response.text}")
            return None
    
    def cleanup_test_entries(self):
        """Clean up test entries created during testing"""
        print("🧹 Cleaning up test entries...")
        
        for entry_id in self.created_entries:
            response = self.session.delete(f"{API_BASE}/logbook/entries/{entry_id}")
            if response.status_code == 200:
                print(f"✅ Deleted test entry: {entry_id}")
            else:
                print(f"⚠️ Failed to delete test entry {entry_id}: {response.status_code}")
    
    def get_cpd_years(self):
        """Get CPD years for the user"""
        print("📅 Getting CPD years...")
        
        response = self.session.get(f"{API_BASE}/cpd/years")
        
        if response.status_code == 200:
            years = response.json()
            print(f"✅ Found {len(years)} CPD years")
            
            if years:
                # Use the first available CPD year
                self.cpd_year_id = years[0]['id']
                print(f"📋 Using CPD year ID: {self.cpd_year_id} for year: {years[0]['year']}")
                return years
            else:
                # Create a new CPD year for testing
                print("📝 No CPD years found, creating one for testing...")
                return self.create_test_cpd_year()
        else:
            print(f"❌ Failed to get CPD years: {response.status_code} - {response.text}")
            return None
    
    def create_test_cpd_year(self):
        """Create a test CPD year"""
        current_year = datetime.now().year
        year_data = {
            "year": f"Test CPD Year {current_year}",
            "cpd_hours_required": 30
        }
        
        response = self.session.post(f"{API_BASE}/cpd/years", json=year_data)
        
        if response.status_code == 200:
            year = response.json()
            self.cpd_year_id = year['id']
            print(f"✅ Created test CPD year: {year['year']}")
            return [year]
        else:
            print(f"❌ Failed to create CPD year: {response.status_code} - {response.text}")
            return None
    
    def create_peer_consultation(self, minutes_spent, description, linked_goal_id=None):
        """Create a peer consultation"""
        if not self.cpd_year_id:
            print("❌ No CPD year ID available for creating consultation")
            return None
            
        consultation_data = {
            "year_id": self.cpd_year_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "minutes_spent": minutes_spent,
            "activity_description": description,
            "linked_goal_id": linked_goal_id
        }
        
        print(f"👥 Creating peer consultation: {minutes_spent} minutes")
        
        response = self.session.post(f"{API_BASE}/cpd/consultations", json=consultation_data)
        
        if response.status_code == 200:
            consultation = response.json()
            self.created_consultations.append(consultation['id'])
            print(f"✅ Created consultation: {minutes_spent} minutes")
            return consultation
        else:
            print(f"❌ Failed to create consultation: {response.status_code} - {response.text}")
            return None
    
    def create_cpd_activity(self, activity_type, hours, description):
        """Create a CPD activity"""
        if not self.cpd_year_id:
            print("❌ No CPD year ID available for creating activity")
            return None
            
        activity_data = {
            "year_id": self.cpd_year_id,
            "activity_type": activity_type,
            "hours": hours,
            "description": description,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "reflection": "Test reflection for this activity"
        }
        
        print(f"📚 Creating CPD activity: {activity_type} ({hours} hours)")
        
        response = self.session.post(f"{API_BASE}/cpd/activities", json=activity_data)
        
        if response.status_code == 200:
            activity = response.json()
            self.created_activities.append(activity['id'])
            print(f"✅ Created activity: {activity_type} - {hours} hours")
            return activity
        else:
            print(f"❌ Failed to create activity: {response.status_code} - {response.text}")
            return None
    
    def create_competency_journal(self, competency_id, entry_text):
        """Create a competency journal entry"""
        journal_data = {
            "competency_id": competency_id,
            "entry": entry_text,
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        
        print(f"🏆 Creating competency journal for area {competency_id}")
        
        response = self.session.post(f"{API_BASE}/competencies/journals", json=journal_data)
        
        if response.status_code == 200:
            journal = response.json()
            self.created_journals.append(journal['id'])
            print(f"✅ Created competency journal for area {competency_id}")
            return journal
        else:
            print(f"❌ Failed to create competency journal: {response.status_code} - {response.text}")
            return None
    
    def test_supervisor_endpoints(self):
        """Test supervisor-specific endpoints"""
        print("👨‍💼 Testing supervisor endpoints...")
        
        # Test supervisor logbook entries endpoint
        response = self.session.get(f"{API_BASE}/supervisor/logbook-entries")
        if response.status_code == 200:
            entries = response.json()
            print(f"✅ Supervisor logbook entries: {len(entries)} entries found")
        else:
            print(f"❌ Failed to get supervisor logbook entries: {response.status_code}")
            return False
        
        # Test supervisor CPD activities endpoint
        response = self.session.get(f"{API_BASE}/supervisor/cpd-activities")
        if response.status_code == 200:
            activities = response.json()
            print(f"✅ Supervisor CPD activities: {len(activities)} activities found")
        else:
            print(f"❌ Failed to get supervisor CPD activities: {response.status_code}")
            return False
        
        return True
    
    def test_supervisor_commenting(self):
        """Test supervisor commenting functionality"""
        print("💬 Testing supervisor commenting...")
        
        # Create test entries first
        logbook_entry = self.create_logbook_entry("Direct Client Contact", 1.0, "Test entry for supervisor comment")
        cpd_activity = self.create_cpd_activity("Workshop", 2.0, "Test activity for supervisor comment")
        competency_journal = self.create_competency_journal("0", "Test competency entry for supervisor comment")
        
        if not all([logbook_entry, cpd_activity, competency_journal]):
            print("❌ Failed to create test entries for supervisor commenting")
            return False
        
        # Test logbook entry commenting
        comment_data = {"comment": "Great work on this client session!"}
        response = self.session.patch(f"{API_BASE}/supervisor/logbook-entries/{logbook_entry['id']}/comment", json=comment_data)
        if response.status_code == 200:
            print("✅ Supervisor logbook comment added successfully")
        else:
            print(f"❌ Failed to add supervisor logbook comment: {response.status_code}")
            return False
        
        # Test CPD activity commenting
        response = self.session.patch(f"{API_BASE}/supervisor/cpd-activities/{cpd_activity['id']}/comment", json=comment_data)
        if response.status_code == 200:
            print("✅ Supervisor CPD comment added successfully")
        else:
            print(f"❌ Failed to add supervisor CPD comment: {response.status_code}")
            return False
        
        # Test competency journal commenting
        response = self.session.patch(f"{API_BASE}/supervisor/competencies/{competency_journal['id']}/comment", json=comment_data)
        if response.status_code == 200:
            print("✅ Supervisor competency comment added successfully")
        else:
            print(f"❌ Failed to add supervisor competency comment: {response.status_code}")
            return False
        
        return True
    
    def cleanup_test_data(self):
        """Clean up all test data created during testing"""
        print("🧹 Cleaning up test data...")
        
        # Cleanup logbook entries
        for entry_id in self.created_entries:
            response = self.session.delete(f"{API_BASE}/logbook/entries/{entry_id}")
            if response.status_code == 200:
                print(f"✅ Deleted logbook entry: {entry_id}")
            else:
                print(f"⚠️ Failed to delete logbook entry {entry_id}: {response.status_code}")
        
        # Cleanup consultations
        for consultation_id in self.created_consultations:
            response = self.session.delete(f"{API_BASE}/cpd/consultations/{consultation_id}")
            if response.status_code == 200:
                print(f"✅ Deleted consultation: {consultation_id}")
            else:
                print(f"⚠️ Failed to delete consultation {consultation_id}: {response.status_code}")
        
        # Cleanup CPD activities
        for activity_id in self.created_activities:
            response = self.session.delete(f"{API_BASE}/cpd/activities/{activity_id}")
            if response.status_code == 200:
                print(f"✅ Deleted CPD activity: {activity_id}")
            else:
                print(f"⚠️ Failed to delete CPD activity {activity_id}: {response.status_code}")
        
        # Cleanup competency journals
        for journal_id in self.created_journals:
            response = self.session.delete(f"{API_BASE}/competencies/journals/{journal_id}")
            if response.status_code == 200:
                print(f"✅ Deleted competency journal: {journal_id}")
            else:
                print(f"⚠️ Failed to delete competency journal {journal_id}: {response.status_code}")

    def run_comprehensive_test(self):
        """Run all psychology app backend tests"""
        print("🚀 Starting Psychology App Backend Tests")
        print("=" * 60)
        
        # Test 1: Psychologist Authentication
        print("\n🔐 TEST 1: Psychologist Authentication")
        print("-" * 40)
        
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Psychologist login test failed - cannot continue")
            return False
        
        # Test 2: Peer Consultations Backend Support
        print("\n👥 TEST 2: Peer Consultations Backend Support")
        print("-" * 45)
        
        cpd_years = self.get_cpd_years()
        if not cpd_years:
            print("❌ Failed to get CPD years - cannot continue")
            return False
        
        # Test creating peer consultations (supporting the frontend fix)
        test_consultations = [
            (60, "Discussed challenging case with peer psychologist"),
            (90, "Group consultation on ethical considerations"),
            (45, "Peer review of assessment techniques")
        ]
        
        created_successfully = 0
        for minutes, description in test_consultations:
            consultation = self.create_peer_consultation(minutes, description)
            if consultation:
                created_successfully += 1
        
        if created_successfully != len(test_consultations):
            print(f"❌ Only {created_successfully}/{len(test_consultations)} consultations created successfully")
            return False
        
        print(f"✅ All {len(test_consultations)} peer consultations created successfully")
        
        # Test 3: Supervisor Authentication and Endpoints
        print("\n👨‍💼 TEST 3: Supervisor Authentication and Unified View Support")
        print("-" * 60)
        
        # Login as supervisor
        if not self.login("demo-supervisor@psychology.com", "password"):
            print("❌ Supervisor login test failed")
            return False
        
        # Test supervisor endpoints that support the unified view
        if not self.test_supervisor_endpoints():
            print("❌ Supervisor endpoints test failed")
            return False
        
        # Test 4: Logbook Data for Supervisor View
        print("\n📋 TEST 4: Logbook Data for Supervisor View")
        print("-" * 42)
        
        # Switch back to psychologist to create test data
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Failed to switch back to psychologist account")
            return False
        
        # Get logbook years
        logbook_years = self.get_logbook_years()
        if not logbook_years:
            print("❌ Failed to get logbook years")
            return False
        
        # Create test logbook entries
        test_entries = [
            ("Direct Client Contact", 2.0, "Individual therapy session"),
            ("Supervision", 1.5, "Weekly supervision meeting"),
            ("Other", 1.0, "Administrative tasks"),
            ("CPD", 2.0, "Professional development workshop")
        ]
        
        for activity_type, duration, notes in test_entries:
            entry = self.create_logbook_entry(activity_type, duration, notes)
            if not entry:
                print(f"❌ Failed to create logbook entry: {activity_type}")
                return False
        
        print("✅ Created test logbook entries for supervisor view")
        
        # Test 5: CPD Data for Supervisor View
        print("\n📚 TEST 5: CPD Data for Supervisor View")
        print("-" * 35)
        
        # Create test CPD activities
        test_activities = [
            ("Workshop", 3.0, "Cognitive Behavioral Therapy Workshop"),
            ("Conference", 6.0, "Annual Psychology Conference"),
            ("Reading", 2.0, "Professional journal articles")
        ]
        
        for activity_type, hours, description in test_activities:
            activity = self.create_cpd_activity(activity_type, hours, description)
            if not activity:
                print(f"❌ Failed to create CPD activity: {activity_type}")
                return False
        
        print("✅ Created test CPD activities for supervisor view")
        
        # Test 6: Competency Data for Supervisor View
        print("\n🏆 TEST 6: Competency Data for Supervisor View")
        print("-" * 42)
        
        # Create test competency journal entries
        competency_areas = [
            ("0", "Reflected on ethical considerations in client treatment"),
            ("1", "Completed psychological assessment training"),
            ("2", "Practiced new intervention techniques"),
            ("3", "Reviewed research methodology"),
            ("4", "Improved communication skills with clients"),
            ("5", "Studied cultural diversity in psychology")
        ]
        
        for comp_id, entry_text in competency_areas:
            journal = self.create_competency_journal(comp_id, entry_text)
            if not journal:
                print(f"❌ Failed to create competency journal for area {comp_id}")
                return False
        
        print("✅ Created test competency journals for supervisor view")
        
        # Test 7: Supervisor Commenting Functionality
        print("\n💬 TEST 7: Supervisor Commenting Functionality")
        print("-" * 45)
        
        # Switch back to supervisor
        if not self.login("demo-supervisor@psychology.com", "password"):
            print("❌ Failed to switch back to supervisor account")
            return False
        
        if not self.test_supervisor_commenting():
            print("❌ Supervisor commenting test failed")
            return False
        
        print("✅ Supervisor commenting functionality working correctly")
        
        # Cleanup
        print("\n🧹 TEST 8: Cleanup Test Data")
        print("-" * 30)
        
        # Switch back to psychologist for cleanup
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Failed to switch back to psychologist for cleanup")
            return False
        
        self.cleanup_test_data()
        
        print("\n🎉 ALL BACKEND TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        return True

def main():
    """Main test execution"""
    tester = LogbookTester()
    
    try:
        success = tester.run_comprehensive_test()
        if success:
            print("\n✅ All Practice Logbook Enhancement tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()