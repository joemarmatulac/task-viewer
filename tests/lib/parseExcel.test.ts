import { describe, it, expect } from 'vitest'
import { parseRows } from '@/lib/parseExcel'

describe('parseRows', () => {
  const validRows = [
    {
      'Task ID': 'T1',
      'Task Name': 'Design mockups',
      'Project': 'Alpha',
      'Assignee': 'Alice',
      'Status': 'Done',
      'Start Date': '2026-06-01',
      'End Date': '2026-06-05',
      'Blocked By': '',
    },
    {
      'Task ID': 'T2',
      'Task Name': 'Build frontend',
      'Project': 'Alpha',
      'Assignee': 'Bob',
      'Status': 'In Progress',
      'Start Date': '2026-06-06',
      'End Date': '2026-06-15',
      'Blocked By': 'T1',
    },
    {
      'Task ID': 'T3',
      'Task Name': 'Write tests',
      'Project': 'Beta',
      'Assignee': 'Carol',
      'Status': 'Todo',
      'Start Date': '2026-06-10',
      'End Date': '2026-06-20',
      'Blocked By': 'T1,T2',
    },
  ]

  it('returns a Task for each valid row', () => {
    const { tasks } = parseRows(validRows)
    expect(tasks).toHaveLength(3)
  })

  it('maps column names to Task fields', () => {
    const { tasks: [t1] } = parseRows(validRows)
    expect(t1).toEqual({
      id: 'T1',
      name: 'Design mockups',
      project: 'Alpha',
      description: '',
      assignee: 'Alice',
      status: 'Done',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      actualStartDate: '',
      actualEndDate: '',
      onHoldDate: '',
      onHoldReason: '',
      blockedBy: [],
      dependsOn: [],
      notes: '',
    })
  })

  it('parses comma-separated Blocked By into an array', () => {
    const { tasks } = parseRows(validRows)
    expect(tasks[2].blockedBy).toEqual(['T1', 'T2'])
  })

  it('skips rows with missing Task ID or Task Name and adds warnings', () => {
    const rows = [
      { 'Task ID': '', 'Task Name': 'Orphan', 'Project': 'Alpha', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '2026-06-01', 'End Date': '2026-06-05', 'Blocked By': '' },
      { 'Task ID': 'T4', 'Task Name': '', 'Project': 'Alpha', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '2026-06-01', 'End Date': '2026-06-05', 'Blocked By': '' },
    ]
    const { tasks, warnings } = parseRows(rows)
    expect(tasks).toHaveLength(0)
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toContain('Task ID')
    expect(warnings[1]).toContain('Task Name')
  })

  it('skips rows missing required fields and adds a warning', () => {
    const rows = [
      { 'Task ID': 'T5', 'Task Name': 'Missing dates', 'Project': 'Alpha', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '', 'End Date': '', 'Blocked By': '' },
      { 'Task ID': 'T6', 'Task Name': 'Missing status', 'Project': 'Alpha', 'Assignee': 'X', 'Status': '', 'Start Date': '2026-06-01', 'End Date': '2026-06-05', 'Blocked By': '' },
    ]
    const { tasks, warnings } = parseRows(rows)
    expect(tasks).toHaveLength(0)
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toContain('Start Date')
    expect(warnings[0]).toContain('End Date')
    expect(warnings[1]).toContain('Status')
  })

  it('skips rows missing Project and adds a warning', () => {
    const rows = [{ 'Task ID': 'T7', 'Task Name': 'No project', 'Project': '', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '2026-06-01', 'End Date': '2026-06-10', 'Blocked By': '' }]
    const { tasks, warnings } = parseRows(rows)
    expect(tasks).toHaveLength(0)
    expect(warnings[0]).toContain('Project')
  })

  it('normalises unknown status to Todo', () => {
    const rows = [{ 'Task ID': 'T5', 'Task Name': 'X', 'Project': 'Alpha', 'Assignee': 'X', 'Status': 'Backlog', 'Start Date': '2026-06-01', 'End Date': '2026-06-10', 'Blocked By': '' }]
    const { tasks: [task] } = parseRows(rows)
    expect(task.status).toBe('Todo')
  })
})
