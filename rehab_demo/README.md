# rehab_demo — interactive rehabilitation data-model demo

Isolated Postgres schema + deterministic seed + Hebrew RTL explorer + automated integrity/permission tests.

## Quick start

```bash
npm install
npm run rehab:export   # migrate+seed+snapshot (PGlite)
npm test
npm run dev            # open /rehab-demo
```

## Layout

```
rehab_demo/
  migrations/     # 001–003 Program_Patient spine; 004–005 personal goal/stage workflow
  seed/           # fixed-UUID seed + scenarios 1–20 + personal rehab W01–W15
  scripts/        # apply / export via PGlite
  tests/          # vitest integrity + permissions + personal workflow
  *.md            # decisions, dictionary, diff, runbook, ERD
```

Portal UI workflow (Hebrew): `/units/:id?tab=rehab`, `/rehab/goals/:id`, `/rehab/bank`.  
Implementation doc (project store): `docs/manhelet-portal-demo/REHAB_WORKFLOW_IMPLEMENTATION.md`.

See `RUNBOOK.md` and `REHAB_MODEL_DECISIONS.md`.
