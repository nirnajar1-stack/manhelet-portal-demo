# Design System — פורטל המנהלת (אבטיפוס)

> **Source of this file:** Restored for PR #13. The prototype shipped tokens in
> `portal/src/index.css` and documented them in `portal/README.md`, but
> `DESIGN.md` itself was missing from the branch. Tokens below match the
> implemented CSS (`Calendly — navy ink on cool marble`) cited in the README —
> **not** a fresh generic government palette.

## Provenance

| Item | Path / note |
|------|-------------|
| Implemented tokens (source of truth in code) | `/workspace/portal/src/index.css` (`@theme` block) |
| Prior citation on branch | `/workspace/portal/README.md` → section «Design system» |
| Skill used for original direction | `.cursor/skills/ui-ux-pro-max` (Calendly-style navy/marble) |
| This document | `/workspace/portal/DESIGN.md` (restored) |

## Brand direction

- **Direction:** Calendly-inspired — navy ink on cool marble
- **Mode:** Light operational UI (enterprise casework)
- **RTL:** Hebrew-first; direction set on `html`
- **Fonts:** Gilroy unavailable as a web font → **Heebo** (Hebrew) + **Manrope** (Latin)

## Color tokens

| Token | Hex | CSS variable |
|-------|-----|--------------|
| Ink Navy | `#0b3558` | `--color-ink-navy` |
| Signal Blue | `#006bff` | `--color-signal-blue` |
| Slate Gray | `#476788` | `--color-slate-gray` |
| Mist Gray | `#a6bbd1` | `--color-mist-gray` |
| Cloud | `#f8f9fb` | `--color-cloud` |
| Paper | `#ffffff` | `--color-paper` |
| Pebble | `#f0f3f8` | `--color-pebble` |
| Hairline | `#d4e0ed` | `--color-hairline` |
| Carbon | `#0a0a0a` | `--color-carbon` |
| Deep Cobalt | `#004eba` | `--color-deep-cobalt` |
| Badge BG | `#e6f0ff` | `--color-badge-bg` |
| Success | `#0f7a4c` / `#e8f7ef` | `--color-success` / `--color-success-bg` |
| Warning | `#9a6700` / `#fff6e0` | `--color-warning` / `--color-warning-bg` |
| Danger | `#b42318` / `#feeceb` | `--color-danger` / `--color-danger-bg` |

Shadows use blue-gray (slate) opacity — not neutral black.

## Typography scale

| Role | Size |
|------|------|
| Caption | 12px |
| Body sm | 14px |
| Body | 16px |
| Button | 18px |
| Body lg | 20px |
| Subheading | 28px |
| Heading sm | 38px |

Font stack: `"Heebo", "Manrope", ui-sans-serif, system-ui, sans-serif`

## Radii & spacing

- Buttons / fields: **8px** (`--radius-md`)
- Product cards / rows: **16px** (`--radius-lg`)
- Panels: **24px** (`--radius-xl`)
- Spacing steps: 8 / 16 / 24 / 32 / 40 / 48 / 64

## Layout patterns (portal)

- Persistent **right sidebar** (RTL) for matam / molecule ops roles
- Top bar: search, notifications, new action, profile
- Family portal: minimal shell without ops nav
- Mobile: drawer nav + FAB for new action

## Anti-patterns to avoid

- Purple-on-white / indigo glow themes
- Warm cream + terracotta editorial look
- Dense broadsheet newspaper columns
- Using «דורש טיפול» as a business task status (it is an indicator)
- Hard-coded deep links to specific demo families in quick actions

## Checklist

- [x] Tokens mirrored from `src/index.css`
- [x] RTL + Hebrew body font
- [x] Focus ring via Signal Blue
- [x] Responsive breakpoints for mobile / desktop shell
