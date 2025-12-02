# 🎯 Questions for Successful Emergent Agent

## Project Context
**Our Failed Deployment**: FastAPI + React + MongoDB psychology portal
**Issue**: "not authorized on test_database" - authentication completely broken in production
**Attempts**: 6+ failed fixes over multiple hours

---

## SECTION 1: MongoDB Atlas Setup & Configuration

### Database Creation
1. **For a FRESH Emergent deployment (no existing data), what database name should the application use?**
   - Does Emergent pre-create a database with a specific name?
   - What is that database called? (e.g., "app_database", "production", project name?)
   - Or does the app create it on first user signup?

2. **How is the MongoDB Atlas database name determined?**
   - Is it in the MONGO_URL that Emergent provides?
   - Example: `mongodb+srv://user:pass@cluster.net/DATABASE_NAME?...`
   - If yes, where in the URL path?

3. **What does your database connection code look like?**
   - How do you extract the database name from MONGO_URL?
   - Do you have auto-discovery logic?
   - What's your fallback if no database name is found?

### User Permissions
4. **Does Emergent automatically configure MongoDB Atlas user permissions?**
   - Does the provisioned user have `readWrite` or `dbAdmin` roles by default?
   - Or does the user need to manually configure permissions in Atlas?

5. **Did you encounter any "not authorized" errors during your deployment?**
   - If yes, how did you resolve them?
   - If no, what did you do differently?

---

## SECTION 2: Environment Variables & Configuration

### MONGO_URL Format
6. **What does the production MONGO_URL look like? (without password)**
   ```
   mongodb+srv://username:****@cluster.mongodb.net/[DATABASE_HERE]?retryWrites=true
   ```
   - Does it include a database name after `.net/`?
   - Or is it just `.net/?retryWrites=true` (no database name)?

7. **What environment variables are required for production?**
   - MONGO_URL (provided by Emergent?)
   - DB_NAME (do you set this manually?)
   - Any others?

8. **How does your .env file handling work?**
   - Do you load .env files in production?
   - Or rely 100% on Emergent-injected environment variables?
   - What's your `load_dotenv()` logic?

---

## SECTION 3: Database Connection Logic

### Code Implementation
9. **Can you share your database connection code from server.py?**
   - Lines where you:
     - Get MONGO_URL
     - Extract/determine database name
     - Create MongoDB client
     - Select database

10. **Do you have any database auto-discovery logic?**
    - If yes, how does it work?
    - If no, why not needed?

11. **What happens if the database doesn't exist yet?**
    - Does MongoDB Atlas create it automatically on first write?
    - Or do you need to pre-create it?

### Error Handling
12. **What error handling do you have for database connection failures?**
    - Specific handling for "not authorized" errors?
    - Retry logic?
    - Fallbacks?

---

## SECTION 4: First Deployment Experience

### Testing Authentication
13. **When you first deployed, what happened when you tried to sign up?**
    - Did the first user signup work immediately?
    - Or were there issues you had to debug?

14. **How did you test the production deployment?**
    - Did you check backend logs first?
    - What did you look for in the logs?
    - What indicated everything was working?

15. **Were there any "gotchas" or surprises during deployment?**
    - Things that didn't work as expected?
    - Manual steps required?
    - Configuration tweaks needed?

---

## SECTION 5: Deployment Process

### Pre-Deployment
16. **What checks did you run BEFORE deploying?**
    - Deployment health checks?
    - Linting?
    - Environment variable verification?

17. **What files/settings did you verify were correct?**
    - .gitignore (to exclude .env files?)
    - requirements.txt?
    - Any Emergent-specific config files?

### During Deployment
18. **What does Emergent do automatically during deployment?**
    - Provision MongoDB Atlas?
    - Create database?
    - Set environment variables?

19. **Is there a specific deployment order or steps to follow?**
    - Any "deploy settings" to configure in Emergent UI?
    - Any manual steps after clicking deploy?

### Post-Deployment
20. **What did you check immediately after deployment?**
    - Backend logs?
    - Frontend loading?
    - Database connection?
    - First API call?

---

## SECTION 6: Differences from Our Approach

### What We Did (That May Be Wrong)
21. **We implemented database auto-discovery logic that:**
    - Connects to MongoDB Atlas
    - Lists all databases
    - Filters out system databases
    - Uses first user database found
    - Falls back to "app_database" if none found
    
    **Is this approach correct? Or should we do something simpler?**

22. **We extract database name from MONGO_URL using:**
    ```python
    parsed = urlparse(mongo_url)
    db_name = parsed.path.lstrip('/').split('?')[0]
    ```
    **Is this correct? Or are we missing something?**

23. **We load .env file conditionally:**
    ```python
    if not os.environ.get('MONGO_URL'):
        load_dotenv('.env')
    ```
    **Is this the right approach for Emergent?**

---

## SECTION 7: MongoDB Atlas Dashboard

### Manual Configuration
24. **Did you need to access MongoDB Atlas dashboard at all?**
    - To create database?
    - To set permissions?
    - To check connection?
    - Or was everything automatic?

25. **If you DID access Atlas dashboard, what did you do there?**
    - Create database manually?
    - Assign user roles?
    - Check connection strings?

---

## SECTION 8: Common Mistakes

### Pitfalls to Avoid
26. **What mistakes do new Emergent users commonly make with MongoDB?**
    - Wrong environment variable handling?
    - Incorrect database name?
    - Missing permissions?

27. **What did you learn from your deployment experience?**
    - What would you do differently?
    - What's the "correct" way to handle MongoDB in Emergent?

---

## SECTION 9: Debugging Production Issues

### When Things Go Wrong
28. **If authentication fails in production, what's your debugging checklist?**
    - Step 1: Check what?
    - Step 2: Verify what?
    - Step 3: Fix what?

29. **How do you access production logs in Emergent?**
    - Where to find them?
    - What to look for?

30. **What would cause "not authorized on test_database" error?**
    - Based on your experience?
    - How would you fix it?

---

## SECTION 10: Moving Forward

### Recommendations
31. **Based on our error logs showing:**
    ```
    Available databases: []
    not authorized on test_database
    ```
    **What would you recommend we do?**

32. **Should we:**
    - A) Contact Emergent support (infrastructure issue)?
    - B) Modify our database connection code (code issue)?
    - C) Manually configure MongoDB Atlas (config issue)?
    - D) Something else?

33. **If you were taking over this project right now, what would be your first 3 actions?**

---

## BONUS: Azure Deployment Preparation

Since we're planning to move to Azure:

34. **Have you deployed Emergent projects to Azure?**
    - If yes, any tips or differences to be aware of?

35. **What from Emergent deployment knowledge transfers to Azure?**
    - Database connection logic?
    - Environment variable handling?
    - Any Emergent-specific code we should change?

---

## 📋 Summary of Our Failed Approach

**What we tried (all failed):**
1. ✅ Fixed .gitignore for .env files
2. ✅ Implemented database auto-discovery
3. ✅ Changed fallback from "test_database" to "app_database"
4. ✅ Enhanced logging
5. ✅ Removed ML/AI dependencies
6. ❌ Still getting "not authorized on test_database" errors

**Expert diagnosis:**
- MongoDB Atlas user lacks database permissions
- Not a code issue - infrastructure/configuration problem
- But Emergent SHOULD handle this automatically

**Our confusion:**
- Why does Emergent-provisioned MongoDB not have proper permissions?
- What are we missing in our setup?
- What did successful deployments do differently?

---

**Thank you for helping us understand what went wrong!** 🙏
