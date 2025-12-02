# 🚀 Azure Deployment Guide - Psychology Portal
## Complete Step-by-Step Instructions

**Status**: Ready to deploy to Azure from scratch
**Stack**: React Frontend + Python Azure Functions Backend + Cosmos DB (MongoDB API)

---

## 📋 Prerequisites Checklist

Before starting, you need:
- [x] Azure account with active subscription
- [x] Cosmos DB for MongoDB (you have this)
- [ ] GitHub account (to host code and run workflows)
- [ ] Git installed locally (to push code)

---

## 🎯 Resource Names We'll Use

I've chosen these names (you can change if needed):

| Resource Type | Name | Purpose |
|--------------|------|---------|
| Resource Group | `regpath-portal-rg` | Container for all resources |
| Function App | `regpath-portal-api` | Backend API |
| Static Web App | `regpath-portal-frontend` | React frontend |
| Storage Account | `regpathfiles` | File storage (lowercase, no hyphens) |
| Cosmos DB | `[YOUR_EXISTING]` | Database (you already have) |

**Azure Region**: Australia East (change if your Cosmos DB is in different region)

---

## 📦 PHASE 1: Create GitHub Repository

**Why first?** Static Web Apps require GitHub connection during creation.

### Step 1.1: Create GitHub Repo

1. Go to https://github.com/new
2. Repository name: `psychology-portal-azure`
3. Description: "Psychology portal deployed to Azure"
4. Visibility: Private (recommended)
5. ✅ Initialize with README
6. Click **Create repository**

### Step 1.2: Clone Locally

```bash
# Clone the empty repo
git clone https://github.com/YOUR_USERNAME/psychology-portal-azure.git
cd psychology-portal-azure
```

### Step 1.3: Copy Your Code

We'll restructure and copy code in Phase 3. For now, just have the empty repo ready.

---

## 🏗️ PHASE 2: Create Azure Resources

### Step 2.1: Create Resource Group

1. Go to **Azure Portal**: https://portal.azure.com
2. Search for **"Resource groups"** in top search bar
3. Click **+ Create**
4. Fill in:
   - **Subscription**: Your subscription
   - **Resource group name**: `regpath-portal-rg`
   - **Region**: Australia East
5. Click **Review + create** → **Create**

---

### Step 2.2: Create Storage Account

1. Search for **"Storage accounts"** in Azure Portal
2. Click **+ Create**
3. Fill in:
   - **Resource group**: `regpath-portal-rg`
   - **Storage account name**: `regpathfiles` (must be lowercase, no hyphens!)
   - **Region**: Australia East
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage - cheapest)
4. Click **Review** → **Create**
5. Wait for deployment to complete (1-2 minutes)

**After creation:**
1. Go to the storage account
2. Left menu → **Containers**
3. Click **+ Container**
4. Name: `reports` (lowercase!)
5. Public access level: **Private**
6. Click **Create**

**Copy connection string:**
1. Left menu → **Access keys**
2. Click **Show** next to key1
3. Copy the **Connection string** value
4. Save it temporarily (you'll need it later)

---

### Step 2.3: Create Function App (Backend)

1. Search for **"Function App"** in Azure Portal
2. Click **+ Create**
3. Fill in:
   - **Resource Group**: `regpath-portal-rg`
   - **Function App name**: `regpath-portal-api`
   - **Runtime stack**: Python
   - **Version**: 3.11
   - **Region**: Australia East
   - **Operating System**: Linux
   - **Plan type**: Consumption (Serverless)
4. Click **Review + create** → **Create**
5. Wait for deployment (2-3 minutes)

**After creation - Configure Settings:**
1. Go to the Function App
2. Left menu → **Configuration**
3. Click **+ New application setting** for EACH of these:

| Name | Value | Where to get it |
|------|-------|----------------|
| `COSMOS_CONNECTION_STRING` | `[YOUR_COSMOS_CONNECTION]` | You'll provide this |
| `DB_NAME` | `regpath_production` | Name for your database |
| `AZURE_STORAGE_CONNECTION_STRING` | `[FROM_STEP_2.2]` | Storage account connection string |
| `BLOB_CONTAINER_NAME` | `reports` | Container name from step 2.2 |
| `CORS_ORIGINS` | `https://regpath-portal-frontend.azurestaticapps.net` | Will update later |

**Important**: Click **Save** at the top after adding all settings!

**Get Publish Profile:**
1. Function App → **Overview**
2. Top menu → **Get publish profile** (downloads file)
3. Open the `.PublishSettings` file
4. Copy **entire XML content**
5. Save for later (GitHub secret)

---

### Step 2.4: Enable SCM Basic Auth (Critical!)

**This prevents 401 deployment errors:**

1. Function App → **Configuration**
2. Tab: **General settings**
3. Scroll down to **Platform settings**
4. Find **"SCM Basic Auth Publishing Credentials"**
5. Toggle to **On**
6. Click **Save** at top

---

### Step 2.5: Create Static Web App (Frontend)

1. Search for **"Static Web Apps"** in Azure Portal
2. Click **+ Create**
3. Fill in:
   - **Resource Group**: `regpath-portal-rg`
   - **Name**: `regpath-portal-frontend`
   - **Plan type**: Free
   - **Region**: Australia East (or closest)
   - **Deployment details**:
     - Source: **GitHub**
     - Click **Sign in with GitHub**
     - Organization: Your GitHub username
     - Repository: `psychology-portal-azure`
     - Branch: `main`
   - **Build Details**:
     - Build presets: **React**
     - App location: `/frontend`
     - Api location: (leave empty)
     - Output location: `build`
4. Click **Review + create** → **Create**

**What happens:**
- Azure creates a GitHub workflow file automatically
- Deploys a token to your repo as a secret
- You'll see the workflow file in `.github/workflows/`

**Get the URL:**
1. After creation, go to Static Web App
2. **Overview** → Copy the **URL**
3. Should be: `https://regpath-portal-frontend.azurestaticapps.net`

---

### Step 2.6: Configure CORS (Critical!)

**Enable frontend to call backend API:**

1. Go to **Function App** (`regpath-portal-api`)
2. Left menu → **CORS** (under API section)
3. Delete any existing origins
4. Add: `https://regpath-portal-frontend.azurestaticapps.net`
5. Click **Save**

---

### Step 2.7: Update Function App CORS_ORIGINS

**Update environment variable with actual frontend URL:**

1. Function App → **Configuration**
2. Find `CORS_ORIGINS` setting
3. Click to edit
4. Value: `https://regpath-portal-frontend.azurestaticapps.net`
5. Click **OK** → **Save**

---

## 💻 PHASE 3: Restructure Code for Azure

### Step 3.1: Understand Azure Functions Structure

**Key difference from your current setup:**
- Current: Single `server.py` with all routes
- Azure Functions: Each endpoint is a separate "function"

**Example:**
```
Your current:
/app/backend/server.py
  @app.post("/api/auth/signup")
  @app.post("/api/auth/login")
  @app.get("/api/users")

Azure Functions:
/api/
  ├── signup/          # Separate function
  ├── login/           # Separate function
  ├── users/           # Separate function
  └── shared_code/     # Shared utilities
```

---

### Step 3.2: Create New Azure Functions Structure

I'll create the restructured code in the next steps. The structure will be:

```
psychology-portal-azure/
├── .github/
│   └── workflows/
│       ├── azure-functions.yml
│       └── azure-static-web-apps.yml
├── api/                           # Backend (Azure Functions)
│   ├── host.json
│   ├── requirements.txt
│   ├── shared_code/
│   │   ├── __init__.py
│   │   ├── database.py           # Simple DB connection
│   │   └── auth.py               # Auth utilities
│   ├── signup/
│   │   ├── __init__.py
│   │   └── function.json
│   ├── login/
│   │   ├── __init__.py
│   │   └── function.json
│   └── [other functions...]
├── frontend/                      # React app (unchanged)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

---

## 🔧 PHASE 4: Database Connection (SIMPLE!)

### The Problem We Had

**What failed in Emergent:**
```python
# ❌ Complex auto-discovery logic
databases = client.list_database_names()
filtered = [d for d in databases if d not in ['admin', 'config', 'test']]
db_name = filtered[0] if filtered else 'test_database'  # WRONG!
```

**Why it failed:**
- Required admin permissions
- Fell back to 'test_database' (no permissions)
- Guessed wrong database

---

### The Solution (From Successful Guide)

**Simple, explicit configuration:**
```python
# ✅ CORRECT - Simple and explicit
connection_string = os.environ.get('COSMOS_CONNECTION_STRING')
db_name = os.environ.get('DB_NAME', 'regpath_production')

client = MongoClient(connection_string)
db = client[db_name]
```

**Why this works:**
- No auto-discovery needed
- Explicit database name
- Connection string has permissions
- Cosmos DB creates database on first write

---

## 📝 PHASE 5: GitHub Setup

### Step 5.1: Add GitHub Secrets

After Azure resources are created:

1. Go to your GitHub repo
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for EACH:

**Secret 1: Azure Function App Publish Profile**
- Name: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
- Value: Paste the entire XML from Function App publish profile (Step 2.3)

**Secret 2: Static Web App Token**
- Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- This should already exist (Azure created it)
- If not, get from: Static Web App → **Manage deployment token**

---

## 🚀 PHASE 6: Deployment Workflow

### How It Works

1. You push code to GitHub (`main` branch)
2. GitHub Actions triggers:
   - **Workflow 1**: Builds and deploys Function App (backend)
   - **Workflow 2**: Builds and deploys Static Web App (frontend)
3. Both deploy automatically
4. Azure updates within 2-3 minutes

---

## ✅ PHASE 7: Deployment Checklist

**Before first deployment, verify:**

- [ ] All Azure resources created (Resource Group, Function App, Static Web App, Storage)
- [ ] Cosmos DB connection string added to Function App configuration
- [ ] Storage connection string added to Function App configuration
- [ ] CORS configured in Function App
- [ ] SCM Basic Auth enabled
- [ ] GitHub secrets added (publish profile, static web app token)
- [ ] Code pushed to GitHub `main` branch

---

## 🧪 PHASE 8: Testing Deployment

### Backend API Test

```bash
# Test health endpoint
curl https://regpath-portal-api.azurewebsites.net/api/health

# Expected: {"status": "ok"}
```

### Frontend Test

1. Open: `https://regpath-portal-frontend.azurestaticapps.net`
2. Should load React app
3. Check browser console (F12) - no errors
4. Try signup/login

### Database Test

1. Sign up a test user
2. Azure Portal → Cosmos DB → **Data Explorer**
3. Find database: `regpath_production`
4. Check `users` collection - should see user

---

## 🐛 Common Issues & Solutions

### Issue: "CORS error in browser"

**Symptom**: Network tab shows "blocked by CORS policy"

**Fix**:
1. Function App → CORS
2. Verify Static Web App URL is added
3. Remove any `*` wildcard
4. Save and restart Function App

---

### Issue: "401 Unauthorized" during deployment

**Symptom**: GitHub Actions fails with 401 error

**Fix**:
1. Function App → Configuration → General settings
2. Enable "SCM Basic Auth Publishing Credentials"
3. Re-download publish profile
4. Update GitHub secret with new profile

---

### Issue: "not authorized on database"

**Symptom**: API calls fail with database auth error

**Fix**:
1. Verify `COSMOS_CONNECTION_STRING` in Function App config
2. Verify `DB_NAME` is set correctly
3. Connection string must have read/write permissions

---

### Issue: Frontend shows "0 - Assessment"

**Symptom**: Environment variable not working

**Fix**:
```javascript
// Add hardcoded fallback in frontend code
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 
  'https://regpath-portal-api.azurewebsites.net';
```

---

## 💰 Cost Estimate

For your psychology portal:

| Resource | Tier | Monthly Cost |
|----------|------|-------------|
| Static Web App | Free | $0 |
| Function App | Consumption | $0 - $5 |
| Cosmos DB Serverless | Pay-per-use | $0 - $10 |
| Storage Account | Standard | $0 - $2 |
| **Total** | | **$0 - $17/month** |

Small apps usually stay in free tiers.

---

## 📋 Next Steps

**I will now create:**
1. ✅ Restructured backend code for Azure Functions
2. ✅ GitHub Actions workflow files
3. ✅ Simple database connection module
4. ✅ Frontend configuration updates

**You will then:**
1. Create GitHub repo
2. Create Azure resources (following Phase 2)
3. Copy restructured code to repo
4. Push to GitHub
5. Watch automatic deployment! 🎉

---

## 🎯 Success Criteria

**You'll know it's working when:**
- ✅ GitHub Actions show green checkmarks
- ✅ Frontend loads without errors
- ✅ Backend API responds
- ✅ User signup works
- ✅ Data appears in Cosmos DB

**This should work first time because:**
- Simple, explicit database configuration
- Following proven guide exactly
- No complex auto-discovery
- Proper Azure permissions

Ready for me to create the restructured code? 🚀
