import type { RehabSnapshot, SimRole } from '@/data/rehab-demo/types'

type Grant = {
  actor_id: string
  scope: string
  program_id: string | null
  program_patient_id: string | null
  household_id: string | null
  person_id: string | null
  can_read: boolean
  can_write: boolean
  revoked_at: string | null
}

type Team = { program_id: string; actor_id: string }
type Link = { person_id: string; actor_id: string }
type PP = { id: string; program_id: string; person_id: string }
type Program = { id: string; household_id: string | null }

function activeGrants(snapshot: RehabSnapshot): Grant[] {
  return (snapshot.tables.access_grants as Grant[]).filter((g) => !g.revoked_at)
}

export function isHouseholdMember(
  snapshot: RehabSnapshot,
  personId: string,
  householdId: string,
): boolean {
  return (snapshot.tables.household_members as Array<{
    person_id: string
    household_id: string
  }>).some((m) => m.person_id === personId && m.household_id === householdId)
}

export function canReadProgramPatient(
  snapshot: RehabSnapshot,
  actorId: string,
  role: SimRole,
  ppId: string,
): boolean {
  if (role === 'matam') return true

  const pp = (snapshot.tables.program_patients as PP[]).find((p) => p.id === ppId)
  if (!pp) return false
  const program = (snapshot.tables.programs as Program[]).find((p) => p.id === pp.program_id)
  const householdId = program?.household_id ?? null

  const onTeam = (snapshot.tables.program_team_members as Team[]).some(
    (t) => t.program_id === pp.program_id && t.actor_id === actorId,
  )
  if (onTeam && (role === 'companion' || role === 'gov')) return true

  const grants = activeGrants(snapshot).filter((g) => g.actor_id === actorId && g.can_read)
  const hasGrant = grants.some((g) => {
    if (g.scope === 'program' && g.program_id === pp.program_id) return true
    if (g.scope === 'program_patient' && g.program_patient_id === ppId) return true
    if (g.scope === 'household' && householdId && g.household_id === householdId) return true
    if (g.scope === 'person' && g.person_id === pp.person_id) return true
    return false
  })
  if (hasGrant) return true

  if (role === 'patient') {
    const link = (snapshot.tables.person_actor_links as Link[]).find((l) => l.actor_id === actorId)
    return link?.person_id === pp.person_id
  }

  // Guardian / gov without grant: deny (membership alone is insufficient)
  return false
}

export function canWriteProgramPatient(
  snapshot: RehabSnapshot,
  actorId: string,
  role: SimRole,
  ppId: string,
): boolean {
  if (role === 'matam') return true
  if (role === 'gov' || role === 'patient') return false
  const pp = (snapshot.tables.program_patients as PP[]).find((p) => p.id === ppId)
  if (!pp) return false
  return activeGrants(snapshot).some(
    (g) =>
      g.actor_id === actorId &&
      g.can_write &&
      (g.program_patient_id === ppId || g.program_id === pp.program_id),
  )
}
