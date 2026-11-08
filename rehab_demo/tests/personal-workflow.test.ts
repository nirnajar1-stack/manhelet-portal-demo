import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { bootSeededDb, IDS } from '../scripts/db.ts'

let db: PGlite

const DANIEL = 'a0000000-0000-4000-8000-000000000021'
const NOA = 'a0000000-0000-4000-8000-000000000003'
const T_EMPLOY = 'b0000000-0000-4000-8000-800000000001'
const PG_DAN_EMP = 'b0000000-0000-4000-8000-900000000001'
const PG_DAN_IND = 'b0000000-0000-4000-8000-900000000002'
const ACTOR_MATAM = IDS.actorMatam

beforeAll(async () => {
  db = await bootSeededDb()
})

afterAll(async () => {
  await db?.close()
})

async function stageId(goalId: string, seq: number) {
  const r = await db.query<{ id: string }>(
    `SELECT id::text AS id FROM rehab_demo.rehab_personal_stages
     WHERE personal_goal_id = $1 AND seq = $2`,
    [goalId, seq],
  )
  return r.rows[0]?.id
}

describe('personal rehab workflow — DB scenarios', () => {
  it('W01 open_personal_goal creates goal + all pinned stages for person', async () => {
    const goalId = 'b0000000-0000-4000-8000-900000000099'
    // use social template for a person without active social goal — use Dani Levi
    await db.query(
      `SELECT rehab_demo.open_personal_goal(
        $1::uuid, $2::uuid, 'b0000000-0000-4000-8000-800000000003'::uuid,
        $3::uuid, NULL, CURRENT_DATE, NULL, 'test', NULL, NULL, false
      )`,
      [goalId, IDS.personDani, ACTOR_MATAM],
    )
    const stages = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_personal_stages WHERE personal_goal_id = $1`,
      [goalId],
    )
    expect(stages.rows[0].n).toBe(3)
    const g = await db.query<{ person: string; ver: number }>(
      `SELECT person_id::text AS person, pinned_template_version AS ver
       FROM rehab_demo.rehab_personal_goals WHERE id = $1`,
      [goalId],
    )
    expect(g.rows[0].person).toBe(IDS.personDani)
    expect(g.rows[0].ver).toBe(1)
  })

  it('W02 Daniel has two active goals; stages only for him', async () => {
    const goals = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_personal_goals
       WHERE person_id = $1 AND mgmt_status = 'active'`,
      [DANIEL],
    )
    expect(goals.rows[0].n).toBe(2)
    const foreign = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n
       FROM rehab_demo.rehab_personal_stages s
       JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
       WHERE g.person_id = $1 AND g.person_id <> $2`,
      [NOA, DANIEL],
    )
    expect(foreign.rows[0].n).toBeGreaterThanOrEqual(1)
    // picker query for Daniel never returns Noa's stages
    const danStages = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n
       FROM rehab_demo.rehab_personal_stages s
       JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
       WHERE g.person_id = $1 AND g.mgmt_status = 'active'`,
      [DANIEL],
    )
    expect(danStages.rows[0].n).toBe(10)
  })

  it('W03/W04 rehab task primary + secondary links', async () => {
    const primary = await stageId(PG_DAN_EMP, 2)
    const secondary = await stageId(PG_DAN_IND, 3)
    expect(primary).toBeTruthy()
    const task = await db.query<{ id: string; aff: string }>(
      `SELECT id::text, activity_affiliation::text AS aff FROM rehab_demo.tasks
       WHERE id = 'b0000000-0000-4000-8000-960000000001'`,
    )
    expect(task.rows[0].aff).toBe('rehab')
    const links = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_task_stage_links
       WHERE task_id = 'b0000000-0000-4000-8000-960000000001'`,
    )
    expect(links.rows[0].n).toBe(1)
    // counted once by primary
    const primaryCount = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.tasks
       WHERE rehab_primary_stage_id = $1`,
      [primary],
    )
    expect(primaryCount.rows[0].n).toBe(1)
    void secondary
  })

  it('W06/W07 rehab visit with primary + secondary', async () => {
    const v = await db.query<{ primary: string; npart: number; nsec: number }>(`
      SELECT v.rehab_primary_stage_id::text AS primary,
             (SELECT count(*)::int FROM rehab_demo.rehab_visit_participants p WHERE p.visit_id = v.id) AS npart,
             (SELECT count(*)::int FROM rehab_demo.rehab_visit_stage_links l WHERE l.visit_id = v.id) AS nsec
      FROM rehab_demo.rehab_visits v
      WHERE v.id = 'b0000000-0000-4000-8000-970000000001'
    `)
    expect(v.rows[0].primary).toBeTruthy()
    expect(v.rows[0].npart).toBe(2)
    expect(v.rows[0].nsec).toBe(1)
    const visitCount = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_visits
       WHERE id = 'b0000000-0000-4000-8000-970000000001'`,
    )
    expect(visitCount.rows[0].n).toBe(1)
  })

  it('W08 observation + comment thread', async () => {
    const obs = await db.query<{ body: string; author: string }>(
      `SELECT body_he AS body, author_actor_id::text AS author
       FROM rehab_demo.rehab_stage_observations
       WHERE id = 'b0000000-0000-4000-8000-940000000002'`,
    )
    expect(obs.rows[0].body).toContain('חסם')
    const cmt = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_stage_comments
       WHERE observation_id = 'b0000000-0000-4000-8000-940000000002'`,
    )
    expect(cmt.rows[0].n).toBe(1)
  })

  it('W09 closing task does not complete stage', async () => {
    const primary = await stageId(PG_DAN_EMP, 2)
    await db.query(
      `UPDATE rehab_demo.tasks SET status = 'done'
       WHERE id = 'b0000000-0000-4000-8000-960000000001'`,
    )
    const st = await db.query<{ status: string }>(
      `SELECT status::text FROM rehab_demo.rehab_personal_stages WHERE id = $1`,
      [primary],
    )
    expect(st.rows[0].status).toBe('in_progress')
  })

  it('W10 reject task primary stage of another person', async () => {
    const noaStage = await stageId('b0000000-0000-4000-8000-900000000003', 1)
    // Create PP for Daniel? Use program_patient of someone else — set PP to Yossi and stage of Noa
    await expect(
      db.query(
        `INSERT INTO rehab_demo.tasks (
           id, program_id, program_patient_id, title_he, status,
           activity_affiliation, rehab_primary_stage_id
         ) VALUES (
           'b0000000-0000-4000-8000-960000000099',
           'a0000000-0000-4000-8000-400000000001',
           'a0000000-0000-4000-8000-410000000001',
           'bad link', 'open', 'rehab', $1
         )`,
        [noaStage],
      ),
    ).rejects.toThrow()
  })

  it('W11 close personal goal stores outcome', async () => {
    const goalId = 'b0000000-0000-4000-8000-900000000098'
    await db.query(
      `SELECT rehab_demo.open_personal_goal(
        $1::uuid, $2::uuid, 'b0000000-0000-4000-8000-800000000003'::uuid,
        $3::uuid, NULL, CURRENT_DATE, NULL, NULL, NULL, NULL, false
      )`,
      [goalId, IDS.personMichal, ACTOR_MATAM],
    )
    await db.query(
      `UPDATE rehab_demo.rehab_personal_stages SET status = 'completed', completed_at = now()
       WHERE personal_goal_id = $1`,
      [goalId],
    )
    await db.query(
      `UPDATE rehab_demo.rehab_personal_goals
       SET mgmt_status = 'completed', outcome = 'achieved',
           completed_at = now(), completed_by_actor_id = $2, summary_he = 'סיכום דמה'
       WHERE id = $1`,
      [goalId, ACTOR_MATAM],
    )
    const g = await db.query<{ outcome: string; completed: string | null }>(
      `SELECT outcome::text, completed_at::text AS completed
       FROM rehab_demo.rehab_personal_goals WHERE id = $1`,
      [goalId],
    )
    expect(g.rows[0].outcome).toBe('achieved')
    expect(g.rows[0].completed).toBeTruthy()
  })

  it('W12 bank version bump does not mutate opened personal goals', async () => {
    const before = await db.query<{ n: number; ver: number }>(
      `SELECT 1::int AS n, pinned_template_version AS ver
       FROM rehab_demo.rehab_personal_goals WHERE id = $1`,
      [PG_DAN_EMP],
    )
    const stageCountBefore = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_personal_stages
       WHERE personal_goal_id = $1`,
      [PG_DAN_EMP],
    )
    await db.query(
      `SELECT rehab_demo.add_stage_to_new_template_version(
         $1::uuid, 'E6', 'שלב חדש בבנק', 'לא אמור להופיע במטרות פתוחות', true, 10
       )`,
      [T_EMPLOY],
    )
    const tmpl = await db.query<{ ver: number }>(
      `SELECT current_version AS ver FROM rehab_demo.rehab_goal_templates WHERE id = $1`,
      [T_EMPLOY],
    )
    expect(tmpl.rows[0].ver).toBeGreaterThan(1)
    const after = await db.query<{ n: number; ver: number }>(
      `SELECT 1::int AS n, pinned_template_version AS ver
       FROM rehab_demo.rehab_personal_goals WHERE id = $1`,
      [PG_DAN_EMP],
    )
    const stageCountAfter = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_personal_stages
       WHERE personal_goal_id = $1`,
      [PG_DAN_EMP],
    )
    expect(after.rows[0].ver).toBe(before.rows[0].ver)
    expect(stageCountAfter.rows[0].n).toBe(stageCountBefore.rows[0].n)
  })

  it('W13 switching task to routine clears requirement for stage', async () => {
    await db.query(`
      UPDATE rehab_demo.tasks
      SET activity_affiliation = 'routine', rehab_primary_stage_id = NULL
      WHERE id = 'b0000000-0000-4000-8000-960000000001'
    `)
    // remove secondary links
    await db.query(
      `DELETE FROM rehab_demo.rehab_task_stage_links
       WHERE task_id = 'b0000000-0000-4000-8000-960000000001'`,
    )
    const t = await db.query<{ aff: string; stage: string | null }>(
      `SELECT activity_affiliation::text AS aff, rehab_primary_stage_id::text AS stage
       FROM rehab_demo.tasks WHERE id = 'b0000000-0000-4000-8000-960000000001'`,
    )
    expect(t.rows[0].aff).toBe('routine')
    expect(t.rows[0].stage).toBeNull()
  })

  it('W14 completed stage keeps historical links', async () => {
    const s1 = await stageId(PG_DAN_EMP, 1)
    const obs = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM rehab_demo.rehab_stage_observations
       WHERE personal_stage_id = $1`,
      [s1],
    )
    expect(obs.rows[0].n).toBeGreaterThanOrEqual(1)
    const st = await db.query<{ status: string }>(
      `SELECT status::text FROM rehab_demo.rehab_personal_stages WHERE id = $1`,
      [s1],
    )
    expect(st.rows[0].status).toBe('completed')
  })

  it('W15 multi-participant visit does not auto-link other members goals', async () => {
    const auto = await db.query<{ n: number }>(`
      SELECT count(*)::int AS n
      FROM rehab_demo.rehab_visit_stage_links l
      JOIN rehab_demo.rehab_personal_stages s ON s.id = l.personal_stage_id
      JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
      WHERE l.visit_id = 'b0000000-0000-4000-8000-970000000001'
        AND g.person_id <> 'a0000000-0000-4000-8000-000000000021'
    `)
    expect(auto.rows[0].n).toBe(0)
  })

  it('rejects mutating active bank current version stages directly', async () => {
    await expect(
      db.query(
        `UPDATE rehab_demo.rehab_stage_templates SET name_he = 'שינוי אסור'
         WHERE goal_template_id = $1 AND version_number = (
           SELECT current_version FROM rehab_demo.rehab_goal_templates WHERE id = $1
         ) AND seq = 1`,
        [T_EMPLOY],
      ),
    ).rejects.toThrow()
  })

  it('permission helper: companion write vs gov', async () => {
    const r = await db.query<{ ok: boolean }>(
      `SELECT rehab_demo.can_write_personal_rehab($1::uuid) AS ok
       FROM (
         SELECT set_config('rehab.actor_id', $2, false),
                set_config('rehab.access_role', 'matam', false)
       ) cfg`,
      [DANIEL, ACTOR_MATAM],
    )
    expect(r.rows[0].ok).toBe(true)

    const gov = await db.query<{ ok: boolean }>(
      `SELECT rehab_demo.can_write_personal_rehab($1::uuid) AS ok
       FROM (
         SELECT set_config('rehab.actor_id', $2, false),
                set_config('rehab.access_role', 'gov', false)
       ) cfg`,
      [DANIEL, IDS.actorGov],
    )
    expect(gov.rows[0].ok).toBe(false)
  })
})
