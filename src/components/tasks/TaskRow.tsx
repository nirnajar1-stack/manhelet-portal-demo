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
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-mist-gray">
            {task.number}
          </span>
          <span
            className={cn('h-2 w-2 rounded-full', priorityDot(task.priority))}
            title={priorityLabel[task.priority]}
            aria-label={`דחיפות: ${priorityLabel[task.priority]}`}
          />
          <Badge tone={statusTone(task.status)}>{statusLabel[task.status]}</Badge>
          {task.needsAttention && <Badge tone="danger">דורש טיפול</Badge>}
          {task.hasNewReply && (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-signal-blue">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              תגובה חדשה
            </span>
          )}
        </div>
        <h3 className="truncate text-[15px] font-semibold text-ink-navy">
          {task.title}
        </h3>
        <p className="mt-1 truncate text-[13px] text-slate-gray">
          משפחת {unit?.familyName ?? '—'}
          {member ? ` · ${member.name}` : ''}
          {owner ? ` · ${owner.name}` : ''}
        </p>
        {!compact && (
          <p className="mt-1 truncate text-[12px] text-mist-gray">
            {task.lastActivity} · {formatRelativeHe(task.updatedAt)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-[12px] text-mist-gray">
          {formatRelativeHe(task.updatedAt)}
        </span>
        {showOpenAction && (
          <Button
            size="sm"
            variant="soft"
            className="h-7 text-[12px]"
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
          'flex w-full items-start justify-between gap-3 border-b border-hairline px-4 py-3 text-start transition-colors hover:bg-pebble/70',
          selected && 'bg-badge-bg/50',
          compact && 'px-3 py-2.5',
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
        'flex items-start justify-between gap-3 border-b border-hairline px-4 py-3 transition-colors hover:bg-pebble/70 focus-visible:bg-pebble',
        selected && 'bg-badge-bg/50',
        compact && 'px-3 py-2.5',
      )}
    >
      {content}
    </Link>
  )
}
