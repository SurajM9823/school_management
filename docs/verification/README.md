# Check evidence

Captured against application source baseline `efae2353` during the 23 October 2026 handover. No application source fixes were made. This is a baseline, not an expected passing result.

| Command (from `school/`) | Exit | Result |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | 0 | 425 packages installed |
| `npm run build` | 0 | 3,001 modules; completed in 38.84 seconds; large-chunk warning |
| `tsc --noEmit -p tsconfig.app.json` | 2 | 366 diagnostics; [full output](typescript.txt) |
| `npm run lint` | 1 | 412 errors, 26 warnings; [full output](eslint.txt) |

Build output: main JS approximately 2,351.04 kB / 586.29 kB gzip; CSS approximately 65.31 kB. The build only transpiles/bundles; it does not run the separate TypeScript check. Outputs are retained for triage rather than claiming a passing quality baseline.

Backend runtime and business acceptance tests were not performed. See [setup and verification](../SETUP_AND_VERIFICATION.md).
