# Psychology Portal - Product Requirements Document

## Overview
Multi-user psychology portal for tracking professional development, practice hours, CPD activities, and competency development.

## Core Features

### 1. Dashboard
- Welcome message and portal navigation tiles
- **All Practice Summary Widget**: Integrated progress snapshot showing:
  - **Period Progress**: Percentage of registrar period elapsed (time-based)
  - Registrar period dropdown selector (year selection)
  - Progress percentages against targets (Total, Direct Client, Supervision, CPD, Peer)
  - **Supervision column** with Primary/Secondary % breakdown
  - Weekly/Monthly/All view modes (Mobile: dropdown, Desktop: tabs)
  - All hours formatted to 1 decimal place
  - **PDF Report Download**: Generate and download practice summary as PDF
- **Filtered Portal Tiles**: Dashboard only shows portals the user has access to (based on feature toggles)

### 2. Practice Logbook
- Track supervised practice hours
- Activity types: 
  - Direct Client Contact
  - Supervision - Individual (Primary)
  - Supervision - Individual (Secondary - [Name]) - dynamic based on settings
  - Supervision - Group
  - Other
- **Supervisor Settings** per period:
  - Primary Supervisor (name)
  - Secondary Supervisors (unlimited, names)
- Hours by Category shows supervision breakdown (Primary vs Secondary %)
- CPD removed from Hours by Category (separate section)
- Weekly signatures
- PDF export
- Year-based organization with targets

### 3. CPD Hub
- Log CPD activities with hours
- **Peer consultations in dedicated section** (not in CPD activity log)
- Competency tagging (automatically creates Competency Journal entries)
- Learning plans management

### 4. Competency Journal
- 8 core competencies tracking
- Entries auto-created from tagged CPD/Peer activities
- Reflection notes

### 5. Personal Journal
- Private reflections and notes
- Date-based entries

### 6. User Management (Admin Only)
- Admin can create new user accounts
- **Feature Toggles per user**:
  - Practice Logbook (on/off)
  - Competency Journal (on/off)
- Each user has completely separate data
- Admin sets username and password for new users
- Admin can edit user settings via dialog with feature toggle switches
- Admin can delete users (deletes all their data)
- Available at /admin/users

### 7. PDF Reports
- Download practice summary as PDF from dashboard
- Select custom date range for report
- Report includes ALL activity entries (no limit)
- Australian date format throughout (DD/MM/YYYY)

### 8. Mobile Bottom Navigation
- Fixed bottom navigation bar on mobile devices (< 640px)
- Quick access to: Home, Logbook, CPD, Competency, Journal
- Respects user feature toggles (hidden items if feature disabled)
- Safe area support for iOS devices

## User Access
- **Admin**: admin/admin (has access to User Management)
- **Other users**: Created by admin with custom username/password
- Each user has isolated data (logbooks, CPD, journals, etc.)
- Feature access controlled by admin toggles

## Technical Stack
- Frontend: React + Shadcn UI + jsPDF + Recharts
- Backend: FastAPI
- Database: MongoDB

## Mobile Responsiveness
- **Responsive tabs**: Desktop shows tabs, mobile shows dropdown select
- **Touch targets**: Minimum 44px for interactive elements
- **Grid layouts**: Responsive columns (3-col mobile, 5-col desktop for totals)
- **Date format**: Australian DD/MM/YYYY throughout site and PDFs
- **Dialogs**: Full-width on mobile (95vw max)
- **Bottom navigation**: Fixed at bottom on mobile, hidden on desktop

## UI/UX Improvements
- **Color Contrast**: Tabs and buttons now have proper contrast
  - Active tabs: Blue background (#2563eb) with white text
  - Buttons: Solid blue (#2563eb) background with white text
  - Consistent styling across all interactive elements

## Completed Work (January 2026)

### Session 3 (Jan 10, 2026)
- ✅ **Color Contrast Fix**: Updated tabs.jsx and button.jsx for better readability
  - Active tabs: data-[state=active]:bg-blue-600 data-[state=active]:text-white
  - Buttons: bg-blue-600 text-white (removed gradients)
- ✅ **Admin Feature Toggles**: Added ability to enable/disable features per user
  - Practice Logbook toggle
  - Competency Journal toggle
  - Settings dialog for editing existing users
  - PATCH /api/admin/users/{user_id} endpoint
- ✅ **Mobile Bottom Navigation**: Fixed bottom nav bar for mobile devices
  - Shows Home, Logbook, CPD, Competency, Journal
  - Respects user feature toggles
  - sm:hidden class for desktop
- ✅ **Learning Plans Page Fix**: Fixed text jumping on mobile
  - Added min-w-0 flex-1 for proper text wrapping
  - Improved button sizing on mobile
- ✅ **Dashboard Portal Filtering**: Portals now respect feature toggles

### Session 2 (Jan 10, 2026)
- ✅ Added Period Progress indicator (time elapsed %)
- ✅ Added Supervision column in AllPracticeWidget
- ✅ Changed "Practice" label to "Direct Client"
- ✅ All hours site-wide formatted to 1 decimal place
- ✅ Added Primary Supervisor and Secondary Supervisors fields in Logbook Settings
- ✅ Split individual supervision entries by Primary/Secondary supervisor
- ✅ Added supervision % breakdown (Primary vs Secondary) tracking
- ✅ Removed CPD from Logbook Summary "Hours by Category"
- ✅ Fixed supervisor settings save bug (undefined secondary_supervisors)
- ✅ Multi-user support - Admin can create user accounts for friends
- ✅ Added User Management page (/admin/users)
- ✅ PDF Report Download - Generate practice summary PDFs with custom date range
- ✅ PDF shows ALL activities (removed 50 item limit)
- ✅ **Mobile Responsiveness Overhaul**:
  - Tabs → Select dropdown on mobile
  - Responsive grid layouts
  - Touch-friendly inputs (44px+ targets)
  - Australian date format site-wide (DD/MM/YYYY)

### Session 1 (Jan 10, 2026)
- ✅ AllPracticeWidget enhancement verified working
- ✅ Activity type bug investigated - NOT REPRODUCIBLE
- ✅ CORS configuration fixed
- ✅ Backend API tests created

## API Endpoints

### Admin User Management
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create new user with feature toggles
- `PATCH /api/admin/users/{user_id}` - Update user settings (feature toggles, name)
- `DELETE /api/admin/users/{user_id}` - Delete user and all data

### User Model
```python
class User:
    id: str
    email: str  # username
    name: str
    role: str  # "psychologist"
    competency_journal_enabled: bool = True
    practice_logbook_enabled: bool = True
    created_at: str
```

### Session 4 (Jan 11, 2026)
- ✅ **Data Migration Complete**: Saved live production data to seed file
  - File: `/app/backend/seed_data/live_data_export.json`
  - Contains: 3 users, 3 logbook years, 78 entries, 5 CPD years, 4 CPD activities, 3 peer consultations
- ✅ **Seeding Script Updated**: Now auto-detects `live_data_export.json` or `export.json`
- ✅ **Azure Deployment Guide**: Created comprehensive guide at `/app/AZURE_DEPLOYMENT_GUIDE.md`
  - Covers: Azure Cosmos DB, App Service, GitHub Actions CI/CD
  - Includes cost estimates, troubleshooting, and checklist

## Data Migration System
- **Export Endpoint**: `GET /api/admin/export-data` - Export all collections as JSON
- **Seed Script**: `/app/backend/seed_database.py` - Import JSON data to MongoDB
- **Seed Data**: `/app/backend/seed_data/live_data_export.json` - Your production data backup

## Future/Backlog
- Data visualization/charts for progress tracking (recharts installed)
- Additional mobile responsiveness improvements for forms
- Refactor: Rename /messages/Messages.jsx to /journal/PersonalJournal.jsx
- GitHub Actions workflow file generation for Azure deployment

## Test Reports
- `/app/test_reports/iteration_1.json`
- `/app/test_reports/iteration_2.json`
- `/app/test_reports/iteration_3.json` - Latest (33 tests passed)
