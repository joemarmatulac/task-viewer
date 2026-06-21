import * as XLSX from 'xlsx'
import type { EnrichedTask } from '@/types/task'

export function exportTasksToExcel(tasks: EnrichedTask[], originalName: string, version: string) {
  const rows = tasks.map(t => ({
    'Task ID':          t.id,
    'Task Name':        t.name,
    'Task Description': t.description,
    'Assignee':         t.assignee,
    'Status':           t.status,
    'Start Date':       t.startDate,
    'End Date':         t.endDate,
    'Blocked By':       t.blockedBy.join(','),
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
