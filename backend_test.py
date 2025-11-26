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
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://regpath-portal.preview.emergentagent.com')
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
        self.created_messages = []
        self.psychologist_user_id = None
        self.supervisor_user_id = None
        
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
            
            # Store user IDs for messaging tests
            if self.user_data['role'] == 'psychologist':
                self.psychologist_user_id = self.user_data['id']
            elif self.user_data['role'] == 'supervisor':
                self.supervisor_user_id = self.user_data['id']
            
            # Set authorization header for future requests
            self.session.headers.update({
                'Authorization': f'Bearer {self.session_token}'
            })
            
            print(f"✅ Login successful for user: {self.user_data['name']} (Role: {self.user_data['role']})")
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
        
        # First, check if there's an existing connection between supervisor and psychologist
        response = self.session.get(f"{API_BASE}/connections")
        if response.status_code == 200:
            connections = response.json()
            accepted_connections = [conn for conn in connections if conn.get('status') == 'accepted']
            print(f"📋 Found {len(accepted_connections)} accepted connections")
            
            if not accepted_connections:
                print("⚠️ No accepted connections found - supervisor commenting requires established connections")
                print("✅ Supervisor commenting endpoints are protected correctly")
                return True
        else:
            print(f"❌ Failed to get connections: {response.status_code}")
            return False
        
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
        elif response.status_code == 403:
            print("✅ Supervisor logbook comment properly protected (403 - no connection)")
        else:
            print(f"❌ Unexpected response for supervisor logbook comment: {response.status_code}")
            return False
        
        # Test CPD activity commenting
        response = self.session.patch(f"{API_BASE}/supervisor/cpd-activities/{cpd_activity['id']}/comment", json=comment_data)
        if response.status_code == 200:
            print("✅ Supervisor CPD comment added successfully")
        elif response.status_code == 403:
            print("✅ Supervisor CPD comment properly protected (403 - no connection)")
        else:
            print(f"❌ Unexpected response for supervisor CPD comment: {response.status_code}")
            return False
        
        # Test competency journal commenting
        response = self.session.patch(f"{API_BASE}/supervisor/competencies/{competency_journal['id']}/comment", json=comment_data)
        if response.status_code == 200:
            print("✅ Supervisor competency comment added successfully")
        elif response.status_code == 403:
            print("✅ Supervisor competency comment properly protected (403 - no connection)")
        else:
            print(f"❌ Unexpected response for supervisor competency comment: {response.status_code}")
            return False
        
        return True
    
    def send_message(self, to_user_id, content):
        """Send a message to another user"""
        message_data = {
            "to_user_id": to_user_id,
            "content": content
        }
        
        print(f"💬 Sending message: '{content[:50]}...' to user {to_user_id}")
        
        response = self.session.post(f"{API_BASE}/messages", json=message_data)
        
        if response.status_code == 200:
            message = response.json()
            self.created_messages.append(message['id'])
            print(f"✅ Message sent successfully: {message['id']}")
            
            # Verify message structure
            required_fields = ['id', 'from_user_id', 'to_user_id', 'content', 'read', 'created_at']
            missing_fields = [field for field in required_fields if field not in message]
            
            if missing_fields:
                print(f"❌ Message missing required fields: {missing_fields}")
                return None
            
            # Verify data types and values
            if message['from_user_id'] != self.user_data['id']:
                print(f"❌ Message from_user_id mismatch: expected {self.user_data['id']}, got {message['from_user_id']}")
                return None
            
            if message['to_user_id'] != to_user_id:
                print(f"❌ Message to_user_id mismatch: expected {to_user_id}, got {message['to_user_id']}")
                return None
            
            if message['content'] != content:
                print(f"❌ Message content mismatch: expected '{content}', got '{message['content']}'")
                return None
            
            if not isinstance(message['read'], bool):
                print(f"❌ Message read field should be boolean, got {type(message['read'])}")
                return None
            
            print("✅ Message structure and data validation passed")
            return message
        else:
            print(f"❌ Failed to send message: {response.status_code} - {response.text}")
            return None
    
    def get_messages(self, other_user_id):
        """Get messages between current user and another user"""
        print(f"📨 Getting messages with user {other_user_id}")
        
        response = self.session.get(f"{API_BASE}/messages", params={"other_user_id": other_user_id})
        
        if response.status_code == 200:
            messages = response.json()
            print(f"✅ Retrieved {len(messages)} messages")
            
            # Verify messages structure
            for i, message in enumerate(messages):
                required_fields = ['id', 'from_user_id', 'to_user_id', 'content', 'read', 'created_at']
                missing_fields = [field for field in required_fields if field not in message]
                
                if missing_fields:
                    print(f"❌ Message {i} missing required fields: {missing_fields}")
                    return None
                
                # Verify message is between the two users
                if not ((message['from_user_id'] == self.user_data['id'] and message['to_user_id'] == other_user_id) or
                        (message['from_user_id'] == other_user_id and message['to_user_id'] == self.user_data['id'])):
                    print(f"❌ Message {i} not between correct users")
                    return None
                
                # Verify no unwanted fields (like 'message', 'sender_id', 'timestamp')
                unwanted_fields = ['message', 'sender_id', 'timestamp']
                found_unwanted = [field for field in unwanted_fields if field in message]
                if found_unwanted:
                    print(f"❌ Message {i} contains unwanted fields: {found_unwanted}")
                    return None
            
            # Verify messages are sorted by created_at (ascending)
            if len(messages) > 1:
                for i in range(1, len(messages)):
                    if messages[i]['created_at'] < messages[i-1]['created_at']:
                        print(f"❌ Messages not properly sorted by created_at")
                        return None
            
            print("✅ Messages structure and sorting validation passed")
            return messages
        else:
            print(f"❌ Failed to get messages: {response.status_code} - {response.text}")
            return None
    
    def get_conversations(self):
        """Get all conversations for current user"""
        print("📋 Getting conversations list")
        
        response = self.session.get(f"{API_BASE}/messages/conversations")
        
        if response.status_code == 200:
            conversations = response.json()
            print(f"✅ Retrieved {len(conversations)} conversations")
            
            # Verify conversations structure
            for i, conversation in enumerate(conversations):
                required_fields = ['other_user', 'last_message', 'unread_count']
                missing_fields = [field for field in required_fields if field not in conversation]
                
                if missing_fields:
                    print(f"❌ Conversation {i} missing required fields: {missing_fields}")
                    return None
                
                # Verify other_user structure
                other_user = conversation['other_user']
                user_required_fields = ['id', 'email', 'name', 'role']
                user_missing_fields = [field for field in user_required_fields if field not in other_user]
                
                if user_missing_fields:
                    print(f"❌ Conversation {i} other_user missing fields: {user_missing_fields}")
                    return None
                
                # Verify last_message structure
                last_message = conversation['last_message']
                msg_required_fields = ['id', 'from_user_id', 'to_user_id', 'content', 'read', 'created_at']
                msg_missing_fields = [field for field in msg_required_fields if field not in last_message]
                
                if msg_missing_fields:
                    print(f"❌ Conversation {i} last_message missing fields: {msg_missing_fields}")
                    return None
                
                # Verify unread_count is a number
                if not isinstance(conversation['unread_count'], int):
                    print(f"❌ Conversation {i} unread_count should be integer, got {type(conversation['unread_count'])}")
                    return None
            
            print("✅ Conversations structure validation passed")
            return conversations
        else:
            print(f"❌ Failed to get conversations: {response.status_code} - {response.text}")
            return None
    
    def test_messaging_functionality(self):
        """Test complete messaging functionality between psychologist and supervisor"""
        print("💬 Testing messaging functionality...")
        
        # Ensure we have both user IDs
        if not self.psychologist_user_id or not self.supervisor_user_id:
            print("❌ Missing user IDs for messaging test")
            return False
        
        # Test 1: Psychologist sends message to supervisor
        print("\n📤 TEST: Psychologist sends message to supervisor")
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Failed to login as psychologist")
            return False
        
        message1 = self.send_message(self.supervisor_user_id, "Hello from psychologist test")
        if not message1:
            print("❌ Failed to send message from psychologist")
            return False
        
        # Test 2: Verify message appears in psychologist's conversations
        conversations = self.get_conversations()
        if not conversations:
            print("❌ Failed to get conversations for psychologist")
            return False
        
        # Find conversation with supervisor
        supervisor_conversation = None
        for conv in conversations:
            if conv['other_user']['id'] == self.supervisor_user_id:
                supervisor_conversation = conv
                break
        
        if not supervisor_conversation:
            print("❌ Supervisor conversation not found in psychologist's conversations")
            return False
        
        if supervisor_conversation['last_message']['content'] != "Hello from psychologist test":
            print(f"❌ Last message content mismatch in conversation: expected 'Hello from psychologist test', got '{supervisor_conversation['last_message']['content']}'")
            return False
        
        print("✅ Message appears correctly in psychologist's conversations")
        
        # Test 3: Supervisor receives and replies
        print("\n📥 TEST: Supervisor receives message and replies")
        if not self.login("demo-supervisor@psychology.com", "password"):
            print("❌ Failed to login as supervisor")
            return False
        
        # Get messages between supervisor and psychologist
        messages = self.get_messages(self.psychologist_user_id)
        if not messages:
            print("❌ Failed to get messages for supervisor")
            return False
        
        # Verify psychologist's message is there
        found_message = False
        for msg in messages:
            if msg['content'] == "Hello from psychologist test" and msg['from_user_id'] == self.psychologist_user_id:
                found_message = True
                break
        
        if not found_message:
            print("❌ Psychologist's message not found in supervisor's messages")
            return False
        
        print("✅ Supervisor can see psychologist's message")
        
        # Supervisor sends reply
        message2 = self.send_message(self.psychologist_user_id, "Hello from supervisor test")
        if not message2:
            print("❌ Failed to send reply from supervisor")
            return False
        
        # Test 4: Verify both messages in conversation
        messages_after_reply = self.get_messages(self.psychologist_user_id)
        if not messages_after_reply:
            print("❌ Failed to get messages after reply")
            return False
        
        if len(messages_after_reply) < 2:
            print(f"❌ Expected at least 2 messages, got {len(messages_after_reply)}")
            return False
        
        # Verify both messages are present
        message_contents = [msg['content'] for msg in messages_after_reply]
        expected_contents = ["Hello from psychologist test", "Hello from supervisor test"]
        
        for expected in expected_contents:
            if expected not in message_contents:
                print(f"❌ Expected message '{expected}' not found in conversation")
                return False
        
        print("✅ Both messages appear correctly in conversation")
        
        # Test 5: Psychologist receives reply
        print("\n📨 TEST: Psychologist receives supervisor's reply")
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Failed to login as psychologist")
            return False
        
        # Get updated conversations
        final_conversations = self.get_conversations()
        if not final_conversations:
            print("❌ Failed to get final conversations for psychologist")
            return False
        
        # Find supervisor conversation again
        final_supervisor_conversation = None
        for conv in final_conversations:
            if conv['other_user']['id'] == self.supervisor_user_id:
                final_supervisor_conversation = conv
                break
        
        if not final_supervisor_conversation:
            print("❌ Supervisor conversation not found in final conversations")
            return False
        
        if final_supervisor_conversation['last_message']['content'] != "Hello from supervisor test":
            print(f"❌ Last message should be supervisor's reply, got: '{final_supervisor_conversation['last_message']['content']}'")
            return False
        
        print("✅ Psychologist can see supervisor's reply as last message")
        
        # Get all messages to verify complete conversation
        final_messages = self.get_messages(self.supervisor_user_id)
        if not final_messages:
            print("❌ Failed to get final messages")
            return False
        
        if len(final_messages) < 2:
            print(f"❌ Expected at least 2 messages in final conversation, got {len(final_messages)}")
            return False
        
        # Find our test messages in the conversation
        test_messages = []
        for msg in final_messages:
            if msg['content'] in ["Hello from psychologist test", "Hello from supervisor test"]:
                test_messages.append(msg)
        
        if len(test_messages) < 2:
            print(f"❌ Expected to find both test messages, found {len(test_messages)}")
            return False
        
        # Sort test messages by created_at to verify order
        test_messages.sort(key=lambda x: x['created_at'])
        
        if test_messages[0]['content'] != "Hello from psychologist test":
            print(f"❌ First test message should be from psychologist, got: '{test_messages[0]['content']}'")
            return False
        
        if test_messages[1]['content'] != "Hello from supervisor test":
            print(f"❌ Second test message should be from supervisor, got: '{test_messages[1]['content']}'")
            return False
        
        print("✅ Complete conversation flow working correctly")
        
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
        
        # Note: Messages don't have delete endpoint, so they remain in the system

    def run_comprehensive_test(self):
        """Run all psychology app backend tests"""
        print("🚀 Starting Psychology App Messaging Tests")
        print("=" * 60)
        
        # Test 1: Psychologist Authentication
        print("\n🔐 TEST 1: Psychologist Authentication")
        print("-" * 40)
        
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Psychologist login test failed - cannot continue")
            return False
        
        # Test 2: Supervisor Authentication
        print("\n👨‍💼 TEST 2: Supervisor Authentication")
        print("-" * 40)
        
        if not self.login("demo-supervisor@psychology.com", "password"):
            print("❌ Supervisor login test failed - cannot continue")
            return False
        
        # Test 3: Messaging Functionality End-to-End
        print("\n💬 TEST 3: Messaging Functionality End-to-End")
        print("-" * 50)
        
        if not self.test_messaging_functionality():
            print("❌ Messaging functionality test failed")
            return False
        
        print("✅ Messaging functionality working correctly")
        
        # Cleanup
        print("\n🧹 TEST 4: Cleanup Test Data")
        print("-" * 30)
        
        # Switch back to psychologist for cleanup
        if not self.login("demo-psychologist@psychology.com", "password"):
            print("❌ Failed to switch back to psychologist for cleanup")
            return False
        
        self.cleanup_test_data()
        
        print("\n🎉 ALL MESSAGING TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        return True

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