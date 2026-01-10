# Psychology Portal - Product Requirements Document

## Overview
Single-user psychology portal for tracking professional development, practice hours, CPD activities, and competency development.

## Core Features

### 1. Dashboard
- Welcome message and portal navigation tiles
- **All Practice Summary Widget** (NEW): Integrated progress snapshot showing:
  - Registrar period dropdown selector (year selection)
  - Progress percentages against targets (Total, Practice, CPD, Peer)
  - Weekly/Monthly/All view modes
  - Aggregated data from Practice Logbook + CPD Activities + Peer Consultations

### 2. Practice Logbook
- Track supervised practice hours
- Activity types: Direct Client Contact, Supervision (Individual/Group), Other
- Weekly signatures
- PDF export
- Year-based organization with targets

### 3. CPD Hub
- Log CPD activities with hours
- Peer consultations tracking
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

### Session 1 (Jan 10, 2026)
- ✅ AllPracticeWidget enhancement verified working
  - Registrar Period dropdown functional
  - Progress percentages display correctly
  - Year change updates data
- ✅ Activity type bug investigated - NOT REPRODUCIBLE
  - Backend correctly saves 'Other' type
  - Frontend form correctly handles all activity types
- ✅ CORS configuration fixed for credentials mode
- ✅ Backend API tests created (/app/tests/test_logbook_api.py)

## Upcoming Tasks
1. Minor UI polish: Fix text "jumping" on Learning Plans page (mobile)
2. Refactor: Rename /messages/Messages.jsx to /journal/PersonalJournal.jsx

## Future/Backlog
- Additional mobile responsiveness improvements
- PDF export enhancements
- Data visualization/charts for progress tracking
