# Diff vs model 1.5

## Status

**Docs for Salesforce / rehab model 1.5 were not available** in the repository or Project store at build time (`docs/manhelet-portal-demo/` contains portal demo architecture with a shallow `rehabilitation_plans` / `activities` / `milestones` trio only — not a full Program_Patient model).

This deliverable is therefore an **architect-recommended model**, documented against:

1. The user brief (6 layers, Program_Patient central, pin-on-open, personal≠group, access≠household).
2. Existing portal demo rehab stubs (`rehabilitation_plans` → person-centric).

## Assumed 1.5 shape (from brief + portal stubs)

| Assumed 1.5 | This demo (`rehab_demo`) | Delta |
|-------------|--------------------------|-------|
| Person-centric rehab plan | `program_patients` enrollment spine | Goals/cases hang off enrollment, not person alone |
| Flat plan + milestones | Template versions + pinned instance phases | Versioning + immutability |
| Household implies access | Explicit `access_grants` | Hard separation (scenario 19) |
| Single progress number | `personal_pct` + `group` snapshots | Separated scopes |
| Unclear multi-program rules | One active enrollment per template family | Trigger-enforced (scenario 18) |
| Salesforce object names | Postgres snake_case in schema `rehab_demo` | Adapter-ready; no SF connection |

## Improvements intentionally made

1. **Pin immutability** while program is open (prevents silent template drift).
2. **Published template freeze** (phases/goals locked).
3. **Audit on goal updates** via trigger.
4. **Permission helpers** (`can_read_program_patient` / `can_write_program_patient`) with RLS policies on sensitive tables.
5. **Deterministic seed + scenario registry** for regression of integrity rules.

## When 1.5 docs arrive

Map Salesforce API names → these tables in a follow-up appendix; keep Postgres as the demo system of record. Do not reverse these integrity rules without an ADR update in `REHAB_MODEL_DECISIONS.md`.
