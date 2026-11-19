import { useMemo, useState } from 'react'
import {
  Calendar,
  ChevronDown,
  MapPin,
  MessageCircle,
  Users,
} from 'lucide-react'
import {
  FamCard,
  FamEventImage,
  FamStatus,
} from '@/components/families/FamiliesUi'
import { Button } from '@/components/ui/button'
import {
  familiesCompanion,
  familiesFaq,
  familiesProgramStats,
  familiesPrograms,
  type FamiliesProgramCard,
  type FamiliesProgramFilter,
} from '@/data/families-portal-seed'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppContext'

const filters: { id: FamiliesProgramFilter; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'kids', label: 'לילדים ולנוער' },
  { id: 'family', label: 'לכל המשפחה' },
  { id: 'benefits', label: 'הטבות' },
  { id: 'registered', label: 'רשומים' },
]

function statusTone(
  status: FamiliesProgramCard['status'],
): 'progress' | 'done' | 'info' | 'new' {
  if (status === 'registered' || status === 'eligible') return 'done'
  if (status === 'pending' || status === 'new') return 'progress'
  return 'info'
}

export function FamiliesPrograms() {
  const { showToast } = useApp()
  const [filter, setFilter] = useState<FamiliesProgramFilter>('all')
  const [openFaq, setOpenFaq] = useState<string | null>(familiesFaq[0]?.id ?? null)
  const [pollChoice, setPollChoice] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map: Record<FamiliesProgramFilter, number> = {
      all: familiesPrograms.length,
      kids: 0,
      family: 0,
      benefits: 0,
      registered: 0,
    }
    for (const p of familiesPrograms) {
      for (const f of p.filter) {
        if (f !== 'all') map[f] += 1
      }
    }
    return map
  }, [])

  const visible = familiesPrograms.filter((p) => p.filter.includes(filter))

  const registeredAside = familiesPrograms.filter((p) =>
    p.filter.includes('registered'),
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <header className="fam-enter">
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-navy sm:text-[26px]">
            תוכניות, אירועים והטבות
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <FamStatus tone="done">
              {familiesProgramStats.activeActivities} פעילויות פעילות
            </FamStatus>
            <FamStatus tone="done">
              {familiesProgramStats.activeBenefits} הטבה פעילה
            </FamStatus>
            <FamStatus tone="new">
              {familiesProgramStats.newEvents} אירוע חדש
            </FamStatus>
          </div>
        </header>

        <div
          className="fam-enter fam-enter-delay-1 flex gap-1 overflow-x-auto pb-1"
          role="tablist"
          aria-label="סינון תוכניות"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors',
                filter === f.id
                  ? 'border-ink-navy bg-ink-navy text-paper'
                  : 'border-hairline bg-paper text-slate-gray hover:border-dusk-blue hover:text-ink-navy',
              )}
            >
              {f.label} ({counts[f.id]})
            </button>
          ))}
        </div>

        <ul className="space-y-4">
          {visible.map((p, i) => (
            <li key={p.id}>
              <FamCard
                enter={(Math.min(i, 3) as 0 | 1 | 2 | 3)}
                className={cn(
                  p.kind === 'benefit' && 'border-signal-blue/25 bg-badge-bg/40',
                )}
              >
                <div
                  className={cn(
                    'grid gap-4',
                    p.kind !== 'community' && 'sm:grid-cols-[200px_minmax(0,1fr)]',
                  )}
                >
                  {p.kind !== 'community' && (
                    <FamEventImage
                      tone={p.imageTone}
                      label={
                        p.kind === 'benefit'
                          ? 'הטבה'
                          : p.kind === 'respite'
                            ? 'הפוגה'
                            : 'אירוע'
                      }
                      className="min-h-[140px] sm:min-h-full"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-ink-navy">
                        {p.title}
                      </h2>
                      <FamStatus tone={statusTone(p.status)}>
                        {p.statusLabel}
                      </FamStatus>
                    </div>
                    <p className="mt-1.5 text-[13px] text-slate-gray">
                      {p.summary}
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-gray">
                      <li className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        {p.dateLabel}
                        {p.timeLabel ? ` · ${p.timeLabel}` : ''}
                      </li>
                      <li className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {p.location}
                      </li>
                    </ul>

                    {p.registeredMembers && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-navy">
                        <Users className="h-3.5 w-3.5 text-signal-blue" aria-hidden />
                        רשומים: {p.registeredMembers.join(', ')}
                      </p>
                    )}

                    {p.poll && (
                      <div className="mt-3 rounded-xl border border-hairline bg-paper p-3">
                        <p className="text-[12px] font-semibold text-ink-navy">
                          מגיעים?
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(
                            [
                              ['yes', 'מעוניינים'],
                              ['maybe', 'שוקלים'],
                              ['no', 'לא מגיעים'],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setPollChoice(id)
                                showToast(`נרשם: ${label} (דמו)`)
                              }}
                              className={cn(
                                'rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-colors',
                                pollChoice === id
                                  ? 'border-ink-navy bg-ink-navy text-paper'
                                  : 'border-hairline bg-paper text-ink-navy hover:bg-soft-cyan',
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="dark"
                        size="sm"
                        onClick={() => showToast(`${p.ctaPrimary} (דמו)`)}
                      >
                        {p.ctaPrimary}
                      </Button>
                      {p.ctaSecondary && !p.poll && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showToast(`${p.ctaSecondary} (דמו)`)}
                        >
                          {p.ctaSecondary}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </FamCard>
            </li>
          ))}
        </ul>
      </div>

      <aside className="space-y-4">
        <FamCard enter={1}>
          <h2 className="mb-3 text-[14px] font-semibold text-ink-navy">
            פעילויות שנרשמתם אליהן
          </h2>
          <ul className="space-y-2">
            {registeredAside.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 border-b border-hairline pb-2 last:border-0 last:pb-0"
              >
                <span className="truncate text-[12px] font-medium text-ink-navy">
                  {p.title}
                </span>
                <FamStatus tone={statusTone(p.status)}>{p.statusLabel}</FamStatus>
              </li>
            ))}
          </ul>
        </FamCard>

        <FamCard enter={2} className="border-dusk-blue/30 bg-soft-cyan/70">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-signal-blue">
            <MessageCircle className="h-4 w-4" aria-hidden />
            המלצה אישית מ{familiesCompanion.name}
          </div>
          <p className="text-[13px] leading-relaxed text-ink-navy">
            «שווה לשקול את סוף השבוע בגליל — זה מתאים לקצב שלכם עכשיו, ואפשר
            לשלב את הילדים בפעילות טבע רגועה.»
          </p>
        </FamCard>

        <FamCard enter={3} className="!p-0 overflow-hidden">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="text-[14px] font-semibold text-ink-navy">
              מידע שימושי וזכויות
            </h2>
          </div>
          <ul>
            {familiesFaq.map((item) => {
              const open = openFaq === item.id
              return (
                <li key={item.id} className="border-b border-hairline last:border-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start text-[13px] font-medium text-ink-navy hover:bg-soft-cyan/40"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : item.id)}
                  >
                    {item.q}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-slate-gray transition-transform',
                        open && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <p className="px-4 pb-3 text-[12px] leading-relaxed text-slate-gray">
                      {item.a}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </FamCard>
      </aside>
    </div>
  )
}
