import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckSquare,
  CircleHelp,
  Home,
  Menu,
  Plus,
  Search,
  ShieldCheck,
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
        <header className="sticky top-0 z-40 border-b border-hairline bg-paper/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
            <Link to="/family" className="text-[16px] font-bold text-ink-navy">
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
              <span className="rounded-full bg-pebble px-3 py-1 text-[13px] font-medium">
                {currentUser.name}
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-4 py-6">
          <Outlet />
        </main>
        {toast && <Toast message={toast} />}
      </div>
    )
  }

  const unread = notifs.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-cloud">
      <header className="sticky top-0 z-40 border-b border-hairline bg-paper">
        <div className="flex h-[64px] items-center gap-3 px-4 lg:px-5">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-pebble lg:hidden"
            aria-label="תפריט"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="hidden min-w-[148px] shrink-0 sm:block">
            <div className="text-[13px] font-bold leading-tight text-ink-navy">
              מנהלת החטופים,
            </div>
            <div className="text-[11px] leading-tight text-slate-gray">
              הנעדרים והשבים · משרד רה״מ
            </div>
          </Link>

          <div className="relative mx-auto flex w-full max-w-2xl flex-1 items-center gap-2">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-gray" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate('/tasks')
                }}
                placeholder="חיפוש מהיר: משימה, משפחה, אדם או יחידת טיפול…"
                className="h-10 border-transparent bg-pebble pe-10 text-[13px]"
                aria-label="חיפוש מרכזי"
              />
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-md bg-pebble px-2 py-1.5 text-[11px] font-medium text-slate-gray xl:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-signal-blue" />
              ממשלתי מאובטח
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => navigate('/tasks/new')}
            >
              <Plus className="h-4 w-4" />
              פעולה חדשה
            </Button>

            <button
              type="button"
              className="hidden h-9 w-9 items-center justify-center rounded-md text-slate-gray hover:bg-pebble md:inline-flex"
              aria-label="עזרה"
            >
              <CircleHelp className="h-5 w-5" />
            </button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`התראות${unread ? `, ${unread} חדשות` : ''}`}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute start-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-paper">
                    {unread}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <div className="absolute end-0 top-12 z-50 w-80 rounded-lg border border-hairline bg-paper p-2 shadow-elevated">
                  <p className="px-2 py-1 text-[12px] font-semibold text-slate-gray">
                    התראות
                  </p>
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={cn(
                        'block w-full rounded-md px-2 py-2 text-start hover:bg-pebble',
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
                className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-pebble"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="פרופיל והחלפת תפקיד"
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
                <div className="absolute end-0 top-12 z-50 w-72 rounded-lg border border-hairline bg-paper p-2 shadow-elevated">
                  <p className="px-2 py-1 text-[12px] font-semibold text-slate-gray">
                    החלפת משתמש / תפקיד (דמה)
                  </p>
                  {users
                    .filter((u) => u.role !== 'family')
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-start hover:bg-pebble"
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
                    className="mt-1 w-full rounded-md px-2 py-2 text-start text-[13px] font-medium text-signal-blue hover:bg-pebble"
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

      <div className="mx-auto flex max-w-[1480px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[232px] shrink-0 flex-col border-s border-hairline bg-paper lg:flex">
          <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="ניווט ראשי">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/molecule'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium text-ink-navy hover:bg-pebble',
                    isActive && 'bg-ink-navy text-paper hover:bg-ink-navy',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-paper' : 'text-slate-gray',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                    {'badgeKey' in item &&
                      item.badgeKey === 'tasks' &&
                      attentionCount > 0 && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 text-[11px] font-bold',
                            isActive
                              ? 'bg-paper/20 text-paper'
                              : 'bg-danger text-paper',
                          )}
                        >
                          {attentionCount}
                        </span>
                      )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-hairline p-3">
            <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-mist-gray">
              החלפת סביבה
            </p>
            <div className="space-y-1 rounded-lg bg-pebble/70 p-2">
              <EnvOption
                active={currentUser.role === 'matam'}
                label="מת״מים ומנהלי תיק"
                onClick={() => {
                  setRole('matam')
                  navigate('/')
                }}
              />
              <EnvOption
                active={currentUser.role === 'molecule'}
                label="מרחב מולקולות"
                onClick={() => {
                  switchUser('u-dana')
                  navigate('/molecule')
                }}
              />
              <EnvOption
                active={false}
                label="תצוגת שירות למשפחות"
                onClick={() => {
                  setRole('family')
                  navigate('/family')
                }}
              />
            </div>
            <p className="mt-3 px-1 text-[10px] leading-relaxed text-mist-gray">
              אבטיפוס · נתוני דמה · אין Salesforce
            </p>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink-navy/30"
              aria-label="סגור תפריט"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 end-0 flex w-80 flex-col bg-paper shadow-elevated">
              <div className="flex items-center justify-between border-b border-hairline p-4">
                <span className="font-bold">תפריט</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="סגור"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 p-3">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/' || item.to === '/molecule'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-3 text-[14px] font-medium',
                        isActive
                          ? 'bg-ink-navy text-paper'
                          : 'hover:bg-pebble',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
                <Button className="mt-3" onClick={() => navigate('/tasks/new')}>
                  <Plus className="h-4 w-4" />
                  פעולה חדשה
                </Button>
              </nav>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-6">
          <Outlet />
        </main>
      </div>

      <button
        type="button"
        className="fixed bottom-5 start-5 z-30 flex h-12 w-12 items-center justify-center rounded-md bg-ink-navy text-paper shadow-button sm:hidden"
        aria-label="פעולה חדשה"
        onClick={() => navigate('/tasks/new')}
      >
        <Plus className="h-6 w-6" />
      </button>

      {toast && <Toast message={toast} />}
    </div>
  )
}

function EnvOption({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[12px] font-medium',
        active
          ? 'bg-paper text-ink-navy shadow-soft'
          : 'text-slate-gray hover:bg-paper/70',
      )}
    >
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
          active
            ? 'border-signal-blue bg-signal-blue'
            : 'border-mist-gray bg-transparent',
        )}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-paper" />}
      </span>
      {label}
    </button>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 start-1/2 z-50 -translate-x-1/2 rounded-md bg-ink-navy px-4 py-2.5 text-[14px] font-medium text-paper shadow-elevated"
    >
      {message}
    </div>
  )
}
