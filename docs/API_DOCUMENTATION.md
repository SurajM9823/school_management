# API documentation: Swagger plus the handover

## Recommended approach

Use **drf-spectacular** to generate OpenAPI from Django REST Framework, with Swagger UI for interactive API exploration and ReDoc for reading contracts. Its official documentation lists support for the Django 5.2 / DRF 3.16 versions used here and SimpleJWT. Source: [drf-spectacular installation and supported versions](https://drf-spectacular.readthedocs.io/en/stable/readme.html).

This is a proposed integration, **not enabled by this documentation change**. Pin a tested version during T08. Generated API documentation answers what an endpoint accepts and returns. It cannot determine whether a screen is mocked, a workflow is complete, a permission is correct, or a developer has finished a task. Keep the feature matrix and delivery plan alongside it.

| Documentation layer | What to use | Current deliverable |
|---|---|---|
| Backend contract | OpenAPI + Swagger UI/ReDoc | Source route/action inventories now; live schema integration is T08 |
| Frontend feature behavior | Route/page inventory + feature matrix | Included in this handover |
| Architecture/data | Markdown + relationship diagram + model inventory | Included |
| Remaining work and ownership | Prioritized backlog with acceptance criteria | Included |
| Reusable component appearance | Optional component story catalog later | Not installed; not required to start the handover |

## Implementation recipe for Developer A

First make the backend importable and validate migrations. The missing ReportLab dependency can currently stop URL import before a schema is generated. Use a clean local environment, not the remote API configured in the frontend.

1. Install a reviewed version of `drf-spectacular`, then record the exact version in `backend/requirements.txt`.
2. Add `drf_spectacular` to `INSTALLED_APPS`.
3. Add `'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema'` to the existing `REST_FRAMEWORK` dictionary; preserve authentication and permission settings.
4. Add schema metadata and views. Example configuration below is a starting point, not a claim these routes currently exist.

```python
# backend/settings.py -- merge into existing configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'School Management API',
    'VERSION': '0.1.0',
    'DESCRIPTION': 'School management backend contracts',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SERVE_PERMISSIONS': ['rest_framework.permissions.IsAdminUser'],
    'SERVE_AUTHENTICATION': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

The example restricts documentation to Django staff users; it does not treat all custom `role='admin'` accounts as staff. Session auth lets an authorized developer log into Django admin before opening the documentation in a browser. Decide the intended documentation audience explicitly. Do not broaden production permissions just to make the docs page open. See [schema serving settings](https://drf-spectacular.readthedocs.io/en/stable/settings.html).

```python
# backend/urls.py -- add imports and append to existing urlpatterns
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView,
)

urlpatterns += [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
```

5. Add serializers and explicit annotations for manually implemented APIViews. Document query filters, multipart fields, response arrays/objects and non-success responses. See [schema customization workflow](https://drf-spectacular.readthedocs.io/en/stable/customization.html).
6. Generate and validate locally:

```powershell
# From backend/, after the package/configuration and schema annotations exist
python manage.py spectacular --file schema.yml --validate
```

7. Review every warning, compare documented operations against the route inventories, and add schema generation/validation to CI. A schema that renders but omits APIViews is not complete. Once warnings are resolved, make schema warnings fail the CI check using the installed version's supported CLI option.

## Project-specific annotation priorities

| API family | Required contract details |
|---|---|
| Login/refresh/current user | Email/password input, user object on login, refresh response without user, expired subscription errors, token expiry |
| Admissions | Multipart shape, nested/linked parents, student/class/session fields, fees/documents, duplicate account errors and rollback |
| Staff/teachers | Staff vs Teacher IDs, assignment payloads, uploads, reset flow; do not document plaintext credential recovery as desired behavior |
| Attendance | `class_id`, `section`, date, list of student/status entries; role/school checks, validation and idempotent resave |
| Exams/scores | Required query filters, score list shape, allowed marks/status transitions and result publication |
| Homework | Multipart create/submit, assignment identity, grade/feedback fields and resubmission policy |
| Transport/scholarships/events | Related-ID scope, batch behavior, assign/revoke semantics and reports |
| Settings | Singleton vs collection behavior, create/update rules, effective values and sensitive-field omission |

For each operation, record: method/path, purpose, allowed roles, school/object scope, path/query parameters, request schema and content type, success status/schema, validation/401/403/404 errors, sanitized example, side effects, frontend consumers and test reference.

## Existing request example (source-derived, not runtime verified)

`POST /api/teacher/attendance/save/` currently reads the following structure in `serial/teacher/teacher_attendance.py`. IDs below are placeholders for an isolated fixture, not real accounts:

```json
{
  "class_id": 101,
  "section": 201,
  "date": "2026-10-23",
  "attendance": [{"student": 301, "status": "present"}]
}
```

The current success response is `{"detail": "Attendance saved."}`. Required fixes include role/ownership checks and complete input validation. Do not mistake this source example for a permission-tested public API contract.

## Frontend documentation rules

For each screen retain route, role, purpose, source file, fields/actions, APIs, local/mock behavior, states (loading/empty/error/success), validation, acceptance scenarios and owner. The current inventory plus feature matrix provides the baseline. As each task is implemented, add exact payload examples and screenshots from sanitized local data if useful.

The CSV extractor is a static discovery tool, not an OpenAPI generator. It cannot infer complete TypeScript types, dynamic URLs, inherited permissions, actual DB schema or business completion.
