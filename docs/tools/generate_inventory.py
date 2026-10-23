"""Generate source inventories without importing Django or contacting any service.

Run from any directory: python docs/tools/generate_inventory.py
These are discovery aids, not proof of runtime behavior or complete API schemas.
"""
import ast
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs' / 'inventory'
OUT.mkdir(parents=True, exist_ok=True)


def write(name, headers, rows):
    with (OUT / name).open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    print(f'{name}: {len(rows)} rows')


app = (ROOT / 'school/src/App.tsx').read_text(encoding='utf-8')
active_app = re.sub(r'\{/\*.*?\*/\}', '', app, flags=re.S)
imports = dict(re.findall(r'import\s+(\w+)\s+from\s+["\'](\./pages/[^"\']+)', app))
routes = []
for match in re.finditer(r'<Route\s+path="([^"]+)"(.*?)(?=\s*/>|</Route>)', active_app, re.S):
    path, body = match.groups()
    components = re.findall(r'<(\w+)', body)
    component = next((c for c in components if c in imports), '')
    roles = re.search(r'roles=\{\[([^\]]+)\]', body)
    if not path.startswith('/') and path != '*':
        path = '/admin/settings/' + path
    routes.append([path, component, 'school/src/' + imports[component][2:] + '.tsx' if component else '',
                   roles.group(1).replace('"', '') if roles else ('admin (inherited)' if '/admin/settings/' in path else ''),
                   'true' if 'superuserOnly={true}' in body else 'false'])
write('frontend-routes.csv', ['route', 'component', 'source', 'roles', 'superuser_only'], routes)

calls = []
pages = []
call_pattern = re.compile(r'\b(api|axios)\.(get|post|put|patch|delete)(?:<[^;\n]*?>)?\s*\(\s*([\'"`])(.+?)\3', re.S)
for file in sorted((ROOT / 'school/src').rglob('*')):
    if file.suffix not in ('.tsx', '.ts', '.js'):
        continue
    content = file.read_text(encoding='utf-8')
    rel = file.relative_to(ROOT).as_posix()
    found = list(call_pattern.finditer(content))
    for m in found:
        calls.append([rel, content[:m.start()].count('\n') + 1, m[1], m[2].upper(), m[4]])
    if '/pages/' in rel:
        matched_routes = [r[0] for r in routes if r[2] == rel]
        markers = []
        for i, line in enumerate(content.splitlines(), 1):
            if re.search(r'\bmock\w*|TODO|setTimeout', line, re.I):
                markers.append(str(i))
        state = 'API calls present; runtime unverified' if found else 'No direct API call detected; inspect local/static behavior'
        if rel.endswith('/admin/Notices.tsx'):
            state = 'Partial: lookups use API; notice CRUD uses local state'
        if rel.endswith('/admin/Events.tsx'):
            state = 'Partial: lookups use API; event CRUD/participation use local state'
        if rel.endswith('/auth/Login.tsx'):
            state = 'Delegates login to AuthContext; API wiring exists there'
        if rel.endswith('/admin/TeacherAssignments.tsx'):
            state = 'Embedded form; receives data and callbacks from parent'
        if rel.endswith('/superadmin/ActivityTracker.tsx'):
            state = 'API call present; matching backend route absent'
        pages.append([rel, '; '.join(matched_routes) or 'Not directly routed (may be embedded)', state,
                      len(found), '; '.join(markers[:15])])
write('frontend-pages.csv', ['source', 'routes', 'integration_evidence', 'literal_api_call_count', 'mock_todo_timer_lines'], pages)
write('frontend-api-calls.csv', ['source', 'line', 'client', 'method', 'url_expression'], calls)

classes = {}
models = []
for file in sorted((ROOT / 'backend/core').rglob('*.py')):
    if 'migrations' in file.parts or '__pycache__' in file.parts:
        continue
    content = file.read_text(encoding='utf-8-sig')
    tree = ast.parse(content)
    rel = file.relative_to(ROOT).as_posix()
    for node in tree.body:
        if not isinstance(node, ast.ClassDef):
            continue
        methods = [n.name for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        classes.setdefault(node.name, []).append((rel, node, methods))
        bases = [ast.unparse(b) for b in node.bases]
        if 'models.Model' not in bases and 'AbstractBaseUser' not in bases:
            continue
        fields, relations = [], []
        for n in node.body:
            if isinstance(n, ast.Assign) and isinstance(n.value, ast.Call):
                name = ast.unparse(n.targets[0])
                field_type = ast.unparse(n.value.func)
                if field_type.startswith('models.'):
                    fields.append(name + ':' + field_type.split('.')[-1])
                    if field_type.split('.')[-1] in ('ForeignKey', 'OneToOneField', 'ManyToManyField'):
                        target = ast.unparse(n.value.args[0]) if n.value.args else '?'
                        extra = ', '.join(k.arg + '=' + ast.unparse(k.value) for k in n.value.keywords if k.arg in ('to_field', 'through', 'on_delete'))
                        relations.append(f'{name} -> {target} ({extra})')
        models.append([node.name, rel, node.lineno, '; '.join(fields), '; '.join(relations)])
write('backend-models.csv', ['model', 'source', 'line', 'declared_fields', 'relationships'], models)

urls_file = ROOT / 'backend/core/urls.py'
tree = ast.parse(urls_file.read_text(encoding='utf-8'))
endpoints = []
routers = []
for node in ast.walk(tree):
    if not isinstance(node, ast.Call):
        continue
    if isinstance(node.func, ast.Name) and node.func.id == 'path' and len(node.args) > 1 and isinstance(node.args[0], ast.Constant):
        target = ast.unparse(node.args[1])
        name = target.split('.')[0]
        defs = classes.get(name, [])
        methods = sorted({m.upper() for _, _, ms in defs for m in ms if m in ('get', 'post', 'put', 'patch', 'delete')})
        if isinstance(node.args[1], ast.Call) and node.args[1].args and isinstance(node.args[1].args[0], ast.Dict):
            methods = [str(k.value).upper() for k in node.args[1].args[0].keys]
        endpoints.append(['/api/' + str(node.args[0].value), ', '.join(methods) or 'See target / framework', target,
                          '; '.join(p for p, _, _ in defs), node.lineno])
    if isinstance(node.func, ast.Attribute) and node.func.attr == 'register' and len(node.args) >= 2:
        prefix = node.args[0].value
        name = ast.unparse(node.args[1])
        for source, cls, methods in classes.get(name, []):
            routers.append(['/api/' + prefix + '/', 'Standard ModelViewSet routes; inspect overrides', name, source, cls.lineno])
            for fn in cls.body:
                if not isinstance(fn, ast.FunctionDef):
                    continue
                for dec in fn.decorator_list:
                    if isinstance(dec, ast.Call) and ast.unparse(dec.func) == 'action':
                        kw = {k.arg: ast.literal_eval(k.value) for k in dec.keywords}
                        route = '/api/' + prefix + '/' + ('{pk}/' if kw.get('detail') else '') + kw.get('url_path', fn.name) + '/'
                        routers.append([route, ', '.join(kw.get('methods', ['get'])).upper(), name + '.' + fn.name, source, fn.lineno])
write('backend-explicit-routes.csv', ['route', 'declared_methods', 'target', 'source_candidates', 'url_line'], endpoints)
write('backend-router-actions.csv', ['route', 'methods_or_scope', 'target', 'source', 'line'], routers)
print('Review caveats in docs/inventory/README.md before interpreting these files.')
