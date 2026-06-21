import type { EnrichedTask } from '@/types/task'
import { BlockerBadge } from './BlockerBadge'

interface TaskCardProps {
  task: EnrichedTask
  onEditTask: (id: string) => void
}

export function TaskCard({ task, onEditTask }: TaskCardProps) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2 cursor-grab active:cursor-grabbing active:opacity-50 active:scale-95 transition-[opacity,transform]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-gray-400 font-mono">{task.id}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{task.assignee}</span>
      </div>

      <p className="text-sm font-medium text-gray-800 leading-snug">{task.name}</p>

      {task.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {(task.startDate || task.endDate) && (
        <p className="text-xs text-gray-400">
          {task.startDate} → {task.endDate}
        </p>
      )}

      {task.blockedByTasks.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {task.blockedByTasks.map((t) => (
            <BlockerBadge key={t.id} direction="blocked-by" taskName={t.name} taskId={t.id} />
          ))}
        </div>
      )}

      {task.dependsOnTasks.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {task.dependsOnTasks.map((t) => (
            <BlockerBadge key={t.id} direction="depends-on" taskName={t.name} taskId={t.id} />
          ))}
        </div>
      )}

      {task.notes && (
        <p className="text-xs text-gray-400 italic leading-relaxed line-clamp-2 border-t border-gray-100 pt-2">
          {task.notes}
        </p>
      )}

      <button
        onClick={e => { e.stopPropagation(); onEditTask(task.id) }}
        className="hidden group-hover:block text-xs text-blue-500 hover:text-blue-700 pt-0.5"
      >
        Edit blockers & dependencies
      </button>
    </div>
  )
}
