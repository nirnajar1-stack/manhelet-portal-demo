import { cn } from '@/lib/utils'
import { stageOutcomeCaptionsHe } from '@/data/visitor-demo'
import {
  stageStatusLabelHe,
  type RehabPersonalStage,
} from '@/types/rehab-workflow'

interface Props {
  stages: RehabPersonalStage[]
  selectedId?: string
  onSelect: (id: string) => void
  className?: string
}

/**
 * Hero stage journey for visitor walkthroughs — scannable path with
 * emphasized current stage, completed outcomes, and clear next steps.
 */
export function RehabStageJourney({
  stages,
  selectedId,
  onSelect,
  className,
}: Props) {
  const sorted = [...stages].sort((a, b) => a.seq - b.seq)
  const completed = sorted.filter(
    (s) => s.status === 'completed' || s.status === 'skipped',
  ).length
  const pct = sorted.length ? Math.round((completed / sorted.length) * 100) : 0
  const active = sorted.find((s) => s.status === 'in_progress')
  const nextUp = sorted.find((s) => s.status === 'not_started')

  return (
    <section
      className={cn(
        'rehab-journey overflow-hidden rounded-[12px] border border-hairline bg-paper',
        className,
      )}
      aria-label="מסע שלבי השיקום"
    >
      <div className="relative border-b border-hairline bg-gradient-to-l from-soft-cyan via-paper to-gold/10 px-4 py-4 sm:px-5">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
          <div className="absolute -start-8 top-0 h-24 w-24 rounded-full bg-dusk-blue/25 blur-2xl" />
          <div className="absolute -end-6 bottom-0 h-20 w-28 rounded-full bg-gold/30 blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-signal-blue">
              מסע השיקום
            </p>
            <h2 className="mt-0.5 text-[18px] font-bold text-ink-navy sm:text-[20px]">
              שלבי המטרה
            </h2>
            <p className="mt-1 max-w-xl text-[13px] leading-snug text-slate-gray">
              {active
                ? `כרגע ב«${active.nameHe}» · ${completed} מתוך ${sorted.length} הושלמו`
                : `${completed} מתוך ${sorted.length} שלבים הושלמו`}
              {nextUp ? ` · הבא: ${nextUp.nameHe}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-[7.5rem]">
              <div className="mb-1 flex justify-between text-[11px] text-slate-gray">
                <span>התקדמות</span>
                <span className="font-semibold text-ink-navy">{pct}%</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-pebble"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="rehab-journey__fill h-full rounded-full bg-gradient-to-l from-gold to-dusk-blue"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop / tablet horizontal path */}
      <ol className="rehab-journey__track hidden gap-0 px-3 py-5 sm:flex sm:px-4">
        {sorted.map((stage, i) => (
          <li key={stage.id} className="relative flex min-w-0 flex-1 flex-col">
            {i < sorted.length - 1 && (
              <span
                className={cn(
                  'rehab-journey__connector absolute top-[18px] start-[calc(50%+18px)] end-[calc(-50%+18px)] h-[3px]',
                  stage.status === 'completed' || stage.status === 'skipped'
                    ? 'bg-success/70'
                    : stage.status === 'in_progress'
                      ? 'bg-gradient-to-l from-dusk-blue/80 to-hairline'
                      : 'bg-hairline',
                )}
                aria-hidden
              />
            )}
            <JourneyNode
              stage={stage}
              selected={selectedId === stage.id}
              onSelect={() => onSelect(stage.id)}
            />
          </li>
        ))}
      </ol>

      {/* Mobile vertical path */}
      <ol className="space-y-0 px-3 py-3 sm:hidden">
        {sorted.map((stage, i) => (
          <li key={stage.id} className="relative flex gap-3">
            <div className="flex w-8 shrink-0 flex-col items-center">
              <MobileDot stage={stage} selected={selectedId === stage.id} />
              {i < sorted.length - 1 && (
                <span
                  className={cn(
                    'mt-1 w-[3px] flex-1 min-h-[12px]',
                    stage.status === 'completed' || stage.status === 'skipped'
                      ? 'bg-success/70'
                      : 'bg-hairline',
                  )}
                  aria-hidden
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <JourneyNode
                stage={stage}
                selected={selectedId === stage.id}
                onSelect={() => onSelect(stage.id)}
                compact
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function JourneyNode({
  stage,
  selected,
  onSelect,
  compact,
}: {
  stage: RehabPersonalStage
  selected: boolean
  onSelect: () => void
  compact?: boolean
}) {
  const done = stage.status === 'completed' || stage.status === 'skipped'
  const active = stage.status === 'in_progress'
  const paused = stage.status === 'paused'
  const outcome = stageOutcomeCaptionsHe[stage.id]

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'step' : undefined}
      className={cn(
        'group relative z-[1] flex w-full flex-col items-center text-center transition-transform duration-200',
        !compact && 'px-1',
        compact && 'items-stretch text-start',
        active && 'rehab-journey__active',
      )}
    >
      {!compact && (
        <span
          className={cn(
            'mb-2 flex h-9 w-9 items-center justify-center rounded-full border-2 text-[13px] font-bold transition-shadow',
            done && 'border-success bg-success-bg text-success',
            active &&
              'border-gold bg-gold text-ink-navy shadow-[0_0_0_4px_rgba(245,197,66,0.28)]',
            paused && 'border-warning-text/40 bg-warning-bg text-warning-text',
            !done &&
              !active &&
              !paused &&
              'border-hairline bg-pebble text-slate-gray',
            selected && !active && 'ring-2 ring-signal-blue/40',
          )}
        >
          {done ? '✓' : stage.seq}
        </span>
      )}
      <div
        className={cn(
          'w-full rounded-[10px] border px-2.5 py-2 transition-colors',
          selected
            ? 'border-gold bg-gold/15'
            : 'border-transparent bg-transparent group-hover:border-hairline group-hover:bg-pebble/80',
          active && !selected && 'border-dusk-blue/50 bg-soft-cyan/60',
          compact && 'border-hairline bg-paper',
          compact && selected && 'border-gold bg-gold/15',
        )}
      >
        <div className={cn('flex items-start gap-2', compact && 'items-center')}>
          {compact && (
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                done && 'bg-success-bg text-success',
                active && 'bg-gold text-ink-navy',
                !done && !active && 'bg-pebble text-slate-gray',
              )}
            >
              {done ? '✓' : stage.seq}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                'truncate text-[13px] font-semibold text-ink-navy',
                active && 'text-[14px]',
              )}
            >
              {stage.nameHe}
            </div>
            <div className="mt-0.5 text-[11px] text-mist-gray">
              {stageStatusLabelHe[stage.status]}
              {done && stage.completedAt
                ? ` · ${stage.completedAt.slice(0, 10)}`
                : active && stage.startDate
                  ? ` · מ־${stage.startDate}`
                  : ''}
            </div>
            {outcome && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-gray">
                {outcome}
              </p>
            )}
            {active && !outcome && stage.descriptionHe && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-gray">
                {stage.descriptionHe}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function MobileDot({
  stage,
  selected,
}: {
  stage: RehabPersonalStage
  selected: boolean
}) {
  const done = stage.status === 'completed' || stage.status === 'skipped'
  const active = stage.status === 'in_progress'
  return (
    <span
      className={cn(
        'mt-2 h-3 w-3 rounded-full border-2',
        done && 'border-success bg-success',
        active && 'border-gold bg-gold rehab-pulse',
        !done && !active && 'border-hairline bg-paper',
        selected && 'ring-2 ring-signal-blue/30',
      )}
      aria-hidden
    />
  )
}
