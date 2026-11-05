# REHAB_MODEL_DECISIONS

**Project:** Demo_Data_Poratal_Minhelet / manhelet-portal-demo  
**Schema:** `rehab_demo` (isolated; PGlite local — not Life App / portal production tables)  
**Date:** 2026-11-05

## Central thesis

`program_patients` (Program_Patient) is the **spine** of the rehabilitation operational model. Goals, cases, session attendance, and personal progress attach to an enrollment row — never directly to a loose person or household.

## Six layers

| # | Layer | Tables |
|---|-------|--------|
| 1 | People / units | `persons`, `households`, `household_members` |
| 2 | Templates / versions | `program_templates`, `template_versions`, `template_phases`, `template_goals` |
| 3 | Programs / participants / periods / phases | `programs`, `program_patients`, `program_periods`, `program_phases` |
| 4 | Goals / updates | `goals`, `goal_updates`, `progress_snapshots` |
| 5 | Sessions / tasks / cases | `sessions`, `session_attendance`, `tasks`, `cases` |
| 6 | Companions / team / access / audit | `actors`, `companions`, `program_team_members`, `access_grants`, `person_actor_links`, `audit_log` |

## Key decisions

### D1 — Program_Patient is central
Enrollment of a person into a program instance. Unique `(program_id, person_id)`. Status lifecycle: invited → active → completed | withdrawn | transferred.

### D2 — Goals attach only to Program_Patient
`goals.program_patient_id NOT NULL`. Template goals are blueprints; runtime goals are per enrollment.

### D3 — Template version pin on open programs
`programs.pinned_version_id` required when `status = 'open'`. Trigger blocks pin changes while open. Open programs must reference a **published** version.

### D4 — Published template versions are immutable
Phases/goals of a published version cannot be mutated; retire or draft a new version instead.

### D5 — Personal vs group progress
- Personal: weighted average of non-cancelled goals → `program_patients.personal_pct`.
- Group: average of active personal_pct → `program_periods.group_pct` + `progress_snapshots` with `scope=group` (no `program_patient_id`).
These are intentionally **not** the same row.

### D6 — Access ≠ household membership
`access_grants` are explicit. `is_household_member` alone never grants clinical read. Scenario 19 seeds Ben (grant, not member) vs Noa (member, no grant).

### D7 — Single active enrollment per person × template family
Trigger rejects a second `invited|active` Program_Patient for the same person under the same `program_templates` lineage (scenario 18). Different templates may run in parallel (e.g. group support + housing).

### D8 — Permission roles for demo
`matam` (broad), `companion` (grant/team + optional write), `patient` (own link only, read-only), `guardian` (grant required), `gov` (scoped grant, read-only).

### D9 — No Salesforce / no real PII
Demo national IDs are `DEMO-########`. Engine is PGlite (or any local Postgres with schema `rehab_demo`). Sandbox Supabase portal schema is untouched.

## Open decisions (for product)

1. Should guardian write ever be allowed (care-plan acknowledgements)?
2. Soft-delete policy on enrollments vs hard history.
3. Whether group progress should be median / weighted by attendance instead of mean.
4. Mapping of Salesforce objects from model 1.5 once docs are available — see `DIFF_VS_1_5.md`.

## Integrity rules (§5 analogue)

| Rule | Mechanism |
|------|-----------|
| Open ⇒ pin | CHECK + trigger |
| Pin immutable while open | trigger |
| Pin belongs to template | trigger |
| Published children locked | trigger |
| One active enrollment / template | trigger |
| Phase dates within period | trigger |
| Phase from pinned version | trigger |
| Goal % 0–100 | CHECK |
| Progress scope shape | CHECK |
| Attendance PP ∈ session program | trigger |
| Task goal ↔ PP | trigger |
| Goal update → goal + audit | trigger |
