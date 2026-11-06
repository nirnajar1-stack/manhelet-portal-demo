import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { bootSeededDb, IDS } from '../scripts/db.ts'

let db: PGlite

beforeAll(async () => {
  db = await bootSeededDb()
})

afterAll(async () => {
  await db?.close()
})

async function setActor(actorId: string, role: string) {
  await db.query(`SELECT set_config('rehab.actor_id', $1, false)`, [actorId])
  await db.query(`SELECT set_config('rehab.access_role', $1, false)`, [role])
}

async function canRead(ppId: string): Promise<boolean> {
  const r = await db.query<{ ok: boolean }>(
    `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
    [ppId],
  )
  return r.rows[0].ok
}

async function canWrite(ppId: string): Promise<boolean> {
  const r = await db.query<{ ok: boolean }>(
    `SELECT rehab_demo.can_write_program_patient($1::uuid) AS ok`,
    [ppId],
  )
  return r.rows[0].ok
}

describe('permissions simulation', () => {
  it('S09 companion with grant can read+write PP', async () => {
    await setActor(IDS.actorCompanion, 'companion')
    expect(await canRead(IDS.ppYossi)).toBe(true)
    expect(await canWrite(IDS.ppYossi)).toBe(true)
  })

  it('S10 household member without grant cannot read clinical PP', async () => {
    await setActor(IDS.actorNoa, 'patient')
    // Noa is linked to person 003 (herself), not Yossi — and has no grant on Yossi PP
    expect(await canRead(IDS.ppYossi)).toBe(false)
    const member = await db.query<{ ok: boolean }>(
      `SELECT rehab_demo.is_household_member($1::uuid, $2::uuid) AS ok`,
      [IDS.personNoa, IDS.hhCohen],
    )
    expect(member.rows[0].ok).toBe(true)
  })

  it('S11 matam can read all', async () => {
    await setActor(IDS.actorMatam, 'matam')
    expect(await canRead(IDS.ppYossi)).toBe(true)
    expect(await canRead(IDS.ppDaniHousing)).toBe(true)
    expect(await canWrite(IDS.ppYossi)).toBe(true)
  })

  it('S12 patient sees only own enrollment', async () => {
    await setActor(IDS.actorPatientYossi, 'patient')
    expect(await canRead(IDS.ppYossi)).toBe(true)
    expect(await canRead(IDS.ppDaniHousing)).toBe(false)
    expect(await canWrite(IDS.ppYossi)).toBe(false)
  })

  it('S13 guardian with grant: read yes, write no', async () => {
    await setActor(IDS.actorGuardianMichal, 'guardian')
    expect(await canRead(IDS.ppYossi)).toBe(true)
    expect(await canWrite(IDS.ppYossi)).toBe(false)
  })

  it('S14 gov can read housing program PP, not Cohen', async () => {
    await setActor(IDS.actorGov, 'gov')
    expect(await canRead(IDS.ppDaniHousing)).toBe(true)
    expect(await canRead(IDS.ppYossi)).toBe(false)
    expect(await canWrite(IDS.ppDaniHousing)).toBe(false)
  })

  it('S19 access ≠ household membership', async () => {
    // Ben: NOT household member, HAS grant → can read
    const benMember = await db.query<{ ok: boolean }>(
      `SELECT rehab_demo.is_household_member($1::uuid, $2::uuid) AS ok`,
      [IDS.personBen, IDS.hhCohen],
    )
    expect(benMember.rows[0].ok).toBe(false)
    await setActor(IDS.actorBen, 'guardian')
    expect(await canRead(IDS.ppYossi)).toBe(true)

    // Noa: IS household member, NO grant → cannot read Yossi clinical
    const noaMember = await db.query<{ ok: boolean }>(
      `SELECT rehab_demo.is_household_member($1::uuid, $2::uuid) AS ok`,
      [IDS.personNoa, IDS.hhCohen],
    )
    expect(noaMember.rows[0].ok).toBe(true)
    await setActor(IDS.actorNoa, 'guardian')
    expect(await canRead(IDS.ppYossi)).toBe(false)
  })
})
