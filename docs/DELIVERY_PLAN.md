# Delivery plan for two developers

Use this as the lead's work queue. Owners below are proposed responsibilities, not an assumption about the developers' skills. **Developer A** owns backend/data/API/security; **Developer B** owns frontend/integration/UX. Both review contracts and end-to-end behavior. The lead decides release scope and accepts business rules.

All tasks start **Open**. Effort is relative (S/M/L), not a delivery promise; estimate days after the team has a working local environment. Split L tasks into smaller reviewed tickets. Security and setup tasks precede feature expansion.

The [task spreadsheet](TASK_BACKLOG.csv) is an importable snapshot of this initial backlog. After import, choose one task board as the source of current status; this CSV will not synchronize automatically.

## Ordered backlog

| ID | Priority | Task | Owner | Depends on | Size | Acceptance criteria |
|---|---|---|---|---|---|---|
| T01 | P0 | Reproducible local baseline and sanitized seed data | A + B | — | M | Fresh frontend/backend installs; Django check, migrations and local login documented; two schools and all roles seeded without real personal data |
| T02 | P0 | Environment config and secret/log cleanup (F05) | A + B | T01 | M | Local frontend calls local API; production config externalized; no tokens/passwords in logs; exposed secrets rotated by owner |
| T03 | P0 | Remove plaintext credential lifecycle (F01) | A; B updates credential UI | T01 | L | No plaintext writes/reads; safe migration, reset/invitation UX and recovery tests; existing-password handling agreed |
| T04 | P0 | Transport/attendance/homework role and school isolation (F02–F04, F13) | A | T01 | L | Wrong-role/cross-school access denied for list, detail, mutation and export; related-field validation covered by tests |
| T05 | P1 | Repair auth initialization and refresh (F06–F07, F19) | B; A reviews token contract | T01 | M | Login/reload/logout/expiry/invalid refresh/network error work; one bounded refresh flow; concurrent 401 tests pass |
| T06 | P1 | Establish build, typecheck, lint and critical test gates (F16, F20) | B frontend; A backend | T01 | M | Baseline failures visible; blocking errors resolved; repeatable commands/CI recorded; tests cover real permissions and persistence |
| T07 | P1 | Fix API path/method/query mismatches (F09–F12) | A + B | T01, T05 | M | Class-teacher IDs unambiguous; exam status save and marksheet load work; missing activities/remarks either implemented or explicitly deferred |
| T08 | P1 | Add OpenAPI + Swagger/ReDoc documentation | A | T01, T04, T07 | M | Schema validates; manual APIViews annotated; representative requests/responses/errors correct; docs access restricted appropriately |
| T09 | P1 | School setup and admission acceptance slice | B integration; A repairs | T02–T07 | L | New school/session/classes → admission → parents/documents/fees → reload; rollback and duplicate-email cases verified |
| T10 | P1 | Staff/teacher/class assignment acceptance slice | B integration; A repairs | T09 | M | Teacher created from both entrypoints; one consistent Staff/Teacher identity; class/subject assignments and detail/edit verified |
| T11 | P1 | Attendance end-to-end | B integration; A rules | T04, T10 | M | Teacher saves/edits own authorized class; summaries agree; no foreign IDs accepted; persisted after reload |
| T12 | P1 | Homework identity and full submission/grade flow | A model/API; B integration | T04, T10 | L | Durable assignment linkage; two equal titles stay separate; upload, submit, grade, feedback and resubmission policy tested |
| T13 | P1 | Exams, marks and published results | A + B | T07, T10 | L | Valid marks saved; bounds enforced; formulas approved; marksheet matches source scores; student visibility follows publication rule |
| T14 | P1 | Persist notices/events and audience filtering | B integration; A access/contracts | T04, T08, T09 | M | Create/edit/delete/participation survive reload; audience and school rules verified; sample rows removed |
| T15 | P1 | Student/parent read APIs and screen integration | A APIs; B screens | T09, T11–T14 | L | Real linked children/classes/attendance/homework/results/notices; parent cannot read another family; empty/error/loading states handled |
| T16 | P1 if finance in release | Agree finance rules and design persistent ledger | A with lead; B UI contract | T09 | L | Approved model for structures/packages/invoices/payments/allocations/refunds/discounts; decimal precision, period policy and audit rules documented |
| T17 | P1 if finance in release | Implement fee setup, assignments and billing | A + B | T16 | L | Server totals; idempotent billing per student/period; scoped ledger; no duplicate invoices; approved adjustments |
| T18 | P1 if finance in release | Collections, balances, receipts and fee portals | A + B | T17 | L | Partial/full payment reconciles; reversal audit; student/parent only own balances; any provider webhook verified and idempotent |
| T19 | P2 | Payroll, expenses, financial reports | A + B | T16–T18 | L | Persisted workflows; approvals; report totals reconcile; no simulated save/payment states |
| T20 | P2 | Real dashboards and reporting | B; A aggregate APIs | Relevant completed workflows | M | Every displayed metric has a defined query/period; totals reconcile and respect scope |
| T21 | P2 | Profile and admin user management | A APIs; B screens | T03–T05 | M | Real profile/password/user-status changes with validation; no timer-only success; reset authorization tested |
| T22 | P2 | Leave requests and complaints | A + B; lead defines process | T09, T15 | L | Persisted submission/review/status workflow; linked-child controls; approval audit and notification policy |
| T23 | P2 | Materials and announcements | A + B | T10, T14 | M | Scoped upload/download; CRUD; announcement audience; reuse notice service if approved |
| T24 | Scope decision | Restore scheduling | A + B | Lead approves; T10 | L | Persistent timetable and conflict rules; admin/teacher/student/parent views agree; disabled links restored only after acceptance |
| T25 | P1 release gate | Deployment, backup, restore and release rehearsal | A + B; lead accepts | All in-scope work | L | Clean build/checks; production config; TLS; static/media setup; backup restore demonstration; smoke tests; rollback instructions |

## Suggested delivery sequence

**Stage 1 — make the project trustworthy:** T01–T08. Developer A handles setup/data/security and contracts; Developer B establishes the frontend baseline and fixes auth/navigation. Pair on integration contracts, not on every file. Exit: both developers can reproduce the app and the critical access failures are covered by tests.

**Stage 2 — finish one school workflow:** T09–T15. Demonstrate a newly created school's student progressing through admission, teaching, attendance, homework and results, then show the same real information in parent/student screens. Exit: persistence and permissions verified with two schools and two families.

**Stage 3 — finance, if in scope:** T16–T19. Obtain business-rule agreement before coding a ledger. Accounting UI is a prototype input, not a validated financial design. Exit: independent reconciliation of invoices, receipts, adjustments and balances.

**Stage 4 — remaining operations and release:** T20–T25. Scheduling, payroll, complaints and external providers can be separate releases if the lead explicitly defers them. Hide incomplete functionality in a release rather than presenting simulated success as completed behavior.

## First assignments

- A: T01 backend baseline, dependency gap, migration review and sanitized fixtures; then T03/T04. Provide B with example request/response/error payloads for the first shared workflows.
- B: T01 frontend baseline, T05 auth repair and T06 build/typecheck/lint baseline; then T07 contract fixes and T09 UI verification.
- Lead: confirm release scope, nominate a school-domain reviewer, record accounting/scheduling decisions, and provide authorized test/deployment access through the appropriate access channel.

## Definition of done

1. The intended user can complete the workflow with persisted data; it survives refresh and another login.
2. Wrong roles, other schools and unrelated students/parents cannot read or mutate the data.
3. Validations and failure paths work; no mock-success timer, silent fallback or example records masquerade as real data.
4. Backend tests cover meaningful permission/business cases; frontend build/type/lint gates pass under the agreed baseline and the flow has a recorded smoke test.
5. Schema/contract, feature status, task record and any migration/setup notes are updated.
6. A peer reviews the change and the lead sees an acceptance demo using sanitized data.

## Lead's review routine

Use one shared board: **Open → In progress → Review → Acceptance → Done** (Blocked includes a reason and owner). Each developer takes one primary task at a time. Avoid parallel edits to the large shared route/model files without coordination.

In the daily update ask for task ID, what now works, evidence, blocker and next action. In the weekly review open the app and repeat the workflow after reload; inspect permissions and resulting records. Measure accepted workflows and remaining blockers, not screens built or lines changed. Re-estimate after Stage 1; this audit does not justify a fixed completion date.

## Ticket template

```text
ID / title:
Owner / reviewer:
Status / priority:
Source files and current behavior:
Desired user behavior:
API method, URL, input, response and error contract:
Role / school / object-scope rules:
Dependencies and business decisions:
Acceptance scenarios:
Test evidence / demo / commit:
Documentation updated:
```

## Decision register

| Decision | Owner | Current state |
|---|---|---|
| First-release feature scope | Lead | Pending |
| Scheduling restore or defer | Lead | Pending; currently disabled |
| Billing, fine, discount, refund and payroll rules | Lead + school/accounts reviewer | Pending |
| Grade publication and promotion rules | Lead + academic reviewer | Pending |
| Provider and notification requirements | Lead | Pending |
| Deployment/database/media ownership | Lead | Pending |
