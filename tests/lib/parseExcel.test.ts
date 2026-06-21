import { describe, it, expect } from 'vitest'
import { parseRows } from '@/lib/parseExcel'

describe('parseRows', () => {
  const validRows = [
    {
      'Task ID': 'T1',
      'Task Name': 'Design mockups',
      'Assignee': 'Alice',
      'Status': 'Done',
      'Start Date': '2026-06-01',
      'End Date': '2026-06-05',
      'Blocked By': '',
    },
    {
      'Task ID': 'T2',
      'Task Name': 'Build frontend',
      'Assignee': 'Bob',
      'Status': 'In Progress',
      'Start Date': '2026-06-06',
      'End Date': '2026-06-15',
      'Blocked By': 'T1',
    },
    {
      'Task ID': 'T3',
      'Task Name': 'Write tests',
      'Assignee': 'Carol',
      'Status': 'Todo',
      'Start Date': '2026-06-10',
      'End Date': '2026-06-20',
      'Blocked By': 'T1,T2',
    },
  ]

  it('returns a Task for each valid row', () => {
    const tasks = parseRows(validRows)
    expect(tasks).toHaveLength(3)
  })

  it('maps column names to Task fields', () => {
    const [t1] = parseRows(validRows)
    expect(t1).toEqual({
      id: 'T1',
      name: 'Design mockups',
      assignee: 'Alice',
      status: 'Done',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      blockedBy: [],
    })
  })

  it('parses comma-separated Blocked By into an array', () => {
    const tasks = parseRows(validRows)
    expect(tasks[2].blockedBy).toEqual(['T1', 'T2'])
  })

  it('skips rows with missing Task ID or Task Name', () => {
    const rows = [
      { 'Task ID': '', 'Task Name': 'Orphan', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '', 'End Date': '', 'Blocked By': '' },
      { 'Task ID': 'T4', 'Task Name': '', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '', 'End Date': '', 'Blocked By': '' },
    ]
    expect(parseRows(rows)).toHaveLength(0)
  })

  it('normalises unknown status to Todo', () => {
    const rows = [{ 'Task ID': 'T5', 'Task Name': 'X', 'Assignee': 'X', 'Status': 'Backlog', 'Start Date': '', 'End Date': '', 'Blocked By': '' }]
    const [task] = parseRows(rows)
    expect(task.status).toBe('Todo')
  })
})
