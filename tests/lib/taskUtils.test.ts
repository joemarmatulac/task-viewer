import { describe, it, expect } from 'vitest'
import { resolveBlockers } from '@/lib/taskUtils'
import type { Task } from '@/types/task'

const tasks: Task[] = [
  { id: 'T1', name: 'Design', description: '', assignee: 'Alice', status: 'Done', startDate: '2026-06-01', endDate: '2026-06-05', blockedBy: [], dependsOn: [], notes: '' },
  { id: 'T2', name: 'Build', description: '', assignee: 'Bob', status: 'In Progress', startDate: '2026-06-06', endDate: '2026-06-15', blockedBy: ['T1'], dependsOn: [], notes: '' },
  { id: 'T3', name: 'Test', description: '', assignee: 'Carol', status: 'Todo', startDate: '2026-06-10', endDate: '2026-06-20', blockedBy: ['T1', 'T2'], dependsOn: [], notes: '' },
]

describe('resolveBlockers', () => {
  it('returns one EnrichedTask per input task', () => {
    expect(resolveBlockers(tasks)).toHaveLength(3)
  })

  it('populates blockedByTasks with full Task objects', () => {
    const enriched = resolveBlockers(tasks)
    const t3 = enriched.find((t) => t.id === 'T3')!
    expect(t3.blockedByTasks).toHaveLength(2)
    expect(t3.blockedByTasks.map((t) => t.id)).toEqual(['T1', 'T2'])
  })

  it('populates blocksTasks for tasks that others depend on', () => {
    const enriched = resolveBlockers(tasks)
    const t1 = enriched.find((t) => t.id === 'T1')!
    expect(t1.blocksTasks.map((t) => t.id)).toEqual(['T2', 'T3'])
  })

  it('T1 has empty blockedByTasks', () => {
    const enriched = resolveBlockers(tasks)
    const t1 = enriched.find((t) => t.id === 'T1')!
    expect(t1.blockedByTasks).toHaveLength(0)
  })

  it('silently ignores Blocked By IDs that do not exist', () => {
    const withOrphan: Task[] = [
      { ...tasks[0], blockedBy: ['GHOST'] },
    ]
    const enriched = resolveBlockers(withOrphan)
    expect(enriched[0].blockedByTasks).toHaveLength(0)
  })
})
