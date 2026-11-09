import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMember, getUnit, getUser, priorityLabel, statusLabel } from '@/data/mock'
import { formatRelativeHe, cn } from '@/lib/utils'
import type { Task } from '@/types'

function statusTone(status: Task['status']) {
  switch (status) {
    case 'waiting':
      return 'warning' as const
    case 'done':
    case 'closed':
      return 'success' as const
    case 'in_progress':
      return 'blue' as const
    default:
      return 'muted' as const
  }
}

function priorityDot(p: Task['priority']) {
  if (p === 'urgent') return 'bg-danger'
  if (p === 'high') return 'bg-warning'
  if (p === 'medium') return 'bg-mist-gray'
  return 'bg-hairline'
}

export function TaskRow({
  task,
  selected,
  compact = false,
  showOpenAction = false,
  onSelect,
}: {
  task: Task
  selected?: boolean
  compact?: boolean
  showOpenAction?: boolean
  onSelect?: (task: Task) => void
}) {
  const unit = getUnit(task.unitId)
  const member = getMember(task.unitId, task.memberId)
  const owner = getUser(task.ownerId)

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-1 sm:gap-2">
          <span className="meta-xs-hide text-[12px] font-medium text-mist-gray">
            {task.number}
          </span>
          <span
            className="inline-flex items-center gap-1"
            title={`דחיפות: ${priorityLabel[task.priority]}`}
          >
            <span
              className={cn('h-2 w-2 rounded-full', priorityDot(task.priority))}
              aria-hidden
            />
            <span className="sr-only">דחיפות: {priorityLabel[task.priority]}</span>
            {(task.priority === 'urgent' || task.priority === 'high') && (
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  task.priority === 'urgent' ? 'text-danger' : 'text-warning-text',
                )}
              >
                {priorityLabel[task.priority]}
              </span>
            )}
          </span>
          <Badge tone={statusTone(task.status)}>{statusLabel[task.status]}</Badge>
          {task.needsAttention && <Badge tone="danger">דורש טיפול</Badge>}
          {task.hasNewReply && (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-signal-blue">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              <span className="meta-xs-hide">תגובה חדשה</span>
              <span className="sr-only sm:hidden">תגובה חדשה</span>
            </span>
          )}
        </div>
        <h3 className="text-[15px] font-medium leading-snug text-ink-navy text-balance sm:truncate sm:text-[13px]">
          {task.title}
        </h3>
        <p className="mt-1.5 text-[13px] text-slate-gray sm:mt-1 sm:truncate">
          משפחת {unit?.familyName ?? '—'}
          {member ? (
            <span className="meta-xs-hide">{` · ${member.name}`}</span>
          ) : null}
          {owner ? (
            <span className="meta-xs-hide">{` · ${owner.name}`}</span>
          ) : null}
        </p>
        {!compact && (
          <p className="meta-xs-hide mt-1 truncate text-[12px] text-mist-gray">
            {task.lastActivity} · {formatRelativeHe(task.updatedAt)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <span className="meta-xs-hide text-[12px] text-mist-gray">
          {formatRelativeHe(task.updatedAt)}
        </span>
        {showOpenAction && (
          <Button
            size="sm"
            variant="soft"
            className="min-h-10 text-[13px] sm:h-7 sm:min-h-0 sm:text-[12px]"
            onClick={(e) => {
              if (onSelect) {
                e.preventDefault()
                onSelect(task)
              }
            }}
          >
            פתיחת משימה
          </Button>
        )}
      </div>
    </>
  )

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(task)}
        className={cn(
          'data-row flex w-full cursor-pointer items-start justify-between gap-3 border-b border-hairline px-4 py-4 text-start transition-colors duration-150 hover:bg-soft-cyan focus-visible:bg-soft-cyan sm:px-5 sm:py-3.5',
          selected && 'bg-info-wash',
          compact && 'sm:px-4 sm:py-3',
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        'data-row flex cursor-pointer items-start justify-between gap-3 border-b border-hairline px-4 py-4 transition-colors duration-150 hover:bg-soft-cyan focus-visible:bg-soft-cyan sm:px-5 sm:py-3.5',
        selected && 'bg-info-wash',
        compact && 'sm:px-4 sm:py-3',
      )}
    >
      {content}
    </Link>
  )
}
