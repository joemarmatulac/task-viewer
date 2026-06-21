'use client'

import { useState } from 'react'
import type { EnrichedTask, TaskStatus } from '@/types/task'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  title: string
  status: TaskStatus
  tasks: EnrichedTask[]
  accentClass: string
  onStatusChange: (id: string, status: TaskStatus) => void
}

export function KanbanColumn({ title, status, tasks, accentClass, onStatusChange }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onStatusChange(taskId, status)
  }

  return (
    <div className="flex flex-col gap-3 min-w-[280px] flex-1">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${accentClass}`}>
        <h2 className="font-semibold text-gray-700">{title}</h2>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 rounded-full px-2">{tasks.length}</span>
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col gap-2 min-h-[120px] rounded-lg transition-colors ${
          isDragOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : ''
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className={`text-xs text-center py-6 ${isDragOver ? 'text-blue-400' : 'text-gray-400'}`}>
            {isDragOver ? 'Drop here' : 'No tasks'}
          </p>
        )}
      </div>
    </div>
  )
}
