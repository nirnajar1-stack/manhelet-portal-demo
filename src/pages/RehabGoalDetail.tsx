import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import {
  RehabWorkflowError,
  addComment,
  addObservation,
  buildTimeline,
  closePersonalGoal,
  getGoal,
  getRehabState,
  getStage,
  getStagesForGoal,
  goalProgress,
  listTasksForStage,
  listVisitsForStage,
  resolveActorFromPortalUser,
  updateStageStatus,
} from '@/lib/rehab-workflow/store'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'
import {
  domainLabelHe,
  goalMgmtLabelHe,
  observationKindLabelHe,
  outcomeLabelHe,
  stageStatusLabelHe,
  type ObservationKind,
  type PersonalGoalOutcome,
  type PersonalStageStatus,
} from '@/types/rehab-workflow'
import type { Task } from '@/types'

type StageTab = 'observations' | 'tasks' | 'visits' | 'history'

export function RehabGoalDetail() {
  const { goalId } = useParams()
  const [params, setParams] = useSearchParams()
  const stageId = params.get('stage')
  const { currentUser, showToast, tasks } = useApp()
  const actor = useMemo(
    () => resolveActorFromPortalUser(currentUser),
    [currentUser],
  )
  const [tick, setTick] = useState(0)
  const navigate = useNavigate()

  const goal = useMemo(() => {
    void tick
    return goalId ? getGoal(goalId) : undefined
  }, [goalId, tick])

  const stages = useMemo(() => {
    void tick
    return goalId ? getStagesForGoal(goalId) : []
  }, [goalId, tick])

  const timeline = useMemo(() => {
    void tick
    return goalId ? buildTimeline(goalId) : []
  }, [goalId, tick])

  const prog = goal ? goalProgress(goal.id) : { total: 0, completed: 0, pct: 0 }
  const selected = stageId ? getStage(stageId) : undefined

  const [closeOpen, setCloseOpen] = useState(false)
  const [outcome, setOutcome] = useState<PersonalGoalOutcome>('achieved')
  const [summary, setSummary] = useState('')

  if (!goal) {
    return <p className="text-slate-gray">מטרת שיקום לא נמצאה</p>
  }

  function refresh() {
    setTick((x) => x + 1)
  }

  function selectStage(id: string) {
    const p = new URLSearchParams(params)
    p.set('stage', id)
    setParams(p)
  }

  function onCloseGoal() {
    if (!goal) return
    try {
      closePersonalGoal({
        actor,
        goalId: goal.id,
        outcome,
        summaryHe: summary || undefined,
      })
      showToast('מטרת השיקום נסגרה')
      setCloseOpen(false)
      refresh()
    } catch (e) {
      showToast(e instanceof RehabWorkflowError ? e.message : 'שגיאה בסגירה')
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-[13px] text-slate-gray">
        <Link
          to={`/units/${goal.portalUnitId}?tab=rehab`}
          className="hover:text-ink-navy"
        >
          תהליך השיקום
        </Link>
        <span className="mx-1">/</span>
        <span>{goal.nameHe}</span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-bold">{goal.nameHe}</h1>
            <Badge>{goalMgmtLabelHe[goal.mgmtStatus]}</Badge>
            <Badge tone="muted">{domainLabelHe[goal.domain]}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-slate-gray">
            גרסת תבנית נעולה v{goal.pinnedTemplateVersion} · מחזור{' '}
            {goal.cycleNumber} · {prog.completed}/{prog.total} שלבים ({prog.pct}
            %)
          </p>
          {goal.outcome && (
            <p className="mt-1 text-[13px]">
              תוצאה: {outcomeLabelHe[goal.outcome]}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {goal.mgmtStatus === 'active' && (
            <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}>
              סיום מטרת שיקום
            </Button>
          )}
        </div>
      </div>

      <AssumptionBanner>
        סיום מטרה נפרד מהשלמת כל השלבים — תוצאת השיקום נבחרת במפורש.
      </AssumptionBanner>

      {closeOpen && (
        <Panel>
          <h2 className="mb-2 text-[16px] font-semibold">סיום מטרת שיקום</h2>
          <p className="mb-2 text-[13px] text-slate-gray">
            הושלמו {prog.completed} מתוך {prog.total}. שלבים פתוחים:{' '}
            {stages.filter((s) => s.status !== 'completed' && s.status !== 'skipped').length}.
          </p>
          <label className="mb-2 block space-y-1">
            <span className="text-[13px] font-semibold">תוצאת סיום</span>
            <select
              className="h-10 w-full rounded-md border border-hairline bg-pebble px-3 text-[14px]"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as PersonalGoalOutcome)}
            >
              {(Object.keys(outcomeLabelHe) as PersonalGoalOutcome[]).map((k) => (
                <option key={k} value={k}>
                  {outcomeLabelHe[k]}
                </option>
              ))}
            </select>
          </label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="הערת סיכום"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={onCloseGoal}>
              אישור סיום
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCloseOpen(false)}>
              ביטול
            </Button>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2 space-y-2">
          <h2 className="text-[16px] font-semibold">שלבי המטרה</h2>
          <StageGroup
            title="בביצוע"
            stages={stages.filter((s) => s.status === 'in_progress' || s.status === 'paused')}
            selectedId={stageId}
            onSelect={selectStage}
            highlight
          />
          <StageGroup
            title="עתידיים"
            stages={stages.filter((s) => s.status === 'not_started')}
            selectedId={stageId}
            onSelect={selectStage}
          />
          <StageGroup
            title="הושלמו / דולגו"
            stages={stages.filter(
              (s) =>
                s.status === 'completed' ||
                s.status === 'skipped' ||
                s.status === 'cancelled',
            )}
            selectedId={stageId}
            onSelect={selectStage}
          />
        </Panel>

        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <StageDetail
              stageId={selected.id}
              actor={actor}
              tasks={tasks}
              onChanged={refresh}
              onNavigateTask={(id) => navigate(`/tasks/${id}`)}
            />
          ) : (
            <Panel>
              <p className="text-[14px] text-slate-gray">בחרו שלב לפירוט.</p>
            </Panel>
          )}

          <Panel>
            <h2 className="mb-3 text-[16px] font-semibold">ציר זמן שיקומי</h2>
            <ul className="space-y-3">
              {timeline.slice(0, 40).map((ev) => (
                <li key={ev.id} className="border-s-2 border-gold ps-3">
                  <div className="text-[11px] text-mist-gray">
                    {ev.occurredAt.replace('T', ' ').slice(0, 16)} · {ev.kind}
                  </div>
                  <div className="text-[13px]">{ev.titleHe}</div>
                  {ev.actorNameHe && (
                    <div className="text-[12px] text-slate-gray">{ev.actorNameHe}</div>
                  )}
                </li>
              ))}
              {timeline.length === 0 && (
                <li className="text-[13px] text-slate-gray">אין אירועים עדיין</li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function StageGroup({
  title,
  stages,
  selectedId,
  onSelect,
  highlight,
}: {
  title: string
  stages: ReturnType<typeof getStagesForGoal>
  selectedId: string | null
  onSelect: (id: string) => void
  highlight?: boolean
}) {
  if (!stages.length) return null
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold text-slate-gray">{title}</div>
      <ul className="space-y-1">
        {stages.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-start text-[13px]',
                selectedId === s.id
                  ? 'border-gold bg-gold/15'
                  : 'border-hairline hover:bg-pebble',
                highlight && s.status === 'in_progress' && 'ring-1 ring-dusk-blue/40',
              )}
            >
              <div className="font-medium">
                {s.seq}. {s.nameHe}
              </div>
              <div className="text-[11px] text-mist-gray">
                {stageStatusLabelHe[s.status]}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StageDetail({
  stageId,
  actor,
  tasks,
  onChanged,
  onNavigateTask,
}: {
  stageId: string
  actor: ReturnType<typeof resolveActorFromPortalUser>
  tasks: Task[]
  onChanged: () => void
  onNavigateTask: (id: string) => void
}) {
  const stage = getStage(stageId)!
  const goal = getGoal(stage.personalGoalId)!
  const [tab, setTab] = useState<StageTab>('observations')
  const [obsBody, setObsBody] = useState('')
  const [obsKind, setObsKind] = useState<ObservationKind>('progress')
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const state = getRehabState()
  const observations = state.observations.filter((o) => o.personalStageId === stageId)
  const taskLinks = listTasksForStage(stageId)
  const visits = listVisitsForStage(stageId)
  const events = state.stageEvents.filter((e) => e.personalStageId === stageId)

  function setStatus(to: PersonalStageStatus, reasonHe?: string) {
    try {
      updateStageStatus({ actor, stageId, toStatus: to, reasonHe })
      onChanged()
    } catch (e) {
      alert(e instanceof RehabWorkflowError ? e.message : 'שגיאה')
    }
  }

  return (
    <Panel className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">
            {stage.seq}. {stage.nameHe}
          </h2>
          <p className="text-[13px] text-slate-gray">{stage.descriptionHe}</p>
          <p className="mt-1 text-[12px] text-mist-gray">
            {stageStatusLabelHe[stage.status]} · התחלה {stage.startDate ?? '—'} ·
            יעד {stage.targetDate ?? '—'} · סיום{' '}
            {stage.completedAt?.slice(0, 10) ?? '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {stage.status === 'not_started' && (
            <Button size="sm" onClick={() => setStatus('in_progress')}>
              התחלת שלב
            </Button>
          )}
          {stage.status === 'in_progress' && (
            <>
              <Button size="sm" variant="outline" onClick={() => setStatus('paused')}>
                השהיה
              </Button>
              <Button size="sm" onClick={() => setStatus('completed')}>
                השלמת שלב
              </Button>
            </>
          )}
          {stage.status === 'paused' && (
            <Button size="sm" onClick={() => setStatus('in_progress')}>
              חידוש
            </Button>
          )}
          {stage.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus('in_progress', 'פתיחה מחדש')}
            >
              פתיחה מחדש
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            (window.location.href = `/tasks/new?unitId=${goal.portalUnitId}&memberId=${goal.portalMemberId}&rehabStageId=${stage.id}&affiliation=rehab`)
          }
        >
          פתיחת משימה לשלב
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            (window.location.href = `/units/${goal.portalUnitId}?tab=visits&action=visit&memberId=${goal.portalMemberId}&rehabStageId=${stage.id}&affiliation=rehab`)
          }
        >
          יצירת ביקור לשלב
        </Button>
      </div>

      <div className="flex gap-1 border-b border-hairline" role="tablist">
        {(
          [
            ['observations', 'תצפיות ודיונים'],
            ['tasks', 'משימות'],
            ['visits', 'ביקורים'],
            ['history', 'היסטוריית השלב'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={cn(
              'border-b-2 px-3 py-2 text-[13px]',
              tab === id ? 'border-gold text-ink-navy' : 'border-transparent text-slate-gray',
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'observations' && (
        <div className="space-y-3">
          <div className="space-y-2 rounded-md bg-pebble p-3">
            <div className="text-[13px] font-semibold">הוספת תצפית</div>
            <select
              className="h-9 w-full rounded-md border border-hairline bg-paper px-2 text-[13px]"
              value={obsKind}
              onChange={(e) => setObsKind(e.target.value as ObservationKind)}
            >
              {(Object.keys(observationKindLabelHe) as ObservationKind[]).map((k) => (
                <option key={k} value={k}>
                  {observationKindLabelHe[k]}
                </option>
              ))}
            </select>
            <Textarea
              value={obsBody}
              onChange={(e) => setObsBody(e.target.value)}
              placeholder="תוכן התצפית…"
            />
            <Button
              size="sm"
              onClick={() => {
                try {
                  addObservation({
                    actor,
                    stageId,
                    kind: obsKind,
                    bodyHe: obsBody,
                  })
                  setObsBody('')
                  onChanged()
                } catch (e) {
                  alert(e instanceof RehabWorkflowError ? e.message : 'שגיאה')
                }
              }}
            >
              שמירת תצפית
            </Button>
          </div>
          {observations.map((o) => {
            const comments = state.comments.filter((c) => c.observationId === o.id)
            return (
              <div key={o.id} className="rounded-md border border-hairline p-3">
                <div className="text-[11px] text-mist-gray">
                  {o.observedAt.replace('T', ' ').slice(0, 16)} · {o.authorNameHe} ·{' '}
                  {observationKindLabelHe[o.kind]}
                </div>
                <p className="mt-1 text-[14px]">{o.bodyHe}</p>
                <ul className="mt-2 space-y-2 border-s border-hairline ps-3">
                  {comments.map((c) => (
                    <li key={c.id}>
                      <div className="text-[11px] text-mist-gray">
                        {c.createdAt.replace('T', ' ').slice(0, 16)} · {c.authorNameHe}
                      </div>
                      <p className="text-[13px]">{c.bodyHe}</p>
                    </li>
                  ))}
                </ul>
                {replyFor === o.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="תגובה…"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          try {
                            addComment({
                              actor,
                              observationId: o.id,
                              bodyHe: replyBody,
                            })
                            setReplyBody('')
                            setReplyFor(null)
                            onChanged()
                          } catch (e) {
                            alert(
                              e instanceof RehabWorkflowError ? e.message : 'שגיאה',
                            )
                          }
                        }}
                      >
                        שליחה
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyFor(null)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-2 text-[12px] text-signal-blue hover:underline"
                    onClick={() => setReplyFor(o.id)}
                  >
                    הוספת תגובה
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'tasks' && (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {taskLinks.map((link) => {
            const t = tasks.find((x) => x.id === link.taskId)
            if (!t) {
              return (
                <li key={link.taskId} className="px-3 py-2 text-[13px]">
                  {link.taskId} · {link.linkRole === 'primary' ? 'ראשי' : 'משני'}
                </li>
              )
            }
            return (
              <li key={link.taskId} className="px-3 py-2 text-[13px]">
                <button
                  type="button"
                  className="font-medium text-signal-blue hover:underline"
                  onClick={() => onNavigateTask(t.id)}
                >
                  {t.number} · {t.title}
                </button>
                <div className="text-[12px] text-slate-gray">
                  {t.status} · {link.linkRole === 'primary' ? 'קשר ראשי' : 'קשר משני'} ·{' '}
                  יעד {t.dueDate ?? '—'}
                </div>
              </li>
            )
          })}
          {taskLinks.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-slate-gray">
              אין משימות מקושרות
            </li>
          )}
        </ul>
      )}

      {tab === 'visits' && (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {visits.map((v) => (
            <li key={v.id} className="px-3 py-2 text-[13px]">
              <div className="font-medium">
                {v.visitDate} · {v.visitTypeHe}
              </div>
              <p className="text-slate-gray">{v.summaryHe}</p>
              <div className="text-[12px] text-mist-gray">
                {v.performedByNameHe} ·{' '}
                {v.rehabPrimaryStageId === stageId ? 'קשר ראשי' : 'קשר משני'}
              </div>
            </li>
          ))}
          {visits.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-slate-gray">
              אין ביקורים מקושרים
            </li>
          )}
        </ul>
      )}

      {tab === 'history' && (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="text-[13px]">
              <span className="text-mist-gray">
                {e.occurredAt.replace('T', ' ').slice(0, 16)}
              </span>{' '}
              {e.fromStatus ?? '—'} → {e.toStatus}
              {e.actorNameHe ? ` · ${e.actorNameHe}` : ''}
              {e.reasonHe ? ` · ${e.reasonHe}` : ''}
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-[13px] text-slate-gray">אין היסטוריית סטטוס</li>
          )}
        </ul>
      )}
    </Panel>
  )
}
