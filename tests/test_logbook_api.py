"""
Backend API Tests for Psychology Portal
Tests: Login, Logbook Years, Logbook Entries (including 'Other' activity type bug)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://user-dashboard-82.preview.emergentagent.com')

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with admin/admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user" in data, "Response should contain user"
        assert "session_token" in data, "Response should contain session_token"
        assert data["user"]["role"] == "psychologist", "User should be psychologist"
        return data["session_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401, "Should return 401 for invalid credentials"


class TestLogbookYears:
    """Logbook Years CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        assert response.status_code == 200
        self.token = response.json()["session_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_logbook_years(self):
        """Test getting logbook years"""
        response = requests.get(f"{BASE_URL}/api/logbook/years", headers=self.headers)
        assert response.status_code == 200, f"Failed to get years: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} logbook years")
        
        # Check structure if years exist
        if len(data) > 0:
            year = data[0]
            assert "id" in year, "Year should have id"
            assert "year" in year, "Year should have year field"
            assert "start_date" in year, "Year should have start_date"
            assert "end_date" in year, "Year should have end_date"
        
        return data
    
    def test_create_logbook_year(self):
        """Test creating a logbook year"""
        response = requests.post(f"{BASE_URL}/api/logbook/years", 
            headers=self.headers,
            json={
                "year": "TEST_2026",
                "start_date": "2026-01-01",
                "end_date": "2026-12-31"
            }
        )
        assert response.status_code == 200, f"Failed to create year: {response.text}"
        
        data = response.json()
        assert data["year"] == "TEST_2026"
        assert "id" in data
        
        # Cleanup - delete the test year
        year_id = data["id"]
        delete_response = requests.delete(f"{BASE_URL}/api/logbook/years/{year_id}", headers=self.headers)
        assert delete_response.status_code == 200


class TestLogbookEntries:
    """Logbook Entries CRUD tests - including 'Other' activity type bug verification"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and find/create a logbook year"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        assert response.status_code == 200
        self.token = response.json()["session_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get existing years
        years_response = requests.get(f"{BASE_URL}/api/logbook/years", headers=self.headers)
        years = years_response.json()
        
        if len(years) > 0:
            self.logbook_id = years[0]["id"]
        else:
            # Create a test year
            create_response = requests.post(f"{BASE_URL}/api/logbook/years",
                headers=self.headers,
                json={
                    "year": "2025",
                    "start_date": "2025-01-01",
                    "end_date": "2025-12-31"
                }
            )
            self.logbook_id = create_response.json()["id"]
    
    def test_get_logbook_entries(self):
        """Test getting logbook entries"""
        response = requests.get(f"{BASE_URL}/api/logbook/entries", headers=self.headers)
        assert response.status_code == 200, f"Failed to get entries: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} logbook entries")
        return data
    
    def test_create_entry_direct_client_contact(self):
        """Test creating entry with Direct Client Contact activity type"""
        response = requests.post(f"{BASE_URL}/api/logbook/entries",
            headers=self.headers,
            json={
                "logbook_id": self.logbook_id,
                "date": "2025-01-15",
                "duration": 1.5,
                "activity_type": "Direct Client Contact",
                "notes": "TEST_Direct client session",
                "reflections": "Test reflection"
            }
        )
        assert response.status_code == 200, f"Failed to create entry: {response.text}"
        
        data = response.json()
        assert data["activity_type"] == "Direct Client Contact", f"Activity type mismatch: {data['activity_type']}"
        assert data["duration"] == 1.5
        
        # Cleanup
        entry_id = data["id"]
        requests.delete(f"{BASE_URL}/api/logbook/entries/{entry_id}", headers=self.headers)
    
    def test_create_entry_other_activity_type_bug_check(self):
        """
        BUG CHECK: Test creating entry with 'Other' activity type
        Bug report: When adding entry with 'Other', it might be saved as 'Direct Client Contact'
        """
        # Create entry with 'Other' activity type
        response = requests.post(f"{BASE_URL}/api/logbook/entries",
            headers=self.headers,
            json={
                "logbook_id": self.logbook_id,
                "date": "2025-01-16",
                "duration": 2.0,
                "activity_type": "Other",
                "notes": "TEST_Other activity - bug verification",
                "reflections": "Testing Other type"
            }
        )
        assert response.status_code == 200, f"Failed to create entry: {response.text}"
        
        data = response.json()
        entry_id = data["id"]
        
        # CRITICAL CHECK: Verify activity_type is 'Other', not 'Direct Client Contact'
        assert data["activity_type"] == "Other", f"BUG CONFIRMED: Activity type was saved as '{data['activity_type']}' instead of 'Other'"
        print(f"✅ Backend correctly saved activity_type as 'Other'")
        
        # Verify by fetching the entry again
        entries_response = requests.get(f"{BASE_URL}/api/logbook/entries", headers=self.headers)
        entries = entries_response.json()
        
        created_entry = next((e for e in entries if e["id"] == entry_id), None)
        assert created_entry is not None, "Created entry not found"
        assert created_entry["activity_type"] == "Other", f"BUG: Entry fetched has activity_type '{created_entry['activity_type']}' instead of 'Other'"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/logbook/entries/{entry_id}", headers=self.headers)
        print(f"✅ Backend correctly persists 'Other' activity type")
    
    def test_update_entry_preserves_activity_type(self):
        """Test that updating an entry preserves the activity type"""
        # Create entry with 'Other'
        create_response = requests.post(f"{BASE_URL}/api/logbook/entries",
            headers=self.headers,
            json={
                "logbook_id": self.logbook_id,
                "date": "2025-01-17",
                "duration": 1.0,
                "activity_type": "Other",
                "notes": "TEST_Original notes",
                "reflections": ""
            }
        )
        assert create_response.status_code == 200
        entry_id = create_response.json()["id"]
        
        # Update only the notes, not activity_type
        update_response = requests.patch(f"{BASE_URL}/api/logbook/entries/{entry_id}",
            headers=self.headers,
            json={
                "notes": "TEST_Updated notes",
                "duration": 1.5
            }
        )
        assert update_response.status_code == 200
        
        updated_data = update_response.json()
        assert updated_data["activity_type"] == "Other", f"Activity type changed after update: {updated_data['activity_type']}"
        assert updated_data["notes"] == "TEST_Updated notes"
        assert updated_data["duration"] == 1.5
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/logbook/entries/{entry_id}", headers=self.headers)
        print(f"✅ Update preserves activity type correctly")
    
    def test_create_all_activity_types(self):
        """Test creating entries with all activity types"""
        activity_types = [
            "Direct Client Contact",
            "Supervision - Individual",
            "Supervision - Group",
            "Other"
        ]
        
        created_ids = []
        
        for activity_type in activity_types:
            response = requests.post(f"{BASE_URL}/api/logbook/entries",
                headers=self.headers,
                json={
                    "logbook_id": self.logbook_id,
                    "date": "2025-01-18",
                    "duration": 1.0,
                    "activity_type": activity_type,
                    "notes": f"TEST_{activity_type} entry",
                    "reflections": ""
                }
            )
            assert response.status_code == 200, f"Failed to create {activity_type}: {response.text}"
            
            data = response.json()
            assert data["activity_type"] == activity_type, f"Mismatch for {activity_type}: got {data['activity_type']}"
            created_ids.append(data["id"])
            print(f"✅ Created entry with activity_type: {activity_type}")
        
        # Cleanup
        for entry_id in created_ids:
            requests.delete(f"{BASE_URL}/api/logbook/entries/{entry_id}", headers=self.headers)


class TestLogbookStats:
    """Test logbook statistics endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        assert response.status_code == 200
        self.token = response.json()["session_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get existing years
        years_response = requests.get(f"{BASE_URL}/api/logbook/years", headers=self.headers)
        years = years_response.json()
        self.logbook_id = years[0]["id"] if years else None
    
    def test_get_stats(self):
        """Test getting logbook statistics"""
        if not self.logbook_id:
            pytest.skip("No logbook year available")
        
        response = requests.get(f"{BASE_URL}/api/logbook/stats/{self.logbook_id}", headers=self.headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        data = response.json()
        assert "total" in data, "Stats should have total"
        assert "Direct Client Contact" in data
        assert "Other" in data
        print(f"Stats: {data}")


class TestCPDEndpoints:
    """Test CPD-related endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin",
            "password": "admin"
        })
        assert response.status_code == 200
        self.token = response.json()["session_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_cpd_activities(self):
        """Test getting CPD activities"""
        response = requests.get(f"{BASE_URL}/api/cpd/activities", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_cpd_consultations(self):
        """Test getting peer consultations"""
        response = requests.get(f"{BASE_URL}/api/cpd/consultations", headers=self.headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
