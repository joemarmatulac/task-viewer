import * as XLSX from 'xlsx'

const rows = [
  { 'Task ID': 'T1', 'Task Name': 'Define requirements', 'Assignee': 'Alice', 'Status': 'Done',        'Start Date': '2026-06-01', 'End Date': '2026-06-03', 'Blocked By': '' },
  { 'Task ID': 'T2', 'Task Name': 'Design mockups',       'Assignee': 'Bob',   'Status': 'Done',        'Start Date': '2026-06-04', 'End Date': '2026-06-07', 'Blocked By': 'T1' },
  { 'Task ID': 'T3', 'Task Name': 'Build frontend',       'Assignee': 'Carol', 'Status': 'In Progress', 'Start Date': '2026-06-08', 'End Date': '2026-06-18', 'Blocked By': 'T2' },
  { 'Task ID': 'T4', 'Task Name': 'Build backend API',    'Assignee': 'Dave',  'Status': 'In Progress', 'Start Date': '2026-06-08', 'End Date': '2026-06-20', 'Blocked By': 'T1' },
  { 'Task ID': 'T5', 'Task Name': 'Write unit tests',     'Assignee': 'Eve',   'Status': 'Todo',        'Start Date': '2026-06-15', 'End Date': '2026-06-22', 'Blocked By': 'T3,T4' },
  { 'Task ID': 'T6', 'Task Name': 'Deploy to staging',    'Assignee': 'Alice', 'Status': 'Todo',        'Start Date': '2026-06-23', 'End Date': '2026-06-24', 'Blocked By': 'T5' },
]

const ws = XLSX.utils.json_to_sheet(rows)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
XLSX.writeFile(wb, 'public/sample-tasks.xlsx')
console.log('Generated public/sample-tasks.xlsx')
