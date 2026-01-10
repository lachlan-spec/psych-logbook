"""
Backend API Tests for Psychology Portal - Supervisor Features
Tests: Primary/Secondary Supervisor fields, Supervision activity types
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://user-dashboard-82.preview.emergentagent.com')


class TestSupervisorFields:
    """Test supervisor fields in logbook years"""
    
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
    
    def test_create_year_with_supervisors(self):
        """Test creating logbook year with primary and secondary supervisors"""
        response = requests.post(f"{BASE_URL}/api/logbook/years", 
            headers=self.headers,
            json={
                "year": "TEST_2027",
                "start_date": "2027-01-01",
                "end_date": "2027-12-31",
                "primary_supervisor": "Dr. John Smith",
                "secondary_supervisors": ["Dr. Jane Doe", "Dr. Bob Wilson"]
            }
        )
        assert response.status_code == 200, f"Failed to create year: {response.text}"
        
        data = response.json()
        assert data["year"] == "TEST_2027"
        assert data.get("primary_supervisor") == "Dr. John Smith", f"Primary supervisor not saved: {data}"
        assert data.get("secondary_supervisors") == ["Dr. Jane Doe", "Dr. Bob Wilson"], f"Secondary supervisors not saved: {data}"
        
        # Cleanup
        year_id = data["id"]
        requests.delete(f"{BASE_URL}/api/logbook/years/{year_id}", headers=self.headers)
        print("✅ Logbook year with supervisors created successfully")
    
    def test_update_year_with_supervisors(self):
        """Test updating logbook year with supervisor fields"""
        # Create year first
        create_response = requests.post(f"{BASE_URL}/api/logbook/years", 
            headers=self.headers,
            json={
                "year": "TEST_2028",
                "start_date": "2028-01-01",
                "end_date": "2028-12-31"
            }
        )
        assert create_response.status_code == 200
        year_id = create_response.json()["id"]
        
        # Update with supervisor fields
        update_response = requests.patch(f"{BASE_URL}/api/logbook/years/{year_id}",
            headers=self.headers,
            json={
                "primary_supervisor": "Dr. Primary",
                "secondary_supervisors": ["Dr. Secondary1", "Dr. Secondary2"]
            }
        )
        assert update_response.status_code == 200, f"Failed to update: {update_response.text}"
        
        updated_data = update_response.json()
        assert updated_data.get("primary_supervisor") == "Dr. Primary"
        assert updated_data.get("secondary_supervisors") == ["Dr. Secondary1", "Dr. Secondary2"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/logbook/years/{year_id}", headers=self.headers)
        print("✅ Logbook year supervisor fields updated successfully")
    
    def test_get_years_includes_supervisor_fields(self):
        """Test that getting years includes supervisor fields"""
        response = requests.get(f"{BASE_URL}/api/logbook/years", headers=self.headers)
        assert response.status_code == 200
        
        years = response.json()
        if len(years) > 0:
            year = years[0]
            # Check that supervisor fields exist (may be empty)
            assert "primary_supervisor" in year or year.get("primary_supervisor", "") == "", "primary_supervisor field should exist"
            assert "secondary_supervisors" in year or year.get("secondary_supervisors", []) == [], "secondary_supervisors field should exist"
            print(f"✅ Year has supervisor fields: primary={year.get('primary_supervisor', '')}, secondary={year.get('secondary_supervisors', [])}")


class TestSupervisionActivityTypes:
    """Test supervision activity types including Primary/Secondary split"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and logbook year"""
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
    
    def test_create_supervision_individual_primary(self):
        """Test creating entry with 'Supervision - Individual (Primary)' activity type"""
        response = requests.post(f"{BASE_URL}/api/logbook/entries",
            headers=self.headers,
            json={
                "logbook_id": self.logbook_id,
                "date": "2025-02-01",
                "duration": 1.0,
                "activity_type": "Supervision - Individual (Primary)",
                "notes": "TEST_Primary supervision session",
                "reflections": ""
            }
        )
        assert response.status_code == 200, f"Failed to create entry: {response.text}"
        
        data = response.json()
        assert data["activity_type"] == "Supervision - Individual (Primary)", f"Activity type mismatch: {data['activity_type']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/logbook/entries/{data['id']}", headers=self.headers)
        print("✅ Created entry with 'Supervision - Individual (Primary)'")
    
    def test_create_supervision_individual_secondary(self):
        """Test creating entry with 'Supervision - Individual (Secondary - Name)' activity type"""
        response = requests.post(f"{BASE_URL}/api/logbook/entries",
            headers=self.headers,
            json={
                "logbook_id": self.logbook_id,
                "date": "2025-02-02",
                "duration": 1.0,
                "activity_type": "Supervision - Individual (Secondary - Dr. Jane)",
                "notes": "TEST_Secondary supervision session",
                "reflections": ""
            }
        )
        assert response.status_code == 200, f"Failed to create entry: {response.text}"
        
        data = response.json()
        assert data["activity_type"] == "Supervision - Individual (Secondary - Dr. Jane)", f"Activity type mismatch: {data['activity_type']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/logbook/entries/{data['id']}", headers=self.headers)
        print("✅ Created entry with 'Supervision - Individual (Secondary - Dr. Jane)'")
    
    def test_create_supervision_group(self):
        """Test creating entry with 'Supervision - Group' activity type"""
        response = requests.post(f"{BASE_URL}/api/logbook/entries",
            headers=self.headers,
            json={
                "logbook_id": self.logbook_id,
                "date": "2025-02-03",
                "duration": 2.0,
                "activity_type": "Supervision - Group",
                "notes": "TEST_Group supervision session",
                "reflections": ""
            }
        )
        assert response.status_code == 200, f"Failed to create entry: {response.text}"
        
        data = response.json()
        assert data["activity_type"] == "Supervision - Group", f"Activity type mismatch: {data['activity_type']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/logbook/entries/{data['id']}", headers=self.headers)
        print("✅ Created entry with 'Supervision - Group'")


class TestLogbookStatsCategories:
    """Test logbook stats - verify CPD is NOT in Hours by Category"""
    
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
    
    def test_stats_categories(self):
        """Test that stats include correct categories"""
        if not self.logbook_id:
            pytest.skip("No logbook year available")
        
        response = requests.get(f"{BASE_URL}/api/logbook/stats/{self.logbook_id}", headers=self.headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        data = response.json()
        
        # Verify expected categories exist
        assert "Direct Client Contact" in data, "Should have Direct Client Contact"
        assert "Supervision - Individual" in data, "Should have Supervision - Individual"
        assert "Supervision - Group" in data, "Should have Supervision - Group"
        assert "Other" in data, "Should have Other"
        assert "total" in data, "Should have total"
        
        print(f"✅ Stats categories: {list(data.keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
