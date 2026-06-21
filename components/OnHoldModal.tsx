'use client'

import { useState } from 'react'

interface OnHoldModalProps {
  taskId: string
  taskName: string
  onConfirm: (taskId: string, reason: string) => void
  onCancel: () => void
}

export function OnHoldModal({ taskId, taskName, onConfirm, onCancel }: OnHoldModalProps) {
  const [reason, setReason] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    onConfirm(taskId, reason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Move to On Hold</h2>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{taskId}</span> — {taskName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Reason for hold <span className="text-red-500">*</span>
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Waiting for design approval, dependency on external team…"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Confirm On Hold
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
