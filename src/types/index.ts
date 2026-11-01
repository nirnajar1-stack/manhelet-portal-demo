export type UserRole = 'matam' | 'molecule' | 'family'

/** Business task statuses only — "דורש טיפול" is a separate indicator. */
export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'waiting'
  | 'done'
  | 'closed'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ChatterVisibility = 'shared' | 'internal'

export interface User {
  id: string
  name: string
  role: UserRole
  title: string
  org?: string
  avatarInitials: string
  /** Treatment units this user is affiliated with (molecules / explicit assignments). */
  affiliatedUnitIds?: string[]
}

export interface FamilyMember {
  id: string
  name: string
  relation: string
  phone?: string
}

export interface TreatmentUnit {
  id: string
  familyName: string
  region: string
  openTasks: number
  overdueTasks: number
  lastActivityAt: string
  needsAttention: boolean
  matamId: string
  members: FamilyMember[]
  summary: string
}

export interface Task {
  id: string
  number: string
  title: string
  description: string
  status: TaskStatus
  /** Operational attention flag — not a business status. */
  needsAttention: boolean
  priority: TaskPriority
  domain: string
  subDomain: string
  unitId: string
  memberId?: string
  ownerId: string
  creatorId: string
  participantIds: string[]
  waitingOnIds: string[]
  dueDate?: string
  updatedAt: string
  createdAt: string
  hasNewReply: boolean
  lastActivity: string
}

export interface ChatterMessage {
  id: string
  taskId: string
  authorId: string
  body: string
  createdAt: string
  visibility: ChatterVisibility
}

export interface Visit {
  id: string
  unitId: string
  date: string
  summary: string
  visitedBy: string
}

export interface RehabNote {
  id: string
  unitId: string
  /** Required: rehab update is tied to a specific person in the unit. */
  memberId: string
  date: string
  title: string
  note: string
}

export interface DocumentItem {
  id: string
  unitId: string
  name: string
  kind: string
  updatedAt: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
}

export interface OrgNewsItem {
  id: string
  kind: 'news' | 'leadership' | 'event' | 'initiative' | 'people' | 'procedure' | 'tool'
  title: string
  summary: string
  date: string
  pinned?: boolean
}

export interface FamilyRequest {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'done'
  updatedAt: string
  summary: string
}

export interface KnowledgeItem {
  id: string
  title: string
  category: string
  summary: string
}
