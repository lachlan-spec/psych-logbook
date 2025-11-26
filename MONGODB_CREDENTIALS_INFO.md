# 🔐 MongoDB Credentials & Access Information

## Current Situation

Based on your production error logs, here's what we know:

### Production MongoDB Status:
```
ERROR: ❌ No user databases found! Only system DBs available: []
```

**This means**: Your production MongoDB Atlas cluster is either:
1. **Completely empty** (no databases created)
2. **User doesn't have list database permissions**
3. **Wrong cluster** (pointing to a different/new cluster)

---

## How to Find Your MongoDB Credentials

### Option 1: Emergent Platform Dashboard

**Emergent manages MongoDB for you. To find credentials:**

1. **Go to Emergent Dashboard**: https://app.emergent.build (or your Emergent URL)
2. **Navigate to**: Your Project → Settings → Environment Variables
3. **Look for**: `MONGO_URL` variable
4. **You'll see something like**:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name
   ```

5. **Copy the username and password** from this URL
6. **Note the cluster name**: `cluster0.xxxxx.mongodb.net`

---

### Option 2: MongoDB Atlas Direct Access

**If you created the MongoDB Atlas account:**

1. **Go to**: https://cloud.mongodb.com
2. **Sign in** with:
   - Email/password you used to create the account
   - OR Google/GitHub if you used social login

3. **Once logged in**:
   - Click **"Database"** in the left sidebar
   - You'll see your cluster (e.g., "Cluster0")
   - Click **"Collections"** button
   - This shows all databases and collections

4. **To get connection string**:
   - Click **"Connect"** button on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string shown

---

### Option 3: Check Emergent Support

**If Emergent auto-provisioned MongoDB for you:**

1. Check your **email** for:
   - MongoDB Atlas invitation
   - Emergent setup confirmation emails

2. Or contact Emergent support:
   - They can provide you with MongoDB Atlas access
   - Ask for: "MongoDB Atlas dashboard access for my deployed app"

---

## What We Need to Verify

Once you access MongoDB Atlas dashboard, please check:

### ✅ Checklist:

1. **Does a database exist?**
   - Look in the "Collections" tab
   - Do you see databases listed?
   - What are the database names?

2. **Does the database have your data?**
   - Click on the database
   - Do you see collections like:
     - `users`
     - `logbook_entries`
     - `cpd_activities`
     - `connections`

3. **Is there data in the collections?**
   - Click on `users` collection
   - Do you see user documents?
   - How many documents are there?

---

## Expected Database Name

Based on your app, the database should be named something like:
- `regpath`
- `regpath_production`
- `psychology_portal`
- `psychologist_portal`
- Or the default Emergent creates for you

---

## If Database is Empty/Missing

**Possible scenarios:**

### Scenario A: Fresh Deployment
- This is your first production deployment
- No data has been migrated yet
- **Solution**: Need to migrate data from local/staging to production

### Scenario B: Wrong Cluster
- Production MONGO_URL points to a different cluster
- Your data is in another Atlas cluster
- **Solution**: Update MONGO_URL to point to correct cluster

### Scenario C: Database Was Deleted
- Database existed but was accidentally deleted
- **Solution**: Restore from backup (Atlas has automatic backups)

---

## Next Steps

1. **Access MongoDB Atlas** using one of the methods above
2. **Take a screenshot** of what you see in the Collections tab
3. **Share with me**:
   - What databases exist
   - What collections you see
   - Or confirm if it's completely empty

Then I can:
- Help you migrate data if needed
- Update the connection string if pointing to wrong cluster
- Or help restore from backup if data was lost

---

## Quick Check Command

If you have the MongoDB connection string, you can also verify it using MongoDB Compass (free GUI tool):

1. Download: https://www.mongodb.com/products/compass
2. Paste your connection string
3. Connect and browse your databases visually

---

**Let me know what you find!** 🔍
