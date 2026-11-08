import { useMemo, useState } from 'react'
import {
  getGoal,
  getStage,
  listStagesGroupedForMember,
} from '@/lib/rehab-workflow/store'
import { stageStatusLabelHe } from '@/types/rehab-workflow'
import { cn } from '@/lib/utils'

export interface RehabStageSelection {
  primaryStageId?: string
  secondaryStageIds: string[]
}

interface Props {
  memberId: string
  primaryStageId?: string
  secondaryStageIds: string[]
  includeInactive?: boolean
  onIncludeInactiveChange?: (value: boolean) => void
  onPrimaryChange: (stageId: string | undefined) => void
  onSecondaryChange: (stageIds: string[]) => void
  emptyHref?: string
  /** When true, show compact selected tags + progressive secondary pick. */
  mode?: 'full' | 'progressive'
  readOnly?: boolean
  className?: string
}

/**
 * Shared rehab stage selector for tasks and visits.
 * Level 1: active personal goals · Level 2: stages of selected goal.
 */
export function RehabStageSelector({
  memberId,
  primaryStageId,
  secondaryStageIds,
  includeInactive,
  onIncludeInactiveChange,
  onPrimaryChange,
  onSecondaryChange,
  emptyHref,
  mode = 'progressive',
  readOnly,
  className,
}: Props) {
  const groups = listStagesGroupedForMember(memberId, { includeInactive })
  const hasGoals = groups.length > 0
  const hasAnyStages = groups.some((g) => g.stages.length > 0)

  const primaryStage = primaryStageId ? getStage(primaryStageId) : undefined
  const primaryGoal = primaryStage ? getGoal(primaryStage.personalGoalId) : undefined

  const [pickGoalId, setPickGoalId] = useState<string | null>(
    primaryGoal?.id ?? groups[0]?.goal.id ?? null,
  )
  const [addingSecondary, setAddingSecondary] = useState(false)

  const activePickGoalId = useMemo(() => {
    if (pickGoalId && groups.some((g) => g.goal.id === pickGoalId)) return pickGoalId
    return groups[0]?.goal.id ?? null
  }, [pickGoalId, groups])

  const activeGroup = groups.find((g) => g.goal.id === activePickGoalId)

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
        אין מטרות שיקום פעילות לבן משפחה זה.
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

  function labelForStage(stageId: string) {
    const s = getStage(stageId)
    if (!s) return stageId
    const g = getGoal(s.personalGoalId)
    return `${g?.nameHe ?? 'מטרה'} / ${s.nameHe}`
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected tags */}
      {(primaryStageId || secondaryStageIds.length > 0) && (
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {primaryStageId && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-gold bg-gold/15 px-2.5 py-1 text-[12px] font-semibold text-ink-navy">
              <span className="text-[10px] font-bold text-slate-gray">ראשי</span>
              {labelForStage(primaryStageId)}
              {!readOnly && (
                <button
                  type="button"
                  className="ms-1 text-mist-gray hover:text-danger"
                  aria-label="הסרת שלב ראשי"
                  onClick={() => onPrimaryChange(undefined)}
                >
                  ×
                </button>
              )}
            </span>
          )}
          {secondaryStageIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-md border border-dusk-blue bg-dusk-blue/15 px-2.5 py-1 text-[12px] text-ink-navy"
            >
              <span className="text-[10px] font-bold text-slate-gray">נוסף</span>
              {labelForStage(id)}
              {!readOnly && (
                <button
                  type="button"
                  className="ms-1 text-mist-gray hover:text-danger"
                  aria-label="הסרת שלב נוסף"
                  onClick={() =>
                    onSecondaryChange(secondaryStageIds.filter((x) => x !== id))
                  }
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-slate-gray">
              בחרו מטרה, ואז שלב. מוצגים מופעים אישיים בלבד.
            </p>
            {onIncludeInactiveChange && (
              <label className="flex items-center gap-2 text-[12px] text-slate-gray">
                <input
                  type="checkbox"
                  checked={Boolean(includeInactive)}
                  onChange={(e) => onIncludeInactiveChange(e.target.checked)}
                />
                כולל שלבים שהושלמו / טרם התחילו
              </label>
            )}
          </div>

          {!hasAnyStages && (
            <div className="rounded-md border border-hairline bg-pebble px-3 py-3 text-[13px] text-slate-gray">
              אין שלבים זמינים לבחירה כרגע.
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

          {/* Goal list */}
          <div className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_1fr]">
            <ul
              className="space-y-1 rounded-md border border-hairline bg-pebble p-1"
              role="listbox"
              aria-label="מטרות שיקום"
            >
              {groups.map(({ goal, stages }) => {
                const selected = activePickGoalId === goal.id
                const activeCount = stages.filter(
                  (s) => s.status === 'in_progress',
                ).length
                return (
                  <li key={goal.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => setPickGoalId(goal.id)}
                      className={cn(
                        'w-full rounded-[6px] px-2.5 py-2 text-start text-[13px]',
                        selected
                          ? 'bg-paper font-semibold text-ink-navy shadow-sm'
                          : 'text-slate-gray hover:bg-paper/70',
                      )}
                    >
                      <div>{goal.nameHe}</div>
                      <div className="text-[11px] font-normal text-mist-gray">
                        {stages.length} שלבים
                        {activeCount > 0 ? ` · ${activeCount} בביצוע` : ''}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="rounded-md border border-hairline bg-paper p-2">
              {activeGroup ? (
                <ul className="space-y-1" aria-label={`שלבי ${activeGroup.goal.nameHe}`}>
                  {activeGroup.stages.map((s) => {
                    const isPrimary = primaryStageId === s.id
                    const isSecondary = secondaryStageIds.includes(s.id)
                    const pickingSecondary =
                      mode === 'progressive' &&
                      Boolean(primaryStageId) &&
                      addingSecondary
                    return (
                      <li
                        key={s.id}
                        className={cn(
                          'flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px]',
                          isPrimary && 'bg-gold/15',
                          isSecondary && !isPrimary && 'bg-dusk-blue/10',
                        )}
                      >
                        <div>
                          <span className="font-medium">
                            {s.seq}. {s.nameHe}
                          </span>
                          <span className="ms-2 text-[11px] text-mist-gray">
                            {stageStatusLabelHe[s.status]}
                            {s.status === 'in_progress' ? ' · פעיל' : ''}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {!pickingSecondary ? (
                            <button
                              type="button"
                              className={cn(
                                'rounded border px-2 py-1 text-[12px]',
                                isPrimary
                                  ? 'border-gold bg-gold/25 font-semibold'
                                  : 'border-hairline hover:bg-pebble',
                              )}
                              onClick={() => {
                                if (isPrimary) {
                                  onPrimaryChange(undefined)
                                } else {
                                  onPrimaryChange(s.id)
                                  onSecondaryChange(
                                    secondaryStageIds.filter((id) => id !== s.id),
                                  )
                                  setAddingSecondary(false)
                                }
                              }}
                            >
                              {isPrimary ? 'ראשי ✓' : 'בחר כראשי'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isPrimary}
                              className={cn(
                                'rounded border px-2 py-1 text-[12px] disabled:opacity-40',
                                isSecondary
                                  ? 'border-dusk-blue bg-dusk-blue/20 font-semibold'
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
                              {isSecondary ? 'נוסף ✓' : 'הוסף'}
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                  {activeGroup.stages.length === 0 && (
                    <li className="px-2 py-4 text-center text-[12px] text-mist-gray">
                      אין שלבים להצגה במטרה זו.
                    </li>
                  )}
                </ul>
              ) : (
                <p className="px-2 py-4 text-[13px] text-slate-gray">בחרו מטרה</p>
              )}
            </div>
          </div>

          {mode === 'progressive' && primaryStageId && (
            <div>
              {!addingSecondary ? (
                <button
                  type="button"
                  className="text-[13px] font-medium text-signal-blue hover:underline"
                  onClick={() => setAddingSecondary(true)}
                >
                  הוספת שלב נוסף
                </button>
              ) : (
                <button
                  type="button"
                  className="text-[13px] text-slate-gray hover:underline"
                  onClick={() => setAddingSecondary(false)}
                >
                  סיום הוספת שלבים
                </button>
              )}
            </div>
          )}

          {mode === 'full' && (
            <p className="text-[12px] text-mist-gray">
              מצב מלא: בחרו שלב ראשי ואז סמנו שלבים משניים באותה רשימה באמצעות
              &quot;הוספת שלב נוסף&quot;.
            </p>
          )}
        </>
      )}
    </div>
  )
}

/** Back-compat alias used by earlier workflow PR. */
export { RehabStageSelector as RehabStagePicker }
