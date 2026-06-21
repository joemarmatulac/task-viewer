'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ReportsTabs } from '@/components/ReportsTabs'
import { TaskEditModal } from '@/components/TaskEditModal'
import { parseExcelFile } from '@/lib/parseExcel'
import { exportTasksToExcel } from '@/lib/exportExcel'
import { resolveBlockers } from '@/lib/taskUtils'
import type { EnrichedTask, TaskStatus } from '@/types/task'

const REQUIRED_COLUMNS = ['Task ID', 'Task Name', 'Task Description', 'Assignee', 'Status', 'Start Date', 'End Date', 'Blocked By', 'Notes']
const REQUIRED_FIELDS  = ['Task ID', 'Task Name', 'Status', 'Start Date', 'End Date']

export default function Page() {
  const [tasks, setTasks] = useState<EnrichedTask[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dlMinor, setDlMinor] = useState(0)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) ?? null : null

  function handleStatusChange(id: string, status: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
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

  async function handleFile(file: File) {
    setIsLoading(true)
    setError(null)
    setWarnings([])
    try {
      const { tasks: parsed, warnings: warn } = await parseExcelFile(file)
      setTasks(resolveBlockers(parsed))
      setWarnings(warn)
      setFileName(file.name)
      setDlMinor(0)
    } catch (e) {
      setError('Failed to parse the Excel file. Check the column names match the expected format.')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Standup Board</h1>
          {fileName && <p className="text-sm text-gray-400 mt-0.5">Loaded: {fileName}</p>}
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
            >
              Download updated Excel
            </button>
            <button
              onClick={() => { setTasks([]); setFileName(null); setWarnings([]) }}
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

      {tasks.length === 0 ? (
        <div className="space-y-8">
          <FileUpload onFile={handleFile} isLoading={isLoading} />

          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-800">How to use this app</h2>

            <ol className="space-y-4 text-sm text-gray-600 list-decimal list-inside">
              <li>
                <span className="font-medium text-gray-800">Prepare your Excel file (.xlsx)</span>
                <p className="mt-1 ml-5 text-gray-500">
                  The first sheet must have the following column headers in row 1:
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
                  the upload area above, or click it to browse.
                </p>
              </li>

              <li>
                <span className="font-medium text-gray-800">Manage tasks on the Kanban board</span>
                <p className="mt-1 ml-5 text-gray-500">
                  Tasks are grouped into <strong>Todo</strong>, <strong>In Progress</strong>, and <strong>Done</strong> columns.
                  Drag any card to a different column to update its status. Use the filter bar to narrow by
                  assignee, start date, or end date.
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
                {['Todo', 'In Progress', 'Done'].map(s => (
                  <code key={s} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mr-1">{s}</code>
                ))}
                — any other value defaults to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Todo</code>.
              </p>
            </div>
          </div>
        </div>
      ) : (
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
