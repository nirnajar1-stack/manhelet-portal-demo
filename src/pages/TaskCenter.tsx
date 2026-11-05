import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Download,
  Filter,
  Save,
  Share2,
} from 'lucide-react'
import { TaskList } from '@/components/tasks/TaskList'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import {
  getMember,
  getUnit,
  getUser,
  priorityLabel,
  statusLabel,
} from '@/data/mock'
import { matamCaseloadTasks, visibleTasks, visibleUnits } from '@/lib/access'
import { cn, formatRelativeHe } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { Task, TaskStatus } from '@/types'

type ViewTab = 'all' | 'urgent' | 'open' | 'waiting' | 'done'

function isOverdue(task: Task) {
  if (!task.dueDate) return false
  if (task.status === 'done' || task.status === 'closed') return false
  return task.dueDate < new Date().toISOString().slice(0, 10)
}

export function TaskCenter() {
  const {
    tasks,
    refreshTasks,
    searchQuery,
    setSearchQuery,
    currentUser,
    loadChatter,
    addChatter,
  } = useApp()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [unitId, setUnitId] = useState('all')
  const [domain, setDomain] = useState('all')
  const [view, setView] = useState<ViewTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [drawerNote, setDrawerNote] = useState('')
  const [drawerMessages, setDrawerMessages] = useState<
    { id: string; body: string; authorId: string; createdAt: string }[]
  >([])
  const navigate = useNavigate()

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  const accessibleTasks = useMemo(() => {
    if (currentUser.role === 'matam') {
      return matamCaseloadTasks(currentUser, tasks)
    }
    return visibleTasks(currentUser, tasks)
  }, [tasks, currentUser])

  const accessibleUnits = useMemo(
    () => visibleUnits(currentUser),
    [currentUser],
  )

  const domains = useMemo(
    () => Array.from(new Set(accessibleTasks.map((t) => t.domain))),
    [accessibleTasks],
  )

  const kpis = useMemo(() => {
    const active = accessibleTasks.filter(
      (t) => t.status !== 'done' && t.status !== 'closed',
    )
    return {
      active: active.length,
      urgent: accessibleTasks.filter(
        (t) =>
          t.priority === 'urgent' ||
          t.priority === 'high' ||
          t.needsAttention ||
          isOverdue(t),
      ).length,
      waiting: accessibleTasks.filter((t) => t.status === 'waiting').length,
      done: accessibleTasks.filter(
        (t) => t.status === 'done' || t.status === 'closed',
      ).length,
    }
  }, [accessibleTasks])

  const filtered = useMemo(() => {
    let list = [...accessibleTasks]
    switch (view) {
      case 'urgent':
        list = list.filter(
          (t) =>
            t.priority === 'urgent' ||
            t.priority === 'high' ||
            t.needsAttention ||
            isOverdue(t),
        )
        break
      case 'open':
        list = list.filter(
          (t) => t.status === 'open' || t.status === 'in_progress',
        )
        break
      case 'waiting':
        list = list.filter((t) => t.status === 'waiting')
        break
      case 'done':
        list = list.filter((t) => t.status === 'done' || t.status === 'closed')
        break
      default:
        break
    }
    if (status !== 'all') list = list.filter((t) => t.status === status)
    if (unitId !== 'all') list = list.filter((t) => t.unitId === unitId)
    if (domain !== 'all') list = list.filter((t) => t.domain === domain)
    if (unreadOnly) list = list.filter((t) => t.hasNewReply)
    const q = searchQuery.trim()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.includes(q) ||
          t.number.includes(q) ||
          getUnit(t.unitId)?.familyName.includes(q),
      )
    }
    return list.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [
    accessibleTasks,
    view,
    status,
    unitId,
    domain,
    searchQuery,
    unreadOnly,
  ])

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0]

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [selected, selectedId])

  useEffect(() => {
    if (!selected) {
      setDrawerMessages([])
      return
    }
    void loadChatter(selected.id).then((msgs) =>
      setDrawerMessages(
        msgs.slice(0, 5).map((m) => ({
          id: m.id,
          body: m.body,
          authorId: m.authorId,
          createdAt: m.createdAt,
        })),
      ),
    )
  }, [selected, loadChatter])

  async function postDrawerNote() {
    if (!selected || !drawerNote.trim()) return
    await addChatter(selected.id, drawerNote.trim(), 'shared')
    setDrawerNote('')
    const msgs = await loadChatter(selected.id)
    setDrawerMessages(
      msgs.slice(0, 5).map((m) => ({
        id: m.id,
        body: m.body,
        authorId: m.authorId,
        createdAt: m.createdAt,
      })),
    )
  }

  const viewTabs: { id: ViewTab; label: string; count: number }[] = [
    { id: 'all', label: 'הכל', count: accessibleTasks.length },
    { id: 'urgent', label: 'דחופות', count: kpis.urgent },
    {
      id: 'open',
      label: 'בטיפול',
      count: accessibleTasks.filter(
        (t) => t.status === 'open' || t.status === 'in_progress',
      ).length,
    },
    { id: 'waiting', label: 'ממתינות', count: kpis.waiting },
    { id: 'done', label: 'הושלמו לאחרונה', count: kpis.done },
  ]

  return (
    <div className="space-y-4 motion-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-ink-navy text-balance">
            מרכז המשימות והמעקב
          </h1>
          <p className="mt-1 text-[13px] text-slate-gray">
            {filtered.length} משימות בתצוגה · לפי הרשאות שיוך יחידות
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate('/tasks/new')}>
            + משימה חדשה
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-3.5 w-3.5" aria-hidden />
            ייצוא לאקסל
          </Button>
          <Button size="sm" variant="ghost">
            <Save className="h-3.5 w-3.5" aria-hidden />
            שמירת תצוגה
          </Button>
        </div>
      </div>

      <AssumptionBanner>
        תצוגות שמורות הן אבטיפוס מקומי. סינון «דורש טיפול» הוא אינדיקטור נפרד
        מסטטוס עסקי.
      </AssumptionBanner>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard tone="blue" value={kpis.active} label="סה״כ פעילות" />
        <KpiCard tone="danger" value={kpis.urgent} label="דחופות ומיידיות" />
        <KpiCard tone="warning" value={kpis.waiting} label="ממתינות למשרדים" />
        <KpiCard tone="success" value={kpis.done} label="הושלמו" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש במשימות…"
          className="sm:max-w-xs"
        />
        <Button
          variant="outline"
          size="sm"
          className="sm:hidden"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <Filter className="h-4 w-4" />
          סינונים
        </Button>
        <div
          className={cn('flex flex-wrap gap-2', !filtersOpen && 'hidden sm:flex')}
        >
          <Select
            label="סטטוס"
            value={status}
            onChange={(v) => setStatus(v as TaskStatus | 'all')}
            options={[
              { value: 'all', label: 'כל הסטטוסים' },
              ...Object.entries(statusLabel).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <Select
            label="משפחה"
            value={unitId}
            onChange={setUnitId}
            options={[
              { value: 'all', label: 'כל היחידות' },
              ...accessibleUnits.map((u) => ({
                value: u.id,
                label: `משפחת ${u.familyName}`,
              })),
            ]}
          />
          <Select
            label="תחום"
            value={domain}
            onChange={setDomain}
            options={[
              { value: 'all', label: 'כל המולקולות/תחומים' },
              ...domains.map((d) => ({ value: d, label: d })),
            ]}
          />
          <label className="inline-flex items-center gap-2 rounded-md border border-hairline bg-paper px-2.5 text-[12px] text-slate-gray">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="accent-ink-navy"
            />
            רק עם עדכונים שלא נקראו
          </label>
        </div>
      </div>

      <div
        className="flex gap-1 overflow-x-auto"
        role="tablist"
        aria-label="תצוגות משימות"
      >
        {viewTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={cn(
              'min-h-9 shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-200',
              view === t.id
                ? 'bg-ink-navy text-paper'
                : 'bg-paper text-slate-gray shadow-soft hover:bg-pebble',
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="hidden gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-lg border border-hairline/70 bg-paper shadow-soft">
          <div className="grid grid-cols-[auto_1fr_140px_120px_100px] gap-2 border-b border-hairline bg-pebble/50 px-4 py-2 text-[11px] font-semibold text-slate-gray">
            <span />
            <span>משימה</span>
            <span>משפחה</span>
            <span>אחראי / מולקולה</span>
            <span>יעד</span>
          </div>
          <TaskTable
            tasks={filtered}
            selectedId={selected?.id}
            onSelect={(t) => setSelectedId(t.id)}
          />
        </div>
        <TaskDrawer
          task={selected}
          messages={drawerMessages}
          note={drawerNote}
          onNoteChange={setDrawerNote}
          onPost={() => void postDrawerNote()}
        />
      </div>

      <div className="xl:hidden">
        <div className="overflow-hidden rounded-lg border border-hairline/70 bg-paper shadow-soft">
          <TaskList
            tasks={filtered}
            selectedId={selected?.id}
            onSelect={(t) => {
              setSelectedId(t.id)
              navigate(`/tasks/${t.id}`)
            }}
          />
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone: 'blue' | 'danger' | 'warning' | 'success'
}) {
  const styles = {
    blue: 'border-signal-blue/20 bg-[#f3f8ff]',
    danger: 'border-danger/20 bg-danger-bg',
    warning: 'border-warning/30 bg-warning-bg',
    success: 'border-success/20 bg-success-bg',
  }
  const valueColor = {
    blue: 'text-signal-blue',
    danger: 'text-danger',
    warning: 'text-[#9a6700]',
    success: 'text-success',
  }
  return (
    <div className={cn('rounded-lg border px-4 py-3 shadow-soft', styles[tone])}>
      <div className={cn('text-[26px] font-bold tabular-nums', valueColor[tone])}>
        {value}
      </div>
      <div className="mt-0.5 text-[12px] font-medium text-slate-gray">{label}</div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="inline-flex min-h-9 items-center gap-1.5 text-[12px] text-slate-gray">
      <span className="hidden font-medium sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-h-9 cursor-pointer rounded-md border border-hairline bg-paper px-2 text-[12px] text-ink-navy transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TaskTable({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: Task[]
  selectedId?: string
  onSelect: (t: Task) => void
}) {
  if (tasks.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-[14px] text-slate-gray">
        אין משימות להצגה
      </div>
    )
  }

  return (
    <ul>
      {tasks.map((task) => {
        const unit = getUnit(task.unitId)
        const owner = getUser(task.ownerId)
        const waiting = task.waitingOnIds.map(getUser).filter(Boolean)[0]
        return (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onSelect(task)}
              aria-pressed={selectedId === task.id}
              className={cn(
                'grid w-full cursor-pointer grid-cols-[auto_1fr_140px_120px_100px] items-center gap-2 border-b border-hairline px-4 py-3 text-start transition-colors duration-200 hover:bg-pebble/60',
                selectedId === task.id && 'bg-badge-bg/40',
              )}
            >
              <input
                type="checkbox"
                checked={selectedId === task.id}
                readOnly
                className="accent-ink-navy"
                aria-hidden
                tabIndex={-1}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-mist-gray">
                    {task.number}
                  </span>
                  <DuePill task={task} />
                </div>
                <div className="truncate text-[13px] font-semibold text-ink-navy">
                  {task.title}
                </div>
              </div>
              <div className="truncate text-[12px] text-slate-gray">
                משפחת {unit?.familyName ?? '—'}
              </div>
              <div className="truncate text-[12px] text-slate-gray">
                {waiting?.name ?? owner?.name ?? '—'}
              </div>
              <div className="text-[12px] text-mist-gray">
                {task.dueDate ?? '—'}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function DuePill({ task }: { task: Task }) {
  if (task.status === 'done' || task.status === 'closed') {
    return (
      <Badge tone="success">
        <CheckCircle2 className="me-1 h-3 w-3" aria-hidden />
        הושלמה
      </Badge>
    )
  }
  if (isOverdue(task)) return <Badge tone="danger">חורגת</Badge>
  if (task.needsAttention) return <Badge tone="danger">דורש טיפול</Badge>
  if (task.status === 'waiting') return <Badge tone="warning">ממתינה</Badge>
  return <Badge tone="info">{statusLabel[task.status]}</Badge>
}

function TaskDrawer({
  task,
  messages,
  note,
  onNoteChange,
  onPost,
}: {
  task?: Task
  messages: { id: string; body: string; authorId: string; createdAt: string }[]
  note: string
  onNoteChange: (v: string) => void
  onPost: () => void
}) {
  if (!task) {
    return (
      <Panel className="!p-4">
        <p className="text-[14px] text-slate-gray">בחרו משימה מהטבלה</p>
      </Panel>
    )
  }

  const unit = getUnit(task.unitId)
  const member = getMember(task.unitId, task.memberId)
  const owner = getUser(task.ownerId)
  const participants = task.participantIds.map(getUser).filter(Boolean)

  return (
    <Panel className="flex max-h-[calc(100vh-12rem)] flex-col !p-0 overflow-hidden">
      <div className="border-b border-hairline px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-mist-gray">
            {task.number}
          </span>
          <Badge tone="danger">{priorityLabel[task.priority]}</Badge>
        </div>
        <p className="mt-1 text-[11px] text-mist-gray">
          נוצר · {task.createdAt.slice(0, 10)}
        </p>
        <h2 className="mt-2 text-[16px] font-semibold leading-snug">
          {task.title}
        </h2>
        <p className="mt-1 text-[12px] text-slate-gray">
          תיק יחידה:{' '}
          <Link
            to={`/units/${task.unitId}`}
            className="font-semibold text-signal-blue hover:underline"
          >
            משפחת {unit?.familyName}
            {member ? ` · ${member.name}` : ''}
          </Link>
        </p>
        <p className="mt-1 text-[12px] text-slate-gray">
          אחראי: <span className="font-medium text-ink-navy">{owner?.name}</span>
        </p>
      </div>

      <div className="space-y-4 overflow-y-auto px-4 py-3">
        <div>
          <p className="mb-2 text-[12px] font-semibold text-slate-gray">סטטוס</p>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ['open', 'לא התחיל'],
                ['in_progress', 'בטיפול פעיל'],
                ['done', 'הושלמה'],
              ] as const
            ).map(([id, label]) => (
              <span
                key={id}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium',
                  task.status === id ||
                    (id === 'done' && task.status === 'closed')
                    ? 'bg-ink-navy text-paper'
                    : 'bg-pebble text-slate-gray',
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold text-slate-gray">
            גורמים משתתפים
          </p>
          <ul className="space-y-1.5">
            {participants.map((p) => (
              <li
                key={p!.id}
                className="flex items-center justify-between rounded-md bg-pebble/70 px-2.5 py-1.5 text-[12px]"
              >
                <span className="font-medium">{p!.name}</span>
                <Badge tone="success">מעורב</Badge>
              </li>
            ))}
            {participants.length === 0 && (
              <li className="text-[12px] text-mist-gray">אין משתתפים נוספים</li>
            )}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold text-slate-gray">
            הערות ויומן פעולות ({messages.length})
          </p>
          <ul className="space-y-2">
            {messages.map((m) => {
              const author = getUser(m.authorId)
              return (
                <li
                  key={m.id}
                  className="rounded-md border border-hairline bg-cloud/80 px-2.5 py-2"
                >
                  <div className="mb-0.5 flex items-center gap-2 text-[11px]">
                    <span className="font-semibold">{author?.name ?? 'משתמש'}</span>
                    <span className="text-mist-gray">
                      {formatRelativeHe(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed">{m.body}</p>
                </li>
              )
            })}
          </ul>
          <div className="mt-2 space-y-2">
            <Textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="הוסיפו עדכון קצר למשימה…"
              className="min-h-[64px] text-[13px]"
              aria-label="עדכון למשימה"
            />
            <Button size="sm" disabled={!note.trim()} onClick={onPost}>
              פרסום
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-auto flex gap-2 border-t border-hairline px-4 py-3">
        <Button size="sm" variant="outline" className="flex-1">
          <Share2 className="h-3.5 w-3.5" />
          שיתוף
        </Button>
        <Button size="sm" className="flex-1" asChild>
          <Link to={`/tasks/${task.id}`}>מעבר לתיק המלא</Link>
        </Button>
      </div>
    </Panel>
  )
}
