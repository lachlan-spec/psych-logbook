# Azure Deployment Guide for Psychology Logbook

This guide covers deploying your Psychology Logbook application to Microsoft Azure.

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Azure Cloud                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐      ┌─────────────────────────┐  │
│  │ Azure App       │      │ Azure Cosmos DB         │  │
│  │ Service (Web)   │──────│ (MongoDB API)           │  │
│  │                 │      │                         │  │
│  │ - Backend API   │      │ - Database: psych_portal│  │
│  │ - Frontend      │      │                         │  │
│  └─────────────────┘      └─────────────────────────┘  │
│           │                                             │
│           │                                             │
│  ┌────────▼────────┐                                   │
│  │ GitHub Actions  │                                   │
│  │ (CI/CD)         │                                   │
│  └─────────────────┘                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Create Azure Resources

### 1.1 Create a Resource Group
```bash
# Login to Azure CLI
az login

# Create resource group (choose your region)
az group create --name psych-logbook-rg --location australiaeast
```

### 1.2 Create Azure Cosmos DB (MongoDB API)
```bash
# Create Cosmos DB account with MongoDB API
az cosmosdb create \
  --name psych-logbook-db \
  --resource-group psych-logbook-rg \
  --kind MongoDB \
  --server-version 4.2 \
  --default-consistency-level Session

# Get the connection string (save this!)
az cosmosdb keys list \
  --name psych-logbook-db \
  --resource-group psych-logbook-rg \
  --type connection-strings
```

**Alternative: Use MongoDB Atlas**
- Go to https://www.mongodb.com/atlas
- Create a free M0 cluster
- Whitelist Azure App Service IPs (or allow all: 0.0.0.0/0)
- Get connection string from Atlas dashboard

### 1.3 Create Azure App Service
```bash
# Create App Service Plan (B1 is lowest paid tier with always-on)
az appservice plan create \
  --name psych-logbook-plan \
  --resource-group psych-logbook-rg \
  --sku B1 \
  --is-linux

# Create Web App for containers
az webapp create \
  --name psych-logbook-app \
  --resource-group psych-logbook-rg \
  --plan psych-logbook-plan \
  --runtime "PYTHON:3.11"
```

---

## Step 2: Configure Environment Variables

In Azure Portal → App Service → Configuration → Application settings:

| Setting | Value |
|---------|-------|
| `MONGO_URL` | `mongodb+srv://username:password@cluster.mongodb.net/` |
| `DB_NAME` | `psychology_portal` |
| `JWT_SECRET` | `your-secure-random-string-32-chars-min` |
| `WEBSITE_NODE_DEFAULT_VERSION` | `18-lts` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |

**Generate a secure JWT secret:**
```bash
openssl rand -hex 32
```

---

## Step 3: Prepare Your Code for Azure

### 3.1 Create `startup.sh` in `/app/backend/`:
```bash
#!/bin/bash

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server with Gunicorn
gunicorn server:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### 3.2 Update `requirements.txt`:
Ensure these are included:
```
gunicorn
uvicorn[standard]
```

### 3.3 Build Frontend for Production:
```bash
cd frontend
npm run build
```
The built files in `frontend/build/` should be served by your backend or a separate static hosting.

---

## Step 4: Deployment Options

### Option A: Deploy via GitHub Actions (Recommended)

1. **Save to GitHub** using the Emergent "Save to Github" feature
2. In Azure Portal → App Service → Deployment Center:
   - Select "GitHub" as source
   - Authorize and select your repo
   - Azure will auto-create a workflow file

3. **Or create your own workflow** at `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    # Build Frontend
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
      env:
        REACT_APP_BACKEND_URL: https://psych-logbook-app.azurewebsites.net
    
    # Deploy to Azure
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'psych-logbook-app'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./backend
```

4. **Add publish profile secret:**
   - Azure Portal → App Service → Get publish profile
   - GitHub repo → Settings → Secrets → Add `AZURE_WEBAPP_PUBLISH_PROFILE`

### Option B: Deploy via Azure CLI (Manual)

```bash
# Zip your backend code
cd /app/backend
zip -r deploy.zip . -x "*.pyc" -x "__pycache__/*" -x "*.git*"

# Deploy
az webapp deploy \
  --resource-group psych-logbook-rg \
  --name psych-logbook-app \
  --src-path deploy.zip
```

### Option C: Deploy using Docker

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .
COPY frontend/build/ ./static/

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "server:app", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

Then deploy:
```bash
# Build and push to Azure Container Registry
az acr build --registry yourregistry --image psych-logbook:latest .

# Update App Service to use container
az webapp config container set \
  --name psych-logbook-app \
  --resource-group psych-logbook-rg \
  --docker-custom-image-name yourregistry.azurecr.io/psych-logbook:latest
```

---

## Step 5: Seed Your Database

After deployment, seed your database with your exported data:

1. **SSH into Azure App Service:**
   ```bash
   az webapp ssh --resource-group psych-logbook-rg --name psych-logbook-app
   ```

2. **Run the seed script:**
   ```bash
   cd /home/site/wwwroot
   python seed_database.py
   ```

**Or seed locally before deployment:**
```bash
# Set your Azure MongoDB connection string
export MONGO_URL="your-azure-cosmos-connection-string"
export DB_NAME="psychology_portal"

# Run seed script
cd /app/backend
python seed_database.py
```

---

## Step 6: Configure Custom Domain (Optional)

1. Azure Portal → App Service → Custom domains
2. Add your domain (e.g., `logbook.yourdomain.com`)
3. Configure DNS:
   - CNAME: `logbook` → `psych-logbook-app.azurewebsites.net`
4. Enable HTTPS (free SSL certificate from Azure)

---

## Step 7: Enable Always On

To prevent your app from sleeping after inactivity:

Azure Portal → App Service → Configuration → General settings:
- **Always On**: Enable

> Note: Requires Basic (B1) tier or higher

---

## Troubleshooting

### View Application Logs
```bash
# Stream live logs
az webapp log tail \
  --resource-group psych-logbook-rg \
  --name psych-logbook-app

# Or in Azure Portal → App Service → Log stream
```

### Common Issues

1. **MongoDB Connection Timeout**
   - Check connection string format
   - Ensure database firewall allows Azure IPs
   - For Cosmos DB, verify MongoDB API is selected

2. **App Not Starting**
   - Check startup command: `gunicorn server:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`
   - Review logs for import errors

3. **Static Files Not Loading**
   - Ensure frontend build is included in deployment
   - Check that backend serves static files from correct path

---

## Cost Estimate (Monthly)

| Resource | Tier | Estimated Cost |
|----------|------|----------------|
| App Service | B1 Basic | ~$13 AUD |
| Cosmos DB | Free Tier (400 RU/s) | $0 |
| **OR** MongoDB Atlas | M0 Free | $0 |
| Custom Domain SSL | Included | $0 |
| **Total** | | **~$13 AUD/month** |

> Note: Prices vary by region and usage. Free tiers have limitations.

---

## Quick Checklist

- [ ] Azure account created
- [ ] Resource group created
- [ ] Cosmos DB or MongoDB Atlas cluster created
- [ ] App Service created
- [ ] Environment variables configured (MONGO_URL, DB_NAME, JWT_SECRET)
- [ ] GitHub repo connected (or manual deployment ready)
- [ ] Database seeded with exported data
- [ ] HTTPS enabled
- [ ] Always On enabled (optional)
- [ ] Custom domain configured (optional)

---

## Files You Need for Deployment

From this project, you need:
```
/app/backend/
├── server.py              # Main FastAPI application
├── requirements.txt       # Python dependencies
├── seed_database.py       # Database seeding script
└── seed_data/
    └── live_data_export.json  # Your exported data

/app/frontend/build/       # Built React app (run npm build first)
```

---

## Need Help?

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Cosmos DB MongoDB API](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
