import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Layers } from 'lucide-react'
import snapshot from '@/data/rehab-demo/snapshot.json'
import type { RehabSnapshot } from '@/data/rehab-demo/types'

const data = snapshot as RehabSnapshot
const passed = data.scenarioResults.filter((s) => s.passed).length

const decisions = [
  'Program_Patient הוא הישות המרכזית — יעדים, תיקים והשתתפות במפגשים נקשרים אליו בלבד.',
  'פתיחת תוכנית נועלת template_version; לא ניתן להחליף גרסה כל עוד הסטטוס open.',
  'התקדמות אישית (personal_pct) מחושבת מיעדים משוקללים; התקדמות קבוצתית היא ממוצע נפרד.',
  'access_grants מפורשים — חברות במשק בית אינה מקנה גישה קלינית.',
]

export function RehabOverview() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'טבלאות', value: Object.keys(data.tables).length - 1 },
          { label: 'שכבות', value: data.layers.length },
          { label: 'Program_Patient', value: data.tables.program_patients.length },
          { label: 'תרחישים שעברו', value: `${passed}/${data.scenarioResults.length}` },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-hairline bg-paper p-4 shadow-soft transition-shadow duration-200 hover:shadow-elevated"
          >
            <p className="text-[13px] text-mist-gray">{k.label}</p>
            <p className="mt-1 text-[28px] font-bold text-ink-navy">{k.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2 text-ink-navy">
          <Layers className="size-5" aria-hidden />
          <h2 className="text-[20px] font-bold">שש שכבות המודל</h2>
        </div>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.layers.map((layer) => (
            <li
              key={layer.id}
              className="rounded-lg border border-hairline bg-cloud/60 p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <p className="text-[12px] font-semibold text-signal-blue">שכבה {layer.id}</p>
              <p className="mt-1 text-[16px] font-bold text-ink-navy">{layer.name_he}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-gray">
                {layer.tables.join(' · ')}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <h2 className="text-[20px] font-bold text-ink-navy">עקרונות ליבה</h2>
        <ul className="mt-3 space-y-2">
          {decisions.map((d) => (
            <li key={d} className="flex gap-2 text-[15px] text-slate-gray">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/rehab-demo/programs"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ink-navy px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          >
            מעבר לתוכניות
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <Link
            to="/rehab-demo/scenarios"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-hairline bg-paper px-4 py-2 text-[14px] font-medium text-ink-navy transition-colors hover:bg-pebble"
          >
            דפדוף תרחישים
          </Link>
        </div>
        <p className="mt-4 text-[12px] text-mist-gray">
          Snapshot נוצר ב־{new Date(data.generatedAt).toLocaleString('he-IL')} · מקור אמת SQL ב־
          <code className="mx-1 rounded bg-pebble px-1">rehab_demo/</code>
        </p>
      </section>
    </div>
  )
}
