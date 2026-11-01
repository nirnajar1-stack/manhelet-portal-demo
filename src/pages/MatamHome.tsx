import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ClipboardPlus,
  FolderSearch,
  Home,
  UserRoundSearch,
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

const tabs: { id: HomeTab; label: string }[] = [
  { id: 'attention', label: 'דורש טיפול' },
  { id: 'open', label: 'פתוחות' },
  { id: 'waiting', label: 'ממתינות' },
  { id: 'recent', label: 'עודכנו לאחרונה' },
  { id: 'all', label: 'כלל המשימות' },
]

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
  const [orgOpen, setOrgOpen] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  // All tasks in units this matam is responsible for (not only assignee)
  const myTasks = useMemo(
    () => matamCaseloadTasks(currentUser, tasks),
    [tasks, currentUser],
  )

  const openCount = myTasks.filter(
    (t) => t.status !== 'done' && t.status !== 'closed',
  ).length
  const overdueCount = myTasks.filter(isOverdue).length
  const updatesCount = myTasks.filter((t) => t.hasNewReply).length

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
    return list.slice(0, 8)
  }, [myTasks, tab, metric, searchQuery])

  const myUnits = visibleUnits(currentUser).sort(
    (a, b) => Number(b.needsAttention) - Number(a.needsAttention),
  )

  const pinned = orgNews.find((o) => o.pinned)
  const updates = orgNews.filter((o) => o.kind === 'news').slice(0, 2)
  const nextEvent = orgNews.find((o) => o.kind === 'event')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-ink-navy md:text-[38px] md:leading-[1.21]">
            {greetingHe()}, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-[16px] text-slate-gray">
            יש לך {overdueCount} משימות חורגות ו־{updatesCount} עדכונים חדשים
            שדורשים תשומת לב.
          </p>
        </div>
        <Button onClick={() => navigate('/tasks/new')}>פעולה חדשה</Button>
      </div>

      <AssumptionBanner>
        מדדים לפי יחידות טיפול באחריות המת״ם — כל המשימות ביחידות אלו, גם אם
        האחראי הניהולי הוא משתמש אחר.
      </AssumptionBanner>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(
          [
            { id: 'open' as const, label: 'פתוחות', value: openCount },
            { id: 'overdue' as const, label: 'חורגות', value: overdueCount },
            { id: 'updates' as const, label: 'עדכונים חדשים', value: updatesCount },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMetric((prev) => (prev === m.id ? null : m.id))}
            className={cn(
              'rounded-lg border border-hairline bg-paper px-3 py-3 text-start transition-colors hover:border-signal-blue/40 sm:px-4 sm:py-4',
              metric === m.id && 'border-signal-blue bg-badge-bg',
            )}
          >
            <div className="text-[22px] font-bold tabular-nums text-ink-navy sm:text-[28px]">
              {m.value}
            </div>
            <div className="text-[12px] font-medium text-slate-gray sm:text-[14px]">
              {m.label}
            </div>
          </button>
        ))}
      </div>

      <Panel className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-hairline px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-[20px] font-semibold text-ink-navy">המשימות שלי</h2>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-signal-blue hover:underline"
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
                  'shrink-0 rounded-md px-3 py-2 text-[13px] font-medium whitespace-nowrap',
                  tab === t.id
                    ? 'bg-badge-bg text-signal-blue'
                    : 'text-slate-gray hover:bg-pebble',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {metric && (
          <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
            <span className="text-[13px] text-slate-gray">
              מסונן לפי מדד אישי
            </span>
            <button
              type="button"
              className="text-[13px] font-semibold text-signal-blue"
              onClick={() => setMetric(null)}
            >
              נקה סינון
            </button>
          </div>
        )}

        <TaskList tasks={filtered} compact />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3 !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-4 sm:px-6">
            <h2 className="text-[20px] font-semibold">יחידות טיפול</h2>
            <Link
              to="/units"
              className="text-[14px] font-semibold text-signal-blue hover:underline"
            >
              הכל
            </Link>
          </div>
          <ul className="divide-y divide-hairline">
            {myUnits.slice(0, 5).map((u) => (
              <li key={u.id}>
                <Link
                  to={`/units/${u.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-pebble/70 sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">משפחת {u.familyName}</span>
                      {u.needsAttention && (
                        <Badge tone="danger">דורשת התייחסות</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-mist-gray">
                      פעילות אחרונה · {formatRelativeHe(u.lastActivityAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-end text-[12px] text-slate-gray">
                    <div>{u.openTasks} פתוחות</div>
                    <div className={u.overdueTasks ? 'text-danger font-medium' : ''}>
                      {u.overdueTasks} חורגות
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="lg:col-span-2">
          <h2 className="mb-4 text-[20px] font-semibold">פעולות מהירות</h2>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  label: 'פתיחת משימה',
                  icon: ClipboardPlus,
                  to: '/tasks/new',
                },
                {
                  label: 'תיעוד ביקור',
                  icon: Home,
                  to: '/units?intent=visit',
                },
                {
                  label: 'עדכון שיקום',
                  icon: CalendarDays,
                  to: '/units?intent=rehab',
                },
                {
                  label: 'איתור משפחה',
                  icon: UserRoundSearch,
                  to: '/units',
                },
              ] as const
            ).map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex flex-col items-start gap-2 rounded-lg border border-hairline bg-cloud px-3 py-3 hover:border-signal-blue/40 hover:bg-badge-bg/40"
              >
                <a.icon className="h-5 w-5 text-signal-blue" aria-hidden />
                <span className="text-[13px] font-semibold leading-snug">
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
          <Link
            to="/units"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-slate-gray hover:text-ink-navy"
          >
            <FolderSearch className="h-3.5 w-3.5" />
            חיפוש מתקדם ביחידות
          </Link>
        </Panel>
      </div>

      <Panel>
        <button
          type="button"
          className="flex w-full items-center justify-between text-start"
          onClick={() => setOrgOpen((v) => !v)}
          aria-expanded={orgOpen}
        >
          <h2 className="text-[20px] font-semibold">מה חדש במנהלת?</h2>
          <span className="text-[13px] text-slate-gray">
            {orgOpen ? 'סגור' : 'הרחב'}
          </span>
        </button>
        {orgOpen && (
          <div className="mt-4 space-y-3">
            {pinned && (
              <div className="rounded-lg border border-hairline bg-pebble/60 p-4">
                <Badge tone="info">הודעת הנהלה</Badge>
                <h3 className="mt-2 text-[16px] font-semibold">{pinned.title}</h3>
                <p className="mt-1 text-[14px] text-slate-gray">{pinned.summary}</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {updates.map((u) => (
                <div key={u.id} className="rounded-lg border border-hairline p-3">
                  <p className="text-[12px] text-mist-gray">{u.date}</p>
                  <h3 className="mt-1 text-[14px] font-semibold">{u.title}</h3>
                </div>
              ))}
            </div>
            {nextEvent && (
              <div className="flex items-center justify-between rounded-lg bg-badge-bg/50 px-3 py-2">
                <div>
                  <p className="text-[12px] font-medium text-deep-cobalt">
                    אירוע קרוב
                  </p>
                  <p className="text-[14px] font-semibold">{nextEvent.title}</p>
                </div>
                <span className="text-[13px] text-slate-gray">{nextEvent.date}</span>
              </div>
            )}
            <Link
              to="/org"
              className="inline-flex text-[14px] font-semibold text-signal-blue hover:underline"
            >
              לבית המנהלת
            </Link>
          </div>
        )}
      </Panel>
    </div>
  )
}
