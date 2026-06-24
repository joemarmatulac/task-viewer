'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ReportsTabs } from '@/components/ReportsTabs'
import { TaskEditModal } from '@/components/TaskEditModal'
import { parseExcelFile, getSheetNames } from '@/lib/parseExcel'
import { exportTasksToExcel } from '@/lib/exportExcel'
import { resolveBlockers, applyStatusTransition } from '@/lib/taskUtils'
import type { EnrichedTask, TaskStatus } from '@/types/task'

const REQUIRED_COLUMNS = ['Task ID', 'Task Name', 'Project', 'Task Description', 'Assignee', 'Story Points', 'Status', 'Target Start Date', 'Target End Date', 'Actual Start Date', 'Actual End Date', 'On Hold Date', 'On Hold Reason', 'Blocked By', 'Dependency', 'Notes']
const REQUIRED_FIELDS  = ['Task ID', 'Task Name', 'Project', 'Status', 'Target Start Date', 'Target End Date']

export default function Page() {
  const [tasks, setTasks] = useState<EnrichedTask[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [sheetName, setSheetName] = useState<string | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dlMinor, setDlMinor] = useState(0)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) ?? null : null

  function handleStatusChange(id: string, status: TaskStatus, meta?: { onHoldReason?: string }, insertBeforeId?: string | null) {
    const today = new Date().toISOString().split('T')[0]
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t
        return { ...t, ...applyStatusTransition(t, status, today, meta) }
      })

      if (insertBeforeId === undefined) return updated

      // Reorder: splice the moved task into the correct position in the flat array
      const movedTask = updated.find(t => t.id === id)!
      const rest = updated.filter(t => t.id !== id)

      if (insertBeforeId === null) {
        // Append after the last task of the target status
        let lastPos = -1
        for (let i = 0; i < rest.length; i++) {
          if (rest[i].status === status) lastPos = i
        }
        if (lastPos === -1) return [...rest, movedTask]
        return [...rest.slice(0, lastPos + 1), movedTask, ...rest.slice(lastPos + 1)]
      }

      if (insertBeforeId === id) return updated // no-op: dropping before itself

      const pos = rest.findIndex(t => t.id === insertBeforeId)
      if (pos === -1) return [...rest, movedTask] // fallback
      return [...rest.slice(0, pos), movedTask, ...rest.slice(pos)]
    })
  }

  function handleBlockerSave(blockedBy: string[], dependsOn: string[]) {
    if (!editingTaskId) return
    setTasks(prev => resolveBlockers(prev.map(t =>
      t.id === editingTaskId ? { ...t, blockedBy, dependsOn } : t
    )))
    setEditingTaskId(null)
  }

  function handleDownload() {
    if (!fileName) return
    exportTasksToExcel(tasks, fileName, `1.${dlMinor}`)
    setDlMinor(v => v + 1)
  }

  function resetAll() {
    setTasks([])
    setFileName(null)
    setSheetName(null)
    setSheetNames([])
    setPendingFile(null)
    setWarnings([])
    setError(null)
  }

  async function handleSheetSelect(name: string) {
    if (!pendingFile) return
    setIsLoading(true)
    setError(null)
    setWarnings([])
    try {
      const { tasks: parsed, warnings: warn, sheetName: resolved } = await parseExcelFile(pendingFile, name)
      setTasks(resolveBlockers(parsed))
      setWarnings(warn)
      setSheetName(resolved ?? null)
      setDlMinor(0)
    } catch (e) {
      setError('Failed to parse the sheet. Check the column names match the expected format.')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFile(file: File) {
    setIsLoading(true)
    setError(null)
    setWarnings([])
    setTasks([])
    setSheetName(null)
    setSheetNames([])
    setPendingFile(null)
    setFileName(file.name)
    try {
      const names = await getSheetNames(file)
      setSheetNames(names)
      setPendingFile(file)
      setDlMinor(0)
      if (names.length === 1) {
        const { tasks: parsed, warnings: warn, sheetName: resolved } = await parseExcelFile(file, names[0])
        setTasks(resolveBlockers(parsed))
        setWarnings(warn)
        setSheetName(resolved ?? null)
      }
      // multiple sheets: stop here, show picker
    } catch (e) {
      setError('Failed to read the Excel file. Check it is a valid .xlsx file.')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const showPicker = pendingFile !== null && sheetNames.length > 1 && tasks.length === 0 && !isLoading
  const showBoard  = tasks.length > 0

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sheetName ?? 'Daily Standup Board'}</h1>
          {fileName && <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Loaded: {fileName}</p>}
        </div>

        {(showBoard || showPicker) && (
          <div className="flex items-center gap-4">
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sheet:</label>
                <select
                  value={sheetName ?? ''}
                  onChange={e => handleSheetSelect(e.target.value)}
                  disabled={isLoading}
                  className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                >
                  {!sheetName && <option value="">Select a sheet…</option>}
                  {sheetNames.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

            {showBoard && (
              <button
                onClick={handleDownload}
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
              >
                Download updated Excel
              </button>
            )}

            <button
              onClick={resetAll}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
            >
              Load different file
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 text-sm">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-4 text-sm space-y-1">
          <p className="font-medium">
            {warnings.length} row{warnings.length > 1 ? 's' : ''} skipped — missing required fields:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Loading…</div>
      )}

      {!isLoading && !showBoard && !showPicker && (
        <div className="space-y-8">
          <FileUpload onFile={handleFile} isLoading={isLoading} />

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">How to use this app</h2>
              <a
                href="/sample-tasks.xlsx"
                download="sample-tasks.xlsx"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 px-3 py-1.5 rounded-md transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
                  <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
                </svg>
                Download sample file
              </a>
            </div>

            <ol className="space-y-4 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
              <li>
                <span className="font-medium text-gray-800 dark:text-gray-200">Prepare your Excel file (.xlsx)</span>
                <p className="mt-1 ml-5 text-gray-500 dark:text-gray-400">
                  The sheet you select must have the following column headers in row 1:
                </p>
                <div className="mt-2 ml-5 flex flex-wrap gap-1.5">
                  {REQUIRED_COLUMNS.map(col => (
                    <code
                      key={col}
                      className={`px-2 py-0.5 rounded text-xs font-mono ${
                        REQUIRED_FIELDS.includes(col)
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {col}{REQUIRED_FIELDS.includes(col) ? ' *' : ''}
                    </code>
                  ))}
                </div>
                <p className="mt-2 ml-5 text-xs text-gray-400 dark:text-gray-500">
                  * Required — rows missing these fields will be skipped with a warning.
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Blocked By</code> and{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Dependency</code> accept
                  comma-separated Task IDs (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">T1,T3</code>).
                  Dates can be Excel date cells or text in <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">YYYY-MM-DD</code> format.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800 dark:text-gray-200">Upload the file</span>
                <p className="mt-1 ml-5 text-gray-500 dark:text-gray-400">
                  Drag and drop your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.xlsx</code> file onto
                  the upload area above, or click it to browse. If the file has multiple sheets, you will be
                  asked to choose which one to load. You can switch sheets at any time using the{' '}
                  <strong>Sheet</strong> dropdown in the top-right.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800 dark:text-gray-200">Manage tasks on the Kanban board</span>
                <p className="mt-1 ml-5 text-gray-500 dark:text-gray-400">
                  Tasks are grouped into <strong>Todo</strong>, <strong>In Progress</strong>, <strong>Validation &amp; Testing</strong>, <strong>On Hold</strong>, and <strong>Done</strong> columns.
                  Drag any card to a different column to update its status. Moving a card to <strong>In Progress</strong> automatically
                  records today as the <strong>Actual Start Date</strong>; moving to <strong>Done</strong> records the <strong>Actual End Date</strong>.
                  Only <strong>In Progress</strong> cards can be moved to <strong>Validation &amp; Testing</strong>.
                  Only <strong>In Progress</strong> or <strong>Validation &amp; Testing</strong> cards can be moved to <strong>On Hold</strong> — a reason prompt will appear.
                  Hover over any card and click <strong>Edit</strong> to update blockers and dependency relationships.
                  Use the filter bar to narrow by assignee, status, or target date range.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800 dark:text-gray-200">Explore Reports</span>
                <p className="mt-1 ml-5 text-gray-500 dark:text-gray-400">
                  Switch to the <strong>Reports</strong> tab to access six built-in views:
                </p>
                <ul className="mt-1.5 ml-5 space-y-0.5 list-disc list-inside text-gray-500 dark:text-gray-400">
                  <li><strong>Charts</strong> — burndown, velocity, story-point KPIs, and SP by assignee</li>
                  <li><strong>Blocked</strong> — tasks currently blocked by unfinished dependencies</li>
                  <li><strong>Workload</strong> — task and story-point load grouped by assignee</li>
                  <li><strong>Sprint</strong> — tasks organised by due-date buckets (overdue, this week, upcoming, completed)</li>
                  <li><strong>Dependency Chains</strong> — visualises task dependency trees</li>
                  <li><strong>On Hold Log</strong> — history of tasks put on hold with reasons and dates</li>
                </ul>
                <p className="mt-1.5 ml-5 text-gray-500 dark:text-gray-400">
                  All reports respect the active filter bar selections.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800 dark:text-gray-200">Download the updated file</span>
                <p className="mt-1 ml-5 text-gray-500 dark:text-gray-400">
                  Click <strong>Download updated Excel</strong> in the top-right to export the current board
                  state. The file is saved with a version suffix (e.g.{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">my-sprints_v1.0.xlsx</code>),
                  incrementing on each download so previous versions are preserved. Load a new file to reset to{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">v1.0</code>.
                </p>
              </li>
            </ol>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                <strong className="text-gray-500 dark:text-gray-400">Valid Status values:</strong>{' '}
                {['Todo', 'In Progress', 'Validation & Testing', 'On Hold', 'Done'].map(s => (
                  <code key={s} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs mr-1">{s}</code>
                ))}
                — any other value defaults to <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">Todo</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && showPicker && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Choose a sheet to load</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-mono text-gray-700 dark:text-gray-300">{fileName}</span> has {sheetNames.length} sheets.
              Select the one that contains your task data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {sheetNames.map(name => (
              <button
                key={name}
                onClick={() => handleSheetSelect(name)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors shadow-sm"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLoading && showBoard && (
        <ReportsTabs
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEditTask={setEditingTaskId}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          allTasks={tasks}
          onSave={handleBlockerSave}
          onClose={() => setEditingTaskId(null)}
        />
      )}
    </main>
  )
}
