'use client'

import { useState } from 'react'
import type { EnrichedTask, TaskStatus } from '@/types/task'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  title: string
  status: TaskStatus
  tasks: EnrichedTask[]
  accentClass: string
  /** If provided, only cards whose current status is in this list can be dropped here. */
  allowedSources?: TaskStatus[]
  rejectionMessage?: string
  onStatusChange: (id: string, status: TaskStatus, sourceStatus: TaskStatus) => void
  onEditTask: (id: string) => void
}

export function KanbanColumn({ title, status, tasks, accentClass, allowedSources, rejectionMessage, onStatusChange, onEditTask }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isRejected, setIsRejected] = useState(false)

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
    const sourceStatus = e.dataTransfer.getData('sourceStatus') as TaskStatus
    if (!taskId) return

    if (allowedSources && !allowedSources.includes(sourceStatus)) {
      setIsRejected(true)
      setTimeout(() => setIsRejected(false), 600)
      return
    }

    onStatusChange(taskId, status, sourceStatus)
  }

  const dropClass = isRejected
    ? 'bg-red-50 dark:bg-red-950/40 ring-2 ring-red-300 dark:ring-red-700 ring-inset'
    : isDragOver
      ? 'bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-300 dark:ring-blue-700 ring-inset'
      : ''

  return (
    <div className="flex flex-col gap-3 min-w-[280px] flex-1">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${accentClass}`}>
        <h2 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
        <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2">{tasks.length}</span>
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col gap-2 min-h-[120px] rounded-lg transition-colors ${dropClass}`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
        ))}
        {tasks.length === 0 && (
          <p className={`text-xs text-center py-6 ${
            isRejected ? 'text-red-400' : isDragOver ? 'text-blue-400' : 'text-gray-400 dark:text-gray-600'
          }`}>
            {isRejected ? (rejectionMessage ?? 'Cannot drop here') : isDragOver ? 'Drop here' : 'No tasks'}
          </p>
        )}
      </div>
    </div>
  )
}
