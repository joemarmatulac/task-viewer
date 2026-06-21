'use client'

import { useMemo, useState } from 'react'
import type { EnrichedTask, TaskStatus } from '@/types/task'
import { KanbanBoard } from './KanbanBoard'
import { ReportsView } from './reports/ReportsView'

interface ReportsTabsProps {
  tasks: EnrichedTask[]
  onStatusChange: (id: string, status: TaskStatus) => void
}

type TopTab = 'kanban' | 'reports'

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'reports', label: 'Reports' },
]

export function ReportsTabs({ tasks, onStatusChange }: ReportsTabsProps) {
  const [activeTab, setActiveTab] = useState<TopTab>('kanban')
  const [assigneeFilter, setAssigneeFilter] = useState('All')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  const assignees = useMemo(() => {
    const unique = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean))).sort()
    return ['All', ...unique]
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (assigneeFilter !== 'All' && t.assignee !== assigneeFilter) return false
      if (startDateFilter && t.startDate && t.startDate < startDateFilter) return false
      if (endDateFilter && t.endDate && t.endDate > endDateFilter) return false
      return true
    })
  }, [tasks, assigneeFilter, startDateFilter, endDateFilter])

  const hasFilters = assigneeFilter !== 'All' || startDateFilter !== '' || endDateFilter !== ''

  function clearFilters() {
    setAssigneeFilter('All')
    setStartDateFilter('')
    setEndDateFilter('')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        {TOP_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Assignee</label>
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="text-sm rounded-md border border-gray-300 bg-white px-2 py-1.5 text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {assignees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Start Date from</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={e => setStartDateFilter(e.target.value)}
            className="text-sm rounded-md border border-gray-300 bg-white px-2 py-1.5 text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">End Date until</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={e => setEndDateFilter(e.target.value)}
            className="text-sm rounded-md border border-gray-300 bg-white px-2 py-1.5 text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="flex items-end gap-2 ml-auto">
          <span className="text-xs text-gray-400 self-center">
            {filtered.length} of {tasks.length} tasks
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 underline self-center"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {activeTab === 'kanban' && <KanbanBoard tasks={filtered} onStatusChange={onStatusChange} />}
      {activeTab === 'reports' && <ReportsView tasks={filtered} />}
    </div>
  )
}
