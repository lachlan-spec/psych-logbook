# Seed Data for Database Migration

This folder contains data export/import tools for migrating your Psych Logbook data.

## Exporting Data from Emergent

1. **Deploy the latest code** (includes the export endpoint)

2. **Login as admin** on your live site

3. **Export your data** by visiting:
   ```
   https://your-site.emergent.host/api/admin/export-data
   ```

4. **Save the JSON response** to this file:
   ```
   seed_data/export.json
   ```

## Importing Data to New Database (Azure, etc.)

1. **Set your MongoDB connection string:**
   ```bash
   export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/"
   export DB_NAME="psych_logbook"
   ```

2. **Run the seed script:**
   ```bash
   cd backend
   pip install motor passlib bcrypt
   python seed_database.py
   ```

3. **Verify the import** by logging into your new deployment

## Notes

- User passwords are NOT exported (security)
- Users will need to reset passwords or use the default: `changeme123`
- Admin user is always created with password: `admin`
- You can re-run the seed script - it clears and re-imports data

## File Structure

```
seed_data/
├── README.md          # This file
├── export.json        # Your exported data (create this)
```
