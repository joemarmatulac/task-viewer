import * as XLSX from 'xlsx'
import type { EnrichedTask } from '@/types/task'

export function exportTasksToExcel(tasks: EnrichedTask[], originalName: string, version: string) {
  const rows = tasks.map(t => ({
    'Task ID':          t.id,
    'Task Name':        t.name,
    'Project':          t.project,
    'Task Description': t.description,
    'Assignee':         t.assignee,
    'Story Points':     t.storyPoints || '',
    'Status':           t.status,
    'Target Start Date': t.startDate,
    'Target End Date':   t.endDate,
    'Actual Start Date': t.actualStartDate,
    'Actual End Date':   t.actualEndDate,
    'On Hold Date':      t.onHoldDate,
    'On Hold End Date':  t.onHoldEndDate,
    'On Hold Reason':    t.onHoldReason,
    'Blocked By':       t.blockedBy.join(','),
    'Dependency':       t.dependsOn.join(','),
    'Notes':            t.notes,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks')

  const base = originalName.replace(/\.[^.]+$/, '')
  const ext  = originalName.match(/\.[^.]+$/)?.[0] ?? '.xlsx'
  const fileName = `${base}_v${version}${ext}`

  XLSX.writeFile(wb, fileName)
}
