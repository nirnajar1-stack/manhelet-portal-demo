import { bootSeededDb } from './db.ts'

const db = await bootSeededDb()
const tables = await db.query<{ table_name: string }>(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'rehab_demo'
  ORDER BY table_name
`)
console.log(`rehab_demo ready — ${tables.rows.length} tables:`)
console.log(tables.rows.map((r) => r.table_name).join(', '))
const counts = await db.query<{ t: string; n: string }>(`
  SELECT 'persons' AS t, count(*)::text AS n FROM rehab_demo.persons
  UNION ALL SELECT 'households', count(*)::text FROM rehab_demo.households
  UNION ALL SELECT 'programs', count(*)::text FROM rehab_demo.programs
  UNION ALL SELECT 'program_patients', count(*)::text FROM rehab_demo.program_patients
  UNION ALL SELECT 'goals', count(*)::text FROM rehab_demo.goals
  UNION ALL SELECT 'scenarios', count(*)::text FROM rehab_demo.scenarios
`)
for (const row of counts.rows) {
  console.log(`  ${row.t}: ${row.n}`)
}
await db.close()
