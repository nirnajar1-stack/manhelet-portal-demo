import { useMemo, useState } from 'react'
import snapshot from '@/data/rehab-demo/snapshot.json'
import type { RehabSnapshot } from '@/data/rehab-demo/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const data = snapshot as RehabSnapshot

export function RehabScenarios() {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'permission'>('all')
  const rows = useMemo(
    () =>
      data.scenarioResults.filter((s) => (filter === 'all' ? true : s.kind === filter)),
    [filter],
  )
  const passed = data.scenarioResults.filter((s) => s.passed).length

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-hairline bg-paper p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-ink-navy">דפדפן תרחישים</h2>
            <p className="mt-1 text-[14px] text-slate-gray">
              Expected מול Actual מריצת האימות על PGlite — {passed}/
              {data.scenarioResults.length} עברו.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'הכל'],
                ['positive', 'חיובי'],
                ['negative', 'שלילי'],
                ['permission', 'הרשאות'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={cn(
                  'cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                  filter === id
                    ? 'bg-dusk-blue text-ink-navy'
                    : 'bg-soft-cyan text-ink-navy',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((s) => (
          <article
            key={s.id}
            className={cn(
              'rounded-xl border bg-paper p-4 shadow-soft transition-transform duration-200 hover:-translate-y-0.5',
              s.passed ? 'border-hairline' : 'border-danger',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-semibold text-signal-blue">
                  {s.code} · שכבה {s.layer} · {s.kind}
                </p>
                <h3 className="mt-1 text-[16px] font-bold text-ink-navy">{s.title_he}</h3>
              </div>
              <Badge tone={s.passed ? 'success' : 'danger'}>
                {s.passed ? 'עבר' : 'נכשל'}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-cloud p-3">
                <p className="text-[12px] font-medium text-mist-gray">Expected</p>
                <p className="mt-1 text-[14px] text-ink-navy">{s.expected_he}</p>
              </div>
              <div className="rounded-lg bg-cloud p-3">
                <p className="text-[12px] font-medium text-mist-gray">Actual</p>
                <p className="mt-1 text-[14px] text-ink-navy">{s.actual_he}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
