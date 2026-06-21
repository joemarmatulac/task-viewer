'use client'

import type { EnrichedTask } from '@/types/task'

interface WorkloadReportProps {
  tasks: EnrichedTask[]
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Done'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
      : status === 'In Progress'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>
  )
}

export function WorkloadReport({ tasks }: WorkloadReportProps) {
  if (tasks.length === 0) {
    return <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No tasks loaded.</div>
  }

  const byAssignee = tasks.reduce<Record<string, EnrichedTask[]>>((acc, task) => {
    const key = task.assignee || 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  const assignees = Object.keys(byAssignee).sort()

  return (
    <div className="space-y-6">
      {assignees.map((assignee) => {
        const assigneeTasks = byAssignee[assignee]
        const done = assigneeTasks.filter((t) => t.status === 'Done').length
        const inProgress = assigneeTasks.filter((t) => t.status === 'In Progress').length
        const todo = assigneeTasks.filter((t) => t.status === 'Todo').length

        const summaryParts: string[] = []
        if (done > 0) summaryParts.push(`${done} done`)
        if (inProgress > 0) summaryParts.push(`${inProgress} in progress`)
        if (todo > 0) summaryParts.push(`${todo} todo`)

        return (
          <section key={assignee}>
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{assignee}</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">{summaryParts.join(', ')}</span>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {assigneeTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-16 shrink-0">{task.id}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{task.name}</span>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
