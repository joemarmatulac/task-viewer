'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { ReportsTabs } from '@/components/ReportsTabs'
import { parseExcelFile } from '@/lib/parseExcel'
import { exportTasksToExcel } from '@/lib/exportExcel'
import { resolveBlockers } from '@/lib/taskUtils'
import type { EnrichedTask, TaskStatus } from '@/types/task'

export default function Page() {
  const [tasks, setTasks] = useState<EnrichedTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dlMinor, setDlMinor] = useState(0)

  function handleStatusChange(id: string, status: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  function handleDownload() {
    if (!fileName) return
    const version = `1.${dlMinor}`
    exportTasksToExcel(tasks, fileName, version)
    setDlMinor(v => v + 1)
  }

  async function handleFile(file: File) {
    setIsLoading(true)
    setError(null)
    try {
      const parsed = await parseExcelFile(file)
      setTasks(resolveBlockers(parsed))
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
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
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
              onClick={() => { setTasks([]); setFileName(null) }}
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

      {tasks.length === 0 ? (
        <FileUpload onFile={handleFile} isLoading={isLoading} />
      ) : (
        <ReportsTabs tasks={tasks} onStatusChange={handleStatusChange} />
      )}
    </main>
  )
}
