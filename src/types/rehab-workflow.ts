/** Personal rehab goal/stage workflow types (portal + shared integrity). */

export type RehabDomain =
  | 'employment'
  | 'education'
  | 'daily_function'
  | 'emotional_support'
  | 'health'
  | 'social'
  | 'housing'
  | 'other'

export type GoalBankStatus = 'draft' | 'active' | 'retired'
export type StageExecutionMode = 'sequential' | 'parallel'
export type PersonalGoalMgmtStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type PersonalGoalOutcome =
  | 'achieved'
  | 'partial'
  | 'not_achieved'
  | 'cancelled'
  | 'not_relevant'
export type PersonalStageStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'skipped'
  | 'cancelled'
export type ObservationKind =
  | 'progress'
  | 'blocker'
  | 'condition_change'
  | 'recommendation'
  | 'action_done'
  | 'decision'
  | 'other'
export type ObservationVisibility = 'internal' | 'shared' | 'external_allowed'
export type ActivityAffiliation = 'routine' | 'rehab'
export type RehabLinkRole = 'primary' | 'secondary'
export type RehabVisitStatus = 'planned' | 'completed' | 'cancelled' | 'no_show'

export interface RehabGoalTemplate {
  id: string
  code: string
  nameHe: string
  domain: RehabDomain
  descriptionHe?: string
  guidelinesHe?: string
  executionMode: StageExecutionMode
  status: GoalBankStatus
  currentVersion: number
}

export interface RehabStageTemplate {
  id: string
  goalTemplateId: string
  versionNumber: number
  seq: number
  code: string
  nameHe: string
  descriptionHe?: string
  isMandatory: boolean
  typicalDays?: number
}

export interface RehabPersonalGoal {
  id: string
  personId: string
  portalMemberId: string
  portalUnitId: string
  programPatientId?: string
  goalTemplateId: string
  pinnedTemplateVersion: number
  nameHe: string
  domain: RehabDomain
  executionMode: StageExecutionMode
  mgmtStatus: PersonalGoalMgmtStatus
  outcome?: PersonalGoalOutcome
  ownerActorId?: string
  ownerNameHe?: string
  startDate?: string
  targetDate?: string
  completedAt?: string
  completedByActorId?: string
  summaryHe?: string
  notesHe?: string
  cycleNumber: number
  updatedAt: string
  createdAt: string
}

export interface RehabPersonalStage {
  id: string
  personalGoalId: string
  stageTemplateId?: string
  seq: number
  nameHe: string
  descriptionHe?: string
  isMandatory: boolean
  typicalDays?: number
  status: PersonalStageStatus
  ownerActorId?: string
  ownerNameHe?: string
  startDate?: string
  targetDate?: string
  completedAt?: string
  lastActivityAt?: string
  exceptionReasonHe?: string
}

export interface RehabStageObservation {
  id: string
  personalStageId: string
  kind: ObservationKind
  bodyHe: string
  observedAt: string
  authorActorId: string
  authorNameHe: string
  visibility: ObservationVisibility
  linkedTaskId?: string
  linkedVisitId?: string
  createdAt: string
  editedAt?: string
}

export interface RehabStageComment {
  id: string
  observationId: string
  parentCommentId?: string
  bodyHe: string
  authorActorId: string
  authorNameHe: string
  createdAt: string
  editedAt?: string
}

export interface RehabStageStatusEvent {
  id: string
  personalStageId: string
  fromStatus?: PersonalStageStatus
  toStatus: PersonalStageStatus
  actorId?: string
  actorNameHe?: string
  reasonHe?: string
  occurredAt: string
}

export interface RehabGoalStatusEvent {
  id: string
  personalGoalId: string
  fromStatus?: PersonalGoalMgmtStatus
  toStatus: PersonalGoalMgmtStatus
  outcome?: PersonalGoalOutcome
  actorId?: string
  actorNameHe?: string
  reasonHe?: string
  occurredAt: string
}

export interface RehabVisitRecord {
  id: string
  primaryPersonId: string
  portalMemberId: string
  portalUnitId: string
  activityAffiliation: ActivityAffiliation
  rehabPrimaryStageId?: string
  visitDate: string
  visitTypeHe: string
  status: RehabVisitStatus
  summaryHe?: string
  performedByNameHe: string
  participantMemberIds: string[]
  secondaryStageIds: string[]
  createdAt: string
}

export interface RehabTimelineEvent {
  id: string
  personalGoalId: string
  personalStageId?: string
  occurredAt: string
  kind: string
  titleHe: string
  actorNameHe?: string
  href?: string
}

export const domainLabelHe: Record<RehabDomain, string> = {
  employment: 'תעסוקה',
  education: 'השכלה',
  daily_function: 'תפקוד יומיומי',
  emotional_support: 'תמיכה רגשית',
  health: 'בריאות',
  social: 'קשרים חברתיים',
  housing: 'דיור',
  other: 'אחר',
}

export const stageStatusLabelHe: Record<PersonalStageStatus, string> = {
  not_started: 'טרם התחיל',
  in_progress: 'בביצוע',
  paused: 'מושהה',
  completed: 'הושלם',
  skipped: 'דולג',
  cancelled: 'בוטל',
}

export const goalMgmtLabelHe: Record<PersonalGoalMgmtStatus, string> = {
  active: 'פעילה',
  paused: 'מושהה',
  completed: 'סגורה',
  cancelled: 'בוטלה',
}

export const outcomeLabelHe: Record<PersonalGoalOutcome, string> = {
  achieved: 'המטרה הושגה',
  partial: 'המטרה הושגה חלקית',
  not_achieved: 'המטרה לא הושגה',
  cancelled: 'המטרה בוטלה',
  not_relevant: 'המטרה אינה רלוונטית עוד',
}

export const observationKindLabelHe: Record<ObservationKind, string> = {
  progress: 'עדכון התקדמות',
  blocker: 'קושי או חסם',
  condition_change: 'שינוי במצב',
  recommendation: 'המלצה מקצועית',
  action_done: 'תיעוד פעולה',
  decision: 'החלטה או הנחיה',
  other: 'אחר',
}

export interface RehabWorkflowActor {
  id: string
  nameHe: string
  role: 'matam' | 'companion' | 'gov' | 'family' | 'molecule'
  writableMemberIds: string[]
  readableMemberIds: string[]
}

export interface RehabWorkflowState {
  templates: RehabGoalTemplate[]
  stageTemplates: RehabStageTemplate[]
  goals: RehabPersonalGoal[]
  stages: RehabPersonalStage[]
  observations: RehabStageObservation[]
  comments: RehabStageComment[]
  stageEvents: RehabStageStatusEvent[]
  goalEvents: RehabGoalStatusEvent[]
  visits: RehabVisitRecord[]
  taskSecondaryLinks: Record<string, string[]>
  taskRehab: Record<
    string,
    {
      activityAffiliation: ActivityAffiliation
      rehabPrimaryStageId?: string
      memberId?: string
    }
  >
  actors: RehabWorkflowActor[]
}
