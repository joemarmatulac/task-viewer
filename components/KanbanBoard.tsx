'use client'

import { useState } from 'react'
import type { EnrichedTask, TaskStatus } from '@/types/task'
import { groupByStatus } from '@/lib/taskUtils'
import { KanbanColumn } from './KanbanColumn'
import { OnHoldModal } from './OnHoldModal'

interface KanbanBoardProps {
  tasks: EnrichedTask[]
  onStatusChange: (id: string, status: TaskStatus, meta?: { onHoldReason?: string }) => void
  onEditTask: (id: string) => void
}

const COLUMNS: { status: TaskStatus; label: string; accent: string; allowedSources?: TaskStatus[]; rejectionMessage?: string }[] = [
  { status: 'Todo',                 label: 'Todo',                 accent: 'border-gray-300' },
  { status: 'In Progress',          label: 'In Progress',          accent: 'border-blue-400' },
  { status: 'Validation & Testing', label: 'Validation & Testing', accent: 'border-purple-400', allowedSources: ['In Progress'], rejectionMessage: 'Only In Progress cards can move to Validation & Testing' },
  { status: 'On Hold',              label: 'On Hold',              accent: 'border-amber-400', allowedSources: ['In Progress', 'Validation & Testing'], rejectionMessage: 'Only In Progress or Validation & Testing cards can be put On Hold' },
  { status: 'Done',                 label: 'Done',                 accent: 'border-green-400' },
]

export function KanbanBoard({ tasks, onStatusChange, onEditTask }: KanbanBoardProps) {
  const grouped = groupByStatus(tasks)
  const [pendingOnHold, setPendingOnHold] = useState<{ id: string; name: string } | null>(null)

  function handleColumnDrop(taskId: string, targetStatus: TaskStatus, sourceStatus: TaskStatus) {
    if (targetStatus === 'On Hold') {
      const task = tasks.find(t => t.id === taskId)
      if (task) setPendingOnHold({ id: task.id, name: task.name })
      return
    }
    onStatusChange(taskId, targetStatus)
  }

  function handleOnHoldConfirm(taskId: string, reason: string) {
    setPendingOnHold(null)
    onStatusChange(taskId, 'On Hold', { onHoldReason: reason })
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ status, label, accent, allowedSources, rejectionMessage }) => (
          <KanbanColumn
            key={status}
            status={status}
            title={label}
            tasks={grouped[status]}
            accentClass={accent}
            allowedSources={allowedSources}
            rejectionMessage={rejectionMessage}
            onStatusChange={handleColumnDrop}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      {pendingOnHold && (
        <OnHoldModal
          taskId={pendingOnHold.id}
          taskName={pendingOnHold.name}
          onConfirm={handleOnHoldConfirm}
          onCancel={() => setPendingOnHold(null)}
        />
      )}
    </>
  )
}
