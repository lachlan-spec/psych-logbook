# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'psychologist',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "YOUR_BACKEND_URL/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test protected endpoints
curl -X GET "YOUR_BACKEND_URL/api/logbook/entries" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```javascript
// Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "your-domain.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
}]);
await page.goto("https://your-domain.com");
```

## Critical MongoDB + Pydantic ID Mapping

### Pydantic Models
```python
class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    role: str
    
    class Config:
        populate_by_name = True
```

### Backend Auth Fix
```python
async def get_current_user(session_token: str):
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        return None
    
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if user_doc:
        user_doc.pop("_id", None)  # Remove MongoDB _id
        return User(**user_doc)
```

## Checklist
- [ ] User document has `id` field
- [ ] Session `user_id` matches user's `id` value
- [ ] Both use string IDs (not ObjectId)
- [ ] Backend queries exclude `_id` field
- [ ] API returns user data (not 401/404)
- [ ] Dashboard loads without redirect

## Success Indicators
✅ /api/auth/me returns user data
✅ Dashboard loads without redirect
✅ CRUD operations work

## Failure Indicators
❌ "User not found" errors
❌ 401 Unauthorized responses
❌ Redirect to login page
