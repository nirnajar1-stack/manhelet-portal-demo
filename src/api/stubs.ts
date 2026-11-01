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
  visits,
} from '@/data/mock'
import type {
  ChatterMessage,
  Task,
  TaskStatus,
  TreatmentUnit,
  User,
} from '@/types'

let tasksStore: Task[] = structuredClone(seedTasks)
let chatterStore: ChatterMessage[] = structuredClone(chatterSeed)
let rehabStore = structuredClone(rehabNotes)

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

  return updateTaskStatus(input.taskId, 'done', { needsAttention: false })
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
  > & { status?: TaskStatus; needsAttention?: boolean },
): Promise<Task> {
  const n = 1000 + tasksStore.length + 1
  const now = new Date().toISOString()
  const task: Task = {
    ...input,
    id: `t-${n}`,
    number: `TSK-${n}`,
    status: input.status ?? 'open',
    needsAttention: input.needsAttention ?? false,
    participantIds: [],
    waitingOnIds: [],
    createdAt: now,
    updatedAt: now,
    hasNewReply: false,
    lastActivity: 'נוצרה משימה',
  }
  tasksStore = [task, ...tasksStore]
  return structuredClone(task)
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
    visits: visits.filter((v) => v.unitId === unitId),
    rehab: rehabStore.filter((r) => r.unitId === unitId),
    documents: documents.filter((d) => d.unitId === unitId),
  }
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
}
