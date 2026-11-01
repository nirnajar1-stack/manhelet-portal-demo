import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

function priorityTone(p: Task['priority']) {
  if (p === 'urgent' || p === 'high') return 'danger' as const
  if (p === 'medium') return 'warning' as const
  return 'muted' as const
}

export function TaskRow({
  task,
  selected,
  compact = false,
}: {
  task: Task
  selected?: boolean
  compact?: boolean
}) {
  const unit = getUnit(task.unitId)
  const member = getMember(task.unitId, task.memberId)
  const owner = getUser(task.ownerId)

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        'block border-b border-hairline px-4 py-3 transition-colors hover:bg-pebble/70 focus-visible:bg-pebble',
        selected && 'bg-badge-bg/60',
        compact && 'px-3 py-2.5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-mist-gray">
              {task.number}
            </span>
            <Badge tone={statusTone(task.status)}>{statusLabel[task.status]}</Badge>
            {task.needsAttention && <Badge tone="danger">דורש טיפול</Badge>}
            <Badge tone={priorityTone(task.priority)}>
              {priorityLabel[task.priority]}
            </Badge>
            {task.hasNewReply && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-signal-blue">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                תגובה חדשה
              </span>
            )}
          </div>
          <h3 className="truncate text-[16px] font-semibold text-ink-navy">
            {task.title}
          </h3>
          <p className="mt-1 truncate text-[14px] text-slate-gray">
            {member?.name ?? '—'} · משפחת {unit?.familyName ?? '—'}
            {owner ? ` · אחראי: ${owner.name}` : ''}
          </p>
          {!compact && (
            <p className="mt-1 truncate text-[12px] text-mist-gray">
              {task.lastActivity} · {formatRelativeHe(task.updatedAt)}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[12px] text-mist-gray">
          {formatRelativeHe(task.updatedAt)}
        </span>
      </div>
    </Link>
  )
}
