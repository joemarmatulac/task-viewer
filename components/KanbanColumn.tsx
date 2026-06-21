import type { EnrichedTask } from '@/types/task'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  title: string
  tasks: EnrichedTask[]
  accentClass: string
}

export function KanbanColumn({ title, tasks, accentClass }: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-3 min-w-[280px] flex-1">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${accentClass}`}>
        <h2 className="font-semibold text-gray-700">{title}</h2>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 rounded-full px-2">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
        )}
      </div>
    </div>
  )
}
