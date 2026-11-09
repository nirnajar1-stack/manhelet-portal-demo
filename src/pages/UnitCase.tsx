import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ActivityAffiliationControl } from '@/components/rehab/ActivityAffiliationControl'
import { MemberRehabPanel } from '@/components/rehab/MemberRehabPanel'
import { RehabStageSelector } from '@/components/rehab/RehabStageSelector'
import { getGoal, getStage } from '@/lib/rehab-workflow/store'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { TaskList } from '@/components/tasks/TaskList'
import { createVisit, fetchUnitExtras } from '@/api/stubs'
import { getUnit } from '@/data/mock'
import { canViewUnit, visibleTasks } from '@/lib/access'
import { formatRelativeHe, cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import type { ActivityAffiliation, DocumentItem, Visit } from '@/types'

type Tab = 'overview' | 'members' | 'tasks' | 'visits' | 'rehab' | 'docs'

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'סקירה' },
  { id: 'members', label: 'בני משפחה' },
  { id: 'tasks', label: 'משימות' },
  { id: 'visits', label: 'ביקורים' },
  { id: 'rehab', label: 'תהליך השיקום' },
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
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [visitNote, setVisitNote] = useState('')
  const [visitMemberId, setVisitMemberId] = useState(params.get('memberId') ?? '')
  const [visitAffiliation, setVisitAffiliation] = useState<ActivityAffiliation>(
    (params.get('affiliation') as ActivityAffiliation) || 'routine',
  )
  const [visitPrimaryStageId, setVisitPrimaryStageId] = useState<
    string | undefined
  >(params.get('rehabStageId') || undefined)
  const [visitSecondaryStageIds, setVisitSecondaryStageIds] = useState<
    string[]
  >([])
  const [visitIncludeInactive, setVisitIncludeInactive] = useState(
    Boolean(params.get('rehabStageId')),
  )

  const allowed = unitId ? canViewUnit(currentUser, unitId) : false

  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  useEffect(() => {
    if (!unitId || !allowed) return
    void fetchUnitExtras(unitId).then((x) => {
      setVisits(x.visits)
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
    <div className="page-stack">
      <div className="text-[12px] text-slate-gray">
        <Link to="/units" className="hover:text-ink-navy">
          יחידות טיפול
        </Link>
        <span className="mx-1">/</span>
        <span>משפחת {unit.familyName}</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="page-title">משפחת {unit.familyName}</h1>
            <Badge tone="muted">{unit.region}</Badge>
            {unit.needsAttention && <Badge tone="danger">דורשת התייחסות</Badge>}
          </div>
          <p className="mt-2 max-w-2xl text-[14px] leading-snug text-slate-gray">
            {unit.summary}
          </p>
          <p className="meta-xs-hide mt-1.5 text-[11px] text-mist-gray">
            פעילות אחרונה · {formatRelativeHe(unit.lastActivityAt)}
          </p>
        </div>
        <Button
          size="sm"
          className="min-h-11 w-full sm:min-h-0 sm:w-auto"
          onClick={() => navigate(`/tasks/new?unitId=${unit.id}`)}
        >
          משימה חדשה לתיק
        </Button>
      </div>

      <div
        className="flex gap-0.5 overflow-x-auto border-b border-hairline pb-px sm:gap-1"
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
              'min-h-12 shrink-0 border-b-2 px-3 py-3 text-[14px] font-medium whitespace-nowrap sm:min-h-0 sm:px-3.5',
              tab === t.id
                ? 'border-gold text-ink-navy'
                : 'border-transparent text-slate-gray hover:text-ink-navy',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <h2 className="mb-3 text-[17px] font-semibold tracking-tight">סקירה</h2>
            <p className="text-[14px] leading-relaxed text-slate-gray">
              {unit.summary} הממשק מציג מידע תפעולי בלבד. אין כאן נתונים רפואיים.
            </p>
            <div className="kpi-strip mt-5 grid-cols-1 sm:grid-cols-3">
              <Stat label="פתוחות" value={unit.openTasks} />
              <Stat label="חורגות" value={unit.overdueTasks} danger={unit.overdueTasks > 0} />
              <Stat label="בני משפחה" value={unit.members.length} />
            </div>
          </Panel>
          <Panel>
            <h2 className="mb-3 text-[17px] font-semibold tracking-tight">גישה מהירה</h2>
            <ul className="space-y-1 text-[14px] sm:space-y-2.5">
              <li>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center text-start text-signal-blue hover:underline sm:min-h-0 sm:inline"
                  onClick={() => setTab('tasks')}
                >
                  {unitTasks.length} משימות בתיק
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center text-start text-signal-blue hover:underline sm:min-h-0 sm:inline"
                  onClick={() => setTab('visits')}
                >
                  ביקורים
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center text-start text-signal-blue hover:underline sm:min-h-0 sm:inline"
                  onClick={() => setTab('rehab')}
                >
                  תהליך השיקום
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
              <li
                key={m.id}
                className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
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
        <div className="space-y-6">
          <AssumptionBanner>
            ביקורים — כולל שיוך שיקום אופציונלי לשלב אישי של בן המשפחה הראשי.
            אין קישור אוטומטי לכל משתתפי הביקור.
          </AssumptionBanner>
          <Panel className="space-y-4">
            <h2 className="text-[17px] font-semibold tracking-tight">
              תיעוד ביקור{action === 'visit' ? ' · פעולה מהירה' : ''}
            </h2>
            <label className="block space-y-1.5">
              <span className="text-[13px] font-semibold">בן/בת משפחה ראשי</span>
              <select
                className="h-10 w-full rounded-[10px] border border-hairline bg-pebble px-3 text-[14px]"
                value={visitMemberId}
                onChange={(e) => {
                  const next = e.target.value
                  if (
                    visitMemberId &&
                    next !== visitMemberId &&
                    visitAffiliation === 'rehab' &&
                    (visitPrimaryStageId || visitSecondaryStageIds.length)
                  ) {
                    if (
                      !window.confirm(
                        'שינוי בן המשפחה מחייב בחירה מחדש של שלבי השיקום.',
                      )
                    ) {
                      return
                    }
                  }
                  setVisitMemberId(next)
                  setVisitPrimaryStageId(undefined)
                  setVisitSecondaryStageIds([])
                }}
              >
                <option value="">בחרו…</option>
                {unit.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-1.5">
              <span className="text-[13px] font-semibold">שיוך הפעילות</span>
              <ActivityAffiliationControl
                value={visitAffiliation}
                onChange={(next) => {
                  if (
                    visitAffiliation === 'rehab' &&
                    next === 'routine' &&
                    (visitPrimaryStageId || visitSecondaryStageIds.length)
                  ) {
                    if (
                      !window.confirm(
                        'להסיר את קישורי השיקום מהביקור? שאר הפרטים יישמרו.',
                      )
                    ) {
                      return
                    }
                    setVisitPrimaryStageId(undefined)
                    setVisitSecondaryStageIds([])
                  }
                  setVisitAffiliation(next)
                }}
                routineLabel="ביקור שוטף"
                rehabLabel="ביקור שיקומי"
              />
            </div>
            {visitAffiliation === 'rehab' && (
              <div className="space-y-3 rounded-xl border border-hairline p-4">
                <h3 className="text-[14px] font-semibold">קישור למטרת שיקום</h3>
                <p className="text-[12px] text-slate-gray">
                  הקישור מתייחס לבן המשפחה הראשי שנבחר. משתתפים נוספים אינם
                  מקושרים אוטומטית.
                </p>
                <RehabStageSelector
                  memberId={visitMemberId}
                  primaryStageId={visitPrimaryStageId}
                  secondaryStageIds={visitSecondaryStageIds}
                  includeInactive={visitIncludeInactive}
                  onIncludeInactiveChange={setVisitIncludeInactive}
                  onPrimaryChange={setVisitPrimaryStageId}
                  onSecondaryChange={setVisitSecondaryStageIds}
                  emptyHref={`/units/${unit.id}?tab=rehab`}
                />
              </div>
            )}
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
                void createVisit({
                  unitId: unit.id,
                  summary: visitNote.trim(),
                  visitedBy: currentUser.name,
                  memberId: visitMemberId || undefined,
                  activityAffiliation: visitAffiliation,
                  rehabPrimaryStageId: visitPrimaryStageId,
                  rehabSecondaryStageIds: visitSecondaryStageIds,
                  actorUserId: currentUser.id,
                })
                  .then((created) => {
                    setVisits((prev) => [created, ...prev])
                    setVisitNote('')
                    showToast('ביקור נשמר')
                  })
                  .catch((err: Error) => showToast(err.message))
              }}
            >
              שמירת ביקור
            </Button>
          </Panel>
          <Panel className="!p-0 overflow-hidden">
            <ul className="divide-y divide-hairline">
              {visits.map((v) => {
                const member = unit.members.find((m) => m.id === v.memberId)
                const primary = v.rehabPrimaryStageId
                  ? getStage(v.rehabPrimaryStageId)
                  : undefined
                const primaryGoal = primary
                  ? getGoal(primary.personalGoalId)
                  : undefined
                return (
                  <li key={v.id} className="px-5 py-4 sm:px-6">
                    <div className="text-[12px] text-mist-gray">
                      {v.date} · {v.visitedBy}
                      {v.activityAffiliation === 'rehab' ? ' · שיקום' : ''}
                      {member ? ` · ${member.name}` : ''}
                    </div>
                    <p className="mt-1.5 text-[14px]">{v.summary}</p>
                    {primary && primaryGoal && member && (
                      <div className="mt-2.5 rounded-[10px] bg-pebble px-3 py-2.5 text-[12px]">
                        <div className="font-semibold text-ink-navy">
                          {member.name}
                        </div>
                        <div className="text-signal-blue">
                          ← {primaryGoal.nameHe}
                        </div>
                        <div className="text-slate-gray">
                          ← {primary.nameHe}
                          {v.rehabSecondaryStageIds?.length
                            ? ` · +${v.rehabSecondaryStageIds.length} שלבים נוספים`
                            : ''}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
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
        <MemberRehabPanel
          unitId={unit.id}
          members={unit.members}
          initialMemberId={params.get('memberId') ?? undefined}
        />
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
    <div className="kpi-cell !border-0">
      <div
        className={`kpi-value ${danger ? 'text-danger' : ''}`}
      >
        {value}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
