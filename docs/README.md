# Project handover and delivery guide

**Audit date:** 23 October 2026 (Asia/Kathmandu). **Source baseline:** `efae2353`. Documentation describes this checkout, not a verified deployment.

## What you can tell the two developers

The project has six user experiences: superadmin, school admin, teacher, student, parent, and accountant. The database has five role values; superadmin is an admin with `is_superuser=True`. No seventh login role was found. Staff roles are employment categories, not additional dashboard roles.

The UI is broad, but implementation is uneven. Admissions, school settings, staff/teacher administration, classes, exams, scholarships, transport, and parts of teacher/student assignments have API wiring. Most parent pages, most student pages, the accountant area, and several dashboards use local/sample data. Events and notices have backend implementations, but their admin screens currently simulate the main operations.

Do not give the team a percentage-complete target based on page count. Use the feature matrix and require an end-to-end demonstration before marking work done. Authentication, school isolation, reproducible setup, and password handling need attention before a production release.

## Reading order

| Document | Who uses it | Purpose |
|---|---|---|
| [Feature status](FEATURE_STATUS.md) | Lead and both developers | What exists in UI/backend, what is connected, what is left |
| [Architecture and data](ARCHITECTURE.md) | Both developers | Code map, roles, models, API conventions and workflow dependencies |
| [Setup and verification](SETUP_AND_VERIFICATION.md) | Both developers | Local setup, known blockers, checks, test scenarios |
| [Findings and risks](FINDINGS.md) | Lead and backend developer | Specific defects and source evidence, prioritized |
| [Delivery plan](DELIVERY_PLAN.md) | Lead | Ownership, ordered backlog, acceptance criteria and review routine |
| [Task spreadsheet](TASK_BACKLOG.csv) | Lead | 25 starter tasks with owners, dependencies, status and acceptance criteria; import into your tracking tool |
| [API documentation plan](API_DOCUMENTATION.md) | Backend developer | Swagger/OpenAPI setup and what must be documented manually |
| [Source inventories](inventory/README.md) | Both developers | Spreadsheet-friendly routes, pages, API calls, models and backend actions |

## Status language

- **Wired:** frontend calls and corresponding backend code exist. Not an end-to-end pass.
- **Partial:** only some operations use the backend, or a known contract gap remains.
- **UI/local:** screens exist, but primary behavior uses local/sample data or simulated success.
- **Placeholder/disabled:** minimal content, removed route, or inactive implementation.
- **Backend present:** code exists but the intended frontend does not consume it.
- **Verified:** reserve this for a recorded runtime test with a commit, environment, result and reviewer. No business workflow was certified in this audit.

The inventories contain 86 source files under `pages` (including helper files), 83 active route declarations (including duplicates), 341 literal API-call occurrences across frontend source, 100 explicit backend URL declarations (including the router include), 32 router/action entries, and 63 model class declarations (including five unmanaged legacy scheduling placeholders). These are discovery counts, not unique working features or deployed tables.

## First decisions for the project lead

Record answers in the delivery plan as the team confirms them; they do not block reading or assigning the initial repair work.

1. Which workflows are required for the first release? Suggested first slice: school setup → admission → teacher assignment → attendance → homework submission → marks/results.
2. Is accounting part of that release? Full billing, payments and payroll are a substantial backend workstream, not a final UI integration task.
3. Should scheduling be restored? Both admin and teacher schedule routes are commented out and backend scheduling files explicitly say functionality was removed.
4. What are the approved fee, scholarship, refund, promotion, grading and attendance rules?
5. Who owns the deployment, database backup, media files, domain and email/SMS provider accounts? Transfer access separately; do not put credentials in these documents.

## How to keep this useful

Every feature PR updates the relevant matrix row, API contract, and task status. Attach a short demo plus test evidence. Regenerate the inventories with `python docs/tools/generate_inventory.py` when routes/models/calls change. Keep human review notes separate from generated files.

This handover adds documentation and a local inventory tool. It does not fix application defects or enable Swagger endpoints. See the verification document for exactly what was and was not executed.
