import type { Task, EnrichedTask } from '@/types/task'

export function resolveBlockers(tasks: Task[]): EnrichedTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))

  return tasks.map((task) => {
    const blockedByTasks = task.blockedBy
      .map((id) => byId.get(id))
      .filter((t): t is Task => t !== undefined)

    const blocksTasks = tasks.filter((other) =>
      other.blockedBy.includes(task.id)
    )

    const dependsOnTasks = task.dependsOn
      .map((id) => byId.get(id))
      .filter((t): t is Task => t !== undefined)

    const dependedOnByTasks = tasks.filter((other) =>
      other.dependsOn.includes(task.id)
    )

    return { ...task, blockedByTasks, blocksTasks, dependsOnTasks, dependedOnByTasks }
  })
}

export function groupByStatus(tasks: EnrichedTask[]) {
  return {
    'Todo':        tasks.filter((t) => t.status === 'Todo'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    'On Hold':     tasks.filter((t) => t.status === 'On Hold'),
    'Done':        tasks.filter((t) => t.status === 'Done'),
  }
}
