#!/usr/bin/env python3
"""
Backend API Testing for Simplified Single-Psychologist Portal
Tests the simplified authentication system with:
1. Login with admin/admin credentials
2. Verify NO signup endpoint exists
3. Auth/me endpoint testing
4. Dashboard data access with authentication
5. Logout functionality
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
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://psych-one.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class SimplifiedPsychologyPortalTester:
    def __init__(self):
        self.session = requests.Session()
        self.session_token = None
        self.user_data = None
        
    def test_login(self, username="admin", password="admin"):
        """Test login with admin credentials"""
        print(f"🔐 Testing login with username: {username}")
        
        response = self.session.post(f"{API_BASE}/auth/login", json={
            "email": username,  # Frontend sends as 'email' but backend treats as username
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            if 'user' not in data or 'session_token' not in data:
                print("❌ Login response missing required fields (user, session_token)")
                return False
            
            user = data['user']
            
            # Verify user data structure
            required_fields = ['name', 'role']
            missing_fields = [field for field in required_fields if field not in user]
            if missing_fields:
                print(f"❌ User data missing required fields: {missing_fields}")
                return False
            
            # Verify role is psychologist
            if user['role'] != 'psychologist':
                print(f"❌ Expected role 'psychologist', got '{user['role']}'")
                return False
            
            self.session_token = data['session_token']
            self.user_data = user
            
            # Set authorization header for future requests
            self.session.headers.update({
                'Authorization': f'Bearer {self.session_token}'
            })
            
            print(f"✅ Login successful!")
            print(f"   User name: {user['name']}")
            print(f"   User role: {user['role']}")
            print(f"   Session token: {self.session_token[:20]}...")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def test_no_signup_endpoint(self):
        """Test that signup endpoint does not exist or returns appropriate error"""
        print("🚫 Testing that signup endpoint is not available...")
        
        test_signup_data = {
            "email": "test@example.com",
            "password": "testpassword",
            "name": "Test User"
        }
        
        response = self.session.post(f"{API_BASE}/auth/signup", json=test_signup_data)
        
        # Should return 404 (not found) or 405 (method not allowed)
        if response.status_code in [404, 405]:
            print(f"✅ Signup endpoint properly disabled (status: {response.status_code})")
            return True
        else:
            print(f"❌ Signup endpoint should not be available, got status: {response.status_code}")
            return False
    
    def test_auth_me(self):
        """Test auth/me endpoint with session token"""
        print("👤 Testing auth/me endpoint...")
        
        if not self.session_token:
            print("❌ No session token available for auth/me test")
            return False
        
        response = self.session.get(f"{API_BASE}/auth/me")
        
        if response.status_code == 200:
            user_data = response.json()
            
            # Verify user data structure
            required_fields = ['name', 'role', 'email']
            missing_fields = [field for field in required_fields if field not in user_data]
            if missing_fields:
                print(f"❌ Auth/me response missing required fields: {missing_fields}")
                return False
            
            # Verify role is psychologist
            if user_data['role'] != 'psychologist':
                print(f"❌ Expected role 'psychologist', got '{user_data['role']}'")
                return False
            
            # Verify no password in response
            if 'password' in user_data:
                print("❌ Password should not be included in auth/me response")
                return False
            
            print("✅ Auth/me endpoint working correctly")
            print(f"   User: {user_data['name']} ({user_data['role']})")
            return True
        else:
            print(f"❌ Auth/me failed: {response.status_code} - {response.text}")
            return False
    
    def test_dashboard_data_access(self):
        """Test dashboard data endpoints with authentication"""
        print("📊 Testing dashboard data access with authentication...")
        
        if not self.session_token:
            print("❌ No session token available for dashboard data test")
            return False
        
        # Test logbook years endpoint
        print("   Testing GET /api/logbook/years...")
        response = self.session.get(f"{API_BASE}/logbook/years")
        if response.status_code != 200:
            print(f"❌ Logbook years endpoint failed: {response.status_code}")
            return False
        print("   ✅ Logbook years endpoint accessible")
        
        # Test CPD years endpoint
        print("   Testing GET /api/cpd/years...")
        response = self.session.get(f"{API_BASE}/cpd/years")
        if response.status_code != 200:
            print(f"❌ CPD years endpoint failed: {response.status_code}")
            return False
        print("   ✅ CPD years endpoint accessible")
        
        # Test competency journals endpoint
        print("   Testing GET /api/competencies/journals...")
        response = self.session.get(f"{API_BASE}/competencies/journals")
        if response.status_code != 200:
            print(f"❌ Competency journals endpoint failed: {response.status_code}")
            return False
        print("   ✅ Competency journals endpoint accessible")
        
        print("✅ All dashboard data endpoints accessible with authentication")
        return True
    
    def test_logout(self):
        """Test logout functionality"""
        print("🚪 Testing logout functionality...")
        
        if not self.session_token:
            print("❌ No session token available for logout test")
            return False
        
        response = self.session.post(f"{API_BASE}/auth/logout")
        
        if response.status_code == 200:
            # Clear session token
            self.session_token = None
            self.session.headers.pop('Authorization', None)
            
            print("✅ Logout successful")
            
            # Verify session is cleared by testing auth/me
            print("   Verifying session is cleared...")
            auth_response = self.session.get(f"{API_BASE}/auth/me")
            if auth_response.status_code == 401:
                print("   ✅ Session properly cleared - auth/me returns 401")
                return True
            else:
                print(f"   ❌ Session not properly cleared - auth/me returns {auth_response.status_code}")
                return False
        else:
            print(f"❌ Logout failed: {response.status_code} - {response.text}")
            return False
    
    def run_simplified_portal_tests(self):
        """Run all simplified single-psychologist portal tests"""
        print("🚀 Starting Simplified Single-Psychologist Portal Tests")
        print("=" * 60)
        
        test_results = []
        
        # Test 1: Login Test (P0)
        print("\n🔐 TEST 1: Login with admin/admin credentials")
        print("-" * 50)
        result = self.test_login("admin", "admin")
        test_results.append(("Login Test", result))
        if not result:
            print("❌ Critical test failed - cannot continue")
            return False
        
        # Test 2: Verify NO Signup Endpoint
        print("\n🚫 TEST 2: Verify NO Signup Endpoint")
        print("-" * 40)
        result = self.test_no_signup_endpoint()
        test_results.append(("No Signup Endpoint", result))
        
        # Test 3: Auth/Me Test
        print("\n👤 TEST 3: Auth/Me Endpoint Test")
        print("-" * 35)
        result = self.test_auth_me()
        test_results.append(("Auth/Me Test", result))
        
        # Test 4: Dashboard Data Access
        print("\n📊 TEST 4: Dashboard Data Access (with auth)")
        print("-" * 45)
        result = self.test_dashboard_data_access()
        test_results.append(("Dashboard Data Access", result))
        
        # Test 5: Logout Test
        print("\n🚪 TEST 5: Logout Test")
        print("-" * 25)
        result = self.test_logout()
        test_results.append(("Logout Test", result))
        
        # Summary
        print("\n📋 TEST SUMMARY")
        print("=" * 60)
        
        all_passed = True
        for test_name, passed in test_results:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{test_name:<30} {status}")
            if not passed:
                all_passed = False
        
        print("=" * 60)
        
        if all_passed:
            print("🎉 ALL SIMPLIFIED PORTAL TESTS COMPLETED SUCCESSFULLY!")
            return True
        else:
            print("❌ SOME TESTS FAILED!")
            return False

def main():
    """Main test execution"""
    tester = PsychologyAppTester()
    
    try:
        success = tester.run_comprehensive_test()
        if success:
            print("\n✅ All Messaging Backend tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some messaging tests failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()