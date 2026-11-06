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
  migrations/     # 001 schema, 002 triggers, 003 RLS helpers
  seed/           # fixed-UUID seed + scenarios 1–20
  scripts/        # apply / export via PGlite
  tests/          # vitest integrity + permissions
  *.md            # decisions, dictionary, diff, runbook, ERD
```

See `RUNBOOK.md` and `REHAB_MODEL_DECISIONS.md`.
