/**
 * API stubs — structure for future Salesforce / backend wiring.
 * All functions currently resolve against in-memory mock data.
 * Access rules are enforced here so UI filters cannot bypass permissions.
 */
import {
  canPostInternalChatter,
  canViewInternalChatter,
  filterChatterForUser,
  validateCloseDocumentation,
} from '@/lib/access'
import {
  chatterSeed,
  documents,
  familyRequests,
  getUnit,
  knowledgeItems,
  notifications,
  orgNews,
  rehabNotes,
  tasks as seedTasks,
  units,
  users,
  visits as seedVisits,
} from '@/data/mock'
import { portalMemberPersonId } from '@/data/rehab-workflow-seed'
import {
  RehabWorkflowError,
  createRehabVisit,
  getTaskRehab,
  onTaskClosed,
  resolveActorFromPortalUser,
  validateAndSetTaskRehab,
} from '@/lib/rehab-workflow/store'
import type {
  ActivityAffiliation,
  ChatterMessage,
  Task,
  TaskStatus,
  TreatmentUnit,
  User,
  Visit,
} from '@/types'

let tasksStore: Task[] = structuredClone(seedTasks)
let chatterStore: ChatterMessage[] = structuredClone(chatterSeed)
let rehabStore = structuredClone(rehabNotes)
let visitsStore: Visit[] = structuredClone(seedVisits)

function resolveUser(userId: string): User {
  const u = users.find((x) => x.id === userId)
  if (!u) throw new Error(`Unknown user ${userId}`)
  return u
}

export async function fetchTasks(): Promise<Task[]> {
  return structuredClone(tasksStore)
}

export async function fetchTask(id: string): Promise<Task | undefined> {
  return structuredClone(tasksStore.find((t) => t.id === id))
}

export async function fetchUnits(): Promise<TreatmentUnit[]> {
  return structuredClone(units)
}

export async function fetchUnit(id: string) {
  return structuredClone(getUnit(id))
}

/**
 * Chatter load — access filtering happens in the data layer.
 * Molecules never receive internal messages, regardless of UI view tab.
 */
export async function fetchChatter(
  taskId: string,
  viewerId: string,
): Promise<ChatterMessage[]> {
  const viewer = resolveUser(viewerId)
  const all = chatterStore.filter((c) => c.taskId === taskId)
  return structuredClone(filterChatterForUser(viewer, all))
}

export async function postChatter(
  message: Omit<ChatterMessage, 'id' | 'createdAt'>,
): Promise<ChatterMessage> {
  const author = resolveUser(message.authorId)
  if (message.visibility === 'internal' && !canPostInternalChatter(author)) {
    throw new Error('אין הרשאה לפרסם הודעה פנימית')
  }
  const created: ChatterMessage = {
    ...message,
    id: `ch-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  chatterStore = [...chatterStore, created]
  tasksStore = tasksStore.map((t) =>
    t.id === message.taskId
      ? {
          ...t,
          hasNewReply: true,
          needsAttention: true,
          updatedAt: created.createdAt,
          lastActivity: 'תגובה חדשה נוספה',
        }
      : t,
  )
  return created
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  options?: { needsAttention?: boolean },
): Promise<Task | undefined> {
  tasksStore = tasksStore.map((t) =>
    t.id === taskId
      ? {
          ...t,
          status,
          needsAttention:
            options?.needsAttention !== undefined
              ? options.needsAttention
              : status === 'done' || status === 'closed'
                ? false
                : t.needsAttention,
          updatedAt: new Date().toISOString(),
          lastActivity: 'סטטוס עודכן',
        }
      : t,
  )
  return fetchTask(taskId)
}

export async function setTaskNeedsAttention(
  taskId: string,
  needsAttention: boolean,
): Promise<Task | undefined> {
  tasksStore = tasksStore.map((t) =>
    t.id === taskId
      ? {
          ...t,
          needsAttention,
          updatedAt: new Date().toISOString(),
          lastActivity: needsAttention
            ? 'סומן כדורש טיפול'
            : 'הוסר סימון דורש טיפול',
        }
      : t,
  )
  return fetchTask(taskId)
}

/**
 * Close task with Chatter documentation validation (min 20 chars).
 * Molecule callers are rejected by the caller; this enforces documentation.
 */
export async function closeTaskWithDocumentation(input: {
  taskId: string
  authorId: string
  documentation: string
  visibility?: ChatterMessage['visibility']
}): Promise<Task | undefined> {
  const author = resolveUser(input.authorId)
  if (!canViewInternalChatter(author) && author.role !== 'matam') {
    // close is matam-only; belt-and-suspenders at stub layer
  }
  if (author.role !== 'matam') {
    throw new Error('אין הרשאה לסגור משימה')
  }
  const docError = validateCloseDocumentation(input.documentation)
  if (docError) throw new Error(docError)

  const visibility = input.visibility ?? 'shared'
  if (visibility === 'internal' && !canPostInternalChatter(author)) {
    throw new Error('אין הרשאה לתיעוד פנימי')
  }

  await postChatter({
    taskId: input.taskId,
    authorId: input.authorId,
    body: input.documentation.trim(),
    visibility,
  })

  const closed = await updateTaskStatus(input.taskId, 'done', {
    needsAttention: false,
  })
  onTaskClosed(input.taskId)
  return closed
}

export async function createTask(
  input: Omit<
    Task,
    | 'id'
    | 'number'
    | 'createdAt'
    | 'updatedAt'
    | 'hasNewReply'
    | 'lastActivity'
    | 'participantIds'
    | 'waitingOnIds'
    | 'status'
    | 'needsAttention'
  > & {
    status?: TaskStatus
    needsAttention?: boolean
    actorUserId?: string
    confirmClearRehabLinks?: boolean
  },
): Promise<Task> {
  const affiliation: ActivityAffiliation = input.activityAffiliation ?? 'routine'
  const actorUser = resolveUser(input.actorUserId ?? input.creatorId)
  const actor = resolveActorFromPortalUser(actorUser)
  const n = 1000 + tasksStore.length + 1
  const now = new Date().toISOString()
  const taskId = `t-${n}`

  try {
    validateAndSetTaskRehab({
      actor,
      taskId,
      memberId: input.memberId,
      activityAffiliation: affiliation,
      rehabPrimaryStageId: input.rehabPrimaryStageId,
      secondaryStageIds: input.rehabSecondaryStageIds,
      confirmClearLinks: input.confirmClearRehabLinks,
    })
  } catch (e) {
    if (e instanceof RehabWorkflowError) throw new Error(e.message)
    throw e
  }

  const rehabMeta = getTaskRehab(taskId)
  const task: Task = {
    ...input,
    id: taskId,
    number: `TSK-${n}`,
    status: input.status ?? 'open',
    needsAttention: input.needsAttention ?? false,
    participantIds: [],
    waitingOnIds: [],
    createdAt: now,
    updatedAt: now,
    hasNewReply: false,
    lastActivity:
      affiliation === 'rehab' ? 'נוצרה משימת שיקום' : 'נוצרה משימה',
    activityAffiliation: affiliation,
    rehabPrimaryStageId: rehabMeta.rehabPrimaryStageId,
    rehabSecondaryStageIds: rehabMeta.secondaryStageIds,
  }
  tasksStore = [task, ...tasksStore]
  return structuredClone(task)
}

export async function updateTaskRehabLinks(input: {
  taskId: string
  actorUserId: string
  memberId?: string
  activityAffiliation: ActivityAffiliation
  rehabPrimaryStageId?: string
  rehabSecondaryStageIds?: string[]
  confirmClearRehabLinks?: boolean
}): Promise<Task | undefined> {
  const actor = resolveActorFromPortalUser(resolveUser(input.actorUserId))
  try {
    validateAndSetTaskRehab({
      actor,
      taskId: input.taskId,
      memberId: input.memberId,
      activityAffiliation: input.activityAffiliation,
      rehabPrimaryStageId: input.rehabPrimaryStageId,
      secondaryStageIds: input.rehabSecondaryStageIds,
      confirmClearLinks: input.confirmClearRehabLinks,
    })
  } catch (e) {
    if (e instanceof RehabWorkflowError) throw new Error(e.message)
    throw e
  }
  const meta = getTaskRehab(input.taskId)
  tasksStore = tasksStore.map((t) =>
    t.id === input.taskId
      ? {
          ...t,
          memberId: input.memberId,
          activityAffiliation: meta.activityAffiliation,
          rehabPrimaryStageId: meta.rehabPrimaryStageId,
          rehabSecondaryStageIds: meta.secondaryStageIds,
          updatedAt: new Date().toISOString(),
          lastActivity: 'עודכן שיוך שיקום',
        }
      : t,
  )
  return fetchTask(input.taskId)
}

export async function fetchNotifications() {
  return structuredClone(notifications)
}

export async function fetchOrgNews() {
  return structuredClone(orgNews)
}

export async function fetchKnowledge() {
  return structuredClone(knowledgeItems)
}

export async function fetchFamilyRequests() {
  return structuredClone(familyRequests)
}

export async function fetchUnitExtras(unitId: string) {
  return {
    visits: visitsStore.filter((v) => v.unitId === unitId),
    rehab: rehabStore.filter((r) => r.unitId === unitId),
    documents: documents.filter((d) => d.unitId === unitId),
  }
}

export async function createVisit(input: {
  unitId: string
  summary: string
  visitedBy: string
  memberId?: string
  activityAffiliation?: ActivityAffiliation
  rehabPrimaryStageId?: string
  rehabSecondaryStageIds?: string[]
  participantMemberIds?: string[]
  visitTypeHe?: string
  actorUserId: string
}): Promise<Visit> {
  const affiliation = input.activityAffiliation ?? 'routine'
  if (affiliation === 'rehab') {
    if (!input.memberId) throw new Error('ביקור שיקומי מחייב בן משפחה')
    const actor = resolveActorFromPortalUser(resolveUser(input.actorUserId))
    try {
      createRehabVisit({
        actor,
        portalMemberId: input.memberId,
        portalUnitId: input.unitId,
        personId: portalMemberPersonId[input.memberId] ?? input.memberId,
        activityAffiliation: 'rehab',
        rehabPrimaryStageId: input.rehabPrimaryStageId,
        secondaryStageIds: input.rehabSecondaryStageIds,
        participantMemberIds: input.participantMemberIds,
        summaryHe: input.summary,
        visitTypeHe: input.visitTypeHe,
        status: 'completed',
      })
    } catch (e) {
      if (e instanceof RehabWorkflowError) throw new Error(e.message)
      throw e
    }
  }

  const created: Visit = {
    id: `v-${Date.now()}`,
    unitId: input.unitId,
    date: new Date().toISOString().slice(0, 10),
    summary: input.summary.trim(),
    visitedBy: input.visitedBy,
    memberId: input.memberId,
    activityAffiliation: affiliation,
    rehabPrimaryStageId: input.rehabPrimaryStageId,
    rehabSecondaryStageIds: input.rehabSecondaryStageIds,
    participantMemberIds: input.participantMemberIds,
    visitTypeHe: input.visitTypeHe ?? 'ביקור בית',
    status: 'completed',
  }
  visitsStore = [created, ...visitsStore]
  return structuredClone(created)
}

export async function addRehabNote(input: {
  unitId: string
  memberId: string
  title: string
  note: string
}) {
  if (!input.memberId) throw new Error('עדכון שיקום מחייב בחירת בן/בת משפחה')
  const unit = getUnit(input.unitId)
  if (!unit?.members.some((m) => m.id === input.memberId)) {
    throw new Error('בן/בת המשפחה אינו שייך ליחידת הטיפול')
  }
  const created = {
    id: `r-${Date.now()}`,
    unitId: input.unitId,
    memberId: input.memberId,
    date: new Date().toISOString().slice(0, 10),
    title: input.title.trim(),
    note: input.note.trim(),
  }
  rehabStore = [created, ...rehabStore]
  return structuredClone(created)
}

export function resetMockStores() {
  tasksStore = structuredClone(seedTasks)
  chatterStore = structuredClone(chatterSeed)
  rehabStore = structuredClone(rehabNotes)
  visitsStore = structuredClone(seedVisits)
}
