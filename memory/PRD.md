# Psychology Portal - Product Requirements Document

## Overview
Single-user psychology portal for tracking professional development, practice hours, CPD activities, and competency development.

## Core Features

### 1. Dashboard
- Welcome message and portal navigation tiles
- **All Practice Summary Widget**: Integrated progress snapshot showing:
  - **Period Progress**: Percentage of registrar period elapsed (time-based)
  - Registrar period dropdown selector (year selection)
  - Progress percentages against targets (Total, Practice, Supervision, CPD, Peer)
  - **Supervision column** with Primary/Secondary % breakdown
  - Weekly/Monthly/All view modes
  - All hours formatted to 1 decimal place

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

## User Access
- Single psychologist user
- Credentials: admin/admin
- Role: psychologist

## Technical Stack
- Frontend: React + Shadcn UI
- Backend: FastAPI
- Database: MongoDB

## Completed Work (January 2026)

### Session 2 (Jan 10, 2026)
- ✅ Added Period Progress indicator (time elapsed %)
- ✅ Added Supervision column in AllPracticeWidget
- ✅ All hours site-wide formatted to 1 decimal place
- ✅ Added Primary Supervisor and Secondary Supervisors fields in Logbook Settings
- ✅ Split individual supervision entries by Primary/Secondary supervisor
- ✅ Added supervision % breakdown (Primary vs Secondary) tracking
- ✅ Removed CPD from Logbook Summary "Hours by Category"
- ✅ Fixed backend to save supervisor fields on year creation

### Session 1 (Jan 10, 2026)
- ✅ AllPracticeWidget enhancement verified working
- ✅ Activity type bug investigated - NOT REPRODUCIBLE
- ✅ CORS configuration fixed
- ✅ Backend API tests created

## Upcoming Tasks
- Minor UI polish: Fix text "jumping" on Learning Plans page (mobile)
- Refactor: Rename /messages/Messages.jsx to /journal/PersonalJournal.jsx

## Future/Backlog
- Additional mobile responsiveness improvements
- Data visualization/charts for progress tracking
