import { useMemo, useState } from 'react'
import snapshot from '@/data/rehab-demo/snapshot.json'
import type { RehabSnapshot, SimActor, SimRole } from '@/data/rehab-demo/types'
import {
  canReadProgramPatient,
  canWriteProgramPatient,
  isHouseholdMember,
} from '@/lib/rehab-permissions'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const data = snapshot as RehabSnapshot

const actors: SimActor[] = [
  { id: data.ids.actorMatam, label_he: 'רותי מת״ם', role: 'matam' },
  { id: data.ids.actorCompanion, label_he: 'יואב מלווה', role: 'companion' },
  { id: data.ids.actorPatientYossi, label_he: 'יוסי (מטופל)', role: 'patient' },
  { id: data.ids.actorGuardianMichal, label_he: 'מיכל (אפוטרופוס)', role: 'guardian' },
  { id: data.ids.actorGov, label_he: 'נציג ביטוח לאומי', role: 'gov' },
  { id: data.ids.actorBen, label_he: 'בן חיצוני (עם grant)', role: 'guardian' },
  { id: data.ids.actorNoa, label_he: 'נועה (בן בית ללא grant)', role: 'guardian' },
]

const targets = [
  {
    id: data.ids.ppYossi,
    label_he: 'Program_Patient — יוסי כהן (שיקום אישי)',
    householdId: data.ids.hhCohen,
    personId: data.ids.personYossi,
  },
  {
    id: data.ids.ppDaniHousing,
    label_he: 'Program_Patient — דני לוי (דיור)',
    householdId: null as string | null,
    personId: data.ids.personDani,
  },
]

export function RehabPermissions() {
  const [actorId, setActorId] = useState(actors[0].id)
  const [targetId, setTargetId] = useState(targets[0].id)

  const actor = actors.find((a) => a.id === actorId)!
  const target = targets.find((t) => t.id === targetId)!

  const result = useMemo(() => {
    const read = canReadProgramPatient(data, actor.id, actor.role as SimRole, target.id)
    const write = canWriteProgramPatient(data, actor.id, actor.role as SimRole, target.id)
    const member =
      target.householdId != null
        ? isHouseholdMember(
            data,
            actor.id === data.ids.actorNoa
              ? data.ids.personNoa
              : actor.id === data.ids.actorBen
                ? data.ids.personBen
                : actor.id === data.ids.actorGuardianMichal
                  ? data.ids.personMichal
                  : actor.id === data.ids.actorPatientYossi
                    ? data.ids.personYossi
                    : '00000000-0000-0000-0000-000000000000',
            target.householdId,
          )
        : false
    return { read, write, member }
  }, [actor, target])

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <h2 className="text-[20px] font-bold text-ink-navy">סימולציית הרשאות</h2>
        <p className="mt-1 max-w-3xl text-[14px] text-slate-gray">
          בחרו שחקן ויעד Program_Patient. הכללים משקפים את פונקציות ה־SQL (
          <code className="rounded bg-pebble px-1">can_read_program_patient</code>
          ). גישה ≠ חברות במשק בית.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-[13px] font-medium text-ink-navy">
            שחקן
            <select
              className="mt-1 w-full cursor-pointer rounded-md border border-hairline bg-paper px-3 py-2 text-[14px]"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            >
              {actors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label_he} ({a.role})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-medium text-ink-navy">
            יעד
            <select
              className="mt-1 w-full cursor-pointer rounded-md border border-hairline bg-paper px-3 py-2 text-[14px]"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label_he}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ResultCard
          title="קריאה קלינית"
          ok={result.read}
          detail={result.read ? 'מותרת לפי תפקיד/מענק' : 'נדחתה'}
        />
        <ResultCard
          title="כתיבה"
          ok={result.write}
          detail={result.write ? 'can_write על grant/מת״ם' : 'ללא הרשאת כתיבה'}
        />
        <ResultCard
          title="חברות במשק בית"
          ok={result.member}
          detail={
            result.member
              ? 'חבר/ת משק בית — לבדה אינה מספיקה'
              : 'לא חבר/ת משק בית (או לא רלוונטי)'
          }
          soft
        />
      </section>

      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <h3 className="text-[16px] font-bold text-ink-navy">מטריצת בדיקה מהירה (יוסי)</h3>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-hairline text-right text-mist-gray">
                <th className="px-2 py-2">שחקן</th>
                <th className="px-2 py-2">קריאה</th>
                <th className="px-2 py-2">כתיבה</th>
              </tr>
            </thead>
            <tbody>
              {actors.map((a) => {
                const r = canReadProgramPatient(data, a.id, a.role, data.ids.ppYossi)
                const w = canWriteProgramPatient(data, a.id, a.role, data.ids.ppYossi)
                return (
                  <tr key={a.id} className="border-b border-hairline/60">
                    <td className="px-2 py-2 font-medium text-ink-navy">{a.label_he}</td>
                    <td className="px-2 py-2">
                      <Badge tone={r ? 'success' : 'danger'}>{r ? 'כן' : 'לא'}</Badge>
                    </td>
                    <td className="px-2 py-2">
                      <Badge tone={w ? 'success' : 'muted'}>{w ? 'כן' : 'לא'}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ResultCard({
  title,
  ok,
  detail,
  soft,
}: {
  title: string
  ok: boolean
  detail: string
  soft?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-paper p-4 shadow-soft transition-shadow hover:shadow-elevated',
        soft ? 'border-hairline' : ok ? 'border-success/40' : 'border-danger/40',
      )}
    >
      <p className="text-[13px] text-mist-gray">{title}</p>
      <p className="mt-2 text-[22px] font-bold text-ink-navy">{ok ? 'כן' : 'לא'}</p>
      <p className="mt-1 text-[13px] text-slate-gray">{detail}</p>
    </div>
  )
}
