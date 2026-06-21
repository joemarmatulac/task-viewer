export type TaskStatus = 'Todo' | 'In Progress' | 'Done'

export interface Task {
  id: string
  name: string
  description: string
  assignee: string
  status: TaskStatus
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  blockedBy: string[] // Task IDs
  dependsOn: string[] // Task IDs
  notes: string
}

export interface EnrichedTask extends Task {
  blockedByTasks: Task[]    // full Task objects for tasks that block this one
  blocksTasks: Task[]       // full Task objects that this task blocks
  dependsOnTasks: Task[]    // full Task objects this task depends on
  dependedOnByTasks: Task[] // full Task objects that depend on this task
}
