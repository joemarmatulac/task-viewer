import * as XLSX from 'xlsx'
import type { Task, TaskStatus } from '@/types/task'

type RawRow = Record<string, string | number | undefined>

const VALID_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'Done']

function toStr(val: string | number | undefined): string {
  if (val === undefined || val === null) return ''
  return String(val).trim()
}

function parseDate(val: string | number | undefined): string {
  if (typeof val === 'number') {
    // Excel serial date → JS Date
    const date = XLSX.SSF.parse_date_code(val)
    const y = date.y
    const m = String(date.m).padStart(2, '0')
    const d = String(date.d).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return toStr(val)
}

export function parseRows(rows: RawRow[]): Task[] {
  return rows.flatMap((row) => {
    const id = toStr(row['Task ID'])
    const name = toStr(row['Task Name'])
    if (!id || !name) return []

    const rawStatus = toStr(row['Status']) as TaskStatus
    const status: TaskStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'Todo'

    const blockedByRaw = toStr(row['Blocked By'])
    const blockedBy = blockedByRaw
      ? blockedByRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    return [{
      id,
      name,
      assignee: toStr(row['Assignee']),
      status,
      startDate: parseDate(row['Start Date']),
      endDate: parseDate(row['End Date']),
      blockedBy,
    }]
  })
}

export async function parseExcelFile(file: File): Promise<Task[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' })
  return parseRows(rows)
}
