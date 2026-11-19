import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import './families.css'

export function FamStatus({
  tone,
  children,
  className,
}: {
  tone: 'progress' | 'done' | 'info' | 'danger' | 'new'
  children: ReactNode
  className?: string
}) {
  const tones = {
    progress: 'bg-warning-bg text-warning-text ring-1 ring-warning/40',
    done: 'bg-success-bg text-success ring-1 ring-success/25',
    info: 'bg-badge-bg text-signal-blue ring-1 ring-signal-blue/20',
    danger: 'bg-danger-bg text-danger ring-1 ring-danger/20',
    new: 'bg-warning-bg text-warning-text ring-1 ring-warning/40',
  } as const
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function FamStepper({
  steps,
  activeIndex,
  className,
}: {
  steps: string[]
  activeIndex: number
  className?: string
}) {
  return (
    <ol
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0',
        className,
      )}
      aria-label="שלבי התקדמות"
    >
      {steps.map((label, i) => {
        const done = i < activeIndex
        const current = i === activeIndex
        return (
          <li
            key={label}
            className={cn(
              'relative flex flex-1 items-start gap-2 sm:flex-col sm:items-center sm:gap-2 sm:px-1',
            )}
          >
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'absolute top-3 end-0 hidden h-0.5 w-[calc(100%-1.25rem)] translate-x-1/2 sm:block',
                  done || current ? 'bg-ink-navy/40' : 'bg-hairline',
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                'relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                done && 'bg-success text-paper',
                current && 'bg-ink-navy text-paper ring-2 ring-dusk-blue/60',
                !done && !current && 'bg-pebble text-slate-gray',
              )}
              aria-current={current ? 'step' : undefined}
            >
              {done ? '✓' : i + 1}
            </span>
            <span
              className={cn(
                'text-[12px] leading-snug sm:text-center',
                current ? 'font-semibold text-ink-navy' : 'text-slate-gray',
              )}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function FamEventImage({
  tone,
  label,
  className,
}: {
  tone: 'nature' | 'craft' | 'photo' | 'bridge' | 'sport' | 'community'
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn('fam-img', `fam-img--${tone}`, className)}
      role="img"
      aria-label={label ?? 'תמונת אירוע'}
    >
      {label ? <span className="fam-img__label">{label}</span> : null}
    </div>
  )
}

export function FamCard({
  children,
  className,
  enter,
}: {
  children: ReactNode
  className?: string
  enter?: 0 | 1 | 2 | 3
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-hairline bg-paper p-4 shadow-soft sm:p-5',
        enter !== undefined && 'fam-enter',
        enter === 1 && 'fam-enter-delay-1',
        enter === 2 && 'fam-enter-delay-2',
        enter === 3 && 'fam-enter-delay-3',
        className,
      )}
    >
      {children}
    </section>
  )
}
