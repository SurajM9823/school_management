# Frontend, backend and integration status

Read the [status definitions](README.md#status-language) first. Paths in the UI column are relative to `school/src/pages/`; backend URLs are relative to `/api/`. Each row states source evidence, not a production certification. The [page inventory](inventory/frontend-pages.csv) lists every page/helper file; the [route inventory](inventory/frontend-routes.csv) records active route/component mappings.

## Shared and superadmin

| Feature / UI source | Backend evidence | Status | Remaining work |
|---|---|---|---|
| Login (`auth/Login.tsx`, `contexts/AuthContext.tsx`) | `token/`, `token/refresh/`, `school/settings/current-user/`; `core/views.py` | Wired with defects | Repair refresh handling and out-of-scope variable; remove token logs; test expiry, logout and disabled subscription |
| Role navigation (`App.tsx`, `ProtectedRoute.tsx`, sidebar) | Custom User roles; endpoint-specific permissions | Partial | Server permissions must match business roles; clean duplicate/disabled links; test direct URLs |
| Profile (`common/Profile.tsx`) | Current-user GET; admin password-reset endpoint exists | UI/local | Profile and self-service password saves simulate success; implement dedicated validated endpoints |
| Support chat (`components/common/LiveChatWidget.tsx`) | No support/chat endpoint found | UI/local | Decide whether to remove/defer or implement a real support service |
| School list/dashboard (`superadmin/SuperadminDashboard.tsx`) | `superadmin/schools/` | Wired | Verify aggregates, empty schools, errors and access control |
| Create school/admin (`superadmin/AddSchool.tsx`) | `superadmin/schools/create/`, `superadmin/admins/` | Wired | Verify school/admin/subscription creation and rollback behavior |
| Subscription management (`superadmin/SubscriptionManagement.tsx`) | GET/PATCH/POST `superadmin/subscriptions/<uuid>/` | Wired | Verify renewal/status/reset behavior; validate dates and permissions |
| Activity tracker (`superadmin/ActivityTracker.tsx`) | Calls `superadmin/activities/`; route not registered | Partial / missing endpoint | Define audit model and event policy; implement endpoint or remove feature |
| Superadmin settings | `/superadmin/settings` reuses admin `Settings` shell | Partial | Define platform settings separately; nested school-settings routes are under `/admin/settings` |

## School administration

| Feature / UI source | Backend evidence | Status | Remaining work |
|---|---|---|---|
| Dashboard (`dashboard/AdminDashboard.tsx`) | `admin/dashboard/stats/`, `admin/dashboard/activities/`; `view/admin/dashboard_view.py` | Wired | Validate calculations with seeded records; agree reporting periods; activities are computed data, not proof of a durable audit log |
| School identity/logo (`settings/SchoolInfo.tsx`) | `school/settings/` | Wired | Validate upload/clear behavior, required fields and unauthorized writes |
| Locale (`settings/TimezoneLocale.tsx`) | `school/settings/locale/` | Wired | Confirm timezone/date/currency settings affect actual displays and calculations |
| Sessions, terms, holidays (`settings/SessionConfig.tsx`) | Sessions and nested terms/holidays endpoints | Wired | Test overlaps, active-session rules and boundary dates |
| Defaults (`settings/DefaultValues.tsx`) | Grading, attendance, fee settings/type endpoints | Wired | Verify each setting is applied in the consuming workflows |
| Academic setup (`settings/AcademicSettings.tsx`) | Classes, sections, subjects, grading scales, promotion rules, capacity | Wired | Validate school-scoped relations; test duplicates and promotion constraints |
| Campus/building/room/resources (`settings/CampusSettings.tsx`) | Campus, building, room and resource endpoints | Wired | Test hierarchy ownership and deletion of referenced records |
| Staff configuration (`settings/StaffManagementSettings.tsx`) | Leave types, staff roles, departments | Wired | Confirm definitions are used correctly in staff and leave operations |
| Notification settings/templates (`settings/Notifications.tsx`) | Notification settings/templates and `test-smtp/` | Wired configuration | SMTP test implementation exists; automatic notifications/SMS delivery not established; use test mailbox for verification |
| Role permissions (`settings/RolesPermissions.tsx`) | `school/settings/roles/` | Disabled UI | Route commented out; verify whether saved permissions are enforced before re-enabling |
| Admission-fee setup (`settings/AdmissionFees.tsx`) | `admission-fees/`, class/section lookups | Wired | Test applicability, amount changes and existing student fee treatment |
| Admissions (`admin/Admissions.tsx`) | `admissions/`, student/parent routes, document actions, credentials, promotion, certificates | Wired | Demonstrate complete admission; validate atomicity, duplicate emails, relationships, uploads, fees and promotion |
| Student drilldown (`admin/StudentDetail.tsx`) | Student detail/documents | Wired | Verify access, file downloads, empty and missing records |
| Staff administration (`admin/StaffManagement.tsx`, `StaffDetailDrill.tsx`) | Staff CRUD, documents, image, credentials/reset, leave endpoints | Wired | Validate leave and employment rules; replace plaintext credential recovery |
| Teachers (`admin/Teachers.tsx`, `TeacherDetail.tsx`, `TeacherEditSimple.tsx`) | Teacher router actions; Staff/Teacher records | Wired | Verify creation through both staff and teacher screens, edits, assignments, uploads and credentials |
| Alternative teacher editor (`admin/TeacherEdit.tsx`) | Teacher calls present | Not directly routed | Current route uses `TeacherEditSimple`; consolidate intentionally after comparison |
| Classes/class teachers (`admin/Classes.tsx`) | Class/section/subject settings and `school/class-teachers/` | Wired with route ambiguity | Two same-shaped numeric detail routes collide; clarify class ID vs assignment ID |
| Timetable (`admin/ClassSchedule.tsx` and helpers) | Scheduling backend view/serializer files are empty; no corresponding URL group | Disabled / incomplete | Decide restore vs defer; design scheduling constraints and endpoints before enabling |
| Exams (`admin/Exams.tsx`) | `school/exams/`, exam serializers/models | Wired with mismatch | UI PATCH status has no PATCH handler; validate session/class/subject setup and lifecycle |
| Marks/marksheet (`admin/exam/ManageScores.tsx`, `ViewMarksheet.tsx`) | `school/scores/`, exam/teacher-grade APIs | Partial | Some score reads send only exam ID, while backend also requires subject and section; reconcile reporting contract and grade math |
| Scholarships (`admin/Scholarships.tsx`) | `scholarships/`, `assignments/`, auto-assign/revoke actions | Wired | Test eligibility, revocation and duplicates; decide how awards affect real invoices |
| Transport (`admin/TransportManagement.tsx`) | Routes/buses/bus-fees/bus-assignments and reports | Wired, access gaps | Add tenant/role/object restrictions; validate capacity, fees and reports; declare missing PDF dependency |
| Events (`admin/Events.tsx`) | Event/event-assignment viewsets exist | Partial | Lookups use APIs; event CRUD and participation use local state. Replace simulations with persisted operations |
| Notices (`admin/Notices.tsx`) | Notice viewset exists | Partial | Lookups use APIs; notices use mock/local state. Connect CRUD and role/class audience filtering |
| User management (`admin/UserManagement.tsx`) | Admin password change exists; no general user-management list/CRUD route found | UI/local | Implement authorized listing/status/edit operations; replace mocked actions |

## Teacher

| UI source | Backend evidence | Status | Remaining work |
|---|---|---|---|
| `dashboard/TeacherDashboard.tsx` | No dashboard API call | UI/static | Calculate actual assigned classes, attendance and homework statistics |
| `teacher/MyClasses.tsx` | `teacher/myclasses/`, class students | Partial | Classes read wired; `/teacher/remarks/` missing. Remove stale `token` header code (shared interceptor uses `accessToken`) |
| `teacher/Attendance.tsx` | Class/student lists; attendance save/list | Wired, authorization gaps | Restrict teacher assignments and same-school students; validate dates/status; test save/read/re-save |
| `teacher/Assignments.tsx` | Teacher-assignment router, bulk update, title-based submissions | Wired, data-model risks | Validate uploads/ownership; replace title-based matching with durable assignment identity; test duplicate titles |
| `teacher/ExamMarks.tsx` | Exam-mark reads; writes to `school/scores/` | Wired | Verify allowed subjects/classes/exams, limits and reopen rules; separate submit endpoint exists but is not the UI write path |
| `teacher/Grades.tsx` | Teacher grade class/student/detail APIs | Wired | Verify formulas, access and missing results |
| `teacher/ReadingMaterials.tsx` | No material API found | UI/local | Storage, CRUD, class audience, authorized download and upload validation |
| `teacher/Announcements.tsx` | No announcement-specific endpoint used; notices may be reusable | UI/local | Agree notice/announcement relationship; implement audience and persistence |
| `teacher/LeaveApply.tsx` | Admin staff-leave endpoint exists | Placeholder | Build self-service submission, review/status and balance effects |
| `teacher/Schedule.tsx` | No active scheduling backend | Placeholder / disabled | Restore only after scheduling design and release decision |

## Student and parent

| Feature | Student status | Parent status | Backend/remainder |
|---|---|---|---|
| Dashboard | Static/sample metrics | Static/sample metrics | Build aggregates scoped to current student or linked children |
| Children | Not applicable | `parent/Children.tsx`: sample list | Existing Parent/StudentParent models; add authenticated linked-child reads |
| Classes | `student/MyClasses.tsx`: sample data | `parent/ChildClasses.tsx`: sample data | Reuse academic models with student/parent-scoped read endpoints |
| Assignments | `student/Assignments.tsx`: list + multipart submission wired | `parent/Assignments.tsx`: sample data | Test teacher→student→teacher grading flow; add parent read-only projection |
| Attendance | `student/Attendance.tsx`: sample/local | `parent/Attendance.tsx`: sample/local | Attendance storage exists; add safe self/linked-child reads and summaries |
| Results | `student/Results.tsx`: sample/local | `parent/Results.tsx`: sample/local | Score/exam data exists; define published-results rule and consumer APIs |
| Timetable | `student/Timetable.tsx`: sample/local | `parent/Timetable.tsx`: sample/local | Requires restored scheduling system |
| Fees | `student/Fees.tsx`: sample/local | `parent/Fees.tsx`: sample/local | Admission fee data is not a complete invoice/payment ledger; build accounting first |
| Leave requests | Local request lists/forms | Local child request lists/forms | No student-leave workflow found; implement submission, approval, evidence and audit |
| Notices | Sample/local | Sample/local | Notice backend exists; implement read access by audience and school |
| Complaints | Local forms/lists | Local forms/lists | No complaint workflow backend found; define triage, visibility, status and ownership |

All ten parent page files contain no direct API calls. Student assignments is the only student page with direct API wiring. This is based on reading the source and scanning API call sites, not a UI acceptance test.

## Accountant

Every page below currently uses static/local UI behavior; no direct API call was found in `pages/accountant/` or its dashboard. Existing fee settings, StudentFee, scholarship, transport-fee and staff salary data can be inputs; they do not implement a complete accounting system.

| Page(s), relative to `accountant/` | Remaining backend/integration work |
|---|---|
| `Fees.tsx` | Authoritative fee collection, receipt, allocation and reversals |
| `FeeStructures.tsx`, `fee-management/FeeStructureSetup.tsx` | Persist structures/components, applicability and effective dates; resolve overlapping screens |
| `fee-management/FeePackagePlans.tsx` | Persist packages and versioning; compute totals on server |
| `fee-management/AssignFeesToStudents.tsx` | School-scoped assignments, eligibility, start/end dates and duplicate prevention |
| `billing/GenerateMonthlyBills.tsx` | Invoice model, numbering, period rules, idempotent generation, discounts/fines and balances |
| `billing/StudentBillingLedger.tsx` | Invoice/payment allocations, opening balances, partial payments and audited adjustments |
| `billing/DueFeeReport.tsx` | Server-generated outstanding balances, aging and export reconciliation |
| `Payroll.tsx` | Salary components, payroll periods/runs, deductions, payslips and approval |
| `Expenses.tsx` | Expense storage, category/approval policy, attachments and ledger effects |
| `Scholarships.tsx` | Reuse authorized scholarship service; avoid creating a disconnected second award system |
| `Reports.tsx` | Reporting queries/exports from actual financial records |
| `Settings.tsx` | Persist financial settings; define provider/receipt/tax rules; gateway form is not a payment integration |
| `../dashboard/AccountantDashboard.tsx` | Real balances and period metrics; reconcile totals to ledger |

## External integrations

| Integration | Evidence | Interpretation |
|---|---|---|
| JWT | SimpleJWT + shared Axios client | Implemented, with refresh defects to repair |
| MySQL | Django database engine configuration and SQL dump | Configured; local connection/schema parity not verified |
| Files/media | Django file fields, upload actions, media URL config | Implemented pieces; validate private access, size/type limits and storage lifecycle |
| Email | SMTP configuration and test-email view | Test-send code exists; no provider delivery was exercised |
| SMS | Provider/key/sender settings | Configuration fields do not prove actual delivery integration |
| Payment gateway | Accountant settings mock save | No real gateway/verified webhook implementation found |
| PDF/export | Browser PDF dependencies and ReportLab imports | Export code exists; backend ReportLab absent from requirements |
| Live support | Simulated reply timer | Demonstration UI, not a live support integration |
