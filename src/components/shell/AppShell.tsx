import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Building2,
  CheckSquare,
  Home,
  Menu,
  Plus,
  Search,
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
  { to: '/', label: 'ראשי', icon: Home },
  { to: '/tasks', label: 'משימות', icon: CheckSquare },
  { to: '/units', label: 'יחידות טיפול', icon: Users },
  { to: '/knowledge', label: 'ידע וכלים', icon: BookOpen },
  { to: '/org', label: 'בית המנהלת', icon: Building2 },
]

const moleculeNav = [
  { to: '/molecule', label: 'ראשי מולקולה', icon: Home },
  { to: '/tasks', label: 'משימות', icon: CheckSquare },
  { to: '/units', label: 'יחידות טיפול', icon: Users },
  { to: '/org', label: 'בית המנהלת', icon: Building2 },
]

/**
 * Navigation decision: persistent right-side sidebar for operational roles.
 * Top bar holds search, notifications, new action, and profile.
 * Family portal uses a separate minimal shell (no ops nav).
 */
export function AppShell() {
  const { currentUser, setRole, switchUser, searchQuery, setSearchQuery, toast } =
    useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotificationItem[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const onFamilyRoute = location.pathname.startsWith('/family')
  const isFamily = currentUser.role === 'family' || onFamilyRoute
  const nav = currentUser.role === 'molecule' ? moleculeNav : matamNav

  useEffect(() => {
    void fetchNotifications().then(setNotifs)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  // Keep persona aligned with route for demo navigation
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
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-paper/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-pebble lg:hidden"
            aria-label="תפריט"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="hidden min-w-0 shrink-0 sm:block">
            <div className="text-[13px] font-bold leading-tight text-ink-navy">
              מנהלת החטופים,
            </div>
            <div className="text-[12px] leading-tight text-slate-gray">
              הנעדרים והשבים
            </div>
          </Link>

          <div className="relative mx-auto w-full max-w-xl flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-gray" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/tasks')
              }}
              placeholder="חיפוש משימות, משפחות, יחידות…"
              className="pe-10"
              aria-label="חיפוש מרכזי"
            />
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`התראות${unread ? `, ${unread} חדשות` : ''}`}
              onClick={() => setNotifOpen((v) => !v)}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute start-1.5 top-1.5 h-2 w-2 rounded-full bg-signal-blue" />
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

          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => navigate('/tasks/new')}
          >
            <Plus className="h-4 w-4" />
            פעולה חדשה
          </Button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-pebble"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="פרופיל והחלפת תפקיד"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-navy text-[12px] font-semibold text-paper">
                {currentUser.avatarInitials}
              </span>
              <span className="hidden text-start md:block">
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
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Desktop sidebar — right in RTL */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 border-s border-hairline bg-paper/60 p-3 lg:block">
          <nav className="flex flex-col gap-1" aria-label="ניווט ראשי">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/molecule'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2.5 text-[14px] font-medium text-ink-navy hover:bg-pebble',
                    isActive && 'bg-badge-bg text-signal-blue',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 rounded-lg bg-pebble p-3 text-[11px] leading-relaxed text-slate-gray">
            אבטיפוס Frontend · נתוני דמה בלבד · אין חיבור ל־Salesforce
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink-navy/30"
              aria-label="סגור תפריט"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 end-0 w-72 bg-paper p-4 shadow-elevated">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-bold">תפריט</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="סגור"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/' || item.to === '/molecule'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-3 text-[15px] font-medium',
                        isActive ? 'bg-badge-bg text-signal-blue' : 'hover:bg-pebble',
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

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        className="fixed bottom-5 start-5 z-30 flex h-12 w-12 items-center justify-center rounded-md bg-signal-blue text-paper shadow-button sm:hidden"
        aria-label="פעולה חדשה"
        onClick={() => navigate('/tasks/new')}
      >
        <Plus className="h-6 w-6" />
      </button>

      {toast && <Toast message={toast} />}
    </div>
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
