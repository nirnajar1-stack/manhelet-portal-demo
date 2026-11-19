import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarHeart,
  ClipboardList,
  Headset,
  Home,
  Menu,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react'
import { BrandLogo } from '@/components/shell/BrandLogo'
import { Button } from '@/components/ui/button'
import {
  familiesCompanion,
  familiesPortalProfile,
} from '@/data/families-portal-seed'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import './families.css'

const navItems = [
  { to: '/families', end: true, label: 'הבית שלי', icon: Home },
  {
    to: '/families/requests',
    label: 'הבקשות והסיוע שלי',
    icon: ClipboardList,
  },
  {
    to: '/families/programs',
    label: 'תוכניות, אירועים והטבות',
    icon: CalendarHeart,
  },
  {
    to: '/families/companion',
    label: 'קשר עם המלווה שלי',
    icon: MessageCircle,
  },
] as const

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="ניווט פורטל משפחות">
      {navItems.map(({ to, label, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={'end' in rest ? rest.end : false}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors duration-150',
              isActive
                ? 'bg-ink-navy text-paper'
                : 'text-ink-navy hover:bg-soft-cyan',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span className="leading-snug">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function CompanionMini({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-hairline bg-soft-cyan/60 p-3',
        compact && 'p-2.5',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-navy text-[14px] font-semibold text-paper">
          {familiesCompanion.initials}
          <span
            className="absolute bottom-0 start-0 h-2.5 w-2.5 rounded-full border-2 border-paper bg-success"
            title={familiesCompanion.availableLabel}
            aria-hidden
          />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-gray">
            המלווה האישי שלכם
          </p>
          <p className="truncate text-[14px] font-semibold text-ink-navy">
            {familiesCompanion.name}
          </p>
        </div>
      </div>
      <Button asChild variant="dark" size="sm" className="mt-2.5 w-full">
        <Link to="/families/companion">פנייה ישירה לניר</Link>
      </Button>
    </div>
  )
}

function FamilyFooterCard() {
  return (
    <div className="rounded-xl border border-hairline bg-paper p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pebble text-[12px] font-bold text-ink-navy">
          אא
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink-navy">
            {familiesPortalProfile.familyName}
          </p>
          <p className="text-[11px] text-slate-gray">
            תיק #{familiesPortalProfile.fileNumber} ·{' '}
            <span className="text-success">{familiesPortalProfile.status}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Family-facing chrome: light SaaS shell with RTL sidebar nav (distinct from מת״ם ops).
 */
export function FamiliesShell() {
  const { setRole, toast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-cloud">
      <header className="sticky top-0 z-40 border-b border-hairline bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-ink-navy hover:bg-soft-cyan lg:hidden"
              aria-label="תפריט"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <BrandLogo
              to="/families"
              size="sm"
              imgClassName="max-w-[9.5rem] sm:max-w-[11rem]"
            />
            <div className="hidden min-w-0 md:block">
              <p className="text-[14px] font-semibold tracking-tight text-ink-navy">
                פורטל המשפחות
              </p>
              <p className="truncate text-[11px] text-slate-gray">
                מנהלת החטופים, הנעדרים והשבים · משרד רה״מ
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <p className="hidden max-w-[220px] truncate text-[12px] text-slate-gray lg:block xl:max-w-none">
              שלום, {familiesPortalProfile.viewerFullName}.{' '}
              <span className="text-ink-navy/80">
                {familiesPortalProfile.greetingTagline}
              </span>
            </p>
            <Button variant="soft" size="sm" className="hidden sm:inline-flex" asChild>
              <a href="tel:*8855">
                <Headset className="h-4 w-4" aria-hidden />
                פניות ושירות
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRole('matam')
                navigate('/')
              }}
            >
              <span className="hidden sm:inline">מעבר לעובדים</span>
              <span className="sm:hidden">עובדים</span>
            </Button>
            <span className="hidden items-center gap-2 rounded-full bg-pebble px-2.5 py-1.5 sm:inline-flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-navy text-[11px] font-semibold text-paper">
                אא
              </span>
              <span className="text-[12px] font-medium text-ink-navy">
                {familiesPortalProfile.viewerFirstName}
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[260px] shrink-0 flex-col gap-4 overflow-y-auto border-e border-hairline bg-paper p-4 lg:flex">
          <CompanionMini />
          <NavList />
          <div className="mt-auto space-y-3 pt-4">
            <FamilyFooterCard />
            <a
              href="tel:*8855"
              className="flex items-center gap-2 rounded-[10px] px-2 py-2 text-[12px] font-medium text-signal-blue hover:bg-soft-cyan"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              מוקד המנהלת · <span dir="ltr">*8855</span>
            </a>
          </div>
        </aside>

        <main
          id="main-content"
          className="min-w-0 flex-1 px-3 py-5 sm:px-5 sm:py-7 lg:px-6 lg:py-8"
        >
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink-navy/40"
            aria-label="סגירת תפריט"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 end-0 flex w-[min(100%,20rem)] flex-col gap-4 overflow-y-auto bg-paper p-4 shadow-elevated">
            <div className="flex items-center justify-between gap-2">
              <BrandLogo to="/families" size="sm" />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-soft-cyan"
                aria-label="סגור"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <CompanionMini compact />
            <NavList onNavigate={() => setMobileOpen(false)} />
            <FamilyFooterCard />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRole('matam')
                navigate('/')
              }}
            >
              מעבר לתצוגת עובדים
            </Button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 start-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-ink-navy px-4 py-2.5 text-[13px] font-medium text-paper shadow-elevated"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
