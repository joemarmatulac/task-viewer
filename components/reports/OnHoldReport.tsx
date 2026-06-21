import type { EnrichedTask } from '@/types/task'

interface OnHoldReportProps {
  tasks: EnrichedTask[]
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

export function OnHoldReport({ tasks }: OnHoldReportProps) {
  const onHoldTasks = tasks.filter(t => t.status === 'On Hold' && t.onHoldDate)
  const today = new Date().toISOString().split('T')[0]

  if (onHoldTasks.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
        No tasks currently on hold.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 dark:text-gray-500">{onHoldTasks.length} task{onHoldTasks.length !== 1 ? 's' : ''} on hold</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4 font-medium">Task</th>
              <th className="py-2 pr-4 font-medium">Assignee</th>
              <th className="py-2 pr-4 font-medium">Actual Start</th>
              <th className="py-2 pr-4 font-medium">On Hold Since</th>
              <th className="py-2 pr-4 font-medium">Days On Hold</th>
              <th className="py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {onHoldTasks.map(t => {
              const daysOnHold = t.onHoldDate ? daysBetween(t.onHoldDate, today) : null
              return (
                <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 pr-4">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 mr-1">{t.id}</span>
                    <span className="text-gray-800 dark:text-gray-200">{t.name}</span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{t.assignee || '—'}</td>
                  <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{t.actualStartDate || '—'}</td>
                  <td className="py-2 pr-4 text-amber-600 dark:text-amber-400 font-medium">{t.onHoldDate}</td>
                  <td className="py-2 pr-4">
                    {daysOnHold !== null && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        daysOnHold >= 5 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                        daysOnHold >= 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {daysOnHold}d
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400 italic max-w-xs">
                    {t.onHoldReason || <span className="text-gray-300 dark:text-gray-600">No reason provided</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
