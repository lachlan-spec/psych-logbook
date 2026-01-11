#!/usr/bin/env python3
"""
Authentication System Testing for Psychology Portal
Tests all authentication scenarios as requested in the review:
1. Email/Password Signup (should work)
2. Email/Password Signup - Duplicate Email (should fail gracefully)
3. Email/Password Login (should work)
4. Email/Password Login - Wrong Password (should fail gracefully)
5. Auth Me Endpoint (test cookie-based auth)
6. OAuth Session Exchange (test with invalid session)
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
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://psych-portal-6.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class AuthenticationTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_email = f"test-{uuid.uuid4().hex[:8]}@psychology-test.com"
        self.test_password = "TestPassword123!"
        self.test_name = "Test User"
        self.session_token = None
        self.created_users = []
        
    def test_email_password_signup(self):
        """Test 1: Email/Password Signup (should work)"""
        print("🔐 TEST 1: Email/Password Signup")
        print("-" * 40)
        
        signup_data = {
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name,
            "role": "psychologist"
        }
        
        print(f"📝 Attempting signup with email: {self.test_email}")
        
        response = self.session.post(f"{API_BASE}/auth/signup", json=signup_data)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            if 'user' not in data or 'session_token' not in data:
                print("❌ Signup response missing required fields (user, session_token)")
                return False
            
            user = data['user']
            self.session_token = data['session_token']
            
            # Verify user data
            required_fields = ['id', 'email', 'name', 'role']
            missing_fields = [field for field in required_fields if field not in user]
            
            if missing_fields:
                print(f"❌ User data missing required fields: {missing_fields}")
                return False
            
            if user['email'] != self.test_email:
                print(f"❌ Email mismatch: expected {self.test_email}, got {user['email']}")
                return False
            
            if user['name'] != self.test_name:
                print(f"❌ Name mismatch: expected {self.test_name}, got {user['name']}")
                return False
            
            if user['role'] != "psychologist":
                print(f"❌ Role mismatch: expected psychologist, got {user['role']}")
                return False
            
            # Verify password is not in response
            if 'password' in user:
                print("❌ Password should not be included in signup response")
                return False
            
            # Verify session token is set
            if not self.session_token:
                print("❌ Session token not provided")
                return False
            
            # Check if cookie was set (look in response headers)
            set_cookie_header = response.headers.get('Set-Cookie', '')
            if 'session_token' not in set_cookie_header:
                print("❌ Session cookie not set in response")
                return False
            
            self.created_users.append(user['id'])
            print(f"✅ Signup successful for user: {user['name']} (ID: {user['id']})")
            print(f"✅ Session token received: {self.session_token[:20]}...")
            print(f"✅ Cookie set correctly")
            return True
            
        else:
            print(f"❌ Signup failed: {response.status_code} - {response.text}")
            return False
    
    def test_duplicate_email_signup(self):
        """Test 2: Email/Password Signup - Duplicate Email (should fail gracefully)"""
        print("\n🔐 TEST 2: Duplicate Email Signup")
        print("-" * 40)
        
        # Try to signup with the same email again
        duplicate_signup_data = {
            "email": self.test_email,  # Same email as before
            "password": "DifferentPassword123!",
            "name": "Different User",
            "role": "supervisor"
        }
        
        print(f"📝 Attempting duplicate signup with email: {self.test_email}")
        
        response = self.session.post(f"{API_BASE}/auth/signup", json=duplicate_signup_data)
        
        if response.status_code == 400:
            try:
                error_data = response.json()
                if 'detail' in error_data and 'already registered' in error_data['detail'].lower():
                    print(f"✅ Duplicate email properly rejected: {error_data['detail']}")
                    return True
                else:
                    print(f"❌ Wrong error message for duplicate email: {error_data}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response for duplicate email: {response.text}")
                return False
        else:
            print(f"❌ Duplicate email should return 400, got {response.status_code}: {response.text}")
            return False
    
    def test_email_password_login(self):
        """Test 3: Email/Password Login (should work)"""
        print("\n🔐 TEST 3: Email/Password Login")
        print("-" * 40)
        
        # First test with demo account
        demo_credentials = {
            "email": "demo-psychologist@psychology.com",
            "password": "password"
        }
        
        print(f"📝 Testing login with demo account: {demo_credentials['email']}")
        
        response = self.session.post(f"{API_BASE}/auth/login", json=demo_credentials)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            if 'user' not in data or 'session_token' not in data:
                print("❌ Login response missing required fields (user, session_token)")
                return False
            
            user = data['user']
            session_token = data['session_token']
            
            # Verify user data
            if user['email'] != demo_credentials['email']:
                print(f"❌ Email mismatch: expected {demo_credentials['email']}, got {user['email']}")
                return False
            
            # Verify password is not in response
            if 'password' in user:
                print("❌ Password should not be included in login response")
                return False
            
            # Verify session token
            if not session_token:
                print("❌ Session token not provided")
                return False
            
            # Check if cookie was set
            set_cookie_header = response.headers.get('Set-Cookie', '')
            if 'session_token' not in set_cookie_header:
                print("❌ Session cookie not set in response")
                return False
            
            print(f"✅ Demo login successful for user: {user['name']} (Role: {user['role']})")
            print(f"✅ Session token received: {session_token[:20]}...")
            print(f"✅ Cookie set correctly")
            
            # Now test with our created test user
            print(f"\n📝 Testing login with created test user: {self.test_email}")
            
            test_credentials = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response2 = self.session.post(f"{API_BASE}/auth/login", json=test_credentials)
            
            if response2.status_code == 200:
                data2 = response2.json()
                user2 = data2['user']
                self.session_token = data2['session_token']  # Update session token
                
                if user2['email'] != self.test_email:
                    print(f"❌ Test user email mismatch: expected {self.test_email}, got {user2['email']}")
                    return False
                
                print(f"✅ Test user login successful: {user2['name']}")
                return True
            else:
                print(f"❌ Test user login failed: {response2.status_code} - {response2.text}")
                return False
            
        else:
            print(f"❌ Demo login failed: {response.status_code} - {response.text}")
            return False
    
    def test_wrong_password_login(self):
        """Test 4: Email/Password Login - Wrong Password (should fail gracefully)"""
        print("\n🔐 TEST 4: Wrong Password Login")
        print("-" * 40)
        
        wrong_credentials = {
            "email": "demo-psychologist@psychology.com",
            "password": "wrongpassword123"
        }
        
        print(f"📝 Testing login with wrong password for: {wrong_credentials['email']}")
        
        response = self.session.post(f"{API_BASE}/auth/login", json=wrong_credentials)
        
        if response.status_code == 401:
            try:
                error_data = response.json()
                if 'detail' in error_data and 'invalid credentials' in error_data['detail'].lower():
                    print(f"✅ Wrong password properly rejected: {error_data['detail']}")
                    return True
                else:
                    print(f"❌ Wrong error message for invalid password: {error_data}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response for wrong password: {response.text}")
                return False
        else:
            print(f"❌ Wrong password should return 401, got {response.status_code}: {response.text}")
            return False
    
    def test_auth_me_endpoint(self):
        """Test 5: Auth Me Endpoint (test cookie-based auth)"""
        print("\n🔐 TEST 5: Auth Me Endpoint")
        print("-" * 40)
        
        if not self.session_token:
            print("❌ No session token available for auth/me test")
            return False
        
        # Test with Authorization header
        print("📝 Testing /auth/me with Authorization header")
        
        headers = {'Authorization': f'Bearer {self.session_token}'}
        response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            
            # Verify user data structure
            required_fields = ['id', 'email', 'name', 'role']
            missing_fields = [field for field in required_fields if field not in user_data]
            
            if missing_fields:
                print(f"❌ Auth/me response missing required fields: {missing_fields}")
                return False
            
            if user_data['email'] != self.test_email:
                print(f"❌ Auth/me email mismatch: expected {self.test_email}, got {user_data['email']}")
                return False
            
            # Verify password is not in response
            if 'password' in user_data:
                print("❌ Password should not be included in auth/me response")
                return False
            
            print(f"✅ Auth/me successful with Authorization header: {user_data['name']}")
            
            # Test with cookie (simulate cookie-based auth)
            print("📝 Testing /auth/me with cookie")
            
            # Set the session token as a cookie
            self.session.cookies.set('session_token', self.session_token)
            
            # Remove Authorization header for cookie test
            if 'Authorization' in self.session.headers:
                del self.session.headers['Authorization']
            
            response2 = self.session.get(f"{API_BASE}/auth/me")
            
            if response2.status_code == 200:
                user_data2 = response2.json()
                
                if user_data2['email'] != self.test_email:
                    print(f"❌ Cookie auth email mismatch: expected {self.test_email}, got {user_data2['email']}")
                    return False
                
                print(f"✅ Auth/me successful with cookie: {user_data2['name']}")
                return True
            else:
                print(f"❌ Cookie-based auth/me failed: {response2.status_code} - {response2.text}")
                return False
            
        else:
            print(f"❌ Auth/me with Authorization header failed: {response.status_code} - {response.text}")
            return False
    
    def test_oauth_session_exchange(self):
        """Test 6: OAuth Session Exchange (test with invalid session)"""
        print("\n🔐 TEST 6: OAuth Session Exchange")
        print("-" * 40)
        
        # Test with fake/invalid session_id
        fake_session_data = {
            "session_id": "fake-invalid-session-id-12345"
        }
        
        print(f"📝 Testing OAuth session exchange with invalid session_id")
        
        response = self.session.post(f"{API_BASE}/auth/session", json=fake_session_data)
        
        # Should return 401 or 500 with error message about invalid session
        if response.status_code in [401, 500]:
            try:
                error_data = response.json()
                if 'detail' in error_data:
                    error_message = error_data['detail'].lower()
                    if 'invalid' in error_message or 'session' in error_message:
                        print(f"✅ Invalid session properly rejected ({response.status_code}): {error_data['detail']}")
                        return True
                    else:
                        print(f"❌ Unexpected error message for invalid session: {error_data['detail']}")
                        return False
                else:
                    print(f"❌ Error response missing detail field: {error_data}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response for invalid session: {response.text}")
                return False
        else:
            print(f"❌ Invalid session should return 401 or 500, got {response.status_code}: {response.text}")
            return False
    
    def test_auth_without_credentials(self):
        """Test 7: Auth endpoints without credentials"""
        print("\n🔐 TEST 7: Auth Without Credentials")
        print("-" * 40)
        
        # Clear any existing auth
        self.session.headers.pop('Authorization', None)
        self.session.cookies.clear()
        
        print("📝 Testing /auth/me without credentials")
        
        response = self.session.get(f"{API_BASE}/auth/me")
        
        if response.status_code == 401:
            try:
                error_data = response.json()
                if 'detail' in error_data and 'not authenticated' in error_data['detail'].lower():
                    print(f"✅ Unauthenticated request properly rejected: {error_data['detail']}")
                    return True
                else:
                    print(f"❌ Wrong error message for unauthenticated request: {error_data}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response for unauthenticated request: {response.text}")
                return False
        else:
            print(f"❌ Unauthenticated request should return 401, got {response.status_code}: {response.text}")
            return False
    
    def test_malformed_requests(self):
        """Test 8: Malformed authentication requests"""
        print("\n🔐 TEST 8: Malformed Requests")
        print("-" * 40)
        
        # Test signup without required fields
        print("📝 Testing signup without required fields")
        
        incomplete_signup = {
            "email": "test@example.com"
            # Missing password, name, role
        }
        
        response = self.session.post(f"{API_BASE}/auth/signup", json=incomplete_signup)
        
        if response.status_code == 400:
            print("✅ Incomplete signup properly rejected (400)")
        else:
            print(f"❌ Incomplete signup should return 400, got {response.status_code}")
            return False
        
        # Test login without required fields
        print("📝 Testing login without required fields")
        
        incomplete_login = {
            "email": "test@example.com"
            # Missing password
        }
        
        response = self.session.post(f"{API_BASE}/auth/login", json=incomplete_login)
        
        if response.status_code == 400:
            print("✅ Incomplete login properly rejected (400)")
            return True
        else:
            print(f"❌ Incomplete login should return 400, got {response.status_code}")
            return False
    
    def run_comprehensive_auth_test(self):
        """Run all authentication tests"""
        print("🚀 Starting Psychology Portal Authentication Tests")
        print("=" * 60)
        
        test_results = []
        
        # Test 1: Email/Password Signup
        test_results.append(("Email/Password Signup", self.test_email_password_signup()))
        
        # Test 2: Duplicate Email Signup
        test_results.append(("Duplicate Email Signup", self.test_duplicate_email_signup()))
        
        # Test 3: Email/Password Login
        test_results.append(("Email/Password Login", self.test_email_password_login()))
        
        # Test 4: Wrong Password Login
        test_results.append(("Wrong Password Login", self.test_wrong_password_login()))
        
        # Test 5: Auth Me Endpoint
        test_results.append(("Auth Me Endpoint", self.test_auth_me_endpoint()))
        
        # Test 6: OAuth Session Exchange
        test_results.append(("OAuth Session Exchange", self.test_oauth_session_exchange()))
        
        # Test 7: Auth Without Credentials
        test_results.append(("Auth Without Credentials", self.test_auth_without_credentials()))
        
        # Test 8: Malformed Requests
        test_results.append(("Malformed Requests", self.test_malformed_requests()))
        
        # Summary
        print("\n📊 TEST RESULTS SUMMARY")
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
        
        print(f"\n📈 Total Tests: {len(test_results)}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if failed_tests == 0:
            print("\n🎉 ALL AUTHENTICATION TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️ {failed_tests} AUTHENTICATION TESTS FAILED!")
            return False

def main():
    """Main test execution"""
    tester = AuthenticationTester()
    
    try:
        success = tester.run_comprehensive_auth_test()
        if success:
            print("\n✅ All Authentication tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some authentication tests failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()