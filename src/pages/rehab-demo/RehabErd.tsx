import { useState } from 'react'
import snapshot from '@/data/rehab-demo/snapshot.json'
import type { RehabSnapshot } from '@/data/rehab-demo/types'
import { cn } from '@/lib/utils'

const data = snapshot as RehabSnapshot
const tableNames = Object.keys(data.tables)
  .filter((t) => t !== 'scenarios' && t !== 'scenario_results')
  .sort()

export function RehabErd() {
  const [table, setTable] = useState('program_patients')
  const rows = data.tables[table] ?? []
  const columns = rows.length ? Object.keys(rows[0]) : []

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-hairline bg-paper p-4">
        <h2 className="text-[16px] font-bold text-ink-navy">טבלאות</h2>
        <ul className="mt-3 max-h-[70vh] space-y-1 overflow-auto">
          {tableNames.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => setTable(name)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-right text-[13px] transition-colors duration-150',
                  table === name
                    ? 'bg-dusk-blue text-ink-navy'
                    : 'text-slate-gray hover:bg-soft-cyan',
                )}
              >
                <span className="font-medium">{name}</span>
                <span className="opacity-80">{data.tables[name]?.length ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="space-y-4">
        <section className="rounded-xl border border-hairline bg-paper p-4">
          <h2 className="text-[18px] font-bold text-ink-navy">ERD (Mermaid)</h2>
          <pre
            className="mt-3 overflow-auto rounded-lg bg-cloud p-4 text-[12px] leading-relaxed text-ink-navy"
            dir="ltr"
          >
            {data.erdMermaid}
          </pre>
          <p className="mt-2 text-[13px] text-mist-gray">
            העתיקו לכלי Mermaid / GitHub לצפייה גרפית. הישות המרכזית:{' '}
            <strong>PROGRAM_PATIENTS</strong>.
          </p>
        </section>

        <section className="rounded-xl border border-hairline bg-paper p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[18px] font-bold text-ink-navy">
              <span className="font-mono text-signal-blue">{table}</span>
            </h2>
            <p className="text-[13px] text-mist-gray">{rows.length} שורות</p>
          </div>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-pebble/70 text-right">
                  {columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 font-semibold text-ink-navy">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-hairline/70 hover:bg-soft-cyan">
                    {columns.map((c) => (
                      <td key={c} className="max-w-[240px] truncate px-3 py-2 text-slate-gray" title={String(row[c] ?? '')}>
                        {formatCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'כן' : 'לא'
  return String(value)
}
