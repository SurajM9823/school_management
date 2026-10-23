# Findings and release risks

These findings come from source inspection unless a runtime check is explicitly noted. They are repair tasks, not claims of exploitation against a deployed service. No remote API or production database was tested.

## P0 — fix before production use

| ID | Finding and evidence | Required outcome |
|---|---|---|
| F01 | `backend/core/models.py`: User includes `plaintext_password`; `UserManager.create_user` saves the supplied password in it. Credential-reading/reset flows exist in student/staff/teacher code. | Stop storing/returning plaintext; replace recovery with reset/invitation flows; migrate away from the field and handle existing copies/backups and resets deliberately. Test that secrets never appear in responses/logs. |
| F02 | `view/admin/transportview.py`: Route, Bus and BusFee viewsets use global `.objects.all()`; BusAssignment filtering only checks supplied route, and student lookup starts from all active students. Serializer related-field querysets are also global. | Establish school ownership for transport entities and scope both reads and writable relations. Require appropriate roles. Two-school and wrong-role tests must pass for list/detail/create/update/delete/export. |
| F03 | `serial/teacher/teacher_attendance.py`: save accepts student/class/section IDs directly and uses `update_or_create`; no check here proves each student belongs to the school/class or teacher assignment. Default permission is authentication. | Validate actor role, assigned class and all related IDs before any write; validate date/status and use an atomic operation where appropriate. Foreign-school IDs must not modify records. |
| F04 | `serial/teacher/teacher_assignment_views.py`: fallback queryset returns all assignments; create does not enforce teacher role; submit fetches assignment by global PK without checking student membership. | Restrict each action by role, school and class/ownership. Test guessed IDs, wrong roles and cross-school submission, read and mutation. |
| F05 | `backend/settings.py` contains checked-in secret/database configuration with DEBUG enabled; frontend points to a hardcoded HTTP server; `api.ts` and AuthContext log tokens/auth responses. | Externalize environment config, rotate exposed secrets, remove sensitive logs and verify production HTTPS/debug/CORS settings. Do not publish real credentials in documentation. |

## P1 — functionality and reliable handover

| ID | Finding and evidence | Required outcome |
|---|---|---|
| F06 | `AuthContext.tsx`: `parsedUser` is declared inside a try block and referenced in its catch fallback. | Repair variable scope and explicitly define safe startup/offline behavior; typecheck and exercise the error path. |
| F07 | `api.ts`: refresh uses the same intercepted client, allowing another refresh attempt when the refresh request itself returns 401. AuthContext also has separate refresh logic and assumes refreshed `user`. | Use one bounded refresh mechanism, avoid intercepting refresh recursively, coalesce concurrent refreshes, fetch current user separately, and clear auth on invalid refresh. |
| F08 | `transportview.py` imports `reportlab` at module load; requirements do not declare it. Django is absent from the audit's selected Python interpreter. | Pin missing dependencies; prove fresh install and Django URL checks in a clean environment. Do not rely on the committed virtualenv. |
| F09 | `core/urls.py` declares `school/class-teachers/<int:class_id>/` and `school/class-teachers/<int:assignment_id>/`. These match the same URL shape; the first wins. | Use distinct paths or one documented identifier contract; test retrieve/update/delete and frontend mapping. |
| F10 | Frontend calls `/superadmin/activities/` and `/teacher/remarks/`; neither is registered in `core/urls.py`. | Implement scoped endpoints or explicitly remove/defer the associated UI. |
| F11 | `Exams.tsx` sends PATCH to `school/exams/<id>/`; `ExamView` implements GET/POST/PUT/DELETE but no PATCH. | Align the client and view contract; test status transitions and invalid transitions. |
| F12 | `Exams.tsx` includes a scores request with only `exam_id`; `ScoreView.get` requires `exam_id`, `subject_id` and `section_id`. | Define a reporting endpoint or supply required filters; verify all marksheet/export callers. |
| F13 | Corrected after reinspection: Student.school targets School.id (integer), while User.school targets the UUID. The attendance student-list filter `school=school.id` is consistent with the Student model; the earlier defect claim is withdrawn. Mixed keys still require care in new finance APIs. | Verify model/migration/database agreement and scope each relation correctly; do not change the student filter to UUID merely to match User.school. |
| F14 | Admin Events and Notices fetch lookup data but simulate their main CRUD and list data locally. Parent/accountant and most student screens also use sample data. | Replace each simulation explicitly; verify persistence after browser reload and a second login. Track by matrix row, not by visible screen count. |
| F15 | Homework submissions are matched/grouped by title and teacher; submission rows duplicate assignment fields. | Define durable parent-assignment identity and uniqueness; migrate safely; test same titles across classes/subjects and resubmission behavior. |
| F16 | Backend `core/tests.py` is empty; frontend has no test script. No recorded end-to-end baseline was found. | Add critical permission, persistence, auth and financial tests with isolated fixtures; record acceptance evidence. |

## P2 — completeness and maintainability

| ID | Finding and evidence | Required outcome |
|---|---|---|
| F17 | `App.tsx` duplicates `/` and `/admin/exam/managescore`; schedule/permission routes are commented out; superadmin settings reuses school settings shell. | Reconcile intended navigation and direct routes; document deferred features and remove broken links. |
| F18 | `Profile.tsx` reports success after timers; support widget simulates replies. | Implement real behavior or make deferred/demo status clear before release. |
| F19 | `MyClasses.tsx` explicitly reads `localStorage.token`, while auth stores `accessToken`. The imported `axios` is the shared client whose interceptor can overwrite this header. | Remove redundant stale-token handling; do not incorrectly assume this is a separate Axios base-URL defect. |
| F20 | `npm run build` is Vite only, not a TypeScript check. Strict TS config and ESLint exist separately. | Add independent build, typecheck and lint gates; establish and reduce existing failures without suppressing them indiscriminately. |
| F21 | Source contains SQL dump, environment, generated static and debug artifacts; deployment/runbook evidence is limited. | Establish sanitized seed data, .gitignore/archive policy, reproducible environments, backup/restore and deployment ownership. |
| F22 | No Swagger/OpenAPI configuration exists; many APIViews build responses manually. | Add schema tooling and explicit request/response/query annotations; schema route availability alone is not contract completeness. |

## Further review, not yet proven defects

Review file authorization and retention, admission multi-record rollback, cascading deletes, staff/admin permission consistency, grade formula boundaries, notification delivery, school-level settings actually being consumed, data-dump/schema parity, and SQL migration portability. These need fixtures and runtime investigation before assigning a precise defect description.
