#!/usr/bin/env python3
"""
Backend API Testing for Practice Logbook Enhancements
Tests the 4 activity categories: Direct Client Contact, Supervision, Other, CPD
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

class LogbookTester:
    def __init__(self):
        self.session = requests.Session()
        self.session_token = None
        self.user_data = None
        self.logbook_id = None
        self.created_entries = []
        
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
    
    def run_comprehensive_test(self):
        """Run all logbook enhancement tests"""
        print("🚀 Starting Practice Logbook Enhancement Tests")
        print("=" * 60)
        
        # Test 1: Login and Get Logbook Stats
        print("\n📋 TEST 1: Login and Get Logbook Stats")
        print("-" * 40)
        
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Login test failed - cannot continue")
            return False
        
        years = self.get_logbook_years()
        if not years:
            print("❌ Failed to get logbook years - cannot continue")
            return False
        
        initial_stats = self.get_logbook_stats()
        if initial_stats is None:
            print("❌ Failed to get initial stats - cannot continue")
            return False
        
        # Test 2: Create Logbook Entry with New Categories
        print("\n📝 TEST 2: Create Logbook Entry with New Categories")
        print("-" * 50)
        
        test_entries = [
            ("Direct Client Contact", 2.0, "Test client session with individual therapy"),
            ("Supervision", 1.5, "Weekly supervision meeting with senior psychologist"),
            ("Other", 1.0, "Administrative tasks and documentation"),
            ("CPD", 2.0, "Attended workshop on cognitive behavioral therapy techniques")
        ]
        
        created_successfully = 0
        for activity_type, duration, notes in test_entries:
            entry = self.create_logbook_entry(activity_type, duration, notes)
            if entry:
                created_successfully += 1
        
        if created_successfully != len(test_entries):
            print(f"❌ Only {created_successfully}/{len(test_entries)} entries created successfully")
            return False
        
        print(f"✅ All {len(test_entries)} test entries created successfully")
        
        # Test 3: Verify Stats Update
        print("\n📊 TEST 3: Verify Stats Update")
        print("-" * 30)
        
        updated_stats = self.get_logbook_stats()
        if updated_stats is None:
            print("❌ Failed to get updated stats")
            return False
        
        # Verify expected increases
        expected_increases = {
            "Direct Client Contact": 2.0,
            "Supervision": 1.5,
            "Other": 1.0,
            "CPD": 2.0
        }
        
        stats_correct = True
        for category, expected_increase in expected_increases.items():
            initial_value = initial_stats.get(category, 0)
            updated_value = updated_stats.get(category, 0)
            actual_increase = updated_value - initial_value
            
            if abs(actual_increase - expected_increase) < 0.01:  # Allow for floating point precision
                print(f"✅ {category}: {initial_value} → {updated_value} (+{actual_increase})")
            else:
                print(f"❌ {category}: Expected increase of {expected_increase}, got {actual_increase}")
                stats_correct = False
        
        # Verify total
        expected_total_increase = sum(expected_increases.values())
        initial_total = initial_stats.get("total", 0)
        updated_total = updated_stats.get("total", 0)
        actual_total_increase = updated_total - initial_total
        
        if abs(actual_total_increase - expected_total_increase) < 0.01:
            print(f"✅ Total: {initial_total} → {updated_total} (+{actual_total_increase})")
        else:
            print(f"❌ Total: Expected increase of {expected_total_increase}, got {actual_total_increase}")
            stats_correct = False
        
        if not stats_correct:
            print("❌ Stats verification failed")
            return False
        
        print("✅ All stats updated correctly")
        
        # Test 4: Test Logbook Settings Endpoints
        print("\n⚙️ TEST 4: Test Logbook Settings Endpoints")
        print("-" * 40)
        
        # Test GET /api/logbook/years (already tested above)
        print("✅ GET /api/logbook/years - Already verified")
        
        # Test PATCH /api/logbook/years/{year_id}
        if years and len(years) > 0:
            year_to_update = years[0]
            original_name = year_to_update['year']
            new_name = f"{original_name} - Updated"
            
            updated_year = self.update_logbook_year(year_to_update['id'], new_name)
            if updated_year and updated_year['year'] == new_name:
                print("✅ PATCH /api/logbook/years/{year_id} - Update successful")
                
                # Restore original name
                self.update_logbook_year(year_to_update['id'], original_name)
                print("✅ Restored original year name")
            else:
                print("❌ PATCH /api/logbook/years/{year_id} - Update failed")
                return False
        
        # Cleanup
        self.cleanup_test_entries()
        
        print("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
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