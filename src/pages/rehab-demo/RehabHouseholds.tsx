import { useMemo, useState } from 'react'
import snapshot from '@/data/rehab-demo/snapshot.json'
import type { RehabSnapshot } from '@/data/rehab-demo/types'
import { cn } from '@/lib/utils'

const data = snapshot as RehabSnapshot

type Household = {
  id: string
  household_code: string
  display_name_he: string
  locality_he: string
  status: string
}
type Person = { id: string; full_name_he: string; demo_national_id: string }
type Member = {
  household_id: string
  person_id: string
  member_role: string
  is_primary: boolean
}

export function RehabHouseholds() {
  const households = data.tables.households as Household[]
  const persons = data.tables.persons as Person[]
  const members = data.tables.household_members as Member[]
  const [selected, setSelected] = useState(households[0]?.id)

  const personMap = useMemo(
    () => Object.fromEntries(persons.map((p) => [p.id, p])),
    [persons],
  )

  const selectedMembers = members.filter((m) => m.household_id === selected)
  const hh = households.find((h) => h.id === selected)

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-xl border border-hairline bg-paper p-4 shadow-soft">
        <h2 className="text-[16px] font-bold text-ink-navy">משקי בית ({households.length})</h2>
        <ul className="mt-3 space-y-1">
          {households.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => setSelected(h.id)}
                className={cn(
                  'w-full cursor-pointer rounded-md px-3 py-2 text-right transition-colors',
                  selected === h.id
                    ? 'bg-dusk-blue text-ink-navy'
                    : 'hover:bg-soft-cyan',
                )}
              >
                <p className="text-[14px] font-semibold">{h.display_name_he}</p>
                <p className="text-[12px] opacity-80">
                  {h.household_code} · {h.locality_he}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        {hh && (
          <>
            <h2 className="text-[22px] font-bold text-ink-navy">{hh.display_name_he}</h2>
            <p className="mt-1 text-[14px] text-slate-gray">
              {hh.locality_he} · סטטוס {hh.status} · {selectedMembers.length} חברים
            </p>
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-[14px]">
                <thead>
                  <tr className="border-b border-hairline text-right text-mist-gray">
                    <th className="px-2 py-2 font-medium">שם</th>
                    <th className="px-2 py-2 font-medium">תפקיד במשק בית</th>
                    <th className="px-2 py-2 font-medium">מזהה דמה</th>
                    <th className="px-2 py-2 font-medium">ראשי</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMembers.map((m) => {
                    const p = personMap[m.person_id]
                    return (
                      <tr key={`${m.household_id}-${m.person_id}`} className="border-b border-hairline/60">
                        <td className="px-2 py-2 font-medium text-ink-navy">{p?.full_name_he}</td>
                        <td className="px-2 py-2 text-slate-gray">{roleHe(m.member_role)}</td>
                        <td className="px-2 py-2 font-mono text-[12px] text-mist-gray">
                          {p?.demo_national_id}
                        </td>
                        <td className="px-2 py-2">{m.is_primary ? 'כן' : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 rounded-lg bg-warning-bg px-3 py-2 text-[13px] text-warning-text">
              חברות במשק בית אינה מקנה גישה קלינית. ראו סימולציית הרשאות ותרחיש 19.
            </p>
          </>
        )}
      </section>
    </div>
  )
}

function roleHe(role: string): string {
  const map: Record<string, string> = {
    returnee: 'שב/ה',
    guardian: 'אפוטרופוס/ת',
    household_member: 'בן/בת משפחה',
    patient: 'מטופל/ת',
    other: 'אחר',
  }
  return map[role] ?? role
}
