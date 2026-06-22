export type TaskStatus = 'Todo' | 'In Progress' | 'On Hold' | 'Done'

export interface Task {
  id: string
  name: string
  project: string
  description: string
  assignee: string
  storyPoints: number      // 0 when not set
  status: TaskStatus
  startDate: string        // YYYY-MM-DD (planned)
  endDate: string          // YYYY-MM-DD (planned)
  actualStartDate: string  // YYYY-MM-DD — set when first moved to In Progress
  actualEndDate: string    // YYYY-MM-DD — set when moved to Done
  onHoldDate: string       // YYYY-MM-DD — set when moved to On Hold
  onHoldReason: string     // free text captured at the time of the On Hold move
  blockedBy: string[]      // Task IDs
  dependsOn: string[]      // Task IDs
  notes: string
}

export interface EnrichedTask extends Task {
  blockedByTasks: Task[]    // full Task objects for tasks that block this one
  blocksTasks: Task[]       // full Task objects that this task blocks
  dependsOnTasks: Task[]    // full Task objects this task depends on
  dependedOnByTasks: Task[] // full Task objects that depend on this task
}
