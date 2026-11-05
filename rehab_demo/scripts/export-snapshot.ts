import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bootSeededDb, IDS } from './db.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../../src/data/rehab-demo')
mkdirSync(outDir, { recursive: true })

const db = await bootSeededDb()

async function all<T extends Record<string, unknown>>(sql: string): Promise<T[]> {
  const r = await db.query<T>(sql)
  return r.rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(row)) {
      out[k] = typeof v === 'bigint' ? Number(v) : v
    }
    return out as T
  })
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  ids: IDS,
  layers: [
    { id: 1, name_he: 'אנשים ומשקי בית', tables: ['persons', 'households', 'household_members'] },
    { id: 2, name_he: 'תבניות וגרסאות', tables: ['program_templates', 'template_versions', 'template_phases', 'template_goals'] },
    { id: 3, name_he: 'תוכניות, משתתפים, מחזורים ושלבים', tables: ['programs', 'program_patients', 'program_periods', 'program_phases'] },
    { id: 4, name_he: 'יעדים ועדכונים', tables: ['goals', 'goal_updates', 'progress_snapshots'] },
    { id: 5, name_he: 'מפגשים, משימות ותיקים', tables: ['sessions', 'session_attendance', 'tasks', 'cases'] },
    { id: 6, name_he: 'מלווים, צוות, הרשאות וביקורת', tables: ['actors', 'companions', 'program_team_members', 'access_grants', 'person_actor_links', 'audit_log'] },
  ],
  tables: {
    persons: await all(`SELECT id, demo_national_id, full_name_he, birth_date::text, email_demo FROM rehab_demo.persons ORDER BY full_name_he`),
    households: await all(`SELECT id, household_code, display_name_he, locality_he, status::text, scenario_tag FROM rehab_demo.households ORDER BY household_code`),
    household_members: await all(`SELECT id, household_id, person_id, member_role::text, is_primary, joined_at::text FROM rehab_demo.household_members ORDER BY household_id`),
    program_templates: await all(`SELECT id, code, name_he, description_he, default_kind::text FROM rehab_demo.program_templates ORDER BY code`),
    template_versions: await all(`SELECT id, template_id, version_number, status::text, changelog_he, published_at FROM rehab_demo.template_versions ORDER BY template_id, version_number`),
    template_phases: await all(`SELECT id, template_version_id, seq, code, name_he, typical_days FROM rehab_demo.template_phases ORDER BY template_version_id, seq`),
    template_goals: await all(`SELECT id, template_version_id, template_phase_id, code, title_he, default_weight::float8 AS default_weight FROM rehab_demo.template_goals ORDER BY code`),
    programs: await all(`SELECT id, program_code, name_he, kind::text, status::text, template_id, pinned_version_id, household_id, opened_at, closed_at, scenario_tag FROM rehab_demo.programs ORDER BY program_code`),
    program_patients: await all(`SELECT id, program_id, person_id, status::text, enrolled_at, completed_at, personal_pct::float8 AS personal_pct FROM rehab_demo.program_patients ORDER BY enrolled_at`),
    program_periods: await all(`SELECT id, program_id, seq, name_he, status::text, starts_on::text, ends_on::text, group_pct::float8 AS group_pct FROM rehab_demo.program_periods ORDER BY program_id, seq`),
    program_phases: await all(`SELECT id, program_period_id, template_phase_id, seq, status::text, starts_on::text, ends_on::text FROM rehab_demo.program_phases ORDER BY program_period_id, seq`),
    goals: await all(`SELECT id, program_patient_id, template_goal_id, program_phase_id, title_he, status::text, progress_pct::float8 AS progress_pct, weight::float8 AS weight FROM rehab_demo.goals ORDER BY title_he`),
    goal_updates: await all(`SELECT id, goal_id, author_actor_id, progress_pct::float8 AS progress_pct, status::text, note_he, recorded_at FROM rehab_demo.goal_updates ORDER BY recorded_at`),
    progress_snapshots: await all(`SELECT id, program_id, program_patient_id, scope::text, progress_pct::float8 AS progress_pct, note_he, captured_at FROM rehab_demo.progress_snapshots`),
    sessions: await all(`SELECT id, program_id, program_period_id, title_he, status::text, scheduled_at, is_group FROM rehab_demo.sessions ORDER BY scheduled_at`),
    session_attendance: await all(`SELECT id, session_id, program_patient_id, attended FROM rehab_demo.session_attendance`),
    tasks: await all(`SELECT id, program_id, program_patient_id, goal_id, title_he, status::text, due_on::text, assignee_actor_id FROM rehab_demo.tasks`),
    cases: await all(`SELECT id, case_code, program_patient_id, title_he, status::text, summary_he FROM rehab_demo.cases`),
    actors: await all(`SELECT id, actor_code, display_name_he, email_demo, access_role::text, agency_he FROM rehab_demo.actors ORDER BY actor_code`),
    companions: await all(`SELECT id, actor_id, specialty_he, active FROM rehab_demo.companions`),
    program_team_members: await all(`SELECT id, program_id, actor_id, team_role::text FROM rehab_demo.program_team_members`),
    access_grants: await all(`SELECT id, actor_id, scope::text, program_id, program_patient_id, household_id, person_id, access_role::text, can_read, can_write, grant_reason_he, revoked_at FROM rehab_demo.access_grants`),
    person_actor_links: await all(`SELECT id, person_id, actor_id, link_kind FROM rehab_demo.person_actor_links`),
    audit_log: await all(`SELECT id, occurred_at, actor_id, action, entity_table, entity_id, details_he FROM rehab_demo.audit_log ORDER BY occurred_at`),
    scenarios: await all(`SELECT id, code, title_he, description_he, expected_he, layer, kind FROM rehab_demo.scenarios ORDER BY id`),
  },
  erdMermaid: `erDiagram
  HOUSEHOLDS ||--o{ HOUSEHOLD_MEMBERS : has
  PERSONS ||--o{ HOUSEHOLD_MEMBERS : member
  PROGRAM_TEMPLATES ||--o{ TEMPLATE_VERSIONS : versions
  TEMPLATE_VERSIONS ||--o{ TEMPLATE_PHASES : phases
  TEMPLATE_VERSIONS ||--o{ TEMPLATE_GOALS : goals
  PROGRAM_TEMPLATES ||--o{ PROGRAMS : instantiates
  TEMPLATE_VERSIONS ||--o| PROGRAMS : pinned_on_open
  HOUSEHOLDS ||--o{ PROGRAMS : optional
  PROGRAMS ||--o{ PROGRAM_PATIENTS : enrolls
  PERSONS ||--o{ PROGRAM_PATIENTS : participant
  PROGRAMS ||--o{ PROGRAM_PERIODS : periods
  PROGRAM_PERIODS ||--o{ PROGRAM_PHASES : phases
  TEMPLATE_PHASES ||--o{ PROGRAM_PHASES : from
  PROGRAM_PATIENTS ||--o{ GOALS : owns
  GOALS ||--o{ GOAL_UPDATES : history
  PROGRAMS ||--o{ PROGRESS_SNAPSHOTS : tracks
  PROGRAMS ||--o{ SESSIONS : schedules
  SESSIONS ||--o{ SESSION_ATTENDANCE : attendance
  PROGRAM_PATIENTS ||--o{ SESSION_ATTENDANCE : attends
  PROGRAMS ||--o{ TASKS : tasks
  PROGRAM_PATIENTS ||--o{ CASES : cases
  ACTORS ||--o| COMPANIONS : may_be
  PROGRAMS ||--o{ PROGRAM_TEAM_MEMBERS : team
  ACTORS ||--o{ ACCESS_GRANTS : granted
  ACTORS ||--o{ AUDIT_LOG : acts`,
}

const scenarioResults = [] as Array<{
  id: number
  code: string
  title_he: string
  expected_he: string
  actual_he: string
  passed: boolean
  kind: string
  layer: number
}>

const checks: Array<{
  id: number
  run: () => Promise<{ passed: boolean; actual_he: string }>
}> = [
  {
    id: 1,
    run: async () => {
      const r = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM rehab_demo.household_members WHERE household_id = $1 AND left_at IS NULL`,
        [IDS.hhCohen],
      )
      return { passed: r.rows[0].n === 3, actual_he: `${r.rows[0].n} חברים פעילים` }
    },
  },
  {
    id: 2,
    run: async () => {
      const r = await db.query<{ status: string }>(
        `SELECT status::text FROM rehab_demo.template_versions WHERE id = $1`,
        [IDS.versionV1],
      )
      return { passed: r.rows[0].status === 'published', actual_he: `status=${r.rows[0].status}` }
    },
  },
  {
    id: 3,
    run: async () => {
      const r = await db.query<{ pinned: string }>(
        `SELECT pinned_version_id::text AS pinned FROM rehab_demo.programs WHERE id = $1`,
        [IDS.programCohen],
      )
      return {
        passed: r.rows[0].pinned === IDS.versionV1,
        actual_he: `pinned=${r.rows[0].pinned.slice(-12)}`,
      }
    },
  },
  {
    id: 4,
    run: async () => {
      const r = await db.query<{ status: string }>(
        `SELECT status::text FROM rehab_demo.program_patients WHERE id = $1`,
        [IDS.ppYossi],
      )
      return { passed: r.rows[0].status === 'active', actual_he: `PP status=${r.rows[0].status}` }
    },
  },
  {
    id: 5,
    run: async () => {
      const r = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM rehab_demo.goals WHERE program_patient_id IS NULL`,
      )
      return { passed: r.rows[0].n === 0, actual_he: `יעדים ללא PP: ${r.rows[0].n}` }
    },
  },
  {
    id: 6,
    run: async () => {
      const g = await db.query<{ p: string }>(
        `SELECT progress_pct::text AS p FROM rehab_demo.goals WHERE id = $1`,
        [IDS.goalWork],
      )
      const a = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM rehab_demo.audit_log WHERE action='goal_update' AND entity_id=$1`,
        [IDS.goalWork],
      )
      const ok = Number(g.rows[0].p) === 40 && a.rows[0].n >= 1
      return { passed: ok, actual_he: `progress=${g.rows[0].p}, audit=${a.rows[0].n}` }
    },
  },
  {
    id: 7,
    run: async () => {
      const r = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM rehab_demo.program_patients WHERE program_id=$1 AND status='active'`,
        [IDS.programGroup],
      )
      return { passed: r.rows[0].n === 3, actual_he: `${r.rows[0].n} משתתפים פעילים` }
    },
  },
  {
    id: 8,
    run: async () => {
      const r = await db.query<{ n: number }>(
        `SELECT count(DISTINCT scope)::int AS n FROM rehab_demo.progress_snapshots`,
      )
      return { passed: r.rows[0].n === 2, actual_he: `${r.rows[0].n} scopes` }
    },
  },
  {
    id: 9,
    run: async () => {
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorCompanion])
      await db.query(`SELECT set_config('rehab.access_role','companion',false)`)
      const r = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_write_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      return { passed: r.rows[0].ok, actual_he: `can_write=${r.rows[0].ok}` }
    },
  },
  {
    id: 10,
    run: async () => {
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorNoa])
      await db.query(`SELECT set_config('rehab.access_role','patient',false)`)
      const r = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      return { passed: !r.rows[0].ok, actual_he: `can_read=${r.rows[0].ok} (צפוי false)` }
    },
  },
  {
    id: 11,
    run: async () => {
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorMatam])
      await db.query(`SELECT set_config('rehab.access_role','matam',false)`)
      const r = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      return { passed: r.rows[0].ok, actual_he: `matam can_read=${r.rows[0].ok}` }
    },
  },
  {
    id: 12,
    run: async () => {
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorPatientYossi])
      await db.query(`SELECT set_config('rehab.access_role','patient',false)`)
      const own = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      const other = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppDaniHousing],
      )
      return {
        passed: own.rows[0].ok && !other.rows[0].ok,
        actual_he: `own=${own.rows[0].ok}, other=${other.rows[0].ok}`,
      }
    },
  },
  {
    id: 13,
    run: async () => {
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorGuardianMichal])
      await db.query(`SELECT set_config('rehab.access_role','guardian',false)`)
      const read = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      const write = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_write_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      return {
        passed: read.rows[0].ok && !write.rows[0].ok,
        actual_he: `read=${read.rows[0].ok}, write=${write.rows[0].ok}`,
      }
    },
  },
  {
    id: 14,
    run: async () => {
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorGov])
      await db.query(`SELECT set_config('rehab.access_role','gov',false)`)
      const housing = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppDaniHousing],
      )
      const cohen = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      return {
        passed: housing.rows[0].ok && !cohen.rows[0].ok,
        actual_he: `housing=${housing.rows[0].ok}, cohen=${cohen.rows[0].ok}`,
      }
    },
  },
  {
    id: 15,
    run: async () => {
      const r = await db.query<{ p: string; pp: string }>(`
        SELECT p.status::text AS p, pp.status::text AS pp
        FROM rehab_demo.programs p
        JOIN rehab_demo.program_patients pp ON pp.program_id = p.id
        WHERE p.program_code = 'PRG-CLOSED'`)
      return {
        passed: r.rows[0]?.p === 'closed' && r.rows[0]?.pp === 'completed',
        actual_he: `program=${r.rows[0]?.p}, pp=${r.rows[0]?.pp}`,
      }
    },
  },
  {
    id: 16,
    run: async () => {
      try {
        await db.query(
          `UPDATE rehab_demo.programs SET pinned_version_id=$1 WHERE id=$2`,
          [IDS.versionV2Draft, IDS.programCohen],
        )
        return { passed: false, actual_he: 'העדכון לא נחסם' }
      } catch {
        return { passed: true, actual_he: 'נדחה כצפוי (trigger)' }
      }
    },
  },
  {
    id: 17,
    run: async () => {
      try {
        await db.query(
          `INSERT INTO rehab_demo.program_phases (id, program_period_id, template_phase_id, seq, status)
           VALUES ('a0000000-0000-4000-8000-439999999998',$1,$2,98,'pending')`,
          [IDS.periodCohen, IDS.phaseGroupOpen],
        )
        return { passed: false, actual_he: 'הכנסה לא נחסמה' }
      } catch {
        return { passed: true, actual_he: 'נדחה כצפוי (יישור גרסה)' }
      }
    },
  },
  {
    id: 18,
    run: async () => {
      await db.query(`
        INSERT INTO rehab_demo.programs (
          id, program_code, name_he, kind, status, template_id, pinned_version_id, opened_at
        ) VALUES (
          'a0000000-0000-4000-8000-409999999989',
          'PRG-DUP-CHECK', 'בדיקת כפילות', 'personal', 'open',
          '${IDS.templateReentry}', '${IDS.versionV1}', now()
        ) ON CONFLICT DO NOTHING
      `)
      try {
        await db.query(
          `INSERT INTO rehab_demo.program_patients (id, program_id, person_id, status, enrolled_at)
           VALUES ('a0000000-0000-4000-8000-419999999998',$1,$2,'active',now())`,
          ['a0000000-0000-4000-8000-409999999989', IDS.personYossi],
        )
        return { passed: false, actual_he: 'כפילות לא נחסמה' }
      } catch {
        return { passed: true, actual_he: 'נדחה כצפוי (רישום כפול לתבנית)' }
      }
    },
  },
  {
    id: 19,
    run: async () => {
      const benMember = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.is_household_member($1::uuid,$2::uuid) AS ok`,
        [IDS.personBen, IDS.hhCohen],
      )
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorBen])
      await db.query(`SELECT set_config('rehab.access_role','guardian',false)`)
      const benRead = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      await db.query(`SELECT set_config('rehab.actor_id',$1,false)`, [IDS.actorNoa])
      const noaRead = await db.query<{ ok: boolean }>(
        `SELECT rehab_demo.can_read_program_patient($1::uuid) AS ok`,
        [IDS.ppYossi],
      )
      const ok = !benMember.rows[0].ok && benRead.rows[0].ok && !noaRead.rows[0].ok
      return {
        passed: ok,
        actual_he: `ben_member=${benMember.rows[0].ok}, ben_read=${benRead.rows[0].ok}, noa_read=${noaRead.rows[0].ok}`,
      }
    },
  },
  {
    id: 20,
    run: async () => {
      const r = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM rehab_demo.audit_log WHERE action='goal_update'`,
      )
      return { passed: r.rows[0].n >= 1, actual_he: `${r.rows[0].n} רשומות audit` }
    },
  },
]

const scenarios = snapshot.tables.scenarios as Array<{
  id: number
  code: string
  title_he: string
  expected_he: string
  kind: string
  layer: number
}>

for (const s of scenarios) {
  const check = checks.find((c) => c.id === s.id)
  const result = check
    ? await check.run()
    : { passed: false, actual_he: 'לא מיושם' }
  scenarioResults.push({
    id: s.id,
    code: s.code,
    title_he: s.title_he,
    expected_he: s.expected_he,
    actual_he: result.actual_he,
    passed: result.passed,
    kind: s.kind,
    layer: s.layer,
  })
  await db.query(
    `INSERT INTO rehab_demo.scenario_results (scenario_id, passed, actual_he)
     VALUES ($1,$2,$3)
     ON CONFLICT (scenario_id) DO UPDATE SET passed=EXCLUDED.passed, actual_he=EXCLUDED.actual_he, checked_at=now()`,
    [s.id, result.passed, result.actual_he],
  )
}

const full = { ...snapshot, scenarioResults }
writeFileSync(join(outDir, 'snapshot.json'), JSON.stringify(full, null, 2), 'utf8')
const passed = scenarioResults.filter((s) => s.passed).length
console.log(`Exported snapshot → src/data/rehab-demo/snapshot.json`)
console.log(`Scenarios: ${passed}/${scenarioResults.length} passed`)
await db.close()

if (passed < scenarioResults.length) {
  process.exitCode = 1
}
