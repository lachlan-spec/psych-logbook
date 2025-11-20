# Supervisor Logbook Comment Flow Testing Plan

## Test Scenario
1. Login as supervisor (demo-supervisor@psychology.com)
2. View connected psychologist's logbook entries
3. Add feedback/comment to a logbook entry
4. Login as psychologist (demo-psychologist@psychology.com)
5. Verify supervisor comment appears in their logbook

## Expected Results
- Supervisor can see all logbook entries from connected psychologists
- Supervisor can add/edit comments on entries
- Psychologist can see supervisor comments in green feedback boxes
- Comments show date added

## API Endpoints
- GET /api/supervisor/logbook-entries - Get all connected psychologists' entries
- PATCH /api/supervisor/logbook-entries/{entry_id}/comment - Add/update comment
