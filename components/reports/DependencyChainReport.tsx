'use client'

import type { EnrichedTask } from '@/types/task'

interface DependencyChainReportProps {
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

interface TreeNodeProps {
  task: EnrichedTask
  taskMap: Map<string, EnrichedTask>
  depth: number
  visited: Set<string>
}

function TreeNode({ task, taskMap, depth, visited }: TreeNodeProps) {
  // Guard against cycles
  if (visited.has(task.id)) {
    return (
      <div style={{ paddingLeft: depth * 20 }} className="flex items-center gap-2 py-1">
        <span className="text-xs text-gray-400 font-mono">{task.id}</span>
        <span className="text-xs text-gray-400 italic">(circular reference)</span>
      </div>
    )
  }

  const nextVisited = new Set(visited).add(task.id)

  // Children = tasks that this task blocks (i.e., blocksTasks)
  const children = task.blocksTasks
    .map((t) => taskMap.get(t.id))
    .filter((t): t is EnrichedTask => t !== undefined)

  return (
    <div>
      <div
        style={{ paddingLeft: depth * 20 }}
        className="flex items-center gap-2 py-1.5 flex-wrap"
      >
        {depth > 0 && (
          <span className="text-gray-300 select-none">{'└'}</span>
        )}
        <span className="text-xs text-gray-400 font-mono">{task.id}</span>
        <span className="text-sm text-gray-700">{task.name}</span>
        <StatusBadge status={task.status} />
        <span className="text-xs text-gray-400">{task.assignee}</span>
      </div>
      {children.map((child) => (
        <TreeNode
          key={child.id}
          task={child}
          taskMap={taskMap}
          depth={depth + 1}
          visited={nextVisited}
        />
      ))}
    </div>
  )
}

export function DependencyChainReport({ tasks }: DependencyChainReportProps) {
  if (tasks.length === 0) {
    return <div className="text-sm text-gray-500 py-8 text-center">No tasks loaded.</div>
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]))

  // Root tasks: tasks that have no (known) blockers
  // i.e., blockedBy is empty OR all referenced blockers are not in our task list
  const rootTasks = tasks.filter((t) => {
    if (t.blockedBy.length === 0) return true
    // If all blockers are orphaned (not in list), treat as root
    return t.blockedBy.every((id) => !taskMap.has(id))
  })

  // If every task has blockers that exist, find tasks with no known blockers
  // (handles edge case where all tasks are in chains)

  if (rootTasks.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-8 text-center">
        No root tasks found — possible circular dependency in the entire task list.
      </div>
    )
  }

  // Only show chains that actually have children (i.e., chains with at least 2 nodes)
  // or show all roots even if they have no dependents
  const chains = rootTasks.filter(
    (t) => t.blocksTasks.length > 0 || t.blockedBy.length === 0
  )

  return (
    <div className="space-y-4">
      {chains.map((root) => (
        <div key={root.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <TreeNode
            task={root}
            taskMap={taskMap}
            depth={0}
            visited={new Set()}
          />
        </div>
      ))}

      {chains.length === 0 && (
        <div className="text-sm text-gray-500 py-8 text-center">
          No dependency chains found.
        </div>
      )}
    </div>
  )
}
