'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { EnrichedTask } from '@/types/task'

const ChartsView = dynamic(
  () => import('./ChartsView').then(m => ({ default: m.ChartsView })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">Loading charts…</p>
    ),
  }
)
import { BlockedTasksReport } from './BlockedTasksReport'
import { WorkloadReport } from './WorkloadReport'
import { SprintReport } from './SprintReport'
import { DependencyChainReport } from './DependencyChainReport'
import { OnHoldReport } from './OnHoldReport'

interface ReportsViewProps {
  tasks: EnrichedTask[]
}

type SubTab = 'charts' | 'blocked' | 'workload' | 'sprint' | 'dependency' | 'onhold'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'charts',     label: '📊 Charts' },
  { id: 'blocked',    label: 'Blocked' },
  { id: 'workload',   label: 'Workload' },
  { id: 'sprint',     label: 'Sprint' },
  { id: 'dependency', label: 'Dependency Chains' },
  { id: 'onhold',     label: 'On Hold Log' },
]

export function ReportsView({ tasks }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('charts')

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {SUB_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'charts'     && <ChartsView tasks={tasks} />}
        {activeTab === 'blocked'    && <BlockedTasksReport tasks={tasks} />}
        {activeTab === 'workload'   && <WorkloadReport tasks={tasks} />}
        {activeTab === 'sprint'     && <SprintReport tasks={tasks} />}
        {activeTab === 'dependency' && <DependencyChainReport tasks={tasks} />}
        {activeTab === 'onhold'     && <OnHoldReport tasks={tasks} />}
      </div>
    </div>
  )
}
