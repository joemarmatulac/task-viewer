'use client'

import { useState } from 'react'
import type { EnrichedTask } from '@/types/task'
import { BlockedTasksReport } from './BlockedTasksReport'
import { WorkloadReport } from './WorkloadReport'
import { SprintReport } from './SprintReport'
import { DependencyChainReport } from './DependencyChainReport'

interface ReportsViewProps {
  tasks: EnrichedTask[]
}

type SubTab = 'blocked' | 'workload' | 'sprint' | 'dependency'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'blocked', label: 'Blocked' },
  { id: 'workload', label: 'Workload' },
  { id: 'sprint', label: 'Sprint' },
  { id: 'dependency', label: 'Dependency Chains' },
]

export function ReportsView({ tasks }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('blocked')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        {SUB_TABS.map(({ id, label }) => (
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

      <div>
        {activeTab === 'blocked' && <BlockedTasksReport tasks={tasks} />}
        {activeTab === 'workload' && <WorkloadReport tasks={tasks} />}
        {activeTab === 'sprint' && <SprintReport tasks={tasks} />}
        {activeTab === 'dependency' && <DependencyChainReport tasks={tasks} />}
      </div>
    </div>
  )
}
