import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RehabBreadcrumbs } from '@/components/rehab/RehabBreadcrumbs'
import { AssumptionBanner } from '@/components/ui/assumption'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { getMember, getUnit } from '@/data/mock'
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
  type ObservationVisibility,
  type PersonalGoalOutcome,
  type PersonalStageStatus,
  type RehabPersonalStage,
} from '@/types/rehab-workflow'
import type { Task } from '@/types'

type StageTab = 'activity' | 'tasks' | 'visits' | 'details'

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
  const unit = goal ? getUnit(goal.portalUnitId) : undefined
  const member = goal
    ? getMember(goal.portalUnitId, goal.portalMemberId)
    : undefined

  const activeStage =
    stages.find((s) => s.status === 'in_progress') ??
    stages.find((s) => s.status === 'paused')

  // Default focus: active stage
  useEffect(() => {
    if (!goal || stageId) return
    if (activeStage) {
      const p = new URLSearchParams(params)
      p.set('stage', activeStage.id)
      setParams(p, { replace: true })
    }
  }, [goal, stageId, activeStage, params, setParams])

  const selected = stageId ? getStage(stageId) : activeStage

  const [closeOpen, setCloseOpen] = useState(false)
  const [outcome, setOutcome] = useState<PersonalGoalOutcome>('achieved')
  const [summary, setSummary] = useState('')
  const [completeStage, setCompleteStage] = useState<RehabPersonalStage | null>(
    null,
  )
  const [completeNote, setCompleteNote] = useState('')

  if (!goal) {
    return (
      <Panel>
        <p className="text-slate-gray">מטרת שיקום לא נמצאה</p>
        <Link to="/units" className="mt-2 inline-block text-signal-blue hover:underline">
          חזרה ליחידות
        </Link>
      </Panel>
    )
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

  function confirmCompleteStage() {
    if (!completeStage) return
    try {
      updateStageStatus({
        actor,
        stageId: completeStage.id,
        toStatus: 'completed',
        reasonHe: completeNote || undefined,
      })
      showToast('השלב הושלם')
      setCompleteStage(null)
      setCompleteNote('')
      refresh()
    } catch (e) {
      showToast(e instanceof RehabWorkflowError ? e.message : 'שגיאה')
    }
  }

  const useHorizontalStepper = stages.length > 0 && stages.length <= 5

  return (
    <div className="space-y-4">
      <RehabBreadcrumbs
        items={[
          { label: 'יחידות טיפול', to: '/units' },
          {
            label: unit ? `משפחת ${unit.familyName}` : 'תיק',
            to: `/units/${goal.portalUnitId}`,
          },
          {
            label: member?.name ?? 'בן משפחה',
            to: `/units/${goal.portalUnitId}?tab=rehab`,
          },
          {
            label: 'שיקום',
            to: `/units/${goal.portalUnitId}?tab=rehab`,
          },
          { label: goal.nameHe },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-bold text-ink-navy">{goal.nameHe}</h1>
            <Badge
              tone={
                goal.mgmtStatus === 'active'
                  ? 'success'
                  : goal.mgmtStatus === 'paused'
                    ? 'warning'
                    : 'muted'
              }
            >
              {goalMgmtLabelHe[goal.mgmtStatus]}
            </Badge>
            <Badge tone="muted">{domainLabelHe[goal.domain]}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-slate-gray">
            {member?.name ?? '—'} · אחראי {goal.ownerNameHe ?? '—'} · התחלה{' '}
            {goal.startDate ?? '—'} · יעד {goal.targetDate ?? '—'}
          </p>
          <p className="mt-1 text-[13px] text-mist-gray">
            התקדמות: {prog.completed}/{prog.total} שלבים ({prog.pct}%) · תבנית
            v{goal.pinnedTemplateVersion}
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

      {/* Stage progress */}
      <Panel className="!py-3">
        <h2 className="mb-3 text-[14px] font-semibold text-slate-gray">
          שלבי המטרה
        </h2>
        {useHorizontalStepper ? (
          <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
            {stages.map((s, i) => (
              <li key={s.id} className="flex min-w-0 flex-1 items-stretch gap-2">
                <StageStepButton
                  stage={s}
                  selected={selected?.id === s.id}
                  onSelect={() => selectStage(s.id)}
                />
                {i < stages.length - 1 && (
                  <span
                    className="hidden w-4 shrink-0 self-center border-t border-hairline sm:block"
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ol>
        ) : (
          <ol className="space-y-1.5">
            {stages.map((s) => (
              <li key={s.id}>
                <StageStepButton
                  stage={s}
                  selected={selected?.id === s.id}
                  onSelect={() => selectStage(s.id)}
                  wide
                />
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {closeOpen && (
        <CloseGoalPanel
          stages={stages}
          prog={prog}
          timeline={timeline}
          tasks={tasks}
          outcome={outcome}
          setOutcome={setOutcome}
          summary={summary}
          setSummary={setSummary}
          onConfirm={onCloseGoal}
          onCancel={() => setCloseOpen(false)}
        />
      )}

      {completeStage && (
        <CompleteStageDialog
          stage={completeStage}
          tasks={tasks}
          note={completeNote}
          setNote={setCompleteNote}
          onConfirm={confirmCompleteStage}
          onCancel={() => {
            setCompleteStage(null)
            setCompleteNote('')
          }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {selected ? (
            <StageWorkspace
              stageId={selected.id}
              actor={actor}
              tasks={tasks}
              memberName={member?.name}
              goalName={goal.nameHe}
              onChanged={refresh}
              onNavigateTask={(id) => navigate(`/tasks/${id}`)}
              onRequestComplete={() => setCompleteStage(selected)}
            />
          ) : (
            <Panel>
              <p className="text-[14px] text-slate-gray">
                בחרו שלב כדי לפתוח את סביבת העבודה.
              </p>
            </Panel>
          )}
        </div>

        <aside className="space-y-3">
          <Panel className="space-y-2">
            <h2 className="text-[15px] font-semibold">סיכום מטרה</h2>
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-gray">סטטוס</dt>
                <dd>{goalMgmtLabelHe[goal.mgmtStatus]}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-gray">אחראי</dt>
                <dd>{goal.ownerNameHe ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-gray">התקדמות</dt>
                <dd>
                  {prog.completed}/{prog.total}
                </dd>
              </div>
            </dl>
            {goal.notesHe && (
              <p className="border-t border-hairline pt-2 text-[13px] text-slate-gray">
                {goal.notesHe}
              </p>
            )}
          </Panel>

          <Panel>
            <h2 className="mb-2 text-[15px] font-semibold">פעילות אחרונה</h2>
            <ul className="space-y-2">
              {timeline.slice(0, 6).map((ev) => (
                <li key={ev.id} className="border-s-2 border-dusk-blue/50 ps-2">
                  <div className="text-[11px] text-mist-gray">
                    {ev.occurredAt.replace('T', ' ').slice(0, 16)}
                  </div>
                  <div className="text-[13px]">{ev.titleHe}</div>
                </li>
              ))}
              {timeline.length === 0 && (
                <li className="text-[13px] text-slate-gray">אין אירועים עדיין</li>
              )}
            </ul>
          </Panel>

          {activeStage && (
            <Panel className="bg-soft-cyan/50">
              <p className="text-[12px] font-semibold text-slate-gray">
                פעולה מומלצת
              </p>
              <p className="mt-1 text-[14px] font-medium text-ink-navy">
                המשך בשלב «{activeStage.nameHe}»
              </p>
              <Button
                className="mt-2"
                size="sm"
                variant="secondary"
                onClick={() => selectStage(activeStage.id)}
              >
                מעבר לשלב הפעיל
              </Button>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  )
}

function StageStepButton({
  stage,
  selected,
  onSelect,
  wide,
}: {
  stage: RehabPersonalStage
  selected: boolean
  onSelect: () => void
  wide?: boolean
}) {
  const done = stage.status === 'completed' || stage.status === 'skipped'
  const active = stage.status === 'in_progress'
  const paused = stage.status === 'paused'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-md border px-3 py-2 text-start transition-colors',
        selected
          ? 'border-gold bg-gold/15 ring-1 ring-gold/40'
          : 'border-hairline bg-paper hover:bg-pebble',
        active && !selected && 'border-dusk-blue/60',
        done && 'opacity-80',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
            done && 'bg-success-bg text-success',
            active && 'bg-dusk-blue text-ink-navy',
            paused && 'bg-warning-bg text-warning-text',
            !done && !active && !paused && 'bg-pebble text-slate-gray',
          )}
        >
          {done ? '✓' : stage.seq}
        </span>
        <div className={cn('min-w-0', wide && 'flex-1')}>
          <div className="truncate text-[13px] font-semibold">{stage.nameHe}</div>
          <div className="text-[11px] text-mist-gray">
            {stageStatusLabelHe[stage.status]}
            {stage.completedAt
              ? ` · ${stage.completedAt.slice(0, 10)}`
              : stage.startDate
                ? ` · ${stage.startDate}`
                : ''}
          </div>
        </div>
      </div>
    </button>
  )
}

function CloseGoalPanel({
  stages,
  prog,
  timeline,
  tasks,
  outcome,
  setOutcome,
  summary,
  setSummary,
  onConfirm,
  onCancel,
}: {
  stages: RehabPersonalStage[]
  prog: { total: number; completed: number; pct: number }
  timeline: ReturnType<typeof buildTimeline>
  tasks: Task[]
  outcome: PersonalGoalOutcome
  setOutcome: (o: PersonalGoalOutcome) => void
  summary: string
  setSummary: (s: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const openStages = stages.filter(
    (s) => s.status !== 'completed' && s.status !== 'skipped' && s.status !== 'cancelled',
  )
  let taskCount = 0
  let visitCount = 0
  for (const s of stages) {
    taskCount += listTasksForStage(s.id).length
    visitCount += listVisitsForStage(s.id).length
  }
  const keyObs = timeline.filter((t) => t.kind.includes('observation')).slice(0, 3)

  return (
    <Panel className="space-y-3 border-gold/40">
      <AssumptionBanner>
        סיום מטרה נפרד מהשלמת כל השלבים — תוצאת השיקום נבחרת במפורש. אחוז השלמה אינו
        מדד יחיד.
      </AssumptionBanner>
      <h2 className="text-[16px] font-semibold">סיום מטרת שיקום — סיכום</h2>
      <ul className="space-y-1 text-[13px]">
        {stages.map((s) => (
          <li key={s.id} className="flex justify-between gap-2">
            <span>
              {s.seq}. {s.nameHe}
            </span>
            <span className="text-slate-gray">{stageStatusLabelHe[s.status]}</span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-slate-gray">
        התקדמות {prog.completed}/{prog.total} ({prog.pct}%) · {taskCount} משימות ·{' '}
        {visitCount} ביקורים · שלבים פתוחים: {openStages.length}
      </p>
      {keyObs.length > 0 && (
        <div>
          <div className="text-[12px] font-semibold text-slate-gray">תצפיות מרכזיות</div>
          <ul className="mt-1 space-y-1 text-[13px]">
            {keyObs.map((o) => (
              <li key={o.id}>{o.titleHe}</li>
            ))}
          </ul>
        </div>
      )}
      <label className="block space-y-1">
        <span className="text-[13px] font-semibold">תוצאה שיקומית</span>
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
      {openStages.length > 0 && (
        <p className="text-[13px] text-warning-text" role="status">
          יש {openStages.length} שלבים שטרם הושלמו — ניתן בכל זאת לסיים עם תוצאה
          מתאימה.
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm}>
          סיום מטרת שיקום
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
      </div>
      {/* silence unused */}
      <span className="hidden">{tasks.length}</span>
    </Panel>
  )
}

function CompleteStageDialog({
  stage,
  tasks,
  note,
  setNote,
  onConfirm,
  onCancel,
}: {
  stage: RehabPersonalStage
  tasks: Task[]
  note: string
  setNote: (s: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const links = listTasksForStage(stage.id)
  const openTasks = links.filter((l) => {
    const t = tasks.find((x) => x.id === l.taskId)
    return t && t.status !== 'done' && t.status !== 'closed'
  })
  const state = getRehabState()
  const lastObs = state.observations
    .filter((o) => o.personalStageId === stage.id)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-navy/40"
        aria-label="סגירה"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-stage-title"
        className="relative w-full max-w-md rounded-lg border border-hairline bg-paper p-5 shadow-xl"
      >
        <h2 id="complete-stage-title" className="text-[16px] font-semibold">
          השלמת שלב
        </h2>
        <p className="mt-1 text-[14px] text-ink-navy">
          {stage.seq}. {stage.nameHe}
        </p>
        <ul className="mt-3 space-y-1 text-[13px] text-slate-gray">
          <li>משימות פתוחות: {openTasks.length}</li>
          <li>
            תצפית אחרונה:{' '}
            {lastObs
              ? `${observationKindLabelHe[lastObs.kind]} · ${lastObs.observedAt.slice(0, 10)}`
              : 'אין'}
          </li>
        </ul>
        {openTasks.length > 0 && (
          <p className="mt-2 text-[13px] text-warning-text">
            קיימות משימות פתוחות — השלמת השלב לא תסגור אותן אוטומטית.
          </p>
        )}
        <label className="mt-3 block space-y-1">
          <span className="text-[13px] font-semibold">הערת סיום</span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="אופציונלי"
          />
        </label>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={onConfirm}>
            אישור השלמה
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            ביטול
          </Button>
        </div>
      </div>
    </div>
  )
}

function StageWorkspace({
  stageId,
  actor,
  tasks,
  memberName,
  goalName,
  onChanged,
  onNavigateTask,
  onRequestComplete,
}: {
  stageId: string
  actor: ReturnType<typeof resolveActorFromPortalUser>
  tasks: Task[]
  memberName?: string
  goalName: string
  onChanged: () => void
  onNavigateTask: (id: string) => void
  onRequestComplete: () => void
}) {
  const stage = getStage(stageId)!
  const goal = getGoal(stage.personalGoalId)!
  const [tab, setTab] = useState<StageTab>('activity')
  const { showToast } = useApp()
  const [obsOpen, setObsOpen] = useState(false)
  const [obsBody, setObsBody] = useState('')
  const [obsKind, setObsKind] = useState<ObservationKind>('progress')
  const [obsVisibility, setObsVisibility] =
    useState<ObservationVisibility>('internal')
  const [obsSaving, setObsSaving] = useState(false)
  const obsSavingRef = useRef(false)
  const [obsError, setObsError] = useState<string | null>(null)
  const [highlightObsId, setHighlightObsId] = useState<string | null>(null)
  const highlightTimerRef = useRef<number | null>(null)
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [activityFilter, setActivityFilter] = useState<'all' | 'obs' | 'system'>(
    'all',
  )
  const [tick, setTick] = useState(0)

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current != null) {
        window.clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  void tick
  const state = getRehabState()
  const observations = state.observations.filter(
    (o) => o.personalStageId === stageId,
  )
  const taskLinks = listTasksForStage(stageId)
  const visits = listVisitsForStage(stageId)
  const events = state.stageEvents.filter((e) => e.personalStageId === stageId)
  const goalTimeline = buildTimeline(goal.id).filter(
    (e) => !e.personalStageId || e.personalStageId === stageId,
  )

  function setStatus(to: PersonalStageStatus, reasonHe?: string) {
    try {
      updateStageStatus({ actor, stageId, toStatus: to, reasonHe })
      onChanged()
      setTick((x) => x + 1)
    } catch (e) {
      alert(e instanceof RehabWorkflowError ? e.message : 'שגיאה')
    }
  }

  const primaryAction =
    stage.status === 'not_started'
      ? { label: 'התחלת שלב', run: () => setStatus('in_progress') }
      : {
          label: 'הוספת תצפית',
          run: () => {
            setObsError(null)
            setObsOpen(true)
          },
        }

  return (
    <Panel className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[12px] text-slate-gray">
            {memberName ?? '—'} · {goalName}
          </p>
          <h2 className="text-[18px] font-semibold text-ink-navy">
            {stage.seq}. {stage.nameHe}
          </h2>
          <p className="mt-0.5 text-[12px] text-mist-gray">
            {stageStatusLabelHe[stage.status]} · אחראי {stage.ownerNameHe ?? goal.ownerNameHe ?? '—'}{' '}
            · התחלה {stage.startDate ?? '—'} · יעד {stage.targetDate ?? '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={primaryAction.run}>
            {primaryAction.label}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              (window.location.href = `/tasks/new?unitId=${goal.portalUnitId}&memberId=${goal.portalMemberId}&rehabStageId=${stage.id}&affiliation=rehab`)
            }
          >
            פתיחת משימה
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              (window.location.href = `/units/${goal.portalUnitId}?tab=visits&action=visit&memberId=${goal.portalMemberId}&rehabStageId=${stage.id}&affiliation=rehab`)
            }
          >
            תיעוד ביקור
          </Button>
          {stage.status === 'in_progress' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStatus('paused')}
              >
                השהיה
              </Button>
              <Button size="sm" variant="secondary" onClick={onRequestComplete}>
                השלמת שלב
              </Button>
            </>
          )}
          {stage.status === 'paused' && (
            <Button size="sm" variant="secondary" onClick={() => setStatus('in_progress')}>
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

      <div className="flex gap-1 overflow-x-auto border-b border-hairline" role="tablist">
        {(
          [
            ['activity', 'פעילות ועדכונים'],
            ['tasks', 'משימות'],
            ['visits', 'ביקורים'],
            ['details', 'פרטי השלב'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2 text-[13px]',
              tab === id
                ? 'border-gold text-ink-navy'
                : 'border-transparent text-slate-gray',
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'activity' && (
        <div className="space-y-3">
          {obsOpen && (
            <div className="space-y-2 rounded-md border border-hairline bg-pebble/60 p-3">
              <div className="text-[13px] font-semibold">הוספת תצפית</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-[12px] font-medium">סוג</span>
                  <select
                    className="h-9 w-full rounded-md border border-hairline bg-paper px-2 text-[13px]"
                    value={obsKind}
                    disabled={obsSaving}
                    onChange={(e) => setObsKind(e.target.value as ObservationKind)}
                  >
                    {(Object.keys(observationKindLabelHe) as ObservationKind[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {observationKindLabelHe[k]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[12px] font-medium">נראות</span>
                  <select
                    className="h-9 w-full rounded-md border border-hairline bg-paper px-2 text-[13px]"
                    value={obsVisibility}
                    disabled={obsSaving}
                    onChange={(e) =>
                      setObsVisibility(e.target.value as ObservationVisibility)
                    }
                  >
                    <option value="internal">פנימי</option>
                    <option value="shared">משותף לצוות</option>
                    <option value="external_allowed">מותר חיצוני</option>
                  </select>
                </label>
              </div>
              <Textarea
                value={obsBody}
                onChange={(e) => {
                  setObsBody(e.target.value)
                  if (obsError) setObsError(null)
                }}
                placeholder="תוכן התצפית…"
                className="min-h-[7rem]"
                disabled={obsSaving}
                aria-invalid={obsError ? true : undefined}
                aria-describedby={obsError ? 'obs-save-error' : undefined}
              />
              {obsError && (
                <p
                  id="obs-save-error"
                  role="alert"
                  className="rounded-md border border-danger/30 bg-danger-bg px-2.5 py-2 text-[13px] text-danger"
                >
                  {obsError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={obsSaving}
                  onClick={() => {
                    if (obsSavingRef.current) return
                    obsSavingRef.current = true
                    setObsSaving(true)
                    setObsError(null)
                    try {
                      const obs = addObservation({
                        actor,
                        stageId,
                        kind: obsKind,
                        bodyHe: obsBody,
                        visibility: obsVisibility,
                      })
                      setObsBody('')
                      setObsOpen(false)
                      setHighlightObsId(obs.id)
                      if (highlightTimerRef.current != null) {
                        window.clearTimeout(highlightTimerRef.current)
                      }
                      highlightTimerRef.current = window.setTimeout(() => {
                        setHighlightObsId(null)
                        highlightTimerRef.current = null
                      }, 2400)
                      showToast('התצפית נשמרה')
                      onChanged()
                      setTick((x) => x + 1)
                    } catch (e) {
                      setObsError(
                        e instanceof RehabWorkflowError
                          ? e.message
                          : 'שמירת התצפית נכשלה',
                      )
                    } finally {
                      obsSavingRef.current = false
                      setObsSaving(false)
                    }
                  }}
                >
                  {obsSaving ? 'שומר…' : 'שמירת תצפית'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={obsSaving}
                  onClick={() => {
                    setObsOpen(false)
                    setObsError(null)
                  }}
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'הכל'],
                ['obs', 'תצפיות'],
                ['system', 'אירועי מערכת'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivityFilter(id)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-[12px]',
                  activityFilter === id
                    ? 'border-gold bg-gold/15 font-semibold'
                    : 'border-hairline text-slate-gray',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="space-y-3">
            {activityFilter !== 'system' &&
              observations.map((o) => {
                const comments = state.comments
                  .filter((c) => c.observationId === o.id)
                  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                return (
                  <li
                    key={o.id}
                    data-obs-id={o.id}
                    className={cn(
                      'rounded-md border border-hairline bg-paper p-3',
                      highlightObsId === o.id && 'rehab-obs-highlight',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-mist-gray">
                      <span className="font-semibold text-ink-navy">
                        {o.authorNameHe}
                      </span>
                      <span>·</span>
                      <span>{o.observedAt.replace('T', ' ').slice(0, 16)}</span>
                      <Badge tone="muted">{observationKindLabelHe[o.kind]}</Badge>
                      <Badge tone="info">
                        {o.visibility === 'internal'
                          ? 'פנימי'
                          : o.visibility === 'shared'
                            ? 'משותף'
                            : 'חיצוני'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed">{o.bodyHe}</p>
                    <ul className="mt-3 space-y-2 border-s-2 border-hairline ps-3">
                      {comments.map((c) => (
                        <li key={c.id}>
                          <div className="text-[11px] text-mist-gray">
                            {c.authorNameHe} ·{' '}
                            {c.createdAt.replace('T', ' ').slice(0, 16)}
                          </div>
                          <p className="text-[13px]">{c.bodyHe}</p>
                        </li>
                      ))}
                    </ul>
                    {replyFor === o.id ? (
                      <div className="mt-3 space-y-2 rounded-md bg-pebble p-2">
                        <p className="line-clamp-2 text-[12px] text-slate-gray">
                          מגיבים ל: {o.bodyHe}
                        </p>
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
                                setTick((x) => x + 1)
                              } catch (e) {
                                alert(
                                  e instanceof RehabWorkflowError
                                    ? e.message
                                    : 'שגיאה',
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
                      <div className="mt-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="text-[12px] font-medium text-signal-blue hover:underline"
                          onClick={() => setReplyFor(o.id)}
                        >
                          תגובה
                          {comments.length > 0 ? ` (${comments.length})` : ''}
                        </button>
                        <button
                          type="button"
                          className="text-[12px] font-medium text-signal-blue hover:underline"
                          onClick={() => {
                            window.location.href = `/tasks/new?unitId=${goal.portalUnitId}&memberId=${goal.portalMemberId}&rehabStageId=${stage.id}&affiliation=rehab&fromObs=${o.id}`
                          }}
                        >
                          יצירת משימה מהתצפית
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}

            {activityFilter !== 'obs' &&
              goalTimeline
                .filter((ev) => !ev.kind.includes('observation'))
                .map((ev) => (
                  <li
                    key={ev.id}
                    className="flex gap-2 border-s-2 border-hairline py-1 ps-3 text-[13px]"
                  >
                    <span className="shrink-0 text-[11px] text-mist-gray">
                      {ev.occurredAt.replace('T', ' ').slice(0, 16)}
                    </span>
                    <span>
                      {ev.titleHe}
                      {ev.actorNameHe ? ` · ${ev.actorNameHe}` : ''}
                    </span>
                  </li>
                ))}

            {observations.length === 0 && activityFilter !== 'system' && (
              <li className="rounded-md border border-dashed border-hairline px-4 py-8 text-center">
                <p className="text-[14px] text-slate-gray">
                  אין תצפיות בשלב זה עדיין.
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setObsOpen(true)}
                >
                  הוספת תצפית ראשונה
                </Button>
              </li>
            )}
          </ul>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-start text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-slate-gray">
                <th className="px-2 py-2 font-medium">נושא</th>
                <th className="px-2 py-2 font-medium">סטטוס</th>
                <th className="px-2 py-2 font-medium">אחראי</th>
                <th className="px-2 py-2 font-medium">יעד</th>
                <th className="px-2 py-2 font-medium">קשר</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {[...taskLinks]
                .sort((a, b) => {
                  const ta = tasks.find((t) => t.id === a.taskId)
                  const tb = tasks.find((t) => t.id === b.taskId)
                  const openA = ta && ta.status !== 'done' && ta.status !== 'closed'
                  const openB = tb && tb.status !== 'done' && tb.status !== 'closed'
                  if (openA === openB) return 0
                  return openA ? -1 : 1
                })
                .map((link) => {
                  const t = tasks.find((x) => x.id === link.taskId)
                  return (
                    <tr key={link.taskId}>
                      <td className="px-2 py-2">
                        {t ? (
                          <button
                            type="button"
                            className="font-medium text-signal-blue hover:underline"
                            onClick={() => onNavigateTask(t.id)}
                          >
                            {t.title}
                          </button>
                        ) : (
                          link.taskId
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-gray">
                        {t?.status ?? '—'}
                      </td>
                      <td className="px-2 py-2 text-slate-gray">
                        {t?.ownerId ?? '—'}
                      </td>
                      <td className="px-2 py-2 text-slate-gray">
                        {t?.dueDate ?? '—'}
                      </td>
                      <td className="px-2 py-2">
                        {link.linkRole === 'primary' ? 'ראשי' : 'משני'}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {taskLinks.length === 0 && (
            <p className="py-6 text-center text-[13px] text-slate-gray">
              אין משימות מקושרות לשלב.
            </p>
          )}
        </div>
      )}

      {tab === 'visits' && (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {visits.map((v) => (
            <li key={v.id} className="px-3 py-2 text-[13px]">
              <div className="font-medium">
                {v.visitDate} · {v.visitTypeHe} · {v.status}
              </div>
              <p className="text-slate-gray line-clamp-2">{v.summaryHe}</p>
              <div className="text-[12px] text-mist-gray">
                {v.performedByNameHe} ·{' '}
                {v.rehabPrimaryStageId === stageId ? 'קשר ראשי' : 'קשר משני'}
              </div>
            </li>
          ))}
          {visits.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-slate-gray">
              אין ביקורים מקושרים.
            </li>
          )}
        </ul>
      )}

      {tab === 'details' && (
        <div className="space-y-2 text-[13px]">
          <p>{stage.descriptionHe || 'אין תיאור נוסף לשלב.'}</p>
          <p className="text-slate-gray">
            חובה: {stage.isMandatory ? 'כן' : 'לא'}
            {stage.typicalDays ? ` · משך משוער ~${stage.typicalDays} ימים` : ''}
          </p>
          <h3 className="pt-2 font-semibold">היסטוריית סטטוס</h3>
          <ul className="space-y-1">
            {events.map((e) => (
              <li key={e.id}>
                <span className="text-mist-gray">
                  {e.occurredAt.replace('T', ' ').slice(0, 16)}
                </span>{' '}
                {e.fromStatus ?? '—'} → {e.toStatus}
                {e.actorNameHe ? ` · ${e.actorNameHe}` : ''}
                {e.reasonHe ? ` · ${e.reasonHe}` : ''}
              </li>
            ))}
            {events.length === 0 && (
              <li className="text-slate-gray">אין היסטוריית סטטוס</li>
            )}
          </ul>
        </div>
      )}
    </Panel>
  )
}
