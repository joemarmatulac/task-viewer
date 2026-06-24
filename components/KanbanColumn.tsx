'use client'

import { useState, useRef } from 'react'
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
  onStatusChange: (id: string, status: TaskStatus, sourceStatus: TaskStatus, insertBeforeId?: string | null) => void
  onEditTask: (id: string) => void
}

function DropLine() {
  return <div className="h-0.5 rounded-full bg-blue-400 dark:bg-blue-500 mx-1 shrink-0" />
}

export function KanbanColumn({ title, status, tasks, accentClass, allowedSources, rejectionMessage, onStatusChange, onEditTask }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isRejected, setIsRejected] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function computeInsertIndex(clientY: number): number {
    const container = containerRef.current
    if (!container) return tasks.length
    const cards = container.querySelectorAll('[data-card]')
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return tasks.length
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
    setInsertIndex(computeInsertIndex(e.clientY))
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
      setInsertIndex(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const idx = computeInsertIndex(e.clientY)
    setIsDragOver(false)
    setInsertIndex(null)

    const taskId = e.dataTransfer.getData('taskId')
    const sourceStatus = e.dataTransfer.getData('sourceStatus') as TaskStatus
    if (!taskId) return

    if (allowedSources && !allowedSources.includes(sourceStatus)) {
      setIsRejected(true)
      setTimeout(() => setIsRejected(false), 600)
      return
    }

    const insertBeforeId = idx < tasks.length ? tasks[idx].id : null
    onStatusChange(taskId, status, sourceStatus, insertBeforeId)
  }

  const dropClass = isRejected
    ? 'bg-red-50 dark:bg-red-950/40 ring-2 ring-red-300 dark:ring-red-700 ring-inset'
    : isDragOver
      ? 'bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-300 dark:ring-blue-700 ring-inset'
      : ''

  const items: React.ReactNode[] = []
  tasks.forEach((task, i) => {
    if (isDragOver && insertIndex === i) items.push(<DropLine key={`line-${i}`} />)
    items.push(
      <div key={task.id} data-card>
        <TaskCard task={task} onEditTask={onEditTask} />
      </div>
    )
  })
  if (isDragOver && (insertIndex === tasks.length || insertIndex === null)) {
    items.push(<DropLine key="line-end" />)
  }

  return (
    <div className="flex flex-col gap-3 min-w-[280px] flex-1">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${accentClass}`}>
        <h2 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
        <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2">{tasks.length}</span>
      </div>
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col gap-2 min-h-[120px] flex-1 rounded-lg transition-colors ${dropClass}`}
      >
        {items}
        {tasks.length === 0 && (
          <p className={`text-xs text-center py-6 ${
            isRejected ? 'text-red-400' : isDragOver ? 'text-blue-400' : 'text-gray-400 dark:text-gray-600'
          }`}>
            {isRejected ? (rejectionMessage ?? 'Cannot drop here') : isDragOver ? 'Drop here' : 'No tasks'}
          </p>
        )}
        {/* Spacer — keeps the drop zone tall enough to receive drops below the last card */}
        <div className="flex-1 min-h-[48px]" />
      </div>
    </div>
  )
}
