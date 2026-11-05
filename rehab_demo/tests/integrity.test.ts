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

async function expectReject(sql: string) {
  await expect(db.query(sql)).rejects.toThrow()
}

describe('integrity — positive seed invariants', () => {
  it('S01 household Cohen has 3 active members', async () => {
    const r = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.household_members
       WHERE household_id = $1 AND left_at IS NULL`,
      [IDS.hhCohen],
    )
    expect(r.rows[0].n).toBe(3)
  })

  it('S02 REENTRY v1 is published', async () => {
    const r = await db.query<{ status: string }>(
      `SELECT status::text FROM rehab_demo.template_versions WHERE id = $1`,
      [IDS.versionV1],
    )
    expect(r.rows[0].status).toBe('published')
  })

  it('S03 open program pins published version', async () => {
    const r = await db.query<{ pinned: string; status: string }>(
      `SELECT pinned_version_id::text AS pinned, status::text
       FROM rehab_demo.programs WHERE id = $1`,
      [IDS.programCohen],
    )
    expect(r.rows[0].status).toBe('open')
    expect(r.rows[0].pinned).toBe(IDS.versionV1)
  })

  it('S04 Program_Patient for Yossi exists and is active', async () => {
    const r = await db.query<{ status: string }>(
      `SELECT status::text FROM rehab_demo.program_patients WHERE id = $1`,
      [IDS.ppYossi],
    )
    expect(r.rows[0].status).toBe('active')
  })

  it('S05 every goal attaches to a program_patient', async () => {
    const r = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.goals WHERE program_patient_id IS NULL`,
    )
    expect(r.rows[0].n).toBe(0)
  })

  it('S06 goal update synced progress + audit', async () => {
    const g = await db.query<{ progress_pct: string }>(
      `SELECT progress_pct::text FROM rehab_demo.goals WHERE id = $1`,
      [IDS.goalWork],
    )
    expect(Number(g.rows[0].progress_pct)).toBe(40)
    const a = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.audit_log
       WHERE action = 'goal_update' AND entity_id = $1`,
      [IDS.goalWork],
    )
    expect(a.rows[0].n).toBeGreaterThanOrEqual(1)
  })

  it('S07 group program has 3 active patients', async () => {
    const r = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.program_patients
       WHERE program_id = $1 AND status = 'active'`,
      [IDS.programGroup],
    )
    expect(r.rows[0].n).toBe(3)
  })

  it('S08 personal and group progress scopes are separate', async () => {
    const r = await db.query<{ scope: string; n: number }>(
      `SELECT scope::text, count(*)::int AS n FROM rehab_demo.progress_snapshots
       GROUP BY scope ORDER BY scope`,
    )
    const scopes = Object.fromEntries(r.rows.map((x) => [x.scope, x.n]))
    expect(scopes.personal).toBeGreaterThanOrEqual(1)
    expect(scopes.group).toBeGreaterThanOrEqual(1)
  })

  it('S15 closed program with completed PP', async () => {
    const r = await db.query<{ pstatus: string; ppstatus: string }>(`
      SELECT p.status::text AS pstatus, pp.status::text AS ppstatus
      FROM rehab_demo.programs p
      JOIN rehab_demo.program_patients pp ON pp.program_id = p.id
      WHERE p.program_code = 'PRG-CLOSED'
    `)
    expect(r.rows[0].pstatus).toBe('closed')
    expect(r.rows[0].ppstatus).toBe('completed')
  })

  it('S20 audit log has goal_update rows', async () => {
    const r = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.audit_log WHERE action = 'goal_update'`,
    )
    expect(r.rows[0].n).toBeGreaterThanOrEqual(1)
  })
})

describe('integrity — negative constraints', () => {
  it('S16 cannot change pinned_version while open', async () => {
    await expectReject(`
      UPDATE rehab_demo.programs
      SET pinned_version_id = '${IDS.versionV2Draft}'
      WHERE id = '${IDS.programCohen}'
    `)
  })

  it('S17 phase must match pinned template version', async () => {
    await expectReject(`
      INSERT INTO rehab_demo.program_phases (
        id, program_period_id, template_phase_id, seq, status
      ) VALUES (
        'a0000000-0000-4000-8000-439999999999',
        '${IDS.periodCohen}',
        '${IDS.phaseGroupOpen}',
        99,
        'pending'
      )
    `)
  })

  it('S18 rejects second active enrollment for same person+template', async () => {
    await db.query(`
      INSERT INTO rehab_demo.programs (
        id, program_code, name_he, kind, status, template_id, pinned_version_id, opened_at
      ) VALUES (
        'a0000000-0000-4000-8000-409999999990',
        'PRG-DUP-REENTRY', 'כפילות', 'personal', 'open',
        '${IDS.templateReentry}', '${IDS.versionV1}', now()
      )
    `)
    await expectReject(`
      INSERT INTO rehab_demo.program_patients (
        id, program_id, person_id, status, enrolled_at
      ) VALUES (
        'a0000000-0000-4000-8000-419999999999',
        'a0000000-0000-4000-8000-409999999990',
        '${IDS.personYossi}',
        'active',
        now()
      )
    `)
  })

  it('rejects open program without pin', async () => {
    await expectReject(`
      INSERT INTO rehab_demo.programs (
        id, program_code, name_he, kind, status, template_id, pinned_version_id
      ) VALUES (
        'a0000000-0000-4000-8000-409999999991',
        'PRG-BAD-OPEN', 'רע', 'personal', 'open',
        '${IDS.templateReentry}', NULL
      )
    `)
  })

  it('rejects progress_pct out of range', async () => {
    await expectReject(`
      UPDATE rehab_demo.goals SET progress_pct = 150 WHERE id = '${IDS.goalWork}'
    `)
  })

  it('rejects published template child mutation', async () => {
    await expectReject(`
      INSERT INTO rehab_demo.template_phases (
        id, template_version_id, seq, code, name_he
      ) VALUES (
        'a0000000-0000-4000-8000-329999999999',
        '${IDS.versionV1}', 99, 'X', 'לא מורשה'
      )
    `)
  })

  it('rejects group snapshot with program_patient_id', async () => {
    await expectReject(`
      INSERT INTO rehab_demo.progress_snapshots (
        id, program_id, program_patient_id, scope, progress_pct
      ) VALUES (
        'a0000000-0000-4000-8000-529999999999',
        '${IDS.programGroup}', '${IDS.ppDaniGroup}', 'group', 10
      )
    `)
  })
})
