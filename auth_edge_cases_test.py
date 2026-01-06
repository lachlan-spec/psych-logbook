#!/usr/bin/env python3
"""
Additional Edge Case Testing for Authentication System
Tests additional scenarios that might cause "Signup failed" or "Session expired" errors
"""

import requests
import json
import sys
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://psych-one.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class EdgeCaseTester:
    def __init__(self):
        self.session = requests.Session()
        
    def test_invalid_role_signup(self):
        """Test signup with invalid role"""
        print("🔐 TEST: Invalid Role Signup")
        print("-" * 40)
        
        signup_data = {
            "email": f"test-{uuid.uuid4().hex[:8]}@psychology-test.com",
            "password": "TestPassword123!",
            "name": "Test User",
            "role": "invalid_role"  # Invalid role
        }
        
        response = self.session.post(f"{API_BASE}/auth/signup", json=signup_data)
        
        if response.status_code == 400:
            error_data = response.json()
            print(f"✅ Invalid role properly rejected: {error_data.get('detail', 'No detail')}")
            return True
        else:
            print(f"❌ Invalid role should return 400, got {response.status_code}: {response.text}")
            return False
    
    def test_empty_fields_signup(self):
        """Test signup with empty fields"""
        print("\n🔐 TEST: Empty Fields Signup")
        print("-" * 40)
        
        test_cases = [
            {"email": "", "password": "test", "name": "test", "role": "psychologist"},
            {"email": "test@test.com", "password": "", "name": "test", "role": "psychologist"},
            {"email": "test@test.com", "password": "test", "name": "", "role": "psychologist"},
            {"email": "test@test.com", "password": "test", "name": "test", "role": ""},
        ]
        
        for i, signup_data in enumerate(test_cases):
            print(f"📝 Testing empty field case {i+1}")
            response = self.session.post(f"{API_BASE}/auth/signup", json=signup_data)
            
            if response.status_code != 400:
                print(f"❌ Empty field case {i+1} should return 400, got {response.status_code}")
                return False
        
        print("✅ All empty field cases properly rejected")
        return True
    
    def test_malformed_json(self):
        """Test with malformed JSON"""
        print("\n🔐 TEST: Malformed JSON")
        print("-" * 40)
        
        # Send invalid JSON
        response = self.session.post(f"{API_BASE}/auth/signup", 
                                   data="invalid json data",
                                   headers={'Content-Type': 'application/json'})
        
        if response.status_code == 422:  # FastAPI returns 422 for validation errors
            print("✅ Malformed JSON properly rejected (422)")
            return True
        else:
            print(f"❌ Malformed JSON should return 422, got {response.status_code}: {response.text}")
            return False
    
    def test_expired_session_simulation(self):
        """Test behavior with potentially expired session"""
        print("\n🔐 TEST: Expired Session Simulation")
        print("-" * 40)
        
        # Use a fake session token that looks valid but doesn't exist
        fake_token = "fake-session-token-that-does-not-exist-12345"
        
        headers = {'Authorization': f'Bearer {fake_token}'}
        response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
        
        if response.status_code == 401:
            error_data = response.json()
            error_message = error_data.get('detail', '').lower()
            if 'invalid session' in error_message or 'session expired' in error_message:
                print(f"✅ Fake session properly rejected: {error_data.get('detail')}")
                return True
            else:
                print(f"❌ Wrong error message for fake session: {error_data.get('detail')}")
                return False
        else:
            print(f"❌ Fake session should return 401, got {response.status_code}: {response.text}")
            return False
    
    def test_special_characters_in_fields(self):
        """Test signup with special characters"""
        print("\n🔐 TEST: Special Characters in Fields")
        print("-" * 40)
        
        signup_data = {
            "email": f"test+special.chars-{uuid.uuid4().hex[:8]}@psychology-test.com",
            "password": "TestPassword123!@#$%",
            "name": "Test User with Àccénts & Special-Chars",
            "role": "psychologist"
        }
        
        response = self.session.post(f"{API_BASE}/auth/signup", json=signup_data)
        
        if response.status_code == 200:
            data = response.json()
            user = data['user']
            
            if user['email'] == signup_data['email'] and user['name'] == signup_data['name']:
                print("✅ Special characters in fields handled correctly")
                return True
            else:
                print(f"❌ Special characters not preserved correctly")
                return False
        else:
            print(f"❌ Special characters signup failed: {response.status_code} - {response.text}")
            return False
    
    def test_very_long_fields(self):
        """Test signup with very long field values"""
        print("\n🔐 TEST: Very Long Fields")
        print("-" * 40)
        
        long_name = "A" * 1000  # Very long name
        long_email = f"{'a' * 100}@{'b' * 100}.com"  # Very long email
        
        signup_data = {
            "email": long_email,
            "password": "TestPassword123!",
            "name": long_name,
            "role": "psychologist"
        }
        
        response = self.session.post(f"{API_BASE}/auth/signup", json=signup_data)
        
        # This might succeed or fail depending on database constraints
        # We just want to ensure it doesn't crash the server
        if response.status_code in [200, 400, 422]:
            print(f"✅ Very long fields handled gracefully ({response.status_code})")
            return True
        else:
            print(f"❌ Very long fields caused server error: {response.status_code} - {response.text}")
            return False
    
    def test_concurrent_signups(self):
        """Test concurrent signups with same email"""
        print("\n🔐 TEST: Concurrent Signups")
        print("-" * 40)
        
        import threading
        import time
        
        test_email = f"concurrent-test-{uuid.uuid4().hex[:8]}@psychology-test.com"
        results = []
        
        def signup_attempt(attempt_id):
            session = requests.Session()
            signup_data = {
                "email": test_email,
                "password": f"TestPassword{attempt_id}!",
                "name": f"Test User {attempt_id}",
                "role": "psychologist"
            }
            
            response = session.post(f"{API_BASE}/auth/signup", json=signup_data)
            results.append((attempt_id, response.status_code))
        
        # Start 3 concurrent signup attempts
        threads = []
        for i in range(3):
            thread = threading.Thread(target=signup_attempt, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check results
        success_count = sum(1 for _, status in results if status == 200)
        duplicate_count = sum(1 for _, status in results if status == 400)
        
        if success_count == 1 and duplicate_count >= 1:
            print(f"✅ Concurrent signups handled correctly: {success_count} success, {duplicate_count} duplicates")
            return True
        else:
            print(f"❌ Concurrent signups not handled correctly: {results}")
            return False
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        print("🚀 Starting Authentication Edge Case Tests")
        print("=" * 60)
        
        test_results = []
        
        test_results.append(("Invalid Role Signup", self.test_invalid_role_signup()))
        test_results.append(("Empty Fields Signup", self.test_empty_fields_signup()))
        test_results.append(("Malformed JSON", self.test_malformed_json()))
        test_results.append(("Expired Session Simulation", self.test_expired_session_simulation()))
        test_results.append(("Special Characters", self.test_special_characters_in_fields()))
        test_results.append(("Very Long Fields", self.test_very_long_fields()))
        test_results.append(("Concurrent Signups", self.test_concurrent_signups()))
        
        # Summary
        print("\n📊 EDGE CASE TEST RESULTS")
        print("=" * 60)
        
        passed_tests = 0
        failed_tests = 0
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
            
            if result:
                passed_tests += 1
            else:
                failed_tests += 1
        
        print(f"\n📈 Total Edge Case Tests: {len(test_results)}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if failed_tests == 0:
            print("\n🎉 ALL EDGE CASE TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️ {failed_tests} EDGE CASE TESTS FAILED!")
            return False

def main():
    """Main test execution"""
    tester = EdgeCaseTester()
    
    try:
        success = tester.run_edge_case_tests()
        if success:
            print("\n✅ All edge case tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some edge case tests failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()