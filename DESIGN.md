# Design System — פורטל המנהלת (אבטיפוס)

> **Source of truth for visual language:** this file + tokens in `src/index.css`
> (`@theme` block). Navy / Soft Gold SaaS pass (2026-11-07). Layout patterns from
> earlier Stitch / ui-ux-pro-max passes remain; palette and chrome are updated here.

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
- **Fonts:** **Rubik** (primary) + **Heebo** / **Assistant** fallbacks + system sans
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
| Body sm | 13–14px |
| Body | 15–16px |
| Button | 14–15px |
| Section title | 18–20px |
| Page title | 24–28px |

Font stack: `"Rubik", "Heebo", "Assistant", ui-sans-serif, system-ui, sans-serif`

## Radii & elevation

- Buttons / fields / pills: **8px** (`--radius-md`)
- Cards / panels: **12px** (`--radius-lg`) — soft shadow
- Soft card shadow: `0 4px 12px rgba(13, 26, 51, 0.06)`
- Spacing: 8 / 12 / 16 / 24

## Layout patterns (portal)

- Persistent **right sidebar** (RTL) — Midnight Navy chrome, environment switcher at bottom
- Top bar: logo, global search, **+ פעולה חדשה** (gold CTA), notifications, profile
- Content: page wash `#F6F9FD` + white cards; optional left widget column
- Task center: KPI strip + table + left detail drawer
- Family portal: minimal shell without ops nav

## Anti-patterns to avoid

- Decorative orange leftover accents (replaced by Soft Gold)
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
- [x] RTL + Hebrew body font (Rubik / Heebo)
- [x] Semantic success / warning / danger preserved
- [x] rehab-demo explorer inherits tokens
- [x] No leftover decorative orange
