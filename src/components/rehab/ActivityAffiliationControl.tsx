import { cn } from '@/lib/utils'
import type { ActivityAffiliation } from '@/types'

interface Props {
  value: ActivityAffiliation
  onChange: (next: ActivityAffiliation) => void
  routineLabel?: string
  rehabLabel?: string
  disabled?: boolean
  id?: string
}

/** Segmented control: routine vs rehab activity affiliation. */
export function ActivityAffiliationControl({
  value,
  onChange,
  routineLabel = 'פעילות שוטפת',
  rehabLabel = 'פעילות שיקומית',
  disabled,
  id = 'activity-affiliation',
}: Props) {
  return (
    <div
      role="group"
      aria-label="שיוך הפעילות"
      id={id}
      className="inline-flex w-full max-w-md rounded-md border border-hairline bg-pebble p-0.5"
    >
      {(
        [
          ['routine', routineLabel],
          ['rehab', rehabLabel],
        ] as const
      ).map(([key, label]) => {
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => {
              if (key !== value) onChange(key)
            }}
            className={cn(
              'flex-1 rounded-[6px] px-3 py-2 text-[13px] font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk-blue',
              selected
                ? 'bg-paper text-ink-navy shadow-sm'
                : 'text-slate-gray hover:text-ink-navy',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
