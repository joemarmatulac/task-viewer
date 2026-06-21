import * as XLSX from 'xlsx'
import type { Task, TaskStatus } from '@/types/task'

type RawRow = Record<string, string | number | undefined>

const VALID_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'On Hold', 'Done']

export interface ParseResult {
  tasks: Task[]
  warnings: string[]
  sheetName?: string
}

function toStr(val: string | number | undefined): string {
  if (val === undefined || val === null) return ''
  return String(val).trim()
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function parseDate(val: string | number | undefined): string {
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    const y = date.y
    const m = String(date.m).padStart(2, '0')
    const d = String(date.d).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = toStr(val)
  if (!s) return ''
  if (ISO_DATE.test(s)) return s
  // Attempt to parse human-readable strings like "Jun 24, 2026" or "2026/06/24"
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const dy = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${dy}`
  }
  return s
}

export function parseRows(rows: RawRow[]): ParseResult {
  const tasks: Task[] = []
  const warnings: string[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // 1-based + header row
    const id = toStr(row['Task ID'])
    const name = toStr(row['Task Name'])

    const missing: string[] = []
    if (!id) missing.push('Task ID')
    if (!name) missing.push('Task Name')

    const rawStatus = toStr(row['Status']) as TaskStatus
    if (!rawStatus) missing.push('Status')

    const startDateRaw = row['Start Date']
    const startDate = parseDate(startDateRaw)
    if (!startDate) missing.push('Start Date')

    const endDateRaw = row['End Date']
    const endDate = parseDate(endDateRaw)
    if (!endDate) missing.push('End Date')

    if (missing.length > 0) {
      const label = id ? `${id} – "${name}"` : `"${name || '?'}"`
      warnings.push(`Row ${rowNum} (${label}): missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`)
      return
    }

    const status: TaskStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'Todo'

    const blockedByRaw = toStr(row['Blocked By'])
    const blockedBy = blockedByRaw
      ? blockedByRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const dependsOnRaw = toStr(row['Dependency'])
    const dependsOn = dependsOnRaw
      ? dependsOnRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    tasks.push({
      id,
      name,
      description: toStr(row['Task Description']),
      assignee: toStr(row['Assignee']),
      status,
      startDate,
      endDate,
      actualStartDate: parseDate(row['Actual Start Date']),
      actualEndDate:   parseDate(row['Actual End Date']),
      onHoldDate:      parseDate(row['On Hold Date']),
      onHoldReason:    toStr(row['On Hold Reason']),
      blockedBy,
      dependsOn,
      notes: toStr(row['Notes']),
    })
  })

  return { tasks, warnings }
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' })
  const result = parseRows(rows)
  return { ...result, sheetName }
}
