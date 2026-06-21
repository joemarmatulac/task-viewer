import type { EnrichedTask } from '@/types/task'
import { groupByStatus } from '@/lib/taskUtils'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  tasks: EnrichedTask[]
}

const COLUMNS = [
  { status: 'Todo' as const,        label: 'Todo',        accent: 'border-gray-300' },
  { status: 'In Progress' as const, label: 'In Progress', accent: 'border-blue-400' },
  { status: 'Done' as const,        label: 'Done',        accent: 'border-green-400' },
]

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const grouped = groupByStatus(tasks)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(({ status, label, accent }) => (
        <KanbanColumn
          key={status}
          title={label}
          tasks={grouped[status]}
          accentClass={accent}
        />
      ))}
    </div>
  )
}
