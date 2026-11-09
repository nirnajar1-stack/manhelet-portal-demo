import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddGoalDrawer } from '@/components/rehab/AddGoalDrawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getUnit, users } from '@/data/mock'
import {
  getRehabState,
  getStagesForGoal,
  goalProgress,
  listGoalsForMember,
  listTasksForStage,
  listVisitsForStage,
  resolveActorFromPortalUser,
} from '@/lib/rehab-workflow/store'
import { cn } from '@/lib/utils'
import {
  domainLabelHe,
  goalMgmtLabelHe,
  type PersonalGoalMgmtStatus,
  type RehabDomain,
  type RehabPersonalGoal,
} from '@/types/rehab-workflow'
import { useApp } from '@/state/AppContext'
import type { FamilyMember } from '@/types'

interface Props {
  unitId: string
  members: FamilyMember[]
  initialMemberId?: string
}

export function MemberRehabPanel({ unitId, members, initialMemberId }: Props) {
  const { currentUser, showToast } = useApp()
  const navigate = useNavigate()
  const actor = useMemo(
    () => resolveActorFromPortalUser(currentUser),
    [currentUser],
  )
  const unit = getUnit(unitId)
  const matam = unit ? users.find((u) => u.id === unit.matamId) : undefined

  const [memberId, setMemberId] = useState(
    initialMemberId && members.some((m) => m.id === initialMemberId)
      ? initialMemberId
      : (members[0]?.id ?? ''),
  )
  const [tick, setTick] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PersonalGoalMgmtStatus>(
    'all',
  )
  const [domainFilter, setDomainFilter] = useState<RehabDomain | 'all'>('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [showCompleted, setShowCompleted] = useState(false)

  const member = members.find((m) => m.id === memberId)

  const goals = useMemo(() => {
    void tick
    try {
      return listGoalsForMember(memberId, actor)
    } catch {
      return []
    }
  }, [memberId, actor, tick])

  const kpis = useMemo(() => {
    const active = goals.filter((g) => g.mgmtStatus === 'active').length
    const completed = goals.filter((g) => g.mgmtStatus === 'completed').length
    let stagesInProgress = 0
    let openActivities = 0
    for (const g of goals) {
      const stages = getStagesForGoal(g.id)
      stagesInProgress += stages.filter((s) => s.status === 'in_progress').length
      for (const s of stages) {
        const tasks = listTasksForStage(s.id)
        // Count linked tasks; portal task status checked loosely via store presence
        openActivities += tasks.length
        openActivities += listVisitsForStage(s.id).filter(
          (v) => v.status === 'planned',
        ).length
      }
    }
    // Prefer observation blockers as "needs attention"
    const state = getRehabState()
    const blockerObs = state.observations.filter((o) => {
      const stage = state.stages.find((s) => s.id === o.personalStageId)
      if (!stage) return false
      const goal = state.goals.find((g) => g.id === stage.personalGoalId)
      return (
        goal?.portalMemberId === memberId &&
        o.kind === 'blocker' &&
        goal.mgmtStatus === 'active'
      )
    }).length
    return {
      active,
      completed,
      stagesInProgress,
      openActivities: Math.max(openActivities, blockerObs),
      lastUpdated:
        goals
          .map((g) => g.updatedAt)
          .sort()
          .at(-1)
          ?.slice(0, 10) ?? '—',
    }
  }, [goals, memberId])

  const owners = useMemo(() => {
    const set = new Set<string>()
    for (const g of goals) {
      if (g.ownerNameHe) set.add(g.ownerNameHe)
    }
    return [...set]
  }, [goals])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return goals.filter((g) => {
      if (statusFilter !== 'all' && g.mgmtStatus !== statusFilter) return false
      if (domainFilter !== 'all' && g.domain !== domainFilter) return false
      if (ownerFilter !== 'all' && g.ownerNameHe !== ownerFilter) return false
      if (q && !g.nameHe.toLowerCase().includes(q)) return false
      return true
    })
  }, [goals, search, statusFilter, domainFilter, ownerFilter])

  const activeGoals = filtered
    .filter((g) => g.mgmtStatus === 'active')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const pausedGoals = filtered
    .filter((g) => g.mgmtStatus === 'paused')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const completedGoals = filtered
    .filter((g) => g.mgmtStatus === 'completed' || g.mgmtStatus === 'cancelled')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-ink-navy">תהליך השיקום</h2>
          <p className="mt-1.5 text-[13px] leading-snug text-slate-gray">
            {member?.name ?? '—'}
            {unit ? ` · משפחת ${unit.familyName}` : ''}
            <span className="meta-xs-hide">
              {matam ? ` · מת״מ ${matam.name}` : ''}
              {` · ${kpis.active} מטרות פעילות`}
              {` · עודכן ${kpis.lastUpdated}`}
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block w-full space-y-1.5 sm:w-auto">
            <span className="text-[12px] font-medium text-slate-gray">בן משפחה</span>
            <select
              className="h-11 w-full min-w-[10rem] rounded-[10px] border border-hairline bg-pebble px-3 text-[14px] sm:h-10"
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value)
                setDrawerOpen(false)
              }}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            className="min-h-11 w-full sm:min-h-0 sm:w-auto"
            onClick={() => setDrawerOpen(true)}
          >
            הוספת מטרת שיקום
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={() => navigate('/rehab/bank')}
          >
            בנק מטרות
          </Button>
        </div>
      </div>

      <div className="kpi-strip !grid-cols-2 sm:!grid-cols-4">
        <Kpi label="מטרות פעילות" value={kpis.active} />
        <Kpi label="מטרות שהושלמו" value={kpis.completed} />
        <Kpi label="שלבים בביצוע" value={kpis.stagesInProgress} accent />
        <Kpi label="פעילויות לטיפול" value={kpis.openActivities} warn={kpis.openActivities > 0} />
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-paper p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <Input
          className="h-11 sm:h-10 sm:max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם מטרה…"
          aria-label="חיפוש מטרות"
        />
        <select
          className="h-11 rounded-[10px] border border-hairline bg-pebble px-3 text-[13px] sm:h-10"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          aria-label="סינון סטטוס"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="active">פעילות</option>
          <option value="paused">מושהות</option>
          <option value="completed">סגורות</option>
          <option value="cancelled">בוטלו</option>
        </select>
        <select
          className="hidden h-10 rounded-[10px] border border-hairline bg-pebble px-3 text-[13px] sm:block"
          value={domainFilter}
          onChange={(e) =>
            setDomainFilter(e.target.value as typeof domainFilter)
          }
          aria-label="סינון תחום"
        >
          <option value="all">כל התחומים</option>
          {(Object.keys(domainLabelHe) as RehabDomain[]).map((d) => (
            <option key={d} value={d}>
              {domainLabelHe[d]}
            </option>
          ))}
        </select>
        <select
          className="hidden h-10 rounded-[10px] border border-hairline bg-pebble px-3 text-[13px] sm:block"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          aria-label="סינון אחראי"
        >
          <option value="all">כל האחראים</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {goals.length === 0 ? (
        <Panel>
          <div className="py-6 text-center">
            <p className="text-[15px] font-medium text-ink-navy">
              אין עדיין מטרות שיקום ל{member?.name ?? 'בן המשפחה'}
            </p>
            <p className="mt-1 text-[13px] text-slate-gray">
              הוסיפו מטרה מבנק המטרות כדי לפתוח שלבים ולתעד פעילות.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setDrawerOpen(true)}>
              הוספת מטרת שיקום
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          <GoalSection
            title="מטרות פעילות"
            goals={activeGoals}
            empty="אין מטרות פעילות התואמות לסינון."
          />
          {pausedGoals.length > 0 && (
            <GoalSection title="מטרות מושהות" goals={pausedGoals} muted />
          )}
          {(completedGoals.length > 0 ||
            goals.some(
              (g) => g.mgmtStatus === 'completed' || g.mgmtStatus === 'cancelled',
            )) && (
            <div>
              <button
                type="button"
                className="mb-2 text-[13px] font-semibold text-signal-blue hover:underline"
                onClick={() => setShowCompleted((v) => !v)}
                aria-expanded={showCompleted}
              >
                {showCompleted ? 'הסתרת' : 'הצגת'} מטרות שהושלמו (
                {completedGoals.length})
              </button>
              {showCompleted && (
                <GoalSection
                  title=""
                  goals={completedGoals}
                  muted
                  empty="אין מטרות שהושלמו בסינון הנוכחי."
                />
              )}
            </div>
          )}
        </div>
      )}

      <AddGoalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        unitId={unitId}
        memberId={memberId}
        memberName={member?.name ?? ''}
        actor={actor}
        onCreated={(goalId) => {
          showToast('מטרת שיקום נוצרה בהצלחה')
          setDrawerOpen(false)
          setTick((x) => x + 1)
          navigate(`/rehab/goals/${goalId}`)
        }}
      />
    </div>
  )
}

function GoalSection({
  title,
  goals,
  empty,
  muted,
}: {
  title: string
  goals: RehabPersonalGoal[]
  empty?: string
  muted?: boolean
}) {
  return (
    <section className="space-y-3">
      {title && (
        <h3 className="text-[13px] font-semibold tracking-wide text-slate-gray">{title}</h3>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} muted={muted} />
        ))}
      </div>
      {goals.length === 0 && empty && (
        <p className="text-[13px] text-slate-gray">{empty}</p>
      )}
    </section>
  )
}

function GoalCard({
  goal,
  muted,
}: {
  goal: RehabPersonalGoal
  muted?: boolean
}) {
  const prog = goalProgress(goal.id)
  const stages = getStagesForGoal(goal.id)
  const current =
    stages.find((s) => s.status === 'in_progress') ??
    stages.find((s) => s.status === 'paused')
  const state = getRehabState()
  const lastObs = state.observations
    .filter((o) => stages.some((s) => s.id === o.personalStageId))
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0]
  const blocker = lastObs?.kind === 'blocker'

  let actionHint: string | null = null
  if (goal.mgmtStatus === 'active' && blocker) {
    actionHint = 'יש חסם פתוח — צפייה בתצפית'
  } else if (goal.mgmtStatus === 'active' && !current && stages.some((s) => s.status === 'not_started')) {
    actionHint = 'ניתן להתחיל שלב הבא'
  } else if (current) {
    actionHint = `המשך בשלב: ${current.nameHe}`
  }

  return (
    <Panel
      className={cn(
        'flex flex-col gap-2 sm:gap-2.5',
        muted && 'opacity-75',
        goal.mgmtStatus === 'active' && 'border-s-4 border-s-gold',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[16px] font-semibold leading-snug tracking-tight text-ink-navy">
          {goal.nameHe}
        </h3>
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
      </div>
      <p className="text-[12px] text-slate-gray">{domainLabelHe[goal.domain]}</p>
      {current && (
        <p className="text-[14px] font-medium text-ink-navy">
          שלב נוכחי: {current.nameHe}
        </p>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-pebble">
        <div
          className="h-full bg-dusk-blue"
          style={{ width: `${prog.pct}%` }}
          role="progressbar"
          aria-valuenow={prog.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="התקדמות בשלבים"
        />
      </div>
      <p className="text-[12px] text-slate-gray">
        {prog.completed} מתוך {prog.total} שלבים
        <span className="meta-xs-hide">
          {' '}
          הושלמו · אחראי: {goal.ownerNameHe ?? '—'}
        </span>
      </p>
      <p className="meta-xs-hide text-[12px] text-mist-gray">
        עודכן {goal.updatedAt.slice(0, 10)}
        {lastObs
          ? ` · פעילות אחרונה: ${lastObs.kind === 'blocker' ? 'חסם' : 'תצפית'} ${lastObs.observedAt.slice(0, 10)}`
          : ''}
      </p>
      {actionHint && goal.mgmtStatus === 'active' && (
        <p className="text-[12px] font-medium text-warning-text">{actionHint}</p>
      )}
      <Link
        to={`/rehab/goals/${goal.id}${current ? `?stage=${current.id}` : ''}`}
        className="mt-1 inline-flex min-h-10 items-center text-[13px] font-semibold text-signal-blue hover:underline sm:min-h-0"
      >
        כניסה למטרה
      </Link>
    </Panel>
  )
}

function Kpi({
  label,
  value,
  accent,
  warn,
}: {
  label: string
  value: number
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className="kpi-cell">
      <div
        className={cn(
          'kpi-value',
          accent && 'text-signal-blue',
          warn && value > 0 && 'text-warning-text',
        )}
      >
        {value}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}
