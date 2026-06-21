'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ReportsTabs } from '@/components/ReportsTabs'
import { TaskEditModal } from '@/components/TaskEditModal'
import { parseExcelFile, getSheetNames } from '@/lib/parseExcel'
import { exportTasksToExcel } from '@/lib/exportExcel'
import { resolveBlockers } from '@/lib/taskUtils'
import type { EnrichedTask, TaskStatus } from '@/types/task'

const REQUIRED_COLUMNS = ['Task ID', 'Task Name', 'Task Description', 'Assignee', 'Status', 'Start Date', 'End Date', 'Actual Start Date', 'Actual End Date', 'On Hold Date', 'On Hold Reason', 'Blocked By', 'Notes']
const REQUIRED_FIELDS  = ['Task ID', 'Task Name', 'Status', 'Start Date', 'End Date']

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

  function handleStatusChange(id: string, status: TaskStatus, meta?: { onHoldReason?: string }) {
    const today = new Date().toISOString().split('T')[0]
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const updates: Partial<typeof t> = { status }
      if (status === 'In Progress' && !t.actualStartDate) updates.actualStartDate = today
      if (status === 'Done' && !t.actualEndDate) updates.actualEndDate = today
      if (status === 'On Hold') {
        updates.onHoldDate = today
        updates.onHoldReason = meta?.onHoldReason ?? ''
      }
      return { ...t, ...updates }
    }))
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
          <h1 className="text-2xl font-bold text-gray-900">{sheetName ?? 'Daily Standup Board'}</h1>
          {fileName && <p className="text-sm text-gray-400 mt-0.5">Loaded: {fileName}</p>}
        </div>

        {(showBoard || showPicker) && (
          <div className="flex items-center gap-4">
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Sheet:</label>
                <select
                  value={sheetName ?? ''}
                  onChange={e => handleSheetSelect(e.target.value)}
                  disabled={isLoading}
                  className="text-sm rounded-md border border-gray-300 bg-white px-2 py-1.5 text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
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
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Load different file
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-4 text-sm space-y-1">
          <p className="font-medium">
            {warnings.length} row{warnings.length > 1 ? 's' : ''} skipped — missing required fields:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-gray-400 text-center py-8">Loading…</div>
      )}

      {!isLoading && !showBoard && !showPicker && (
        <div className="space-y-8">
          <FileUpload onFile={handleFile} isLoading={isLoading} />

          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-800">How to use this app</h2>

            <ol className="space-y-4 text-sm text-gray-600 list-decimal list-inside">
              <li>
                <span className="font-medium text-gray-800">Prepare your Excel file (.xlsx)</span>
                <p className="mt-1 ml-5 text-gray-500">
                  The sheet you select must have the following column headers in row 1:
                </p>
                <div className="mt-2 ml-5 flex flex-wrap gap-1.5">
                  {REQUIRED_COLUMNS.map(col => (
                    <code
                      key={col}
                      className={`px-2 py-0.5 rounded text-xs font-mono ${
                        REQUIRED_FIELDS.includes(col)
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {col}{REQUIRED_FIELDS.includes(col) ? ' *' : ''}
                    </code>
                  ))}
                </div>
                <p className="mt-2 ml-5 text-xs text-gray-400">
                  * Required — rows missing these fields will be skipped with a warning.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800">Upload the file</span>
                <p className="mt-1 ml-5 text-gray-500">
                  Drag and drop your <code className="bg-gray-100 px-1 rounded text-xs">.xlsx</code> file onto
                  the upload area above, or click it to browse. If the file has multiple sheets, you will be
                  asked to choose which one to load.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800">Manage tasks on the Kanban board</span>
                <p className="mt-1 ml-5 text-gray-500">
                  Tasks are grouped into <strong>Todo</strong>, <strong>In Progress</strong>, <strong>On Hold</strong>, and <strong>Done</strong> columns.
                  Drag any card to a different column to update its status. Moving a card to <strong>In Progress</strong> automatically records today as the <strong>Actual Start Date</strong>; moving to <strong>Done</strong> records the <strong>Actual End Date</strong>. Only <strong>In Progress</strong> cards can be moved to <strong>On Hold</strong> — a reason prompt will appear. Use the filter bar to narrow by assignee, status, or date.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800">Set blockers</span>
                <p className="mt-1 ml-5 text-gray-500">
                  Hover over any card and click <strong>Edit blockers</strong> to choose which tasks block it.
                  Blocker relationships are shown as badges on each card and included in the downloaded Excel.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800">Download the updated file</span>
                <p className="mt-1 ml-5 text-gray-500">
                  Click <strong>Download updated Excel</strong> in the top-right to export the current board
                  state. The file is saved with a version suffix (e.g.{' '}
                  <code className="bg-gray-100 px-1 rounded text-xs">de-sprints_v1.0.xlsx</code>),
                  incrementing each download so previous versions are preserved.
                </p>
              </li>
            </ol>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400">
                <strong className="text-gray-500">Valid Status values:</strong>{' '}
                {['Todo', 'In Progress', 'On Hold', 'Done'].map(s => (
                  <code key={s} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mr-1">{s}</code>
                ))}
                — any other value defaults to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Todo</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && showPicker && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Choose a sheet to load</h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-mono text-gray-700">{fileName}</span> has {sheetNames.length} sheets.
              Select the one that contains your task data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {sheetNames.map(name => (
              <button
                key={name}
                onClick={() => handleSheetSelect(name)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
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
