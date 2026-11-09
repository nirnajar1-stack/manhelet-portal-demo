# Design System — פורטל המנהלת (אבטיפוס)

> **Source of truth for visual language:** this file + tokens in `src/index.css`
> (`@theme` block). Apple-like Operate UI polish (2026-11-09) on Navy / Soft Gold —
> 8pt rhythm, airier chrome, soft hairlines; no business-logic changes.

## Provenance

| Item | Path / note |
|------|-------------|
| Implemented tokens | `src/index.css` (`@theme` block) |
| Advisory patterns | `design-system/manhelet-portal/MASTER.md` |
| This document | `DESIGN.md` |
| Design-language report | store `docs/manhelet-portal-demo/design-language-navy-gold.md` |

## Brand direction

- **Direction:** Modern SaaS operations portal — Midnight Navy + Soft Golden Yellow on cool page wash
- **Mode:** Light operational UI; clear hierarchy; measured yellow (never large page backgrounds)
- **RTL:** Hebrew-first; `dir="rtl"` on `html`
- **Fonts:** SF-like stack — `system-ui` / `-apple-system` first, **Heebo** for Hebrew, **Inter** / Rubik / Assistant fallbacks
- **Branding in product:** **מנהלת החטופים, הנעדרים והשבים**

## Color tokens

| Token | Hex | CSS variable | Usage |
|-------|-----|--------------|--------|
| Midnight Navy | `#0D1A33` | `--color-ink-navy` | Nav, major headings, emphasized text, dark important areas |
| Deep Navy | `#152844` | `--color-deep-navy` | Navy hover / elevation |
| Dusk Blue | `#8FB4E3` | `--color-dusk-blue` | Info washes, secondary accents, selection, charts, secondary buttons |
| Soft Golden Yellow | `#F5C542` | `--color-gold` | Primary CTAs, key callouts, active indicators, attention tags |
| Gold hover | `#E8B52F` | `--color-gold-hover` | Primary button hover |
| Signal (link/focus) | `#3D6FA5` | `--color-signal-blue` | Links & focus — dusk-derived, WCAG AA on white |
| Secondary text | `#64748B` | `--color-slate-gray` / `--color-mist-gray` | Muted copy |
| Page bg | `#F6F9FD` | `--color-cloud` | App background |
| Soft cyan | `#EDF4FC` | `--color-soft-cyan` / `--color-pebble` / `--color-badge-bg` | Muted fills, table hover base |
| Cards | `#FFFFFF` | `--color-paper` | Cards / panels |
| Borders | `#D8E3F0` | `--color-hairline` | Dividers / outlines |
| Success | `#2E7D32` / `#E8F5E9` | `--color-success` / `--color-success-bg` | Semantic success |
| Warning | `#F5C542` / `#7A5A00` / `#FFF8E1` | `--color-warning` / `--color-warning-text` / `--color-warning-bg` | Semantic warning |
| Danger | `#C62828` / `#FFEBEE` | `--color-danger` / `--color-danger-bg` | Semantic error |

### Button rules

| Variant | Background | Text |
|---------|------------|------|
| Primary | Soft Golden Yellow | **Midnight Navy** (never white on light yellow) |
| Secondary | Dusk Blue | Midnight Navy |
| Tertiary | Outline / paper | Midnight Navy |
| Dark (rare) | Midnight Navy | Paper |

### Navigation

- Sidebar: Midnight Navy background, light text/icons
- Active item: Dusk Blue background + navy text
- Yellow: sparse indicators only (e.g. attention counts)

### KPI / charts

- Large KPI numbers: Midnight Navy
- Graph / info accents: Dusk Blue
- Yellow: key metric or business exception (not system error)

## Typography scale

| Role | Size |
|------|------|
| Caption | 12px |
| Body sm | 13px |
| Body | 15px |
| Button | 14px |
| Section title | 17–20px |
| Page title | 28px |

Font stack: `system-ui, -apple-system, "Heebo", "Inter", "Rubik", "Assistant", …`

Weight discipline: default 400; labels/CTAs 500; titles 600. Avoid bold everywhere.
Letter-spacing: slightly tight on titles (`-0.02em`).

## Radii & elevation

- Buttons / fields: **10px** (`--radius-md`)
- Cards / panels: **12px** (`--radius-lg`) — **soft hairline border, no default shadow**
- Badges: **~8–10px** (not pills)
- Overlay shadow only (menus/toasts): `0 8px 24px rgba(13, 26, 51, 0.06)`
- Spacing: **8pt rhythm** (8 / 16 / 24 / 32 / 40 / 48)
- Top bar: **56px**; sidebar: **248px**; data rows: **~52px**

## Layout patterns (portal)

- Persistent **right sidebar** (RTL) — Midnight Navy chrome, environment switcher at bottom
- Top bar: logo, global search, **+ פעולה חדשה** (gold CTA), notifications, profile
- Content: page wash `#F6F9FD` + white surfaces; KPI as single strip with hairline dividers
- Task center: calmer table + filters in chrome + detail drawer (no nested card shadows)
- Home: attention first, task list primary, quiet rail for shortcuts
- Family portal: minimal shell; no decorative blurs / AI blobs

## Anti-patterns to avoid

- Identical large KPI cards with decorative duplicate numbers
- Soft shadow on every panel
- Decorative icons / Sparkles / blur orbs
- Giant empty space and oversized page titles
- White text on Soft Golden Yellow buttons
- Large yellow page backgrounds
- Purple-on-white / indigo glow themes
- Warm cream + terracotta editorial look
- Dense broadsheet newspaper columns
- Color overload — measured yellow, dusk for info only
- Using «דורש טיפול» as a business task status (it is an indicator)
- Overriding molecule Chatter / unit affiliation rules for visual reasons
- Scattered hex in components — use `@theme` tokens

## Checklist

- [x] Central tokens in `src/index.css`
- [x] Primary gold + navy text; secondary dusk + navy; tertiary outline
- [x] Navy sidebar with dusk active state
- [x] RTL + Hebrew body font (Heebo primary)
- [x] Hairline elevation; KPI strips not card grids
- [x] Semantic success / warning / danger preserved
- [x] rehab-demo explorer inherits tokens
- [x] No leftover decorative orange / blur orbs
