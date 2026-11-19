import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bus,
  Download,
  FileText,
  Laptop,
  Plus,
  Snowflake,
  Home,
  HeartPulse,
} from 'lucide-react'
import {
  FamCard,
  FamStatus,
  FamStepper,
} from '@/components/families/FamiliesUi'
import { Button } from '@/components/ui/button'
import {
  familiesDocuments,
  familiesRequests,
  familiesRightsShort,
  type FamiliesRequestStatus,
} from '@/data/families-portal-seed'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'

type Filter = 'all' | 'active' | 'done'

function toneFor(
  status: FamiliesRequestStatus,
): 'progress' | 'done' | 'info' {
  if (status === 'done') return 'done'
  if (status === 'checking') return 'info'
  return 'progress'
}

function RequestIcon({ icon }: { icon?: string }) {
  const cls = 'h-4 w-4 text-signal-blue'
  switch (icon) {
    case 'desk':
      return <Laptop className={cls} aria-hidden />
    case 'bus':
    case 'student':
      return <Bus className={cls} aria-hidden />
    case 'winter':
      return <Snowflake className={cls} aria-hidden />
    case 'health':
      return <HeartPulse className={cls} aria-hidden />
    default:
      return <Home className={cls} aria-hidden />
  }
}

export function FamiliesRequests() {
  const { showToast } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [continuity, setContinuity] = useState(true)

  const counts = useMemo(() => {
    const active = familiesRequests.filter(
      (r) => r.status === 'in_progress' || r.status === 'checking',
    ).length
    const done = familiesRequests.filter((r) => r.status === 'done').length
    return { all: familiesRequests.length, active, done }
  }, [])

  const visible = familiesRequests.filter((r) => {
    if (filter === 'active')
      return r.status === 'in_progress' || r.status === 'checking'
    if (filter === 'done') return r.status === 'done'
    return true
  })

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'הכל', count: counts.all },
    { id: 'active', label: 'בטיפול', count: counts.active },
    { id: 'done', label: 'הושלמו', count: counts.done },
  ]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <header className="fam-enter flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink-navy sm:text-[26px]">
              הבקשות והסיוע שלי
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-slate-gray">
              מעקב אחר בקשות שהוגשו על ידי המשפחה או על ידי המלווה בשמכם — עם סטטוס
              ושלבים ברורים.
            </p>
          </div>
          <Button
            variant="dark"
            size="sm"
            className="shrink-0"
            onClick={() => showToast('פתיחת בקשה חדשה (דמו)')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            הגשת בקשה חדשה / פנייה למלווה
          </Button>
        </header>

        <div className="fam-enter fam-enter-delay-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex gap-1 overflow-x-auto rounded-xl border border-hairline bg-paper p-1"
            role="tablist"
            aria-label="סינון בקשות"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={filter === t.id}
                onClick={() => setFilter(t.id)}
                className={cn(
                  'shrink-0 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors',
                  filter === t.id
                    ? 'bg-ink-navy text-paper'
                    : 'text-slate-gray hover:bg-soft-cyan hover:text-ink-navy',
                )}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-slate-gray">
            <button
              type="button"
              role="switch"
              aria-checked={continuity}
              onClick={() => setContinuity((v) => !v)}
              className={cn(
                'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                continuity ? 'bg-ink-navy' : 'bg-hairline',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-paper shadow-soft transition-[inset-inline-start]',
                  continuity ? 'start-4' : 'start-0.5',
                )}
              />
            </button>
            רציפות טיפול ממלכתית
          </label>
        </div>

        <ul className="space-y-3">
          {visible.map((r, i) => (
            <li key={r.id}>
              <FamCard
                enter={(Math.min(i, 3) as 0 | 1 | 2 | 3)}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-soft-cyan">
                      <RequestIcon icon={r.icon} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[14px] font-semibold text-ink-navy">
                          {r.title}
                        </h2>
                        <FamStatus tone={toneFor(r.status)}>
                          {r.statusLabel}
                        </FamStatus>
                      </div>
                      <p className="mt-0.5 text-[12px] text-slate-gray">
                        {r.ref}
                        {r.updatedLabel ? ` · ${r.updatedLabel}` : ''}
                        {r.etaLabel ? ` · ${r.etaLabel}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-slate-gray">{r.summary}</p>
                {r.steps && typeof r.stepIndex === 'number' && (
                  <FamStepper steps={r.steps} activeIndex={r.stepIndex} />
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                  {r.amountLabel ? (
                    <span className="text-[13px] font-medium text-ink-navy">
                      {r.amountLabel}
                    </span>
                  ) : (
                    <span />
                  )}
                  {r.actionLabel && (
                    <Button
                      variant={r.status === 'done' ? 'outline' : 'soft'}
                      size="sm"
                      onClick={() =>
                        showToast(
                          r.status === 'done'
                            ? 'הורדת אישור (דמו)'
                            : 'הודעה נשלחה לניר (דמו)',
                        )
                      }
                    >
                      {r.actionLabel}
                    </Button>
                  )}
                </div>
              </FamCard>
            </li>
          ))}
        </ul>
      </div>

      <aside className="space-y-4">
        <FamCard
          enter={1}
          className="border-signal-blue/20 bg-badge-bg/80"
        >
          <h2 className="text-[14px] font-semibold text-ink-navy">
            צריך עזרה בהגשת בקשה?
          </h2>
          <p className="mt-1 text-[12px] text-slate-gray">
            המלווה יכול להגיש או להשלים בקשה יחד איתכם — בשיחה או בהודעה מאובטחת.
          </p>
          <Button asChild variant="dark" size="sm" className="mt-3 w-full">
            <Link to="/families/companion">פנייה ישירה למלווה</Link>
          </Button>
        </FamCard>

        <FamCard enter={2}>
          <h2 className="mb-3 text-[14px] font-semibold text-ink-navy">
            מסמכים ואישורים בתיק
          </h2>
          <ul className="space-y-2">
            {familiesDocuments.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-[10px] border border-hairline bg-paper px-2.5 py-2 text-start hover:bg-soft-cyan/50"
                  onClick={() => showToast(`הורדת ${d.title} (דמו)`)}
                >
                  <FileText
                    className="h-4 w-4 shrink-0 text-signal-blue"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink-navy">
                    {d.title}
                  </span>
                  <Download
                    className="h-3.5 w-3.5 shrink-0 text-slate-gray"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </FamCard>

        <FamCard enter={3}>
          <h2 className="mb-3 text-[14px] font-semibold text-ink-navy">
            מדריך זכויות מקוצר
          </h2>
          <ul className="space-y-2.5">
            {familiesRightsShort.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 border-b border-hairline pb-2 last:border-0 last:pb-0"
              >
                <span className="text-[12px] font-medium text-ink-navy">
                  {r.title}
                </span>
                <FamStatus tone={r.status === 'approved' ? 'done' : 'info'}>
                  {r.statusLabel}
                </FamStatus>
              </li>
            ))}
          </ul>
          <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
            <Link to="/families/programs">לכל התוכניות וההטבות</Link>
          </Button>
        </FamCard>
      </aside>
    </div>
  )
}
