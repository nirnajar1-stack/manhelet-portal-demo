# Design System — פורטל המנהלת (אבטיפוס)

> **Source of truth for this visual pass:** Stitch mockups under
> `/cursor/stores/self/media/stitch-mockups/` (indexed in
> `/cursor/stores/self/docs/manhelet-portal-demo/stitch-mockups-index.md`).
> Layout and component patterns from those images take priority over the older
> Calendly-inspired notes below. Tokens in `src/index.css` implement this pass.

## Provenance

| Item | Path / note |
|------|-------------|
| Mockup batch (2026-11-05) | `media/stitch-mockups/01`–`04`, `06` (ignore `05-blank`) |
| Index | `docs/manhelet-portal-demo/stitch-mockups-index.md` |
| Implemented tokens | `src/index.css` (`@theme` block) |
| This document | `DESIGN.md` |

### Mockups covered in this pass

| File | Screen |
|------|--------|
| `01-knowledge-center.jpg` | מרכז ידע ונהלים |
| `02-matam-workspace.jpg` | סביבת עבודה מת״ם |
| `03-task-detail.jpg` | פרטי משימה |
| `04-programs-events.jpg` | תוכניות, אירועים והטבות |
| `06-task-center.jpg` | מרכז משימות + מגירת פירוט |

## Brand direction

- **Direction:** Light government-ops portal — navy primary on cool gray marble
- **Mode:** Light operational UI (dense but readable)
- **RTL:** Hebrew-first; `dir="rtl"` on `html`
- **Fonts:** **Heebo** (Hebrew sans) + **Assistant** fallback + system sans
- **Branding in product:** Keep repo brand **מנהלת החטופים, הנעדרים והשבים**. Mockups vary (תקומה / עוטף / חטופים) — layout wins, product name stays.

## Color tokens

| Token | Hex | CSS variable |
|-------|-----|--------------|
| Ink Navy (primary) | `#1a2b4b` | `--color-ink-navy` |
| Deep Navy | `#0b3558` | `--color-deep-navy` |
| Signal Blue | `#1976d2` | `--color-signal-blue` |
| Slate Gray | `#476788` | `--color-slate-gray` |
| Mist Gray | `#8fa3b8` | `--color-mist-gray` |
| Cloud (page bg) | `#f5f7fa` | `--color-cloud` |
| Paper | `#ffffff` | `--color-paper` |
| Pebble | `#eef2f7` | `--color-pebble` |
| Hairline | `#dce3ec` | `--color-hairline` |
| Badge BG | `#e8f0fe` | `--color-badge-bg` |
| Success | `#388e3c` / `#e8f5e9` | `--color-success` / `--color-success-bg` |
| Warning | `#f9a825` / `#fff8e1` | `--color-warning` / `--color-warning-bg` |
| Danger | `#d32f2f` / `#ffebee` | `--color-danger` / `--color-danger-bg` |

Primary **buttons** use Ink Navy. Links / focus rings use Signal Blue.
Status pills: red / yellow-orange / green / blue as in the mockups.

## Typography scale

| Role | Size |
|------|------|
| Caption | 12px |
| Body sm | 13–14px |
| Body | 15–16px |
| Button | 14–15px |
| Section title | 18–20px |
| Page title | 24–28px |

Font stack: `"Heebo", "Assistant", ui-sans-serif, system-ui, sans-serif`

## Radii & elevation

- Buttons / fields / pills: **8px** (`--radius-md`)
- Cards / panels: **10–12px** (`--radius-lg`) — soft shadow, not heavy elevation
- Soft card shadow: `0 4px 12px rgba(26, 43, 75, 0.06)`
- Spacing: dense government density — 8 / 12 / 16 / 24

## Layout patterns (portal)

- Persistent **right sidebar** (RTL) — navy active item, environment switcher at bottom
- Top bar: logo, global search, **+ פעולה חדשה**, notifications, profile
- Content: light gray page + white cards; optional **left** widget column on home / programs / knowledge
- Task center: KPI strip + table + **left detail drawer**
- Family portal: minimal shell without ops nav

## Anti-patterns to avoid

- Purple-on-white / indigo glow themes
- Warm cream + terracotta editorial look
- Dense broadsheet newspaper columns
- Using «דורש טיפול» as a business task status (it is an indicator)
- Overriding molecule Chatter / unit affiliation rules for visual reasons

## ui-ux-pro-max skill pass

Applied [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) design/review workflow (2026-11-05) without replacing Stitch branding:

- Skill installed at `.cursor/skills/ui-ux-pro-max/` (also `~/.cursor/skills/ui-ux-pro-max/` for this agent environment)
- Persisted advisory system: `design-system/manhelet-portal/MASTER.md` (tokens defer to this file + `src/index.css`)
- UX checklist deltas: stronger muted/status contrast, skip link, `prefers-reduced-motion`, sticky-header `scroll-padding`, 44px touch targets on key controls, `cursor-pointer` / hover transitions, `aria-expanded` / live status for chrome, chip `aria-pressed`, priority labels not color-only

## Checklist

- [x] Mockup paths cited as source of truth
- [x] Tokens aligned to stitch visual language
- [x] RTL + Hebrew body font (Heebo)
- [x] Navy primary buttons + status pills
- [x] Shared chrome (sidebar, header, env switcher)
- [x] ui-ux-pro-max skill applied (a11y / interaction pass)
