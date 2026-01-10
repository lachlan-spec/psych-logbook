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
- Each user has completely separate data
- Admin sets username and password for new users
- Admin can delete users (deletes all their data)
- Available at /admin/users

### 7. PDF Reports
- Download practice summary as PDF from dashboard
- Select custom date range for report
- Report includes ALL activity entries (no limit)
- Australian date format throughout (DD/MM/YYYY)

## User Access
- **Admin**: admin/admin (has access to User Management)
- **Other users**: Created by admin with custom username/password
- Each user has isolated data (logbooks, CPD, journals, etc.)

## Technical Stack
- Frontend: React + Shadcn UI + jsPDF
- Backend: FastAPI
- Database: MongoDB

## Mobile Responsiveness
- **Responsive tabs**: Desktop shows tabs, mobile shows dropdown select
- **Touch targets**: Minimum 44px for interactive elements
- **Grid layouts**: Responsive columns (3-col mobile, 5-col desktop for totals)
- **Date format**: Australian DD/MM/YYYY throughout site and PDFs
- **Dialogs**: Full-width on mobile (95vw max)

## Completed Work (January 2026)

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

## Upcoming Tasks
- Minor UI polish: Fix text "jumping" on Learning Plans page (mobile)
- Refactor: Rename /messages/Messages.jsx to /journal/PersonalJournal.jsx

## Future/Backlog
- Bottom navigation bar for mobile
- Additional mobile responsiveness improvements for forms
- Data visualization/charts for progress tracking
