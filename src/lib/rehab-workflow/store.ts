import type {
  ActivityAffiliation,
  RehabGoalTemplate,
  RehabPersonalGoal,
  RehabPersonalStage,
  RehabStageComment,
  RehabStageObservation,
  RehabStageTemplate,
  RehabVisitRecord,
  RehabWorkflowActor,
  RehabWorkflowState,
  PersonalGoalOutcome,
  PersonalStageStatus,
  ObservationKind,
  ObservationVisibility,
} from '@/types/rehab-workflow'
import { createInitialRehabWorkflowSeed } from '@/data/rehab-workflow-seed'

export type { RehabWorkflowActor, RehabWorkflowState }

export class RehabWorkflowError extends Error {
  code: 'validation' | 'permission' | 'not_found' | 'conflict' | 'integrity'

  constructor(
    message: string,
    code:
      | 'validation'
      | 'permission'
      | 'not_found'
      | 'conflict'
      | 'integrity' = 'validation',
  ) {
    super(message)
    this.name = 'RehabWorkflowError'
    this.code = code
  }
}

let state: RehabWorkflowState = createInitialRehabWorkflowSeed()

export function getRehabState(): RehabWorkflowState {
  return state
}

export function resetRehabWorkflowStore() {
  state = createInitialRehabWorkflowSeed()
}

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function assertCanWriteMember(actor: RehabWorkflowActor, memberId: string) {
  if (actor.role === 'matam') return
  if (actor.role === 'gov' || actor.role === 'family') {
    throw new RehabWorkflowError('אין הרשאת כתיבה לתהליך השיקום', 'permission')
  }
  if (!actor.writableMemberIds.includes(memberId)) {
    throw new RehabWorkflowError('אין הרשאה לכתוב עבור בן משפחה זה', 'permission')
  }
}

export function assertCanReadMember(actor: RehabWorkflowActor, memberId: string) {
  if (actor.role === 'matam') return
  if (
    !actor.readableMemberIds.includes(memberId) &&
    !actor.writableMemberIds.includes(memberId)
  ) {
    throw new RehabWorkflowError('אין הרשאה לצפות בתהליך השיקום', 'permission')
  }
}

export function listActiveTemplates() {
  return state.templates.filter((t) => t.status === 'active')
}

export function getTemplateStages(templateId: string, version?: number) {
  const tmpl = state.templates.find((t) => t.id === templateId)
  if (!tmpl) return []
  const ver = version ?? tmpl.currentVersion
  return state.stageTemplates
    .filter((s) => s.goalTemplateId === templateId && s.versionNumber === ver)
    .sort((a, b) => a.seq - b.seq)
}

export function listGoalsForMember(memberId: string, actor?: RehabWorkflowActor) {
  if (actor) assertCanReadMember(actor, memberId)
  return state.goals
    .filter((g) => g.portalMemberId === memberId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getGoal(goalId: string) {
  return state.goals.find((g) => g.id === goalId)
}

export function getStagesForGoal(goalId: string) {
  return state.stages
    .filter((s) => s.personalGoalId === goalId)
    .sort((a, b) => a.seq - b.seq)
}

export function getStage(stageId: string) {
  return state.stages.find((s) => s.id === stageId)
}

export function goalProgress(goalId: string) {
  const stages = getStagesForGoal(goalId)
  const done = stages.filter((s) => s.status === 'completed' || s.status === 'skipped').length
  const pct = stages.length ? Math.round((done / stages.length) * 100) : 0
  return { total: stages.length, completed: done, pct }
}

/** Stages selectable for a portal member (personal instances only). */
export function listStagesGroupedForMember(
  memberId: string,
  options?: { includeInactive?: boolean },
) {
  const goals = state.goals.filter(
    (g) => g.portalMemberId === memberId && g.mgmtStatus === 'active',
  )
  return goals.map((g) => {
    let stages = getStagesForGoal(g.id)
    if (!options?.includeInactive) {
      stages = stages.filter((s) => s.status === 'in_progress' || s.status === 'paused')
    }
    return { goal: g, stages }
  })
}

export function openPersonalGoal(input: {
  actor: RehabWorkflowActor
  portalMemberId: string
  portalUnitId: string
  personId: string
  templateId: string
  startDate?: string
  targetDate?: string
  notesHe?: string
  ownerNameHe?: string
  forceNewCycle?: boolean
}): RehabPersonalGoal {
  assertCanWriteMember(input.actor, input.portalMemberId)

  const tmpl = state.templates.find((t) => t.id === input.templateId)
  if (!tmpl || tmpl.status !== 'active') {
    throw new RehabWorkflowError('תבנית מטרה אינה פעילה', 'not_found')
  }

  const activeDup = state.goals.find(
    (g) =>
      g.portalMemberId === input.portalMemberId &&
      g.goalTemplateId === input.templateId &&
      g.mgmtStatus === 'active',
  )
  if (activeDup && !input.forceNewCycle) {
    throw new RehabWorkflowError(
      'קיימת מטרה פעילה מאותה תבנית. סגרו אותה לפני פתיחת מחזור חדש.',
      'conflict',
    )
  }
  if (activeDup && input.forceNewCycle) {
    throw new RehabWorkflowError('יש לסגור את המטרה הפעילה לפני פתיחת מחזור חדש', 'conflict')
  }

  const bankStages = getTemplateStages(tmpl.id, tmpl.currentVersion)
  if (!bankStages.length) {
    throw new RehabWorkflowError('לתבנית אין שלבים בגרסה הנוכחית', 'integrity')
  }

  const cycle =
    Math.max(
      0,
      ...state.goals
        .filter(
          (g) =>
            g.portalMemberId === input.portalMemberId && g.goalTemplateId === input.templateId,
        )
        .map((g) => g.cycleNumber),
    ) + 1

  const ts = nowIso()
  const goalId = uid('pg')
  const goal: RehabPersonalGoal = {
    id: goalId,
    personId: input.personId,
    portalMemberId: input.portalMemberId,
    portalUnitId: input.portalUnitId,
    goalTemplateId: tmpl.id,
    pinnedTemplateVersion: tmpl.currentVersion,
    nameHe: tmpl.nameHe,
    domain: tmpl.domain,
    executionMode: tmpl.executionMode,
    mgmtStatus: 'active',
    ownerActorId: input.actor.id,
    ownerNameHe: input.ownerNameHe ?? input.actor.nameHe,
    startDate: input.startDate ?? ts.slice(0, 10),
    targetDate: input.targetDate,
    notesHe: input.notesHe,
    cycleNumber: cycle,
    createdAt: ts,
    updatedAt: ts,
  }

  const stages: RehabPersonalStage[] = bankStages.map((bs) => ({
    id: uid('ps'),
    personalGoalId: goalId,
    stageTemplateId: bs.id,
    seq: bs.seq,
    nameHe: bs.nameHe,
    descriptionHe: bs.descriptionHe,
    isMandatory: bs.isMandatory,
    typicalDays: bs.typicalDays,
    status: 'not_started' as const,
    ownerActorId: input.actor.id,
    ownerNameHe: input.ownerNameHe ?? input.actor.nameHe,
  }))

  // Atomic: both or neither
  state = {
    ...state,
    goals: [goal, ...state.goals],
    stages: [...stages, ...state.stages],
    goalEvents: [
      {
        id: uid('ge'),
        personalGoalId: goalId,
        toStatus: 'active',
        actorId: input.actor.id,
        actorNameHe: input.actor.nameHe,
        reasonHe: 'פתיחת מטרת שיקום אישית',
        occurredAt: ts,
      },
      ...state.goalEvents,
    ],
  }

  return goal
}

export function updateStageStatus(input: {
  actor: RehabWorkflowActor
  stageId: string
  toStatus: PersonalStageStatus
  reasonHe?: string
}) {
  const stage = getStage(input.stageId)
  if (!stage) throw new RehabWorkflowError('שלב לא נמצא', 'not_found')
  const goal = getGoal(stage.personalGoalId)
  if (!goal) throw new RehabWorkflowError('מטרה לא נמצאה', 'not_found')
  assertCanWriteMember(input.actor, goal.portalMemberId)

  if (
    stage.status === 'not_started' &&
    input.toStatus === 'in_progress' &&
    goal.executionMode === 'sequential' &&
    stage.seq > 1 &&
    !input.reasonHe
  ) {
    const prev = getStagesForGoal(goal.id).find((s) => s.seq === stage.seq - 1)
    if (prev && prev.status !== 'completed' && prev.status !== 'skipped') {
      throw new RehabWorkflowError(
        'בתבנית עוקבת יש להשלים את השלב הקודם, או לתעד חריגה מורשית',
        'integrity',
      )
    }
  }

  const ts = nowIso()
  const from = stage.status
  state = {
    ...state,
    stages: state.stages.map((s) =>
      s.id === stage.id
        ? {
            ...s,
            status: input.toStatus,
            startDate:
              input.toStatus === 'in_progress' && !s.startDate
                ? ts.slice(0, 10)
                : s.startDate,
            completedAt:
              input.toStatus === 'completed' ? ts : s.completedAt,
            lastActivityAt: ts,
            exceptionReasonHe: input.reasonHe ?? s.exceptionReasonHe,
          }
        : s,
    ),
    stageEvents: [
      {
        id: uid('se'),
        personalStageId: stage.id,
        fromStatus: from,
        toStatus: input.toStatus,
        actorId: input.actor.id,
        actorNameHe: input.actor.nameHe,
        reasonHe: input.reasonHe,
        occurredAt: ts,
      },
      ...state.stageEvents,
    ],
    goals: state.goals.map((g) =>
      g.id === goal.id ? { ...g, updatedAt: ts } : g,
    ),
  }
}

export function addObservation(input: {
  actor: RehabWorkflowActor
  stageId: string
  kind: ObservationKind
  bodyHe: string
  visibility?: ObservationVisibility
  linkedTaskId?: string
  linkedVisitId?: string
}) {
  const stage = getStage(input.stageId)
  if (!stage) throw new RehabWorkflowError('שלב לא נמצא', 'not_found')
  const goal = getGoal(stage.personalGoalId)!
  assertCanWriteMember(input.actor, goal.portalMemberId)
  if (!input.bodyHe.trim()) {
    throw new RehabWorkflowError('תוכן התצפית חובה', 'validation')
  }
  const ts = nowIso()
  const obs: RehabStageObservation = {
    id: uid('obs'),
    personalStageId: stage.id,
    kind: input.kind,
    bodyHe: input.bodyHe.trim(),
    observedAt: ts,
    authorActorId: input.actor.id,
    authorNameHe: input.actor.nameHe,
    visibility: input.visibility ?? 'internal',
    linkedTaskId: input.linkedTaskId,
    linkedVisitId: input.linkedVisitId,
    createdAt: ts,
  }
  state = {
    ...state,
    observations: [obs, ...state.observations],
    stages: state.stages.map((s) =>
      s.id === stage.id ? { ...s, lastActivityAt: ts } : s,
    ),
    goals: state.goals.map((g) =>
      g.id === goal.id ? { ...g, updatedAt: ts } : g,
    ),
  }
  return obs
}

export function addComment(input: {
  actor: RehabWorkflowActor
  observationId: string
  bodyHe: string
  parentCommentId?: string
}) {
  const obs = state.observations.find((o) => o.id === input.observationId)
  if (!obs) throw new RehabWorkflowError('תצפית לא נמצאה', 'not_found')
  const stage = getStage(obs.personalStageId)!
  const goal = getGoal(stage.personalGoalId)!
  assertCanWriteMember(input.actor, goal.portalMemberId)
  if (!input.bodyHe.trim()) {
    throw new RehabWorkflowError('תוכן התגובה חובה', 'validation')
  }
  const ts = nowIso()
  const c: RehabStageComment = {
    id: uid('cmt'),
    observationId: obs.id,
    parentCommentId: input.parentCommentId,
    bodyHe: input.bodyHe.trim(),
    authorActorId: input.actor.id,
    authorNameHe: input.actor.nameHe,
    createdAt: ts,
  }
  state = { ...state, comments: [c, ...state.comments] }
  return c
}

function stagePersonMemberId(stageId: string): string {
  const stage = getStage(stageId)
  if (!stage) throw new RehabWorkflowError('שלב לא נמצא', 'not_found')
  const goal = getGoal(stage.personalGoalId)
  if (!goal) throw new RehabWorkflowError('מטרה לא נמצאה', 'not_found')
  return goal.portalMemberId
}

/** Server-side integrity for task rehab links. */
export function validateAndSetTaskRehab(input: {
  actor: RehabWorkflowActor
  taskId: string
  memberId?: string
  activityAffiliation: ActivityAffiliation
  rehabPrimaryStageId?: string
  secondaryStageIds?: string[]
  confirmClearLinks?: boolean
}) {
  if (input.activityAffiliation === 'routine') {
    const existing = state.taskRehab[input.taskId]
    if (
      existing?.activityAffiliation === 'rehab' &&
      !input.confirmClearLinks
    ) {
      throw new RehabWorkflowError(
        'נדרש אישור להסרת קישורי השיקום',
        'validation',
      )
    }
    state = {
      ...state,
      taskRehab: {
        ...state.taskRehab,
        [input.taskId]: {
          activityAffiliation: 'routine',
          memberId: input.memberId,
        },
      },
      taskSecondaryLinks: { ...state.taskSecondaryLinks, [input.taskId]: [] },
    }
    return
  }

  if (!input.memberId) {
    throw new RehabWorkflowError('פעילות שיקום מחייבת בחירת בן משפחה', 'validation')
  }
  assertCanWriteMember(input.actor, input.memberId)

  if (!input.rehabPrimaryStageId) {
    throw new RehabWorkflowError('יש לבחור שלב שיקום ראשי', 'validation')
  }

  const primaryMember = stagePersonMemberId(input.rehabPrimaryStageId)
  if (primaryMember !== input.memberId) {
    throw new RehabWorkflowError(
      'שלב השיקום אינו שייך לבן המשפחה שנבחר',
      'integrity',
    )
  }

  const secondary = input.secondaryStageIds ?? []
  if (secondary.includes(input.rehabPrimaryStageId)) {
    throw new RehabWorkflowError('שלב משני לא יכול להיות השלב הראשי', 'integrity')
  }
  const unique = new Set(secondary)
  if (unique.size !== secondary.length) {
    throw new RehabWorkflowError('אין לכפול שלב משני', 'integrity')
  }
  for (const sid of secondary) {
    if (stagePersonMemberId(sid) !== input.memberId) {
      throw new RehabWorkflowError(
        'שלב משני חייב להשתייך לאותו בן משפחה',
        'integrity',
      )
    }
  }

  state = {
    ...state,
    taskRehab: {
      ...state.taskRehab,
      [input.taskId]: {
        activityAffiliation: 'rehab',
        rehabPrimaryStageId: input.rehabPrimaryStageId,
        memberId: input.memberId,
      },
    },
    taskSecondaryLinks: {
      ...state.taskSecondaryLinks,
      [input.taskId]: secondary,
    },
  }
}

export function clearTaskRehabOnMemberChange(taskId: string) {
  const existing = state.taskRehab[taskId]
  if (!existing) return
  state = {
    ...state,
    taskRehab: {
      ...state.taskRehab,
      [taskId]: {
        activityAffiliation: existing.activityAffiliation,
        memberId: undefined,
        rehabPrimaryStageId: undefined,
      },
    },
    taskSecondaryLinks: { ...state.taskSecondaryLinks, [taskId]: [] },
  }
}

export function getTaskRehab(taskId: string) {
  return {
    ...(state.taskRehab[taskId] ?? { activityAffiliation: 'routine' as const }),
    secondaryStageIds: state.taskSecondaryLinks[taskId] ?? [],
  }
}

export function listTasksForStage(stageId: string): Array<{
  taskId: string
  linkRole: 'primary' | 'secondary'
}> {
  const out: Array<{ taskId: string; linkRole: 'primary' | 'secondary' }> = []
  for (const [taskId, meta] of Object.entries(state.taskRehab)) {
    if (meta.rehabPrimaryStageId === stageId) {
      out.push({ taskId, linkRole: 'primary' })
    }
  }
  for (const [taskId, ids] of Object.entries(state.taskSecondaryLinks)) {
    if (ids.includes(stageId)) out.push({ taskId, linkRole: 'secondary' })
  }
  return out
}

/** Closing a task must NOT auto-complete stages. */
export function onTaskClosed(taskId: string) {
  const links = listTasksForStage
  void links
  void taskId
  // intentionally no-op on stage status
}

export function createRehabVisit(input: {
  actor: RehabWorkflowActor
  portalMemberId: string
  portalUnitId: string
  personId: string
  activityAffiliation: ActivityAffiliation
  rehabPrimaryStageId?: string
  secondaryStageIds?: string[]
  participantMemberIds?: string[]
  visitDate?: string
  visitTypeHe?: string
  summaryHe?: string
  status?: RehabVisitRecord['status']
}): RehabVisitRecord {
  assertCanWriteMember(input.actor, input.portalMemberId)

  if (input.activityAffiliation === 'rehab') {
    if (!input.rehabPrimaryStageId) {
      throw new RehabWorkflowError('ביקור שיקומי מחייב שלב ראשי', 'validation')
    }
    if (stagePersonMemberId(input.rehabPrimaryStageId) !== input.portalMemberId) {
      throw new RehabWorkflowError(
        'שלב השיקום אינו שייך לבן המשפחה הראשי של הביקור',
        'integrity',
      )
    }
  }

  const secondary = input.secondaryStageIds ?? []
  for (const sid of secondary) {
    if (sid === input.rehabPrimaryStageId) {
      throw new RehabWorkflowError('שלב משני לא יכול להיות הראשי', 'integrity')
    }
    // Explicit only — no auto-link for other participants' stages
    if (stagePersonMemberId(sid) !== input.portalMemberId) {
      throw new RehabWorkflowError(
        'קישור לשלב של משתתף אחר דורש בחירה מפורשת לפי משתתף (לא מיושם אוטומטית)',
        'integrity',
      )
    }
  }

  const visit: RehabVisitRecord = {
    id: uid('rv'),
    primaryPersonId: input.personId,
    portalMemberId: input.portalMemberId,
    portalUnitId: input.portalUnitId,
    activityAffiliation: input.activityAffiliation,
    rehabPrimaryStageId: input.rehabPrimaryStageId,
    visitDate: input.visitDate ?? nowIso().slice(0, 10),
    visitTypeHe: input.visitTypeHe ?? 'ביקור בית',
    status: input.status ?? 'completed',
    summaryHe: input.summaryHe,
    performedByNameHe: input.actor.nameHe,
    participantMemberIds: [
      input.portalMemberId,
      ...(input.participantMemberIds ?? []).filter((id) => id !== input.portalMemberId),
    ],
    secondaryStageIds: secondary,
    createdAt: nowIso(),
  }

  state = { ...state, visits: [visit, ...state.visits] }
  return visit
}

export function listVisitsForStage(stageId: string) {
  return state.visits.filter(
    (v) =>
      v.rehabPrimaryStageId === stageId || v.secondaryStageIds.includes(stageId),
  )
}

export function closePersonalGoal(input: {
  actor: RehabWorkflowActor
  goalId: string
  outcome: PersonalGoalOutcome
  summaryHe?: string
}) {
  const goal = getGoal(input.goalId)
  if (!goal) throw new RehabWorkflowError('מטרה לא נמצאה', 'not_found')
  assertCanWriteMember(input.actor, goal.portalMemberId)
  const ts = nowIso()
  state = {
    ...state,
    goals: state.goals.map((g) =>
      g.id === goal.id
        ? {
            ...g,
            mgmtStatus: input.outcome === 'cancelled' ? 'cancelled' : 'completed',
            outcome: input.outcome,
            completedAt: ts,
            completedByActorId: input.actor.id,
            summaryHe: input.summaryHe,
            updatedAt: ts,
          }
        : g,
    ),
    goalEvents: [
      {
        id: uid('ge'),
        personalGoalId: goal.id,
        fromStatus: goal.mgmtStatus,
        toStatus: input.outcome === 'cancelled' ? 'cancelled' : 'completed',
        outcome: input.outcome,
        actorId: input.actor.id,
        actorNameHe: input.actor.nameHe,
        reasonHe: input.summaryHe,
        occurredAt: ts,
      },
      ...state.goalEvents,
    ],
  }
}

/** Bank: bump version + add stage — does not mutate opened personal goals. */
export function addBankStageViaNewVersion(input: {
  templateId: string
  code: string
  nameHe: string
  descriptionHe?: string
}) {
  const tmpl = state.templates.find((t) => t.id === input.templateId)
  if (!tmpl) throw new RehabWorkflowError('תבנית לא נמצאה', 'not_found')
  const oldVer = tmpl.currentVersion
  const newVer = oldVer + 1
  const oldStages = getTemplateStages(tmpl.id, oldVer)
  const copied: RehabStageTemplate[] = oldStages.map((s) => ({
    ...s,
    id: uid('bst'),
    versionNumber: newVer,
  }))
  const nextSeq = copied.length + 1
  copied.push({
    id: uid('bst'),
    goalTemplateId: tmpl.id,
    versionNumber: newVer,
    seq: nextSeq,
    code: input.code,
    nameHe: input.nameHe,
    descriptionHe: input.descriptionHe,
    isMandatory: true,
  })
  state = {
    ...state,
    templates: state.templates.map((t) =>
      t.id === tmpl.id ? { ...t, currentVersion: newVer } : t,
    ),
    stageTemplates: [...state.stageTemplates, ...copied],
  }
  return newVer
}

export function createBankTemplate(input: {
  code: string
  nameHe: string
  domain: RehabGoalTemplate['domain']
  executionMode: RehabGoalTemplate['executionMode']
  descriptionHe?: string
  stages: Array<{ code: string; nameHe: string; descriptionHe?: string; isMandatory?: boolean }>
}) {
  if (state.templates.some((t) => t.code === input.code)) {
    throw new RehabWorkflowError('קוד תבנית כבר קיים', 'conflict')
  }
  const id = uid('gt')
  const tmpl: RehabGoalTemplate = {
    id,
    code: input.code,
    nameHe: input.nameHe,
    domain: input.domain,
    descriptionHe: input.descriptionHe,
    executionMode: input.executionMode,
    status: 'active',
    currentVersion: 1,
  }
  const stages: RehabStageTemplate[] = input.stages.map((s, i) => ({
    id: uid('bst'),
    goalTemplateId: id,
    versionNumber: 1,
    seq: i + 1,
    code: s.code,
    nameHe: s.nameHe,
    descriptionHe: s.descriptionHe,
    isMandatory: s.isMandatory ?? true,
  }))
  state = {
    ...state,
    templates: [...state.templates, tmpl],
    stageTemplates: [...state.stageTemplates, ...stages],
  }
  return tmpl
}

export function buildTimeline(goalId: string) {
  const stages = getStagesForGoal(goalId)
  const stageIds = new Set(stages.map((s) => s.id))
  const events: Array<{
    id: string
    occurredAt: string
    kind: string
    titleHe: string
    actorNameHe?: string
    personalStageId?: string
  }> = []

  for (const e of state.goalEvents.filter((x) => x.personalGoalId === goalId)) {
    events.push({
      id: e.id,
      occurredAt: e.occurredAt,
      kind: 'goal_status',
      titleHe: `סטטוס מטרה → ${e.toStatus}`,
      actorNameHe: e.actorNameHe,
    })
  }
  for (const e of state.stageEvents.filter((x) => stageIds.has(x.personalStageId))) {
    const st = getStage(e.personalStageId)
    events.push({
      id: e.id,
      occurredAt: e.occurredAt,
      kind: 'stage_status',
      titleHe: `${st?.nameHe ?? 'שלב'}: ${e.toStatus}`,
      actorNameHe: e.actorNameHe,
      personalStageId: e.personalStageId,
    })
  }
  for (const o of state.observations.filter((x) => stageIds.has(x.personalStageId))) {
    events.push({
      id: o.id,
      occurredAt: o.observedAt,
      kind: 'observation',
      titleHe: `תצפית: ${o.bodyHe.slice(0, 60)}`,
      actorNameHe: o.authorNameHe,
      personalStageId: o.personalStageId,
    })
  }
  for (const c of state.comments) {
    const o = state.observations.find((x) => x.id === c.observationId)
    if (!o || !stageIds.has(o.personalStageId)) continue
    events.push({
      id: c.id,
      occurredAt: c.createdAt,
      kind: 'comment',
      titleHe: `תגובה: ${c.bodyHe.slice(0, 60)}`,
      actorNameHe: c.authorNameHe,
      personalStageId: o.personalStageId,
    })
  }
  for (const [taskId, meta] of Object.entries(state.taskRehab)) {
    if (meta.rehabPrimaryStageId && stageIds.has(meta.rehabPrimaryStageId)) {
      events.push({
        id: `task-${taskId}`,
        occurredAt: nowIso(),
        kind: 'task',
        titleHe: `משימה מקושרת (${taskId})`,
        personalStageId: meta.rehabPrimaryStageId,
      })
    }
  }
  for (const v of state.visits) {
    if (v.rehabPrimaryStageId && stageIds.has(v.rehabPrimaryStageId)) {
      events.push({
        id: v.id,
        occurredAt: v.createdAt,
        kind: 'visit',
        titleHe: `ביקור: ${v.summaryHe?.slice(0, 60) ?? v.visitTypeHe}`,
        actorNameHe: v.performedByNameHe,
        personalStageId: v.rehabPrimaryStageId,
      })
    }
  }

  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function resolveActorFromPortalUser(user: {
  id: string
  name: string
  role: string
}): RehabWorkflowActor {
  const found = state.actors.find((a) => a.id === user.id)
  if (found) return found
  return {
    id: user.id,
    nameHe: user.name,
    role:
      user.role === 'matam'
        ? 'matam'
        : user.role === 'molecule'
          ? 'companion'
          : user.role === 'family'
            ? 'family'
            : 'companion',
    writableMemberIds:
      user.role === 'matam'
        ? []
        : user.role === 'molecule'
          ? state.goals.map((g) => g.portalMemberId)
          : [],
    readableMemberIds:
      user.role === 'family' ? [] : state.goals.map((g) => g.portalMemberId),
  }
}
