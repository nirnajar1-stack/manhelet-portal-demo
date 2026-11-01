import { TaskRow } from '@/components/tasks/TaskRow'
import type { Task } from '@/types'

export function TaskList({
  tasks,
  selectedId,
  empty = 'אין משימות להצגה',
  compact,
}: {
  tasks: Task[]
  selectedId?: string
  empty?: string
  compact?: boolean
}) {
  if (tasks.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-[14px] text-slate-gray">
        {empty}
      </div>
    )
  }

  return (
    <div className="divide-y-0 overflow-hidden rounded-lg border border-hairline bg-paper">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          selected={t.id === selectedId}
          compact={compact}
        />
      ))}
    </div>
  )
}
