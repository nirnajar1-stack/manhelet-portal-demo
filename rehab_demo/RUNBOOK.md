# Rehab demo — run instructions

## Prerequisites

- Node 22+
- npm

No Salesforce, no Supabase mutations, no real PII. Database engine is **PGlite** (Postgres WASM) in-process.

Optional: any local Postgres 15+ — apply the same SQL under schema `rehab_demo` only.

## Install

```bash
npm install
```

## Apply schema + seed (PGlite smoke)

```bash
npm run rehab:apply
```

## Export UI snapshot + scenario results

```bash
npm run rehab:export
```

Writes `src/data/rehab-demo/snapshot.json` (committed for UI offline browsing).

## Automated tests (integrity + permissions)

```bash
npm test
# or
npm run rehab:test
```

Expect **24** Vitest assertions green; export reports **20/20** scenarios.

## UI

```bash
npm run dev
```

Open `/rehab-demo` (sidebar: **סייר מודל שיקום**).

Routes:

| Path | Screen |
|------|--------|
| `/rehab-demo` | Model overview |
| `/rehab-demo/erd` | Mermaid ERD + table explorer |
| `/rehab-demo/households` | Households / people |
| `/rehab-demo/programs` | Programs list |
| `/rehab-demo/programs/:id` | Hierarchy detail |
| `/rehab-demo/scenarios` | Scenarios 1–20 expected vs actual |
| `/rehab-demo/permissions` | Role simulation |

## Build / lint

```bash
npm run build
npm run lint
```

## Safety checklist

- [x] Schema name `rehab_demo` only
- [x] No Life App migration chain
- [x] No writes to Minhelet sandbox portal tables
- [x] Demo IDs only (`DEMO-########`)
- [x] Branch + PR — do not merge without review
