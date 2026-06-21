'use client'

import { useState } from 'react'
import type { EnrichedTask } from '@/types/task'

interface Props {
  task: EnrichedTask
  allTasks: EnrichedTask[]
  onSave: (blockedBy: string[], dependsOn: string[]) => void
  onClose: () => void
}

type ModalTab = 'blockers' | 'dependencies'

function TaskCheckList({
  others,
  selected,
  onToggle,
  circularIds,
  emptyText,
}: {
  others: EnrichedTask[]
  selected: Set<string>
  onToggle: (id: string) => void
  circularIds: Set<string>
  emptyText: string
}) {
  return (
    <div className="space-y-0.5 max-h-60 overflow-y-auto -mx-2">
      {others.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">{emptyText}</p>
      ) : (
        others.map(t => {
          const wouldCycle = circularIds.has(t.id)
          return (
            <label
              key={t.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${
                wouldCycle ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title={wouldCycle ? `Cannot select — would create a circular reference` : undefined}
            >
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => !wouldCycle && onToggle(t.id)}
                disabled={wouldCycle}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <span className="font-mono text-xs text-gray-400 dark:text-gray-500 w-8 shrink-0">{t.id}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-snug">{t.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{t.assignee}</span>
              {wouldCycle && (
                <span className="text-xs text-amber-500 shrink-0">circular</span>
              )}
            </label>
          )
        })
      )}
    </div>
  )
}

export function TaskEditModal({ task, allTasks, onSave, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>('blockers')
  const [selectedBlockers, setSelectedBlockers] = useState<Set<string>>(new Set(task.blockedBy))
  const [selectedDeps, setSelectedDeps] = useState<Set<string>>(new Set(task.dependsOn))

  const others = allTasks.filter(t => t.id !== task.id)

  function toggleBlocker(id: string) {
    setSelectedBlockers(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleDep(id: string) {
    setSelectedDeps(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const blockerCircular = new Set(others.filter(t => t.blockedBy.includes(task.id)).map(t => t.id))
  const depCircular = new Set(others.filter(t => t.dependsOn.includes(task.id)).map(t => t.id))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl dark:shadow-gray-950 border border-transparent dark:border-gray-700 w-full max-w-md p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            <span className="font-mono text-sm text-gray-400 dark:text-gray-500 mr-1">{task.id}</span>
            {task.name}
          </h2>
        </div>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {([
            { id: 'blockers' as ModalTab, label: 'Blockers' },
            { id: 'dependencies' as ModalTab, label: 'Dependencies' },
          ]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'blockers' && (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Tick tasks that must be <strong>completed first</strong> before this task can start.
            </p>
            <TaskCheckList
              others={others}
              selected={selectedBlockers}
              onToggle={toggleBlocker}
              circularIds={blockerCircular}
              emptyText="No other tasks to link"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {selectedBlockers.size > 0
                ? <>Blocked by: <span className="font-mono text-gray-600 dark:text-gray-400">{Array.from(selectedBlockers).join(', ')}</span></>
                : 'No blockers set — this task can start immediately.'
              }
            </p>
          </>
        )}

        {activeTab === 'dependencies' && (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Tick tasks that this task <strong>logically depends on</strong> (softer than a blocker).
            </p>
            <TaskCheckList
              others={others}
              selected={selectedDeps}
              onToggle={toggleDep}
              circularIds={depCircular}
              emptyText="No other tasks to link"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {selectedDeps.size > 0
                ? <>Depends on: <span className="font-mono text-gray-600 dark:text-gray-400">{Array.from(selectedDeps).join(', ')}</span></>
                : 'No dependencies set.'
              }
            </p>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(Array.from(selectedBlockers), Array.from(selectedDeps))}
            className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
