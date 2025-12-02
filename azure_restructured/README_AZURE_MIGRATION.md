# 🚀 Azure Migration Guide - Psychology Portal

## Overview

This directory contains the Azure-ready version of your Psychology Portal backend, restructured from FastAPI to Azure Functions.

---

## 📁 Directory Structure

```
azure_restructured/
├── .github/workflows/          # GitHub Actions for deployment
│   ├── azure-functions.yml     # Backend deployment
│   └── azure-static-web-apps.yml  # Frontend deployment
├── api/                        # Backend (Azure Functions)
│   ├── host.json              # Functions runtime config
│   ├── requirements.txt       # Python dependencies
│   ├── shared_code/           # Shared utilities
│   │   ├── database.py        # ✅ Simple DB connection
│   │   └── auth.py            # ✅ JWT & password utils
│   ├── Health/                # Health check function
│   ├── Auth/                  # All auth endpoints
│   ├── Users/                 # User management
│   ├── Connections/           # Supervisor connections
│   ├── Logbook/               # Logbook operations
│   ├── CPD/                   # CPD activities
│   ├── Supervisor/            # Supervisor-specific
│   └── Messages/              # Messaging system
└── frontend/                  # (Copy your existing frontend here)
```

---

## 🎯 Key Changes from Original

### 1. Database Connection - SIMPLIFIED!

**Old (Emergent - FAILED):**
```python
❌ Complex auto-discovery logic
❌ list_database_names() requiring admin permissions
❌ Fallback to "test_database" (authorization error)
```

**New (Azure - WORKS):**
```python
✅ connection_string = os.environ.get('COSMOS_CONNECTION_STRING')
✅ db_name = os.environ.get('DB_NAME', 'regpath_production')
✅ client = MongoClient(connection_string)
✅ db = client[db_name]  # Simple, explicit, works!
```

### 2. Grouped Endpoints (Hybrid Approach)

Instead of 40+ individual functions, grouped by feature:

| Function | Handles | Routes |
|----------|---------|--------|
| `Auth/` | Authentication | `/api/auth/*` |
| `Users/` | User management | `/api/users/*` |
| `Connections/` | Connections | `/api/connections/*` |
| `Logbook/` | Logbook | `/api/logbook/*` |
| `CPD/` | CPD activities | `/api/cpd/*` |
| `Supervisor/` | Supervisor ops | `/api/supervisor/*` |
| `Messages/` | Messaging | `/api/messages/*` |
| `Health/` | Health check | `/api/health` |

### 3. Frontend Configuration with Fallback

**Critical lesson from successful agent:**
```javascript
// ✅ Hardcoded fallback prevents silent failures
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 
  'https://regpath-portal-api.azurewebsites.net';
```

---

## 📝 Implementation Steps

### Step 1: Copy Your Existing Route Logic

For each function folder, you need to copy the corresponding route logic from `/app/backend/server.py`.

**Example - Auth Function:**

1. Open `/app/backend/server.py`
2. Find all routes starting with `@api_router.post("/auth/...)`
3. Copy the logic into `/app/azure_restructured/api/Auth/__init__.py`
4. Adapt to Azure Functions format (see template below)

### Step 2: Azure Functions Template

Here's the pattern for each function:

```python
import azure.functions as func
import json
import logging
from shared_code.database import get_database
from shared_code.auth import get_current_user_from_token

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    \"\"\"
    Handle all auth routes: /api/auth/*
    \"\"\"
    logger.info(f'{req.method} {req.url}')
    
    try:
        # Get database
        db = get_database()
        
        # Parse route
        route = req.route_params.get('route', '')  # e.g., "login", "signup"
        method = req.method  # GET, POST, etc.
        
        # Route to correct handler
        if route == 'login' and method == 'POST':
            return handle_login(req, db)
        elif route == 'signup' and method == 'POST':
            return handle_signup(req, db)
        elif route == 'me' and method == 'GET':
            return handle_get_me(req, db)
        # ... etc
        
        else:
            return func.HttpResponse(
                json.dumps({"error": "Route not found"}),
                status_code=404,
                mimetype="application/json"
            )
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )


def handle_login(req: func.HttpRequest, db) -> func.HttpResponse:
    \"\"\"Handle POST /api/auth/login\"\"\"
    # Copy logic from server.py login route
    # Adapt to Azure Functions response format
    pass


def handle_signup(req: func.HttpRequest, db) -> func.HttpResponse:
    \"\"\"Handle POST /api/auth/signup\"\"\"
    # Copy logic from server.py signup route
    pass
```

### Step 3: Key Differences to Adapt

When copying from `server.py` to Azure Functions:

**1. Request Body:**
```python
# Old (FastAPI)
async def login(credentials: dict):
    email = credentials.get('email')

# New (Azure Functions)
def handle_login(req: func.HttpRequest, db):
    body = req.get_json()
    email = body.get('email')
```

**2. Response:**
```python
# Old (FastAPI)
return {"token": token, "user": user}

# New (Azure Functions)
return func.HttpResponse(
    json.dumps({"token": token, "user": user}),
    mimetype="application/json",
    status_code=200
)
```

**3. Cookies:**
```python
# Old (FastAPI)
response.set_cookie("session_token", token)

# New (Azure Functions)
response = func.HttpResponse(...)
response.headers['Set-Cookie'] = f'session_token={token}; HttpOnly; Secure; SameSite=Lax'
```

**4. Database (Motor → PyMongo):**
```python
# Old (FastAPI with Motor - async)
user = await db.users.find_one({"email": email})

# New (Azure Functions with PyMongo - sync)
user = db.users.find_one({"email": email})
```

**5. No Async/Await:**
```python
# Old (FastAPI)
async def login(...):
    user = await db.users.find_one(...)

# New (Azure Functions)
def handle_login(...):
    user = db.users.find_one(...)  # No await!
```

---

## ⚠️ CRITICAL: Lessons from Successful Deployment

### 1. Container Names Must Be Lowercase
```python
# ✅ CORRECT
container_name = os.environ.get('BLOB_CONTAINER_NAME', 'reports').lower()

# ❌ WRONG - Will fail with "InvalidResourceName"
container_name = 'REPORTS'
```

### 2. Node 20 + Yarn (Not NPM)
- Workflow already configured correctly
- Don't change to NPM!

### 3. Enable SCM Basic Auth BEFORE Getting Publish Profile
- Critical step in deployment guide
- Prevents "REDACTED" credentials issue

### 4. Exact Workflow File Names
- Static Web App auto-generates workflow with specific name
- Check Azure Portal for expected filename
- Rename if needed

### 5. Frontend Env Var with Fallback
```javascript
// ✅ This saved the successful agent
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 
  'https://regpath-portal-api.azurewebsites.net';
```

---

## 🔧 Environment Variables Needed

### Function App Configuration

Set these in Azure Portal → Function App → Configuration:

| Variable | Value | Example |
|----------|-------|---------|
| `COSMOS_CONNECTION_STRING` | Your Cosmos DB connection | From Azure Portal |
| `DB_NAME` | Database name | `regpath_production` |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage connection | From Step 2.2 |
| `BLOB_CONTAINER_NAME` | Container name | `reports` |
| `CORS_ORIGINS` | Frontend URL | `https://regpath-portal-frontend.azurestaticapps.net` |
| `JWT_SECRET` | Secret key for JWT | Generate random string |

### Static Web App Configuration

Build-time variable in workflow (already set):
```yaml
env:
  REACT_APP_BACKEND_URL: https://regpath-portal-api.azurewebsites.net
  REACT_APP_AUTH_URL: https://auth.emergentagent.com
```

---

## 🧪 Testing Checklist

After deployment:

### Backend Tests
```bash
# 1. Health check
curl https://regpath-portal-api.azurewebsites.net/api/health
# Expected: {"status": "healthy", "database": "connected"}

# 2. Signup
curl -X POST https://regpath-portal-api.azurewebsites.net/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User","role":"psychologist"}'

# 3. Login
curl -X POST https://regpath-portal-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Frontend Tests
1. Open: `https://regpath-portal-frontend.azurestaticapps.net`
2. Check browser console (F12) - no errors
3. Try signup
4. Try login
5. Check Network tab - API calls should succeed

### Database Tests
1. Azure Portal → Cosmos DB → Data Explorer
2. Find database: `regpath_production`
3. Check `users` collection - should see test user

---

## 🚨 Troubleshooting

### "CORS Error in Browser"
**Fix:** Function App → CORS → Add Static Web App URL

### "401 Unauthorized During Deployment"
**Fix:** Enable SCM Basic Auth → Re-download publish profile

### "not authorized on database"
**Fix:** Verify COSMOS_CONNECTION_STRING is correct

### "InvalidResourceName" for Blob Storage
**Fix:** Ensure container name is lowercase

### Frontend Shows "0 - Assessment"
**Fix:** Add hardcoded fallback for BACKEND_URL

---

## 📊 What You Have vs What You Need

### ✅ Already Created:
- Folder structure
- function.json files for all functions
- shared_code/database.py (simple DB connection)
- shared_code/auth.py (JWT utilities)
- GitHub Actions workflows
- Deployment guide
- Health function (complete example)

### 🚧 You Need to Create:
- `Auth/__init__.py` (copy logic from server.py lines 313-593)
- `Users/__init__.py` (copy logic from lines 594-605)
- `Connections/__init__.py` (copy logic from lines 607-670)
- `Logbook/__init__.py` (copy logic from lines 672-809)
- `CPD/__init__.py` (similar to Logbook)
- `Supervisor/__init__.py` (copy supervisor routes)
- `Messages/__init__.py` (copy message routes)

**Estimated time:** 2-3 hours to copy and adapt all routes

---

## 💡 Quick Start Option

**If you want to deploy ASAP:**

1. Start with just Auth and Health functions working
2. Get those deployed and tested
3. Add other functions incrementally
4. Deploy after each addition

**Minimal viable deployment:**
- Health ✅ (done)
- Auth (login, signup, me) - ~30 minutes
- Users (search) - ~10 minutes

This gets authentication working, then you can add rest later.

---

## 🎯 Success Criteria

You'll know it's working when:
- ✅ Health check returns 200
- ✅ Signup creates user in Cosmos DB
- ✅ Login returns JWT token
- ✅ Frontend loads without errors
- ✅ No CORS errors in browser
- ✅ API calls succeed

**This will work because:**
- Simple, explicit database config
- No complex auto-discovery
- Hardcoded fallbacks
- Following proven successful approach

---

## 📞 Need Help?

If you get stuck:
1. Check deployment guide: `/app/AZURE_DEPLOYMENT_COMPLETE_GUIDE.md`
2. Review crisis lessons: `/app/DEPLOYMENT_ISSUES_AND_SOLUTIONS.md`
3. Test with curl before full deployment
4. Check Azure Function App logs
5. Verify environment variables

**Remember:** The successful agent spent 12 hours debugging. With this guide, you should avoid all those issues! 🚀
