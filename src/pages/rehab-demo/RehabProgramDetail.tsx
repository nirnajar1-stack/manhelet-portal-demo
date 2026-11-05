import { Link, useParams } from 'react-router-dom'
import snapshot from '@/data/rehab-demo/snapshot.json'
import type { RehabSnapshot } from '@/data/rehab-demo/types'
import { Badge } from '@/components/ui/badge'

const data = snapshot as RehabSnapshot

export function RehabProgramDetail() {
  const { programId } = useParams()
  const program = (data.tables.programs as Array<Record<string, unknown>>).find(
    (p) => p.id === programId,
  )

  if (!program) {
    return (
      <div className="rounded-xl border border-hairline bg-paper p-6 shadow-soft">
        <p>תוכנית לא נמצאה.</p>
        <Link to="/rehab-demo/programs" className="text-signal-blue underline">
          חזרה לרשימה
        </Link>
      </div>
    )
  }

  const patients = (
    data.tables.program_patients as Array<{
      id: string
      program_id: string
      person_id: string
      status: string
      personal_pct: number
    }>
  ).filter((pp) => pp.program_id === programId)

  const persons = Object.fromEntries(
    (data.tables.persons as Array<{ id: string; full_name_he: string }>).map((p) => [
      p.id,
      p.full_name_he,
    ]),
  )

  const periods = (
    data.tables.program_periods as Array<{
      id: string
      program_id: string
      name_he: string
      status: string
      group_pct: number
    }>
  ).filter((p) => p.program_id === programId)

  const phases = data.tables.program_phases as Array<{
    id: string
    program_period_id: string
    seq: number
    status: string
  }>

  const goals = data.tables.goals as Array<{
    id: string
    program_patient_id: string
    title_he: string
    status: string
    progress_pct: number
  }>

  const sessions = (
    data.tables.sessions as Array<{ id: string; program_id: string; title_he: string; status: string }>
  ).filter((s) => s.program_id === programId)

  const tasks = (
    data.tables.tasks as Array<{ id: string; program_id: string; title_he: string; status: string }>
  ).filter((t) => t.program_id === programId)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <Link
          to="/rehab-demo/programs"
          className="text-[13px] text-signal-blue hover:underline"
        >
          ← כל התוכניות
        </Link>
        <h2 className="mt-2 text-[24px] font-bold text-ink-navy">{String(program.name_he)}</h2>
        <p className="mt-1 text-[14px] text-slate-gray">
          {String(program.program_code)} · {String(program.kind)} · pinned{' '}
          <code className="rounded bg-pebble px-1 text-[12px]" dir="ltr">
            {String(program.pinned_version_id ?? 'null')}
          </code>
        </p>
      </div>

      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <h3 className="text-[18px] font-bold text-ink-navy">Program_Patient (מרכז)</h3>
        <div className="mt-3 space-y-4">
          {patients.map((pp) => {
            const ppGoals = goals.filter((g) => g.program_patient_id === pp.id)
            return (
              <div key={pp.id} className="rounded-lg border border-hairline bg-cloud/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[16px] font-semibold text-ink-navy">
                    {persons[pp.person_id] ?? pp.person_id}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{pp.status}</Badge>
                    <span className="text-[13px] text-slate-gray">
                      התקדמות אישית {pp.personal_pct}%
                    </span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1">
                  {ppGoals.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between gap-2 text-[14px] text-slate-gray"
                    >
                      <span>{g.title_he}</span>
                      <span className="font-medium text-ink-navy">
                        {g.progress_pct}% · {g.status}
                      </span>
                    </li>
                  ))}
                  {!ppGoals.length && (
                    <li className="text-[13px] text-mist-gray">אין יעדים לרישום זה</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-hairline bg-paper p-4 shadow-soft">
          <h3 className="font-bold text-ink-navy">מחזורים ושלבים</h3>
          {periods.map((period) => (
            <div key={period.id} className="mt-3">
              <p className="text-[14px] font-medium">
                {period.name_he}{' '}
                <span className="text-mist-gray">
                  ({period.status}, קבוצתי {period.group_pct}%)
                </span>
              </p>
              <ul className="mt-1 mr-3 list-disc text-[13px] text-slate-gray">
                {phases
                  .filter((ph) => ph.program_period_id === period.id)
                  .map((ph) => (
                    <li key={ph.id}>
                      שלב {ph.seq} — {ph.status}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {!periods.length && <p className="mt-2 text-[13px] text-mist-gray">אין מחזורים</p>}
        </section>

        <section className="rounded-xl border border-hairline bg-paper p-4 shadow-soft">
          <h3 className="font-bold text-ink-navy">מפגשים</h3>
          <ul className="mt-2 space-y-1 text-[14px] text-slate-gray">
            {sessions.map((s) => (
              <li key={s.id}>
                {s.title_he} · {s.status}
              </li>
            ))}
            {!sessions.length && <li className="text-mist-gray">אין מפגשים</li>}
          </ul>
        </section>

        <section className="rounded-xl border border-hairline bg-paper p-4 shadow-soft">
          <h3 className="font-bold text-ink-navy">משימות</h3>
          <ul className="mt-2 space-y-1 text-[14px] text-slate-gray">
            {tasks.map((t) => (
              <li key={t.id}>
                {t.title_he} · {t.status}
              </li>
            ))}
            {!tasks.length && <li className="text-mist-gray">אין משימות</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
