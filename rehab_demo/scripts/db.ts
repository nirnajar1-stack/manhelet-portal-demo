import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const REHAB_ROOT = join(__dirname, '..')

export async function createRehabDb(): Promise<PGlite> {
  const db = new PGlite()
  await applyMigrations(db)
  return db
}

export async function applyMigrations(db: PGlite): Promise<void> {
  const dir = join(REHAB_ROOT, 'migrations')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8')
    await db.exec(sql)
  }
}

export async function applySeed(db: PGlite): Promise<void> {
  const dir = join(REHAB_ROOT, 'seed')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8')
    await db.exec(sql)
  }
}

export async function bootSeededDb(): Promise<PGlite> {
  const db = await createRehabDb()
  await applySeed(db)
  return db
}

export const IDS = {
  personYossi: 'a0000000-0000-4000-8000-000000000001',
  personMichal: 'a0000000-0000-4000-8000-000000000002',
  personNoa: 'a0000000-0000-4000-8000-000000000003',
  personDani: 'a0000000-0000-4000-8000-000000000004',
  personBen: 'a0000000-0000-4000-8000-000000000020',
  hhCohen: 'a0000000-0000-4000-8000-100000000001',
  actorMatam: 'a0000000-0000-4000-8000-200000000001',
  actorCompanion: 'a0000000-0000-4000-8000-200000000002',
  actorPatientYossi: 'a0000000-0000-4000-8000-200000000004',
  actorGuardianMichal: 'a0000000-0000-4000-8000-200000000005',
  actorGov: 'a0000000-0000-4000-8000-200000000006',
  actorBen: 'a0000000-0000-4000-8000-200000000009',
  actorNoa: 'a0000000-0000-4000-8000-200000000010',
  templateReentry: 'a0000000-0000-4000-8000-300000000001',
  versionV1: 'a0000000-0000-4000-8000-310000000001',
  versionV2Draft: 'a0000000-0000-4000-8000-310000000002',
  versionGroup: 'a0000000-0000-4000-8000-310000000003',
  phaseGroupOpen: 'a0000000-0000-4000-8000-320000000004',
  programCohen: 'a0000000-0000-4000-8000-400000000001',
  programGroup: 'a0000000-0000-4000-8000-400000000002',
  programHousing: 'a0000000-0000-4000-8000-400000000003',
  ppYossi: 'a0000000-0000-4000-8000-410000000001',
  ppDaniGroup: 'a0000000-0000-4000-8000-410000000002',
  ppDaniHousing: 'a0000000-0000-4000-8000-410000000005',
  periodCohen: 'a0000000-0000-4000-8000-420000000001',
  goalWork: 'a0000000-0000-4000-8000-500000000002',
  personDaniel: 'a0000000-0000-4000-8000-000000000021',
  tmplEmploy: 'b0000000-0000-4000-8000-800000000001',
  pgDanEmp: 'b0000000-0000-4000-8000-900000000001',
  pgDanInd: 'b0000000-0000-4000-8000-900000000002',
} as const
