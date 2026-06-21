'use client'

import type { EnrichedTask } from '@/types/task'

interface SprintReportProps {
  tasks: EnrichedTask[]
}

const TODAY = '2026-06-21'
const WEEK_END = '2026-06-28'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Done'
      ? 'bg-green-100 text-green-700'
      : status === 'In Progress'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>
  )
}

interface GroupSection {
  label: string
  tasks: EnrichedTask[]
  labelClass: string
  dotClass: string
}

export function SprintReport({ tasks }: SprintReportProps) {
  if (tasks.length === 0) {
    return <div className="text-sm text-gray-500 py-8 text-center">No tasks loaded.</div>
  }

  const overdue: EnrichedTask[] = []
  const dueThisWeek: EnrichedTask[] = []
  const upcoming: EnrichedTask[] = []
  const completed: EnrichedTask[] = []

  for (const task of tasks) {
    if (task.status === 'Done') {
      completed.push(task)
      continue
    }
    const end = task.endDate
    if (!end || end > WEEK_END) {
      upcoming.push(task)
    } else if (end < TODAY) {
      overdue.push(task)
    } else {
      // TODAY <= end <= WEEK_END
      dueThisWeek.push(task)
    }
  }

  const sections: GroupSection[] = [
    {
      label: 'Overdue',
      tasks: overdue,
      labelClass: 'text-red-700',
      dotClass: 'bg-red-400',
    },
    {
      label: 'Due this week',
      tasks: dueThisWeek,
      labelClass: 'text-yellow-700',
      dotClass: 'bg-yellow-400',
    },
    {
      label: 'Upcoming',
      tasks: upcoming,
      labelClass: 'text-blue-700',
      dotClass: 'bg-blue-400',
    },
    {
      label: 'Completed',
      tasks: completed,
      labelClass: 'text-green-700',
      dotClass: 'bg-green-400',
    },
  ]

  return (
    <div className="space-y-6">
      {sections.map(({ label, tasks: groupTasks, labelClass, dotClass }) => {
        if (groupTasks.length === 0) return null
        return (
          <section key={label}>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${labelClass}`}
            >
              <span className={`w-2 h-2 rounded-full inline-block ${dotClass}`} />
              {label} ({groupTasks.length})
            </h3>
            <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {groupTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono w-16 shrink-0">{task.id}</span>
                  <span className="text-sm text-gray-700 flex-1 min-w-0">{task.name}</span>
                  <span className="text-xs text-gray-500">{task.assignee}</span>
                  {task.endDate && (
                    <span className="text-xs text-gray-400 font-mono">{task.endDate}</span>
                  )}
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
