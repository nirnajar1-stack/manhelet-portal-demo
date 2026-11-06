import { Link } from 'react-router-dom'
import snapshot from '@/data/rehab-demo/snapshot.json'
import type { RehabSnapshot } from '@/data/rehab-demo/types'
import { Badge } from '@/components/ui/badge'

const data = snapshot as RehabSnapshot

type Program = {
  id: string
  program_code: string
  name_he: string
  kind: string
  status: string
  pinned_version_id: string | null
  household_id: string | null
}

export function RehabPrograms() {
  const programs = data.tables.programs as Program[]
  const patients = data.tables.program_patients as Array<{ program_id: string }>
  const templates = Object.fromEntries(
    (data.tables.program_templates as Array<{ id: string; name_he: string }>).map((t) => [
      t.id,
      t.name_he,
    ]),
  )
  const versions = Object.fromEntries(
    (
      data.tables.template_versions as Array<{
        id: string
        version_number: number
        template_id: string
      }>
    ).map((v) => [v.id, `v${v.version_number}`]),
  )

  return (
    <section className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
      <h2 className="text-[20px] font-bold text-ink-navy">תוכניות שיקום</h2>
      <p className="mt-1 text-[14px] text-slate-gray">
        תוכנית פתוחה נועלת גרסת תבנית. לחצו לפרטי היררכיה סביב Program_Patient.
      </p>
      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-[14px]">
          <thead>
            <tr className="border-b border-hairline text-right text-mist-gray">
              <th className="px-2 py-2 font-medium">קוד</th>
              <th className="px-2 py-2 font-medium">שם</th>
              <th className="px-2 py-2 font-medium">סוג</th>
              <th className="px-2 py-2 font-medium">סטטוס</th>
              <th className="px-2 py-2 font-medium">גרסה נעולה</th>
              <th className="px-2 py-2 font-medium">משתתפים</th>
              <th className="px-2 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => {
              const count = patients.filter((pp) => pp.program_id === p.id).length
              const prog = data.tables.programs.find((x) => x.id === p.id) as
                | { template_id: string }
                | undefined
              return (
                <tr key={p.id} className="border-b border-hairline/70 hover:bg-cloud/70">
                  <td className="px-2 py-3 font-mono text-[12px] text-mist-gray">
                    {p.program_code}
                  </td>
                  <td className="px-2 py-3 font-semibold text-ink-navy">{p.name_he}</td>
                  <td className="px-2 py-3 text-slate-gray">
                    {p.kind === 'group' ? 'קבוצתי' : 'אישי'}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-2 py-3 text-slate-gray">
                    {p.pinned_version_id
                      ? `${templates[prog?.template_id ?? ''] ?? ''} ${versions[p.pinned_version_id] ?? ''}`
                      : '— (טיוטה)'}
                  </td>
                  <td className="px-2 py-3">{count}</td>
                  <td className="px-2 py-3">
                    <Link
                      to={`/rehab-demo/programs/${p.id}`}
                      className="cursor-pointer text-signal-blue underline-offset-2 hover:underline"
                    >
                      פירוט
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'muted' | 'success' | 'warning' | 'danger'> = {
    open: 'success',
    draft: 'warning',
    paused: 'warning',
    closed: 'muted',
  }
  const labels: Record<string, string> = {
    open: 'פתוחה',
    draft: 'טיוטה',
    paused: 'מושהית',
    closed: 'סגורה',
  }
  return <Badge tone={map[status] ?? 'muted'}>{labels[status] ?? status}</Badge>
}
