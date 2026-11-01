/**
 * Access rules for the mock portal prototype.
 * View filters (tabs / "הכול") never grant more data than these rules allow.
 */
import { getUnit, units } from '@/data/mock'
import type {
  ChatterMessage,
  ChatterVisibility,
  Task,
  TreatmentUnit,
  User,
} from '@/types'

/** Minimum Chatter documentation length required to close a task. */
export const CLOSE_DOCUMENTATION_MIN_CHARS = 20

export function isMatam(user: User) {
  return user.role === 'matam'
}

export function isMolecule(user: User) {
  return user.role === 'molecule'
}

/** Government reps never receive internal Chatter — even under "הכול". */
export function canViewInternalChatter(user: User) {
  return user.role === 'matam'
}

export function canPostInternalChatter(user: User) {
  return user.role === 'matam'
}

export function canChangeTaskStatus(user: User) {
  return user.role === 'matam'
}

export function canCloseTask(user: User) {
  return user.role === 'matam'
}

/** Units assigned to this user (affiliation-based, not cosmetic sort). */
export function affiliatedUnitIds(user: User): string[] {
  if (user.role === 'matam') {
    return units.filter((u) => u.matamId === user.id).map((u) => u.id)
  }
  if (user.role === 'molecule') {
    return user.affiliatedUnitIds ?? []
  }
  return []
}

export function canViewUnit(user: User, unitId: string): boolean {
  if (user.role === 'family') return false
  return affiliatedUnitIds(user).includes(unitId)
}

export function visibleUnits(user: User, all: TreatmentUnit[] = units): TreatmentUnit[] {
  const ids = new Set(affiliatedUnitIds(user))
  return all.filter((u) => ids.has(u.id))
}

/**
 * Matam sees every task in units they own, regardless of task owner/assignee.
 * Molecule sees tasks only in affiliated units where they participate / wait.
 */
export function canViewTask(user: User, task: Task): boolean {
  if (user.role === 'family') return false
  if (!canViewUnit(user, task.unitId)) return false
  if (user.role === 'matam') return true
  return (
    task.participantIds.includes(user.id) ||
    task.waitingOnIds.includes(user.id) ||
    task.ownerId === user.id
  )
}

export function visibleTasks(user: User, all: Task[]): Task[] {
  return all.filter((t) => canViewTask(user, t))
}

/**
 * Caseload for a matam home: all tasks in responsible units
 * (ownership of the unit, not the task assignee).
 */
export function matamCaseloadTasks(user: User, all: Task[]): Task[] {
  if (user.role !== 'matam') return visibleTasks(user, all)
  const mine = new Set(affiliatedUnitIds(user))
  return all.filter((t) => mine.has(t.unitId))
}

/** Strip inaccessible messages; view filter applies only after this. */
export function filterChatterForUser(
  user: User,
  messages: ChatterMessage[],
): ChatterMessage[] {
  if (canViewInternalChatter(user)) return messages
  return messages.filter((m) => m.visibility === 'shared')
}

export function allowedChatterVisibilities(user: User): ChatterVisibility[] {
  return canViewInternalChatter(user)
    ? ['shared', 'internal']
    : ['shared']
}

export function applyChatterViewFilter(
  messages: ChatterMessage[],
  view: 'all' | ChatterVisibility,
): ChatterMessage[] {
  if (view === 'all') return messages
  return messages.filter((m) => m.visibility === view)
}

export function validateCloseDocumentation(body: string): string | null {
  const trimmed = body.trim()
  if (trimmed.length < CLOSE_DOCUMENTATION_MIN_CHARS) {
    return `נדרש תיעוד של לפחות ${CLOSE_DOCUMENTATION_MIN_CHARS} תווים לפני סגירת משימה`
  }
  return null
}

export function unitLabel(unitId: string) {
  const u = getUnit(unitId)
  return u ? `משפחת ${u.familyName}` : unitId
}
