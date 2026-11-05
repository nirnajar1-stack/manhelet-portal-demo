import { NavLink, Outlet } from 'react-router-dom'
import {
  Database,
  GitBranch,
  Home,
  KeyRound,
  ListChecks,
  Network,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/rehab-demo', end: true, label: 'סקירת מודל', icon: Home },
  { to: '/rehab-demo/erd', end: false, label: 'ERD וטבלאות', icon: Network },
  { to: '/rehab-demo/households', end: false, label: 'משקי בית', icon: Users },
  { to: '/rehab-demo/programs', end: false, label: 'תוכניות', icon: GitBranch },
  { to: '/rehab-demo/scenarios', end: false, label: 'תרחישים 1–20', icon: ListChecks },
  { to: '/rehab-demo/permissions', end: false, label: 'סימולציית הרשאות', icon: KeyRound },
]

export function RehabDemoLayout() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-signal-blue">Rehab Demo · schema rehab_demo</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight text-ink-navy">
              סייר מודל נתוני שיקום
            </h1>
            <p className="mt-2 max-w-3xl text-[15px] text-slate-gray">
              דמו אינטראקטיבי למודל שישה־שכבתי: משקי בית, תבניות, תוכניות ו־Program_Patient במרכז,
              יעדים, מפגשים והרשאות מפורשות — ללא חיבור ל־Salesforce וללא PII אמיתי.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-badge-bg px-3 py-2 text-[13px] text-ink-navy">
            <Database className="size-4" aria-hidden />
            PGlite · UUID קבועים · 20 תרחישים
          </div>
        </div>
        <nav
          className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-4"
          aria-label="ניווט סייר השיקום"
        >
          {tabs.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[14px] font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-ink-navy text-white'
                    : 'bg-pebble text-ink-navy hover:bg-badge-bg',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
