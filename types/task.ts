export type TaskStatus = 'Todo' | 'In Progress' | 'Done'

export interface Task {
  id: string
  name: string
  assignee: string
  status: TaskStatus
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  blockedBy: string[] // Task IDs
}

export interface EnrichedTask extends Task {
  blockedByTasks: Task[]  // full Task objects for tasks that block this one
  blocksTasks: Task[]     // full Task objects that this task blocks
}
