import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckSquare,
  CircleHelp,
  Database,
  HeartHandshake,
  Home,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Clapperboard,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchNotifications } from '@/api/stubs'
import { users } from '@/data/mock'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { NotificationItem, UserRole } from '@/types'

const matamNav = [
  { to: '/', label: 'סביבת העבודה שלי', icon: Home },
  { to: '/tasks', label: 'מרכז המשימות', icon: CheckSquare, badgeKey: 'tasks' as const },
  { to: '/units', label: 'משפחות ויחידות טיפול', icon: Users },
  { to: '/programs', label: 'תוכניות, אירועים והטבות', icon: CalendarDays },
  { to: '/knowledge', label: 'מרכז ידע ונהלים', icon: BookOpen },
  { to: '/org', label: 'בית המנהלת', icon: Building2 },
  { to: '/rehab/bank', label: 'בנק מטרות שיקום', icon: HeartHandshake },
  { to: '/rehab-demo', label: 'סייר מודל שיקום', icon: Database },
  { to: '/stageshow', label: 'הדגמות מוצר', icon: Clapperboard },
]

const moleculeNav = [
  { to: '/molecule', label: 'סביבת מולקולה', icon: Home },
  { to: '/tasks', label: 'מרכז המשימות', icon: CheckSquare, badgeKey: 'tasks' as const },
  { to: '/units', label: 'משפחות ויחידות טיפול', icon: Users },
  { to: '/org', label: 'בית המנהלת', icon: Building2 },
]

/**
 * Navigation: persistent right sidebar (RTL) + top chrome matching Stitch mockups.
 * Family portal uses a separate minimal shell.
 */
export function AppShell() {
  const {
    currentUser,
    setRole,
    switchUser,
    searchQuery,
    setSearchQuery,
    toast,
    tasks,
  } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotificationItem[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const onFamilyRoute = location.pathname.startsWith('/family')
  const isFamily = currentUser.role === 'family' || onFamilyRoute
  const nav = currentUser.role === 'molecule' ? moleculeNav : matamNav
  const attentionCount = tasks.filter(
    (t) => t.needsAttention || t.hasNewReply,
  ).length

  useEffect(() => {
    void fetchNotifications().then(setNotifs)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (onFamilyRoute && currentUser.role !== 'family') {
      setRole('family')
    }
  }, [onFamilyRoute, currentUser.role, setRole])

  if (isFamily) {
    return (
      <div className="min-h-screen bg-cloud">
        <a href="#main-content" className="skip-link">
          דלג לתוכן הראשי
        </a>
        <header className="sticky top-0 z-40 border-b border-hairline bg-paper/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
            <Link to="/family" className="text-[16px] font-semibold tracking-tight text-ink-navy">
              הפורטל למשפחות
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRole('matam')
                  navigate('/')
                }}
              >
                מעבר לתצוגת עובדים
              </Button>
              <span className="rounded-full bg-pebble px-3 py-1.5 text-[13px] font-medium">
                {currentUser.name}
              </span>
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <Outlet />
        </main>
        {toast && <Toast message={toast} />}
      </div>
    )
  }

  const unread = notifs.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-cloud">
      <a href="#main-content" className="skip-link">
        דלג לתוכן הראשי
      </a>
      <header className="sticky top-0 z-40 border-b border-hairline bg-paper">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-ink-navy transition-colors duration-200 hover:bg-soft-cyan lg:hidden"
            aria-label="תפריט"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <Link
            to="/"
            className="hidden min-w-[160px] shrink-0 rounded-[10px] py-1 sm:block focus-visible:outline-none"
          >
            <div className="text-[14px] font-semibold leading-tight tracking-tight text-ink-navy">
              מנהלת החטופים,
            </div>
            <div className="mt-0.5 text-[11px] leading-tight text-slate-gray">
              הנעדרים והשבים · משרד רה״מ
            </div>
          </Link>

          <div className="relative mx-auto flex w-full max-w-2xl flex-1 items-center gap-2">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-gray"
                aria-hidden
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate('/tasks')
                }}
                placeholder="חיפוש מהיר: משימה, משפחה, אדם או יחידת טיפול…"
                className="h-10 border-hairline bg-pebble pe-10 text-[14px] text-ink-navy placeholder:text-slate-gray"
                aria-label="חיפוש מרכזי"
              />
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-[10px] bg-pebble px-2.5 py-1.5 text-[11px] font-medium text-slate-gray xl:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-signal-blue" aria-hidden />
              ממשלתי מאובטח
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => navigate('/tasks/new')}
            >
              <Plus className="h-4 w-4" aria-hidden />
              פעולה חדשה
            </Button>

            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-[10px] text-slate-gray transition-colors duration-200 hover:bg-soft-cyan md:inline-flex sm:h-9 sm:w-9"
              aria-label="עזרה"
            >
              <CircleHelp className="h-5 w-5" aria-hidden />
            </button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`התראות${unread ? `, ${unread} חדשות` : ''}`}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell className="h-5 w-5" aria-hidden />
                {unread > 0 && (
                  <span
                    className="absolute start-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-paper"
                    aria-hidden
                  >
                    {unread}
                  </span>
                )}
              </Button>
              {unread > 0 && (
                <span className="sr-only" role="status" aria-atomic="true">
                  {unread} התראות שלא נקראו
                </span>
              )}
              {notifOpen && (
                <div
                  role="dialog"
                  aria-label="התראות"
                  className="absolute end-0 top-12 z-50 w-80 rounded-xl border border-hairline bg-paper p-2 shadow-elevated motion-fade-in"
                >
                  <p className="px-2 py-1.5 text-[12px] font-semibold text-slate-gray">
                    התראות
                  </p>
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={cn(
                        'block w-full cursor-pointer rounded-[10px] px-2.5 py-3 text-start transition-colors duration-200 hover:bg-pebble',
                        !n.read && 'bg-badge-bg/40',
                      )}
                      onClick={() => {
                        if (n.href) navigate(n.href)
                        setNotifOpen(false)
                      }}
                    >
                      <div className="text-[14px] font-semibold">{n.title}</div>
                      <div className="text-[12px] text-slate-gray">{n.body}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="flex min-h-11 items-center gap-2 rounded-[10px] px-1.5 py-1 transition-colors duration-200 hover:bg-pebble sm:min-h-0"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="פרופיל והחלפת תפקיד"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-navy text-[12px] font-semibold text-paper">
                  {currentUser.avatarInitials}
                </span>
                <span className="hidden text-start lg:block">
                  <span className="block text-[13px] font-semibold leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="block text-[11px] text-slate-gray">
                    {currentUser.title}
                  </span>
                </span>
              </button>
              {profileOpen && (
                <div
                  role="menu"
                  aria-label="החלפת משתמש"
                  className="absolute end-0 top-12 z-50 w-72 rounded-xl border border-hairline bg-paper p-2 shadow-elevated motion-fade-in"
                >
                  <p className="px-2 py-1.5 text-[12px] font-semibold text-slate-gray">
                    החלפת משתמש / תפקיד (דמה)
                  </p>
                  {users
                    .filter((u) => u.role !== 'family')
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        role="menuitem"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-2.5 py-3 text-start transition-colors duration-200 hover:bg-pebble"
                        onClick={() => {
                          switchUser(u.id)
                          if (u.role === 'molecule') navigate('/molecule')
                          else navigate('/')
                        }}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pebble text-[11px] font-semibold">
                          {u.avatarInitials}
                        </span>
                        <span>
                          <span className="block text-[13px] font-semibold">
                            {u.name}
                          </span>
                          <span className="block text-[11px] text-slate-gray">
                            {u.title}
                          </span>
                        </span>
                      </button>
                    ))}
                  <button
                    type="button"
                    role="menuitem"
                    className="mt-1 w-full cursor-pointer rounded-[10px] px-2.5 py-3 text-start text-[13px] font-medium text-signal-blue transition-colors duration-200 hover:bg-pebble"
                    onClick={() => {
                      setRole('family' as UserRole)
                      navigate('/family')
                    }}
                  >
                    מעבר לפורטל משפחות
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[248px] shrink-0 flex-col bg-ink-navy lg:flex">
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="ניווט ראשי">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/molecule'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-paper/90 transition-colors duration-150 hover:bg-paper/10 hover:text-paper',
                    isActive && 'bg-dusk-blue text-ink-navy hover:bg-dusk-blue hover:text-ink-navy',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-ink-navy' : 'text-paper/80',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                    {'badgeKey' in item &&
                      item.badgeKey === 'tasks' &&
                      attentionCount > 0 && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 text-[11px] font-bold whitespace-nowrap',
                            isActive
                              ? 'bg-ink-navy/15 text-ink-navy'
                              : 'bg-gold text-ink-navy',
                          )}
                          title={`${attentionCount} משימות דורשות טיפול`}
                        >
                          {attentionCount}
                          <span className="sr-only"> משימות דורשות טיפול</span>
                        </span>
                      )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-paper/20 p-4">
            <p className="mb-2.5 px-1 text-[11px] font-semibold tracking-wide text-paper/70">
              החלפת סביבה
            </p>
            <div
              className="space-y-0.5 rounded-xl bg-paper/10 p-1.5"
              role="radiogroup"
              aria-label="החלפת סביבה"
            >
              <EnvOption
                active={currentUser.role === 'matam'}
                label="מת״מים ומנהלי תיק"
                onDark
                onClick={() => {
                  setRole('matam')
                  navigate('/')
                }}
              />
              <EnvOption
                active={currentUser.role === 'molecule'}
                label="מרחב מולקולות"
                onDark
                onClick={() => {
                  switchUser('u-dana')
                  navigate('/molecule')
                }}
              />
              <EnvOption
                active={false}
                label="תצוגת שירות למשפחות"
                onDark
                onClick={() => {
                  setRole('family')
                  navigate('/family')
                }}
              />
            </div>
            <p className="mt-4 px-1 text-[11px] leading-relaxed text-paper/60">
              אבטיפוס · נתוני דמה · אין Salesforce
            </p>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" id="mobile-nav">
            <button
              type="button"
              className="absolute inset-0 bg-ink-navy/45"
              aria-label="סגור תפריט"
              onClick={() => setMobileOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="תפריט ניווט"
              className="absolute inset-y-0 end-0 flex w-[min(20rem,88vw)] flex-col border-s border-paper/15 bg-ink-navy shadow-elevated motion-fade-in"
            >
              <div className="flex items-center justify-between border-b border-paper/20 p-5">
                <span className="font-semibold text-paper">תפריט</span>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-paper hover:bg-paper/10"
                  onClick={() => setMobileOpen(false)}
                  aria-label="סגור"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <nav
                className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
                aria-label="ניווט ראשי"
              >
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/' || item.to === '/molecule'}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-3 text-[14px] font-medium transition-colors duration-200',
                        isActive
                          ? 'bg-dusk-blue text-ink-navy'
                          : 'text-paper/90 hover:bg-paper/10 hover:text-paper',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-ink-navy' : 'text-paper/75',
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                        {'badgeKey' in item &&
                          item.badgeKey === 'tasks' &&
                          attentionCount > 0 && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 text-[11px] font-bold whitespace-nowrap',
                                isActive
                                  ? 'bg-ink-navy/15 text-ink-navy'
                                  : 'bg-gold text-ink-navy',
                              )}
                            >
                              {attentionCount}
                              <span className="sr-only"> משימות דורשות טיפול</span>
                            </span>
                          )}
                      </>
                    )}
                  </NavLink>
                ))}
                <Button className="mt-4" onClick={() => navigate('/tasks/new')}>
                  <Plus className="h-4 w-4" aria-hidden />
                  פעולה חדשה
                </Button>
              </nav>

              <div className="border-t border-paper/20 p-4">
                <p className="mb-2.5 px-1 text-[11px] font-semibold tracking-wide text-paper/70">
                  החלפת סביבה
                </p>
                <div
                  className="space-y-0.5 rounded-xl bg-paper/10 p-1.5"
                  role="radiogroup"
                  aria-label="החלפת סביבה"
                >
                  <EnvOption
                    active={currentUser.role === 'matam'}
                    label="מת״מים ומנהלי תיק"
                    onDark
                    onClick={() => {
                      setRole('matam')
                      setMobileOpen(false)
                      navigate('/')
                    }}
                  />
                  <EnvOption
                    active={currentUser.role === 'molecule'}
                    label="מרחב מולקולות"
                    onDark
                    onClick={() => {
                      switchUser('u-dana')
                      setMobileOpen(false)
                      navigate('/molecule')
                    }}
                  />
                  <EnvOption
                    active={false}
                    label="תצוגת שירות למשפחות"
                    onDark
                    onClick={() => {
                      setRole('family')
                      setMobileOpen(false)
                      navigate('/family')
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <button
        type="button"
        className="fixed bottom-5 start-5 z-30 flex h-12 w-12 items-center justify-center rounded-[10px] bg-gold text-ink-navy shadow-button transition-colors duration-200 hover:bg-gold-hover sm:hidden"
        aria-label="פעולה חדשה"
        onClick={() => navigate('/tasks/new')}
      >
        <Plus className="h-6 w-6" aria-hidden />
      </button>

      {toast && <Toast message={toast} />}
    </div>
  )
}

function EnvOption({
  active,
  label,
  onClick,
  onDark = false,
}: {
  active: boolean
  label: string
  onClick: () => void
  onDark?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-[10px] px-2 py-2.5 text-start text-[12px] font-medium transition-colors duration-200',
        onDark
          ? active
            ? 'bg-dusk-blue text-ink-navy'
            : 'text-paper/85 hover:bg-paper/10 hover:text-paper'
          : active
            ? 'bg-paper text-ink-navy'
            : 'text-slate-gray hover:bg-paper/70',
      )}
    >
      <span
        className={cn(
          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
          active
            ? onDark
              ? 'border-ink-navy bg-gold'
              : 'border-dusk-blue bg-dusk-blue'
            : onDark
              ? 'border-paper/55 bg-transparent'
              : 'border-mist-gray bg-transparent',
        )}
        aria-hidden
      >
        {active && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              onDark ? 'bg-ink-navy' : 'bg-paper',
            )}
          />
        )}
      </span>
      {label}
    </button>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-ink-navy px-4 py-2.5 text-[14px] font-medium text-paper shadow-elevated motion-fade-in"
    >
      {message}
    </div>
  )
}
