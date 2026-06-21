'use client'

import { useState } from 'react'
import type { EnrichedTask } from '@/types/task'

interface Props {
  task: EnrichedTask
  allTasks: EnrichedTask[]
  onSave: (blockedBy: string[]) => void
  onClose: () => void
}

export function TaskEditModal({ task, allTasks, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(task.blockedBy))

  const others = allTasks.filter(t => t.id !== task.id)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="font-semibold text-gray-900">
            <span className="font-mono text-sm text-gray-400 mr-1">{task.id}</span>
            {task.name}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Tick tasks that must be <strong>completed first</strong> before this task can start.
          </p>
        </div>

        <div className="space-y-0.5 max-h-72 overflow-y-auto -mx-2">
          {others.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No other tasks to link</p>
          ) : (
            others.map(t => {
              const wouldCycle = t.blockedBy.includes(task.id)
              return (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${
                    wouldCycle ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                  title={wouldCycle ? `Cannot select — ${t.id} is already blocked by ${task.id}` : undefined}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => !wouldCycle && toggle(t.id)}
                    disabled={wouldCycle}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <span className="font-mono text-xs text-gray-400 w-8 shrink-0">{t.id}</span>
                  <span className="text-sm text-gray-700 flex-1 leading-snug">{t.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{t.assignee}</span>
                  {wouldCycle && (
                    <span className="text-xs text-amber-500 shrink-0">circular</span>
                  )}
                </label>
              )
            })
          )}
        </div>

        <p className="text-xs text-gray-400">
          {selected.size > 0
            ? <>This task is blocked by: <span className="font-mono text-gray-600">{Array.from(selected).join(', ')}</span></>
            : 'No blockers set — this task can start immediately.'
          }
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(Array.from(selected))}
            className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
