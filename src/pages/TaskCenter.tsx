import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Filter, LayoutList, Save } from 'lucide-react'
import { TaskList } from '@/components/tasks/TaskList'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/card'
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

const savedViews = [
  { id: 'mine', label: 'שלי' },
  { id: 'attention', label: 'דורש טיפול' },
  { id: 'waiting-mol', label: 'ממתין למולקולה' },
]

export function TaskCenter() {
  const { tasks, refreshTasks, searchQuery, setSearchQuery, currentUser } =
    useApp()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [unitId, setUnitId] = useState('all')
  const [domain, setDomain] = useState('all')
  const [view, setView] = useState('mine')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
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

  const filtered = useMemo(() => {
    let list = [...accessibleTasks]
    if (view === 'mine') {
      if (currentUser.role === 'matam') {
        // already caseload-scoped
      } else {
        list = list.filter(
          (t) =>
            t.participantIds.includes(currentUser.id) ||
            t.waitingOnIds.includes(currentUser.id),
        )
      }
    } else if (view === 'attention') {
      list = list.filter((t) => t.needsAttention || t.hasNewReply)
    } else if (view === 'waiting-mol') {
      list = list.filter((t) => t.status === 'waiting')
    }
    if (status !== 'all') list = list.filter((t) => t.status === status)
    if (unitId !== 'all') list = list.filter((t) => t.unitId === unitId)
    if (domain !== 'all') list = list.filter((t) => t.domain === domain)
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
    currentUser,
  ])

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0]

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [selected, selectedId])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-ink-navy">מרכז המשימות</h1>
          <p className="mt-1 text-[14px] text-slate-gray">
            {filtered.length} משימות בתצוגה הנוכחית (לפי הרשאות שיוך)
          </p>
        </div>
        <Button onClick={() => navigate('/tasks/new')}>משימה חדשה</Button>
      </div>

      <AssumptionBanner>
        תצוגות שמורות הן אבטיפוס מקומי — שמירה אמיתית תלויה ב־API עתידי. סינון
        «דורש טיפול» הוא אינדיקטור נפרד מסטטוס עסקי.
      </AssumptionBanner>

      <div className="flex flex-wrap gap-2">
        {savedViews.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] font-medium',
              view === v.id
                ? 'border-signal-blue bg-badge-bg text-signal-blue'
                : 'border-hairline bg-paper text-slate-gray hover:bg-pebble',
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            {v.label}
          </button>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-hairline px-3 py-1.5 text-[13px] text-mist-gray"
          title="אבטיפוס"
        >
          <Save className="h-3.5 w-3.5" />
          שמור תצוגה
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש במשימות…"
          className="sm:max-w-sm"
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
          className={cn(
            'flex flex-wrap gap-2',
            !filtersOpen && 'hidden sm:flex',
          )}
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
              { value: 'all', label: 'כל המשפחות' },
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
              { value: 'all', label: 'כל התחומים' },
              ...domains.map((d) => ({ value: d, label: d })),
            ]}
          />
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            className="overflow-hidden rounded-lg border border-hairline bg-paper"
            onClick={(e) => {
              const a = (e.target as HTMLElement).closest('a')
              if (a?.getAttribute('href')?.startsWith('/tasks/')) {
                e.preventDefault()
                const id = a.getAttribute('href')!.split('/').pop()!
                setSelectedId(id)
              }
            }}
          >
            <TaskList tasks={filtered} selectedId={selected?.id} />
          </div>
        </div>
        <Panel className="lg:col-span-2 !p-4">
          {selected ? (
            <TaskPreview task={selected} />
          ) : (
            <p className="text-[14px] text-slate-gray">בחרו משימה מהרשימה</p>
          )}
        </Panel>
      </div>

      <div className="lg:hidden">
        <TaskList tasks={filtered} />
      </div>
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
    <label className="inline-flex items-center gap-1 text-[12px] text-slate-gray">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-hairline bg-pebble px-2 text-[13px] text-ink-navy"
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

function TaskPreview({ task }: { task: Task }) {
  const unit = getUnit(task.unitId)
  const member = getMember(task.unitId, task.memberId)
  const owner = getUser(task.ownerId)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge tone="muted">{task.number}</Badge>
        <Badge>{statusLabel[task.status]}</Badge>
        {task.needsAttention && <Badge tone="danger">דורש טיפול</Badge>}
        <Badge tone="warning">{priorityLabel[task.priority]}</Badge>
      </div>
      <h2 className="text-[20px] font-semibold leading-snug">{task.title}</h2>
      <p className="text-[14px] text-slate-gray">{task.description}</p>
      <dl className="grid grid-cols-2 gap-2 text-[13px]">
        <div>
          <dt className="text-mist-gray">משפחה</dt>
          <dd className="font-medium">{unit?.familyName}</dd>
        </div>
        <div>
          <dt className="text-mist-gray">בן/בת משפחה</dt>
          <dd className="font-medium">{member?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-mist-gray">אחראי</dt>
          <dd className="font-medium">{owner?.name}</dd>
        </div>
        <div>
          <dt className="text-mist-gray">עודכן</dt>
          <dd className="font-medium">{formatRelativeHe(task.updatedAt)}</dd>
        </div>
      </dl>
      <Link
        to={`/tasks/${task.id}`}
        className="inline-flex text-[14px] font-semibold text-signal-blue hover:underline"
      >
        פתיחה מלאה
      </Link>
    </div>
  )
}
