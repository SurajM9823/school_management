# Source inventories

These UTF-8 CSV files open in Excel or a text editor. Generated from repository source by [generate_inventory.py](../tools/generate_inventory.py), without importing Django, reading database records or contacting the API.

| File | Contents |
|---|---|
| [frontend-pages.csv](frontend-pages.csv) | All source files below pages, mapped active routes, direct-call evidence and mock/TODO/timer line hints |
| [frontend-routes.csv](frontend-routes.csv) | Active route declarations, page components, role guard and superuser flag |
| [frontend-api-calls.csv](frontend-api-calls.csv) | Literal/template API call expressions, method and source line |
| [backend-explicit-routes.csv](backend-explicit-routes.csv) | Explicit Django paths, view targets and statically declared methods |
| [backend-router-actions.csv](backend-router-actions.csv) | Router prefixes and decorated custom actions |
| [backend-models.csv](backend-models.csv) | Model declarations, fields and relationship expressions |

Run from the repository root:

```powershell
python docs/tools/generate_inventory.py
```

## Interpretation limits

- These are source inventories, not runtime OpenAPI schemas. Counts are not completion percentages.
- Page files include helpers and embedded forms. No direct API call does not always mean a mock: Login delegates to AuthContext and TeacherAssignments delegates through props. Consult the curated feature matrix.
- Route extraction handles the current JSX layout and ignores JSX block comments. Settings child paths are expanded for this project's current `/admin/settings` nesting; it is not a general JSX parser. Redirect-only/index routes and non-page components do not have a page-source mapping. Duplicate declarations remain visible.
- Call extraction finds literal/template URLs on `api`/`axios`; variable URLs, alternate wrappers, dynamic method calls and calls in delegated components may be missed. Text markers can include comments. Line numbers change when source changes.
- Backend targets/methods are discovered statically. Aliased imports, function-based view decorators and inherited library handlers may need manual resolution. `GradeTeacherClassesAPIView` is the alias for `core.serial.teacher.student_grades.TeacherClassesAPIView`.
- Router prefixes represent standard CRUD capabilities, not one operation or a tested endpoint. Custom action paths respect their explicit `url_path`; HEAD/OPTIONS and format suffixes are not expanded.
- Model declarations include five unmanaged legacy scheduling placeholders in `dummy_models.py`; declaration does not mean a current table is deployed or a feature is active. Migrations/database parity is unverified.
- The curated [feature status](../FEATURE_STATUS.md) and [findings](../FINDINGS.md) take precedence over automatic hints. Regenerate these CSVs after code changes and review the diff.
