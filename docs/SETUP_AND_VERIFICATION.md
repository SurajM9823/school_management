# Setup, checks and acceptance testing

## Audit execution record

This handover inspected source at `efae2353` on 23 October 2026. Only documentation and the inventory script were added to tracked project content. Frontend dependencies were installed locally for checks; generated `node_modules` and `dist` are ignored by the frontend's existing ignore rules. No database was restored/migrated, remote API called, email sent or application deployed.

| Check | Result |
|---|---|
| Git working tree before documentation | Clean |
| Frontend `npm ci --ignore-scripts --no-audit --no-fund` | Passed; 425 packages installed; package manager warned that react-beautiful-dnd is deprecated |
| `npm run build` | Passed; 3,001 modules transformed; Vite warned about a large bundle (main JS approximately 2.35 MB before gzip) |
| `tsc --noEmit -p tsconfig.app.json` | Failed: 366 diagnostics; see [TypeScript diagnostics](verification/typescript.txt) |
| `npm run lint` | Failed: 438 problems, comprising 412 errors and 26 warnings; see [ESLint diagnostics](verification/eslint.txt) |
| Static inventory generation | Passed; inventories generated without application startup |
| Backend Python syntax | 70 source/migration files parsed successfully; two existing invalid-escape syntax warnings in URL regex strings; this does not verify imports or Django behavior |
| Django runtime/system checks | Not run: selected Python interpreter has no Django; requirements also omit imported ReportLab |
| Database schema/migration consistency | Not verified; requires isolated MySQL environment |
| API/business/UI end-to-end tests | Not run; no authenticated local backend/fixtures were configured |

Vite successfully bundling code does not mean TypeScript or business flows pass. Concrete diagnostics include out-of-scope `parsedUser` in auth, missing `feePackages` in monthly billing, missing `logger` in locale settings, and a `variante`/`variant` prop typo in Teacher MyClasses. Unused code and broader type mismatches also need triage. Do not fix the baseline by disabling all checks.

Audit tool versions: Node `v24.21.0`, npm `11.19.0`, Python `3.12.10`. These describe the machine used for the checks, not a reviewed production support policy.

## Prerequisites

- Git, Node/npm, Python, and an isolated MySQL database instance.
- Backend pins indicate a Django 5.2 project; the committed environment path suggests Python 3.12. Establish exact supported developer/CI versions during T01 rather than copying `backend/env`.
- Requirements contain mysqlclient, mariadb and psycopg2-binary, although MySQL is configured. Native database drivers may need platform build prerequisites; document what the chosen Windows/Linux environment actually requires. Do not silently switch the application database engine.
- Use synthetic accounts/documents. The root SQL dump may contain real records and has not been audited or restored as part of this handover.

## Frontend setup

From the repository root, in PowerShell:

```powershell
Set-Location school
npm.cmd ci
npm.cmd run dev
```

**Before using login or forms locally:** change API configuration to your isolated local backend. `src/api.ts` currently has a hardcoded remote HTTP base URL. The project does not currently read a `VITE_API_BASE_URL` environment variable; merely creating `.env` will not change it. Some layout and school-info image URL code already reads `VITE_BACKEND_URL`, but that does not configure the Axios client. T02 should introduce consistent environment-driven API/media configuration.

For a temporary local-only setup, point the Axios base URL at `http://127.0.0.1:8000/api/`. The checked-in Django CORS origins include `http://localhost:5173`, so use that browser origin unless you deliberately configure another one. Vite may choose a different port if 5173 is occupied; keep CORS consistent.

The audit install used `--ignore-scripts`; the production bundle still built successfully in this environment. Record any additional platform installation steps needed on developer machines.

## Backend setup

From a new PowerShell terminal at repository root:

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Before expecting startup to work:

1. Add a reviewed/pinned ReportLab dependency: `core/view/admin/transportview.py` imports it and the URL module imports that view. Other dependency issues may appear once Django runs; record them in T01 rather than relying on the bundled environment.
2. Configure Django to use a dedicated development database and user. Current settings hardcode MySQL values. Environment-variable loading is **not implemented**, even though `django-environ` is in requirements. T02 should implement and document it.
3. Use an empty local database named according to your local settings, with suitable MySQL permissions and charset. Keep this separate from any production database or dump restoration.
4. Run the checks below and resolve failures before loading fixtures. Review the migration plan before applying it. Do not use `--fake` to bypass unexplained discrepancies.

```powershell
python manage.py check
python manage.py showmigrations
python manage.py makemigrations --check --dry-run
python manage.py migrate --plan
# Apply only to the intended isolated development database:
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

Use role `admin` for the superuser. UserManager sets superuser/staff flags. Normal users need a school and an active non-expired subscription to log in. There is no documented shared demo password; create test accounts explicitly. Django admin is at `/admin/`; application APIs are under `/api/`.

For a legacy-data restoration, first inspect schema and migration history in a disposable database. Compare to current models/migrations, then record a repeatable reconciliation procedure. Do not import the dump into a populated environment as an onboarding shortcut. Media files need separate handling from the SQL database.

## Minimum local dataset

Create two schools with active subscriptions; an admin, teacher, accountant, student and parent for each; one superadmin; active session and terms; two classes/sections and subjects; teacher assignments; two unrelated parent-child families; admission/fee records. Add one inactive/expired subscription for negative login testing. Use obvious synthetic names and addresses.

Create data via reviewed fixtures or the intended UI/API. Do not use raw SQL that skips application validation as evidence that an admission or billing flow works. Fixture generation itself is T01 work, not included in this documentation-only change.

## Verification commands

```powershell
# Frontend directory
npm.cmd run build
.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.app.json
npm.cmd run lint

# Backend directory, active isolated environment
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
# Against deployment settings, once those exist:
python manage.py check --deploy
```

The current backend test file is only a scaffold, so a future command reporting zero tests is not acceptance evidence. No frontend test runner is currently configured. Add meaningful auth/permission/integration tests as the corresponding work is implemented.

## Acceptance test matrix

| Test | Actor / steps | Expected evidence |
|---|---|---|
| AUTH-01 | Each role logs in, reloads and logs out | Correct role route; no stale authenticated UI after logout |
| AUTH-02 | Expired access token, valid refresh; then invalid refresh; concurrent requests | Bounded refresh; no loop; deterministic logout on invalid refresh |
| AUTH-03 | Normal account with expired/inactive subscription; superadmin account | Subscription rule matches documented policy and errors are usable |
| SEC-01 | School A user requests School B IDs across all CRUD/report endpoints | No data disclosure/mutation; consistent 403/404 semantics |
| SEC-02 | Student/parent calls admin/teacher writes; unrelated teacher edits marks | Server rejects independently of frontend route guards |
| ADM-01 | Configure school/session/class, admit student, link parent, upload document, reload | One consistent set of records; authorized download works |
| ADM-02 | Duplicate email/invalid related ID/failed document operation | Validation and transaction behavior match policy; no orphaned half-admission |
| STF-01 | Create teacher through staff and teacher entrypoints; assign class/subject | Consistent Staff/Teacher/User relation and usable credentials/reset |
| ATT-01 | Teacher saves and resaves attendance, reloads; tries foreign student | Correct persisted records, no duplicates, foreign write rejected |
| HW-01 | Teacher creates → student reads/submits → teacher grades → student reads feedback | Same assignment identity and authorized file/feedback access |
| HW-02 | Same homework title in different classes, repeated submission, zero mark | Independent records; agreed resubmission and zero-mark display |
| EXM-01 | Create exam, enter valid/invalid marks, change status, render/export marksheet | Bounds/status rules enforced; grade/total calculations reconcile |
| COM-01 | Create notice/event, assign audience/participants, reload in another role | Persistence and audience visibility correct |
| PAR-01 | Parent switches among linked children and attempts unrelated child ID | Correct scoped data; unrelated child denied |
| FIN-01 | Generate the same month's bill twice; partial/full payment; adjustment/reversal | No duplicate invoice; exact decimal totals; auditable reconciliation |
| FILE-01 | Upload allowed/disallowed/oversize file; unauthorized download | Validated storage and private access; predictable errors |
| REL-01 | Restore isolated database/media backup and deploy clean build | Documented restore succeeds; critical role workflows pass afterward |

For each result record test ID, commit, environment, synthetic fixture IDs, actual result, evidence and reviewer. All scenarios above remain pending until executed.

## Release/runbook work still required

Establish deployment configuration and process supervision, approved hostnames/TLS, SPA history fallback, database migration/recovery procedure, static collection, protected media serving, backup retention/restore, health monitoring and rollback. Django `runserver` and Vite's dev server are local development tools, not the production deployment plan. Provider tests should use deliberately configured test destinations.
