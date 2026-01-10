"""
Test User Management and Feature Toggles
Tests for:
- Admin user management endpoints
- Feature toggles (competency_journal_enabled, practice_logbook_enabled)
- PATCH /api/admin/users/{user_id} endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserManagement:
    """Test admin user management features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin and get session token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping user management tests")
        
        login_data = login_response.json()
        self.session_token = login_data.get("session_token")
        self.session.headers.update({"Authorization": f"Bearer {self.session_token}"})
        
        # Store created user IDs for cleanup
        self.created_user_ids = []
        
        yield
        
        # Cleanup - delete test users
        for user_id in self.created_user_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
            except:
                pass
    
    def test_admin_login(self):
        """Test admin can login successfully"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "admin"
        print("✅ Admin login successful")
    
    def test_get_all_users_as_admin(self):
        """Test admin can get all users"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        # Admin user should exist
        admin_found = any(u.get("email") == "admin" for u in users)
        assert admin_found, "Admin user should be in the list"
        print(f"✅ Got {len(users)} users")
    
    def test_create_user_with_feature_toggles(self):
        """Test creating user with feature toggles enabled"""
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User",
            "competency_journal_enabled": True,
            "practice_logbook_enabled": True
        })
        
        assert response.status_code == 200, f"Failed to create user: {response.text}"
        user = response.json()
        
        # Store for cleanup
        self.created_user_ids.append(user["id"])
        
        # Verify feature toggles
        assert user.get("competency_journal_enabled") == True, "competency_journal_enabled should be True"
        assert user.get("practice_logbook_enabled") == True, "practice_logbook_enabled should be True"
        assert user["email"] == test_username
        print(f"✅ Created user with feature toggles: {test_username}")
    
    def test_create_user_with_features_disabled(self):
        """Test creating user with feature toggles disabled"""
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User Disabled",
            "competency_journal_enabled": False,
            "practice_logbook_enabled": False
        })
        
        assert response.status_code == 200, f"Failed to create user: {response.text}"
        user = response.json()
        
        # Store for cleanup
        self.created_user_ids.append(user["id"])
        
        # Verify feature toggles are disabled
        assert user.get("competency_journal_enabled") == False, "competency_journal_enabled should be False"
        assert user.get("practice_logbook_enabled") == False, "practice_logbook_enabled should be False"
        print(f"✅ Created user with features disabled: {test_username}")
    
    def test_patch_user_feature_toggles(self):
        """Test PATCH endpoint to update user feature toggles"""
        # First create a user
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User Patch",
            "competency_journal_enabled": True,
            "practice_logbook_enabled": True
        })
        
        assert create_response.status_code == 200
        user = create_response.json()
        user_id = user["id"]
        self.created_user_ids.append(user_id)
        
        # Now PATCH to disable competency_journal
        patch_response = self.session.patch(f"{BASE_URL}/api/admin/users/{user_id}", json={
            "competency_journal_enabled": False
        })
        
        assert patch_response.status_code == 200, f"PATCH failed: {patch_response.text}"
        updated_user = patch_response.json()
        
        assert updated_user.get("competency_journal_enabled") == False, "competency_journal_enabled should be False after PATCH"
        assert updated_user.get("practice_logbook_enabled") == True, "practice_logbook_enabled should remain True"
        print(f"✅ PATCH user feature toggle successful")
    
    def test_patch_user_practice_logbook_toggle(self):
        """Test PATCH endpoint to toggle practice_logbook_enabled"""
        # First create a user
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User Logbook",
            "competency_journal_enabled": True,
            "practice_logbook_enabled": True
        })
        
        assert create_response.status_code == 200
        user = create_response.json()
        user_id = user["id"]
        self.created_user_ids.append(user_id)
        
        # PATCH to disable practice_logbook
        patch_response = self.session.patch(f"{BASE_URL}/api/admin/users/{user_id}", json={
            "practice_logbook_enabled": False
        })
        
        assert patch_response.status_code == 200
        updated_user = patch_response.json()
        
        assert updated_user.get("practice_logbook_enabled") == False, "practice_logbook_enabled should be False"
        print(f"✅ PATCH practice_logbook_enabled toggle successful")
    
    def test_patch_user_both_toggles(self):
        """Test PATCH endpoint to update both feature toggles at once"""
        # First create a user
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User Both",
            "competency_journal_enabled": True,
            "practice_logbook_enabled": True
        })
        
        assert create_response.status_code == 200
        user = create_response.json()
        user_id = user["id"]
        self.created_user_ids.append(user_id)
        
        # PATCH to disable both
        patch_response = self.session.patch(f"{BASE_URL}/api/admin/users/{user_id}", json={
            "competency_journal_enabled": False,
            "practice_logbook_enabled": False
        })
        
        assert patch_response.status_code == 200
        updated_user = patch_response.json()
        
        assert updated_user.get("competency_journal_enabled") == False
        assert updated_user.get("practice_logbook_enabled") == False
        print(f"✅ PATCH both feature toggles successful")
    
    def test_patch_user_name(self):
        """Test PATCH endpoint to update user name"""
        # First create a user
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Original Name"
        })
        
        assert create_response.status_code == 200
        user = create_response.json()
        user_id = user["id"]
        self.created_user_ids.append(user_id)
        
        # PATCH to update name
        patch_response = self.session.patch(f"{BASE_URL}/api/admin/users/{user_id}", json={
            "name": "Updated Name"
        })
        
        assert patch_response.status_code == 200
        updated_user = patch_response.json()
        
        assert updated_user.get("name") == "Updated Name"
        print(f"✅ PATCH user name successful")
    
    def test_patch_nonexistent_user(self):
        """Test PATCH on non-existent user returns 404"""
        fake_user_id = str(uuid.uuid4())
        
        patch_response = self.session.patch(f"{BASE_URL}/api/admin/users/{fake_user_id}", json={
            "competency_journal_enabled": False
        })
        
        assert patch_response.status_code == 404, "Should return 404 for non-existent user"
        print(f"✅ PATCH non-existent user returns 404")
    
    def test_patch_invalid_fields_rejected(self):
        """Test PATCH with invalid fields returns 400"""
        # First create a user
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User Invalid"
        })
        
        assert create_response.status_code == 200
        user = create_response.json()
        user_id = user["id"]
        self.created_user_ids.append(user_id)
        
        # PATCH with invalid field (should be rejected)
        patch_response = self.session.patch(f"{BASE_URL}/api/admin/users/{user_id}", json={
            "invalid_field": "some_value"
        })
        
        # Should return 400 because no valid fields to update
        assert patch_response.status_code == 400, "Should return 400 for invalid fields"
        print(f"✅ PATCH with invalid fields returns 400")
    
    def test_delete_user(self):
        """Test deleting a user"""
        # First create a user
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User Delete"
        })
        
        assert create_response.status_code == 200
        user = create_response.json()
        user_id = user["id"]
        
        # Delete the user
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        assert delete_response.status_code == 200
        
        # Verify user is deleted - should not appear in list
        list_response = self.session.get(f"{BASE_URL}/api/admin/users")
        users = list_response.json()
        user_found = any(u.get("id") == user_id for u in users)
        assert not user_found, "Deleted user should not appear in list"
        print(f"✅ Delete user successful")
    
    def test_cannot_delete_admin(self):
        """Test that admin user cannot be deleted"""
        # Get admin user ID
        list_response = self.session.get(f"{BASE_URL}/api/admin/users")
        users = list_response.json()
        admin_user = next((u for u in users if u.get("email") == "admin"), None)
        
        assert admin_user is not None, "Admin user should exist"
        
        # Try to delete admin
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/users/{admin_user['id']}")
        assert delete_response.status_code == 400, "Should not be able to delete admin"
        print(f"✅ Cannot delete admin user - correctly rejected")
    
    def test_user_feature_toggles_persist_after_get(self):
        """Test that feature toggles persist and are returned correctly on GET"""
        # Create user with specific toggles
        test_username = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Test User Persist",
            "competency_journal_enabled": False,
            "practice_logbook_enabled": True
        })
        
        assert create_response.status_code == 200
        user = create_response.json()
        user_id = user["id"]
        self.created_user_ids.append(user_id)
        
        # Get all users and verify the toggles
        list_response = self.session.get(f"{BASE_URL}/api/admin/users")
        users = list_response.json()
        
        created_user = next((u for u in users if u.get("id") == user_id), None)
        assert created_user is not None, "Created user should be in list"
        assert created_user.get("competency_journal_enabled") == False
        assert created_user.get("practice_logbook_enabled") == True
        print(f"✅ Feature toggles persist correctly")


class TestNonAdminAccess:
    """Test that non-admin users cannot access admin endpoints"""
    
    def test_non_admin_cannot_get_users(self):
        """Test that non-admin user cannot access /api/admin/users"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # First login as admin to create a test user
        admin_login = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        
        if admin_login.status_code != 200:
            pytest.skip("Admin login failed")
        
        admin_token = admin_login.json().get("session_token")
        session.headers.update({"Authorization": f"Bearer {admin_token}"})
        
        # Create a non-admin test user
        test_username = f"TEST_nonadmin_{uuid.uuid4().hex[:8]}"
        create_response = session.post(f"{BASE_URL}/api/admin/users", json={
            "username": test_username,
            "password": "testpass123",
            "name": "Non Admin User"
        })
        
        if create_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        user = create_response.json()
        user_id = user["id"]
        
        try:
            # Login as the non-admin user
            non_admin_session = requests.Session()
            non_admin_session.headers.update({"Content-Type": "application/json"})
            
            login_response = non_admin_session.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_username,
                "password": "testpass123"
            })
            
            assert login_response.status_code == 200, "Non-admin user should be able to login"
            non_admin_token = login_response.json().get("session_token")
            non_admin_session.headers.update({"Authorization": f"Bearer {non_admin_token}"})
            
            # Try to access admin endpoint
            admin_endpoint_response = non_admin_session.get(f"{BASE_URL}/api/admin/users")
            assert admin_endpoint_response.status_code == 403, "Non-admin should get 403 on admin endpoint"
            print(f"✅ Non-admin correctly denied access to admin endpoint")
            
        finally:
            # Cleanup - delete test user
            session.delete(f"{BASE_URL}/api/admin/users/{user_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
