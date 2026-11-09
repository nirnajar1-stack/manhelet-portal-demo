import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
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

  const metrics = [
    {
      id: 'open' as const,
      label: 'משימות פתוחות',
      value: openCount,
      hint: `מתוך ${myTasks.length}`,
      emphasize: false,
    },
    {
      id: 'overdue' as const,
      label: 'חריגות SLA',
      value: overdueCount,
      hint: 'עיכובים בטיפול',
      emphasize: true,
    },
    {
      id: 'updates' as const,
      label: 'עדכונים חדשים',
      value: updatesCount,
      hint: 'ממולקולות וגורמי מדינה',
      emphasize: false,
    },
  ]

  return (
    <div className="page-stack motion-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">
            {greetingHe()}, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="page-lede">
            {attentionCount > 0 ? (
              <>
                <span className="font-medium text-ink-navy">{attentionCount}</span>
                {' '}משימות דורשות טיפול מתוך {openCount} פתוחות ביחידות באחריותך.
              </>
            ) : (
              <>אין משימות דחופות · {openCount} משימות פתוחות ביחידות באחריותך.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
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

      {/* KPI strip — single surface, not identical cards */}
      <div className="kpi-strip sm:grid-cols-3" role="group" aria-label="מדדים אישיים">
        {metrics.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={metric === m.id}
            onClick={() => setMetric((prev) => (prev === m.id ? null : m.id))}
            className={cn(
              'kpi-cell cursor-pointer',
              m.emphasize && m.value > 0 && metric !== m.id && 'bg-gold-wash/40',
            )}
          >
            <span
              className={cn(
                'kpi-value',
                m.emphasize && m.value > 0 && 'text-warning-text',
              )}
            >
              {m.value}
            </span>
            <span className="kpi-label">{m.label}</span>
            <span className="text-[11px] text-mist-gray">{m.hint}</span>
          </button>
        ))}
      </div>

      {waitingUnits.length > 0 && (
        <div className="rounded-xl border border-danger/20 bg-danger-soft/60 px-4 py-3.5">
          <div className="mb-2.5 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-danger" aria-hidden />
            <h2 className="text-[13px] font-semibold text-ink-navy">
              יחידות הממתינות לך
            </h2>
          </div>
          <ul className="divide-y divide-danger/10">
            {waitingUnits.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13px] font-medium">
                      משפחת {u.familyName}
                    </span>
                    <Badge tone="danger">דורשת התייחסות</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-slate-gray">
                    {u.summary} · {u.overdueTasks} משימות חורגות
                  </p>
                </div>
                <Link
                  to={`/units/${u.id}`}
                  className="shrink-0 text-[12px] font-semibold text-signal-blue hover:underline"
                >
                  מעבר לתיק ›
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Panel className="!p-0 overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-hairline px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[17px] font-semibold tracking-tight text-ink-navy">
              המשימות ביחידות שלי
            </h2>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-signal-blue hover:underline"
            >
              למרכז המשימות
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!metric && (
            <div
              className="flex gap-1 overflow-x-auto border-b border-hairline px-3 py-2 sm:px-4"
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
                    'filter-chip cursor-pointer',
                    tab === t.id ? 'filter-chip-active' : 'filter-chip-idle',
                  )}
                >
                  {t.label}
                  {typeof t.count === 'number' ? ` (${t.count})` : ''}
                </button>
              ))}
            </div>
          )}

          {metric && (
            <div className="flex items-center justify-between border-b border-hairline px-5 py-2.5">
              <span className="text-[12px] text-slate-gray">מסונן לפי מדד אישי</span>
              <button
                type="button"
                className="min-h-8 cursor-pointer text-[12px] font-semibold text-signal-blue hover:underline"
                onClick={() => setMetric(null)}
              >
                נקה סינון
              </button>
            </div>
          )}

          <TaskList tasks={filtered} compact showOpenAction />
        </Panel>

        <aside className="space-y-0 divide-y divide-hairline rounded-xl border border-hairline bg-paper">
          <div className="p-5">
            <h3 className="section-label mb-3">קיצורי דרך</h3>
            <ul className="space-y-0.5">
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
                    className="flex items-center justify-between gap-2 rounded-[10px] px-2 py-2 text-[13px] font-medium hover:bg-soft-cyan"
                  >
                    <span className="inline-flex items-center gap-2">
                      <a.icon className="h-3.5 w-3.5 text-slate-gray" aria-hidden />
                      {a.label}
                    </span>
                    <ChevronLeft className="h-3.5 w-3.5 text-mist-gray" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5">
            <h3 className="section-label mb-3">משפחות אחרונות</h3>
            <ul className="space-y-1">
              {recentFamilies.map((u) => (
                <li key={u.id}>
                  <Link
                    to={`/units/${u.id}`}
                    className="block rounded-[10px] px-2 py-2 hover:bg-soft-cyan"
                  >
                    <div className="text-[13px] font-medium">משפחת {u.familyName}</div>
                    <div className="text-[11px] text-mist-gray">
                      {u.region} · {formatRelativeHe(u.lastActivityAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5">
            <h3 className="section-label mb-3">עדכונים ונהלים</h3>
            <div className="space-y-3">
              {nextEvent && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-signal-blue">
                    <CalendarDays className="h-3 w-3" aria-hidden />
                    {nextEvent.date}
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium leading-snug">
                    {nextEvent.title}
                  </p>
                </div>
              )}
              {procedure && (
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-gray" aria-hidden />
                  <div>
                    <p className="text-[13px] font-medium">{procedure.title}</p>
                    <p className="text-[11px] text-mist-gray">PDF · להורדה</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
