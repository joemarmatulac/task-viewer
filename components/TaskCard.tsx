import type { EnrichedTask } from '@/types/task'
import { BlockerBadge } from './BlockerBadge'

interface TaskCardProps {
  task: EnrichedTask
}

export function TaskCard({ task }: TaskCardProps) {
  const hasDeps = task.blockedByTasks.length > 0 || task.blocksTasks.length > 0

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2 cursor-grab active:cursor-grabbing active:opacity-50 active:scale-95 transition-[opacity,transform]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-gray-400 font-mono">{task.id}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{task.assignee}</span>
      </div>

      <p className="text-sm font-medium text-gray-800 leading-snug">{task.name}</p>

      {(task.startDate || task.endDate) && (
        <p className="text-xs text-gray-400">
          {task.startDate} → {task.endDate}
        </p>
      )}

      {hasDeps && (
        <div className="flex flex-wrap gap-1 pt-1">
          {task.blockedByTasks.map((t) => (
            <BlockerBadge key={t.id} direction="blocked-by" taskName={t.name} taskId={t.id} />
          ))}
          {task.blocksTasks.map((t) => (
            <BlockerBadge key={t.id} direction="blocks" taskName={t.name} taskId={t.id} />
          ))}
        </div>
      )}
    </div>
  )
}
