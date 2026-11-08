import { listStagesGroupedForMember } from '@/lib/rehab-workflow/store'
import { stageStatusLabelHe } from '@/types/rehab-workflow'
import { cn } from '@/lib/utils'

interface Props {
  memberId: string
  primaryStageId?: string
  secondaryStageIds: string[]
  includeInactive?: boolean
  onIncludeInactiveChange?: (value: boolean) => void
  onPrimaryChange: (stageId: string | undefined) => void
  onSecondaryChange: (stageIds: string[]) => void
  emptyHref?: string
}

export function RehabStagePicker({
  memberId,
  primaryStageId,
  secondaryStageIds,
  includeInactive,
  onIncludeInactiveChange,
  onPrimaryChange,
  onSecondaryChange,
  emptyHref,
}: Props) {
  const groups = listStagesGroupedForMember(memberId, { includeInactive })
  const hasAnyStages = groups.some((g) => g.stages.length > 0)
  const hasGoals = groups.length > 0

  if (!memberId) {
    return (
      <p className="text-[13px] text-slate-gray">
        בחרו בן/בת משפחה כדי לטעון שלבי שיקום אישיים.
      </p>
    )
  }

  if (!hasGoals) {
    return (
      <div className="rounded-md border border-hairline bg-pebble px-3 py-3 text-[13px] text-slate-gray">
        אין מטרות שיקום לבן משפחה זה.
        {emptyHref && (
          <>
            {' '}
            <a href={emptyHref} className="text-signal-blue hover:underline">
              מעבר לניהול השיקום
            </a>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-slate-gray">
          מוצגים מופעי שלבים אישיים בלבד — לא תבניות מהבנק. סינון לפי מזהה האדם.
        </p>
        {onIncludeInactiveChange && (
          <label className="flex items-center gap-2 text-[12px] text-slate-gray">
            <input
              type="checkbox"
              checked={Boolean(includeInactive)}
              onChange={(e) => onIncludeInactiveChange(e.target.checked)}
            />
            הצג גם שלבים שהושלמו / טרם התחילו
          </label>
        )}
      </div>
      {!hasAnyStages && (
        <div className="rounded-md border border-hairline bg-pebble px-3 py-3 text-[13px] text-slate-gray">
          אין שלבים פעילים כרגע.
          {emptyHref && (
            <>
              {' '}
              <a href={emptyHref} className="text-signal-blue hover:underline">
                ניהול השיקום
              </a>
            </>
          )}
        </div>
      )}
      {groups.map(({ goal, stages }) => (
        <div key={goal.id} className="rounded-md border border-hairline bg-paper p-3">
          <div className="mb-2 text-[14px] font-semibold text-ink-navy">
            {goal.nameHe}
          </div>
          <ul className="space-y-2">
            {stages.map((s) => {
              const isPrimary = primaryStageId === s.id
              const isSecondary = secondaryStageIds.includes(s.id)
              return (
                <li
                  key={s.id}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px]',
                    isPrimary && 'bg-soft-cyan',
                  )}
                >
                  <div>
                    <span className="font-medium">{s.nameHe}</span>
                    <span className="ms-2 text-mist-gray">
                      {stageStatusLabelHe[s.status]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={cn(
                        'rounded border px-2 py-1 text-[12px]',
                        isPrimary
                          ? 'border-gold bg-gold/20 font-semibold'
                          : 'border-hairline hover:bg-pebble',
                      )}
                      onClick={() => {
                        onPrimaryChange(isPrimary ? undefined : s.id)
                        if (!isPrimary) {
                          onSecondaryChange(
                            secondaryStageIds.filter((id) => id !== s.id),
                          )
                        }
                      }}
                    >
                      ראשי
                    </button>
                    <button
                      type="button"
                      disabled={isPrimary}
                      className={cn(
                        'rounded border px-2 py-1 text-[12px] disabled:opacity-40',
                        isSecondary
                          ? 'border-dusk-blue bg-dusk-blue/15'
                          : 'border-hairline hover:bg-pebble',
                      )}
                      onClick={() => {
                        if (isSecondary) {
                          onSecondaryChange(
                            secondaryStageIds.filter((id) => id !== s.id),
                          )
                        } else {
                          onSecondaryChange([...secondaryStageIds, s.id])
                        }
                      }}
                    >
                      משני
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          {stages.length === 0 && (
            <p className="text-[12px] text-mist-gray">אין שלבים להצגה במטרה זו.</p>
          )}
        </div>
      ))}
    </div>
  )
}
