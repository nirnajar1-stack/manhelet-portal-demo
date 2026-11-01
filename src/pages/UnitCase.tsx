import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { TaskList } from '@/components/tasks/TaskList'
import { addRehabNote, fetchUnitExtras } from '@/api/stubs'
import { getMember, getUnit } from '@/data/mock'
import { canViewUnit, visibleTasks } from '@/lib/access'
import { formatRelativeHe, cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { DocumentItem, RehabNote, Visit } from '@/types'

type Tab = 'overview' | 'members' | 'tasks' | 'visits' | 'rehab' | 'docs'

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'סקירה' },
  { id: 'members', label: 'בני משפחה' },
  { id: 'tasks', label: 'משימות' },
  { id: 'visits', label: 'ביקורים' },
  { id: 'rehab', label: 'שיקום' },
  { id: 'docs', label: 'מסמכים' },
]

export function UnitCase() {
  const { unitId } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'overview'
  const action = params.get('action')
  const unit = unitId ? getUnit(unitId) : undefined
  const { tasks, refreshTasks, showToast, currentUser } = useApp()
  const navigate = useNavigate()

  const [visits, setVisits] = useState<Visit[]>([])
  const [rehab, setRehab] = useState<RehabNote[]>([])
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [visitNote, setVisitNote] = useState('')
  const [rehabTitle, setRehabTitle] = useState('')
  const [rehabNote, setRehabNote] = useState('')
  const [rehabMemberId, setRehabMemberId] = useState('')

  const allowed = unitId ? canViewUnit(currentUser, unitId) : false

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  useEffect(() => {
    if (!unitId || !allowed) return
    void fetchUnitExtras(unitId).then((x) => {
      setVisits(x.visits)
      setRehab(x.rehab)
      setDocs(x.documents)
    })
  }, [unitId, allowed])

  const unitTasks = useMemo(() => {
    if (!unitId) return []
    return visibleTasks(
      currentUser,
      tasks.filter((t) => t.unitId === unitId),
    )
  }, [tasks, unitId, currentUser])

  function setTab(next: Tab) {
    const p = new URLSearchParams(params)
    p.set('tab', next)
    p.delete('action')
    setParams(p)
  }

  if (!unit) {
    return <p className="text-slate-gray">יחידה לא נמצאה</p>
  }

  if (!allowed) {
    return (
      <Panel>
        <p className="text-[14px] text-slate-gray">
          אין הרשאה לצפות ביחידת טיפול זו — אינה בשיוך המשתמש הנוכחי.
        </p>
        <Link to="/units" className="mt-3 inline-flex text-signal-blue hover:underline">
          חזרה לרשימת היחידות
        </Link>
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-[13px] text-slate-gray">
        <Link to="/units" className="hover:text-ink-navy">
          יחידות טיפול
        </Link>
        <span className="mx-1">/</span>
        <span>משפחת {unit.familyName}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-bold">משפחת {unit.familyName}</h1>
            <Badge tone="muted">{unit.region}</Badge>
            {unit.needsAttention && <Badge tone="danger">דורשת התייחסות</Badge>}
          </div>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-gray">
            {unit.summary}
          </p>
          <p className="mt-1 text-[12px] text-mist-gray">
            פעילות אחרונה · {formatRelativeHe(unit.lastActivityAt)}
          </p>
        </div>
        <Button onClick={() => navigate(`/tasks/new?unitId=${unit.id}`)}>
          משימה חדשה לתיק
        </Button>
      </div>

      <div
        className="flex gap-1 overflow-x-auto border-b border-hairline pb-px"
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap',
              tab === t.id
                ? 'border-signal-blue text-signal-blue'
                : 'border-transparent text-slate-gray hover:text-ink-navy',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <h2 className="mb-2 text-[18px] font-semibold">סקירה</h2>
            <p className="text-[14px] leading-relaxed text-slate-gray">
              {unit.summary} הממשק מציג מידע תפעולי בלבד. אין כאן נתונים רפואיים.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="פתוחות" value={unit.openTasks} />
              <Stat label="חורגות" value={unit.overdueTasks} danger={unit.overdueTasks > 0} />
              <Stat label="בני משפחה" value={unit.members.length} />
            </div>
          </Panel>
          <Panel>
            <h2 className="mb-2 text-[16px] font-semibold">גישה מהירה</h2>
            <ul className="space-y-2 text-[14px]">
              <li>
                <button
                  type="button"
                  className="text-signal-blue hover:underline"
                  onClick={() => setTab('tasks')}
                >
                  {unitTasks.length} משימות בתיק
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-signal-blue hover:underline"
                  onClick={() => setTab('visits')}
                >
                  ביקורים
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-signal-blue hover:underline"
                  onClick={() => setTab('rehab')}
                >
                  שיקום (מבני)
                </button>
              </li>
            </ul>
          </Panel>
        </div>
      )}

      {tab === 'members' && (
        <Panel className="!p-0 overflow-hidden">
          <ul className="divide-y divide-hairline">
            {unit.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-[13px] text-slate-gray">{m.relation}</div>
                </div>
                <div className="text-[13px] text-mist-gray">{m.phone ?? '—'}</div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === 'tasks' && <TaskList tasks={unitTasks} />}

      {tab === 'visits' && (
        <div className="space-y-4">
          <AssumptionBanner>
            ביקורים — אבטיפוס מבני בלבד, לא אפיון קליני. אין נתונים רפואיים.
          </AssumptionBanner>
          <Panel>
            <h2 className="mb-2 text-[16px] font-semibold">
              תיעוד ביקור (דמה){action === 'visit' ? ' · פעולה מהירה' : ''}
            </h2>
            <Textarea
              value={visitNote}
              onChange={(e) => setVisitNote(e.target.value)}
              placeholder="סיכום מבני של הביקור…"
            />
            <Button
              className="mt-2"
              size="sm"
              onClick={() => {
                if (!visitNote.trim()) return
                setVisits((prev) => [
                  {
                    id: `v-${Date.now()}`,
                    unitId: unit.id,
                    date: new Date().toISOString().slice(0, 10),
                    summary: visitNote.trim(),
                    visitedBy: currentUser.name,
                  },
                  ...prev,
                ])
                setVisitNote('')
                showToast('ביקור תועד (דמה מקומי)')
              }}
            >
              שמירת ביקור
            </Button>
          </Panel>
          <Panel className="!p-0 overflow-hidden">
            <ul className="divide-y divide-hairline">
              {visits.map((v) => (
                <li key={v.id} className="px-4 py-3 sm:px-6">
                  <div className="text-[12px] text-mist-gray">
                    {v.date} · {v.visitedBy}
                  </div>
                  <p className="mt-1 text-[14px]">{v.summary}</p>
                </li>
              ))}
              {visits.length === 0 && (
                <li className="px-4 py-8 text-center text-[14px] text-slate-gray">
                  אין ביקורים מתועדים
                </li>
              )}
            </ul>
          </Panel>
        </div>
      )}

      {tab === 'rehab' && (
        <div className="space-y-4">
          <AssumptionBanner>
            שיקום — אבטיפוס מבני בלבד. עדכון חייב להיות משויך לבן/בת משפחה ספציפי.
          </AssumptionBanner>
          <Panel>
            <h2 className="mb-2 text-[16px] font-semibold">
              עדכון שיקום (דמה){action === 'rehab' ? ' · פעולה מהירה' : ''}
            </h2>
            <label className="mb-2 block space-y-1.5">
              <span className="text-[13px] font-semibold">
                בן/בת משפחה <span className="text-danger">*</span>
              </span>
              <select
                className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
                value={rehabMemberId}
                onChange={(e) => setRehabMemberId(e.target.value)}
              >
                <option value="">בחרו בן/בת משפחה…</option>
                {unit.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relation})
                  </option>
                ))}
              </select>
            </label>
            <Input
              className="mb-2"
              value={rehabTitle}
              onChange={(e) => setRehabTitle(e.target.value)}
              placeholder="כותרת נקודת ביניים"
            />
            <Textarea
              value={rehabNote}
              onChange={(e) => setRehabNote(e.target.value)}
              placeholder="תיעוד מבני…"
            />
            <Button
              className="mt-2"
              size="sm"
              onClick={() => {
                if (!rehabMemberId) {
                  showToast('יש לבחור בן/בת משפחה לעדכון שיקום')
                  return
                }
                if (!rehabTitle.trim() || !rehabNote.trim()) return
                void addRehabNote({
                  unitId: unit.id,
                  memberId: rehabMemberId,
                  title: rehabTitle.trim(),
                  note: rehabNote.trim(),
                }).then((created) => {
                  setRehab((prev) => [created, ...prev])
                  setRehabTitle('')
                  setRehabNote('')
                  setRehabMemberId('')
                  showToast('עדכון שיקום נשמר לבן/בת המשפחה')
                })
              }}
            >
              שמירת עדכון
            </Button>
          </Panel>
          <Panel className="!p-0 overflow-hidden">
            <ul className="divide-y divide-hairline">
              {rehab.map((r) => {
                const person = getMember(r.unitId, r.memberId)
                return (
                  <li key={r.id} className="px-4 py-3 sm:px-6">
                    <div className="text-[12px] text-mist-gray">
                      {r.date}
                      {person ? ` · ${person.name}` : ''}
                    </div>
                    <div className="font-semibold">{r.title}</div>
                    <p className="mt-1 text-[14px] text-slate-gray">{r.note}</p>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>
      )}

      {tab === 'docs' && (
        <Panel className="!p-0 overflow-hidden">
          <ul className="divide-y divide-hairline">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between px-4 py-3 sm:px-6"
              >
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-[12px] text-mist-gray">{d.kind}</div>
                </div>
                <span className="text-[12px] text-slate-gray">{d.updatedAt}</span>
              </li>
            ))}
            {docs.length === 0 && (
              <li className="px-4 py-8 text-center text-[14px] text-slate-gray">
                אין מסמכים
              </li>
            )}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string
  value: number
  danger?: boolean
}) {
  return (
    <div className="rounded-lg bg-pebble px-3 py-3">
      <div
        className={`text-[22px] font-bold tabular-nums ${danger ? 'text-danger' : ''}`}
      >
        {value}
      </div>
      <div className="text-[12px] text-slate-gray">{label}</div>
    </div>
  )
}
