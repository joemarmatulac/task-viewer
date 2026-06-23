import type { Task, EnrichedTask, TaskStatus } from '@/types/task'

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

function subtractOneDay(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

/**
 * Returns the field updates to apply when a task moves to `targetStatus`.
 * Keeping this pure makes it easy to test without React.
 *
 * Rules:
 * - → In Progress:          set actualStartDate if not already set;
 *                           if resuming from On Hold, set onHoldEndDate = yesterday (today − 1)
 * - → Validation & Testing: same on-hold-resume logic as In Progress
 * - → Done:                 set actualEndDate if not already set
 * - → On Hold:              set onHoldDate = today, onHoldReason from meta, clear onHoldEndDate
 *
 * onHoldDate and onHoldReason are preserved after leaving On Hold so the card can display
 * "Was on Hold from X to Y" as a historical note.
 */
export function applyStatusTransition(
  task: Pick<Task, 'actualStartDate' | 'actualEndDate' | 'onHoldDate' | 'onHoldEndDate' | 'onHoldReason'>,
  targetStatus: TaskStatus,
  today: string,
  meta?: { onHoldReason?: string },
): Partial<Task> {
  const updates: Partial<Task> = { status: targetStatus }

  if (targetStatus === 'In Progress') {
    if (!task.actualStartDate) updates.actualStartDate = today
    if (task.onHoldDate && !task.onHoldEndDate) {
      updates.onHoldEndDate = subtractOneDay(today)
    }
  }

  if (targetStatus === 'Validation & Testing') {
    if (task.onHoldDate && !task.onHoldEndDate) {
      updates.onHoldEndDate = subtractOneDay(today)
    }
  }

  if (targetStatus === 'Done') {
    if (!task.actualEndDate) updates.actualEndDate = today
  }

  if (targetStatus === 'On Hold') {
    updates.onHoldDate = today
    updates.onHoldReason = meta?.onHoldReason ?? ''
    updates.onHoldEndDate = ''
  }

  return updates
}

export function groupByStatus(tasks: EnrichedTask[]) {
  return {
    'Todo':                 tasks.filter((t) => t.status === 'Todo'),
    'In Progress':          tasks.filter((t) => t.status === 'In Progress'),
    'Validation & Testing': tasks.filter((t) => t.status === 'Validation & Testing'),
    'On Hold':              tasks.filter((t) => t.status === 'On Hold'),
    'Done':                 tasks.filter((t) => t.status === 'Done'),
  }
}
