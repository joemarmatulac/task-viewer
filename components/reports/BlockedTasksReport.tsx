'use client'

import type { EnrichedTask } from '@/types/task'

interface BlockedTasksReportProps {
  tasks: EnrichedTask[]
}

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

export function BlockedTasksReport({ tasks }: BlockedTasksReportProps) {
  const blockedTasks = tasks.filter(
    (t) => t.blockedByTasks.length > 0 && t.status !== 'Done'
  )

  const truelyBlocked = blockedTasks.filter((t) =>
    t.blockedByTasks.some((b) => b.status !== 'Done')
  )
  const waitingBlocked = blockedTasks.filter((t) =>
    t.blockedByTasks.every((b) => b.status === 'Done')
  )

  if (blockedTasks.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-8 text-center">
        No blocked tasks — everything is clear!
      </div>
    )
  }

  function TaskRow({ task }: { task: EnrichedTask }) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-mono">{task.id}</span>
          <span className="text-sm font-medium text-gray-800">{task.name}</span>
          <StatusBadge status={task.status} />
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
            {task.assignee}
          </span>
        </div>
        <div className="pl-2 border-l-2 border-gray-200 space-y-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Blocked by</p>
          {task.blockedByTasks.map((b) => (
            <div key={b.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">{b.id}</span>
              <span className="text-xs text-gray-700">{b.name}</span>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {truelyBlocked.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Blocked ({truelyBlocked.length})
          </h3>
          <div className="space-y-3">
            {truelyBlocked.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      {waitingBlocked.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Waiting — blockers done ({waitingBlocked.length})
          </h3>
          <div className="space-y-3">
            {waitingBlocked.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
