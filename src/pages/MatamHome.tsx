import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ClipboardPlus,
  FileText,
  MessageSquare,
  Phone,
} from 'lucide-react'
import { TaskList } from '@/components/tasks/TaskList'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { orgNews } from '@/data/mock'
import { matamCaseloadTasks, visibleUnits } from '@/lib/access'
import { greetingHe, cn, formatRelativeHe } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { Task } from '@/types'

type HomeTab = 'attention' | 'open' | 'waiting' | 'recent' | 'all'
type MetricFilter = 'open' | 'overdue' | 'updates' | null

function isOverdue(task: Task) {
  if (!task.dueDate) return false
  if (task.status === 'done' || task.status === 'closed') return false
  return task.dueDate < new Date().toISOString().slice(0, 10)
}

function requiresAttention(task: Task) {
  return task.needsAttention || task.hasNewReply || isOverdue(task)
}

export function MatamHome() {
  const { currentUser, tasks, refreshTasks, searchQuery } = useApp()
  const [tab, setTab] = useState<HomeTab>('attention')
  const [metric, setMetric] = useState<MetricFilter>(null)
  const navigate = useNavigate()

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  const myTasks = useMemo(
    () => matamCaseloadTasks(currentUser, tasks),
    [tasks, currentUser],
  )

  const openCount = myTasks.filter(
    (t) => t.status !== 'done' && t.status !== 'closed',
  ).length
  const overdueCount = myTasks.filter(isOverdue).length
  const updatesCount = myTasks.filter((t) => t.hasNewReply).length
  const attentionCount = myTasks.filter(requiresAttention).length

  const tabs: { id: HomeTab; label: string; count?: number }[] = [
    { id: 'attention', label: 'טיפול מיידי', count: attentionCount },
    { id: 'open', label: 'פתוחות', count: openCount },
    {
      id: 'recent',
      label: 'עודכנו לאחרונה',
      count: updatesCount,
    },
    { id: 'waiting', label: 'ממתינות' },
    { id: 'all', label: 'הכל' },
  ]

  const filtered = useMemo(() => {
    let list = [...myTasks]
    const q = searchQuery.trim()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.includes(q) ||
          t.number.includes(q) ||
          t.description.includes(q),
      )
    }
    if (metric === 'open') {
      list = list.filter((t) => t.status !== 'done' && t.status !== 'closed')
    } else if (metric === 'overdue') {
      list = list.filter(isOverdue)
    } else if (metric === 'updates') {
      list = list.filter((t) => t.hasNewReply)
    } else {
      switch (tab) {
        case 'attention':
          list = list.filter(requiresAttention)
          break
        case 'open':
          list = list.filter(
            (t) => t.status === 'open' || t.status === 'in_progress',
          )
          break
        case 'waiting':
          list = list.filter((t) => t.status === 'waiting')
          break
        case 'recent':
          list = list
            .slice()
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            )
          break
        default:
          break
      }
    }
    return list.slice(0, 10)
  }, [myTasks, tab, metric, searchQuery])

  const myUnits = visibleUnits(currentUser).sort(
    (a, b) => Number(b.needsAttention) - Number(a.needsAttention),
  )
  const waitingUnits = myUnits.filter((u) => u.needsAttention).slice(0, 3)
  const recentFamilies = myUnits.slice(0, 3)
  const nextEvent = orgNews.find((o) => o.kind === 'event')
  const procedure = orgNews.find((o) => o.kind === 'procedure')

  return (
    <div className="space-y-5 motion-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-signal-blue" aria-hidden />
            <h1 className="text-[26px] font-bold leading-tight text-ink-navy text-balance md:text-[28px]">
              {greetingHe()}, {currentUser.name.split(' ')[0]}
            </h1>
          </div>
          <p className="mt-1.5 text-[14px] text-slate-gray">
            {attentionCount} משימות דחופות מתוך {openCount} משימות פתוחות ביחידות
            באחריותך.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
            <CalendarDays className="h-4 w-4" />
            יומן משימות יומי
          </Button>
          <Button size="sm" onClick={() => navigate('/tasks/new')}>
            <ClipboardPlus className="h-4 w-4" />
            פתיחת משימה חדשה
          </Button>
        </div>
      </div>

      <AssumptionBanner>
        מדדים לפי יחידות טיפול באחריות המת״ם — כל המשימות ביחידות אלו, גם אם
        האחראי הניהולי הוא משתמש אחר.
      </AssumptionBanner>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(
          [
            {
              id: 'open' as const,
              label: 'משימות פתוחות',
              value: openCount,
              hint: `מתוך ${myTasks.length} משימות בחודש`,
              accent: 'text-signal-blue bg-badge-bg',
            },
            {
              id: 'overdue' as const,
              label: 'חריגות SLA',
              value: overdueCount,
              hint: 'עיכובים בטיפול',
              accent: 'text-danger bg-danger-bg',
            },
            {
              id: 'updates' as const,
              label: 'עדכונים חדשים',
              value: updatesCount,
              hint: 'ממולקולות וגורמי מדינה',
              accent: 'text-deep-cobalt bg-badge-bg',
            },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={metric === m.id}
            onClick={() => setMetric((prev) => (prev === m.id ? null : m.id))}
            className={cn(
              'cursor-pointer rounded-lg border border-hairline/70 bg-paper px-4 py-3.5 text-start shadow-soft transition-colors duration-200 hover:border-signal-blue/30',
              metric === m.id && 'border-signal-blue ring-1 ring-signal-blue/30',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[28px] font-bold tabular-nums leading-none text-ink-navy">
                  {m.value}
                </div>
                <div className="mt-1.5 text-[13px] font-semibold text-ink-navy">
                  {m.label}
                </div>
                <div className="mt-0.5 text-[12px] text-slate-gray">{m.hint}</div>
              </div>
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold',
                  m.accent,
                )}
              >
                {m.value}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Panel className="!p-0 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-hairline px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <h2 className="text-[17px] font-semibold text-ink-navy">
              המשימות ביחידות שלי
            </h2>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-signal-blue hover:underline"
            >
              למרכז המשימות
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>

          {!metric && (
            <div
              className="flex gap-1 overflow-x-auto border-b border-hairline px-2 py-2 sm:px-4"
              role="tablist"
              aria-label="סינון משימות"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'min-h-9 shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-200',
                    tab === t.id
                      ? 'bg-ink-navy text-paper'
                      : 'text-slate-gray hover:bg-pebble',
                  )}
                >
                  {t.label}
                  {typeof t.count === 'number' ? ` (${t.count})` : ''}
                </button>
              ))}
            </div>
          )}

          {metric && (
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
              <span className="text-[13px] text-slate-gray">מסונן לפי מדד אישי</span>
              <button
                type="button"
                className="min-h-9 cursor-pointer text-[13px] font-semibold text-signal-blue hover:underline"
                onClick={() => setMetric(null)}
              >
                נקה סינון
              </button>
            </div>
          )}

          <TaskList tasks={filtered} compact showOpenAction />
        </Panel>

        <div className="space-y-3">
          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold text-ink-navy">
              קיצורי דרך תפעוליים
            </h3>
            <ul className="space-y-1.5">
              {(
                [
                  {
                    label: 'תיעוד מפגש / שיחה',
                    icon: Phone,
                    to: '/units?intent=visit',
                  },
                  {
                    label: 'פתיחת משימה ליחידה',
                    icon: ClipboardPlus,
                    to: '/tasks/new',
                  },
                  {
                    label: 'שליחת עדכון למולקולה',
                    icon: MessageSquare,
                    to: '/tasks',
                  },
                ] as const
              ).map((a) => (
                <li key={a.label}>
                  <Link
                    to={a.to}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-[13px] font-medium hover:bg-pebble"
                  >
                    <span className="inline-flex items-center gap-2">
                      <a.icon className="h-4 w-4 text-signal-blue" />
                      {a.label}
                    </span>
                    <ChevronLeft className="h-3.5 w-3.5 text-mist-gray" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">משפחות שביקרתי לאחרונה</h3>
            <ul className="space-y-2">
              {recentFamilies.map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/units/${u.id}`}
                    className="block rounded-md px-2 py-1.5 hover:bg-pebble"
                  >
                    <div className="text-[13px] font-semibold">משפחת {u.familyName}</div>
                    <div className="text-[11px] text-mist-gray">
                      {u.region} · {formatRelativeHe(u.lastActivityAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="!p-4">
            <h3 className="mb-3 text-[14px] font-semibold">עדכונים ונהלים</h3>
            <div className="space-y-3">
              {nextEvent && (
                <div className="rounded-md bg-pebble/80 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-signal-blue">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {nextEvent.date}
                  </div>
                  <p className="mt-1 text-[13px] font-semibold">{nextEvent.title}</p>
                </div>
              )}
              {procedure && (
                <div className="flex items-start gap-2 px-1">
                  <FileText className="mt-0.5 h-4 w-4 text-danger" />
                  <div>
                    <p className="text-[13px] font-semibold">{procedure.title}</p>
                    <p className="text-[11px] text-mist-gray">PDF · להורדה</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {waitingUnits.length > 0 && (
        <Panel className="border-danger/25 bg-[#fff8f7] !p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <h2 className="text-[15px] font-semibold text-ink-navy">
              יחידות טיפול הממתינות לך
            </h2>
          </div>
          <ul className="space-y-2">
            {waitingUnits.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 rounded-md border border-danger/15 bg-paper px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold">
                      משפחת {u.familyName}
                    </span>
                    <Badge tone="danger">דורשת התייחסות</Badge>
                  </div>
                  <p className="mt-0.5 text-[12px] text-slate-gray">
                    {u.summary} · {u.overdueTasks} משימות חורגות
                  </p>
                </div>
                <Link
                  to={`/units/${u.id}`}
                  className="shrink-0 text-[13px] font-semibold text-signal-blue hover:underline"
                >
                  מעבר לתיק היחידה ›
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
