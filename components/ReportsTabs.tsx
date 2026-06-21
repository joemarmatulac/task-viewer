'use client'

import { useState } from 'react'
import type { EnrichedTask } from '@/types/task'
import { KanbanBoard } from './KanbanBoard'
import { ReportsView } from './reports/ReportsView'

interface ReportsTabsProps {
  tasks: EnrichedTask[]
}

type TopTab = 'kanban' | 'reports'

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'reports', label: 'Reports' },
]

export function ReportsTabs({ tasks }: ReportsTabsProps) {
  const [activeTab, setActiveTab] = useState<TopTab>('kanban')

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

      {activeTab === 'kanban' && <KanbanBoard tasks={tasks} />}
      {activeTab === 'reports' && <ReportsView tasks={tasks} />}
    </div>
  )
}
