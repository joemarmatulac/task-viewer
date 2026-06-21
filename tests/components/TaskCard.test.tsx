import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockerBadge } from '@/components/BlockerBadge'
import { TaskCard } from '@/components/TaskCard'
import type { EnrichedTask } from '@/types/task'

describe('BlockerBadge', () => {
  it('renders "Blocked by" label with task name for incoming blockers', () => {
    render(<BlockerBadge direction="blocked-by" taskName="Design mockups" taskId="T1" />)
    expect(screen.getByText(/Blocked by/i)).toBeInTheDocument()
    expect(screen.getByText(/Design mockups/i)).toBeInTheDocument()
  })

  it('renders "Blocks" label for outgoing blockers', () => {
    render(<BlockerBadge direction="blocks" taskName="Write tests" taskId="T3" />)
    expect(screen.getByText(/Blocks/i)).toBeInTheDocument()
    expect(screen.getByText(/Write tests/i)).toBeInTheDocument()
  })
})

const baseTask: EnrichedTask = {
  id: 'T2',
  name: 'Build frontend',
  assignee: 'Bob',
  status: 'In Progress',
  startDate: '2026-06-06',
  endDate: '2026-06-15',
  blockedBy: ['T1'],
  blockedByTasks: [{ id: 'T1', name: 'Design mockups', assignee: 'Alice', status: 'Done', startDate: '2026-06-01', endDate: '2026-06-05', blockedBy: [] }],
  blocksTasks: [{ id: 'T3', name: 'Write tests', assignee: 'Carol', status: 'Todo', startDate: '2026-06-10', endDate: '2026-06-20', blockedBy: ['T1', 'T2'] }],
}

describe('TaskCard', () => {
  it('renders task name and assignee', () => {
    render(<TaskCard task={baseTask} />)
    expect(screen.getByText('Build frontend')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders start and end dates', () => {
    render(<TaskCard task={baseTask} />)
    expect(screen.getByText(/2026-06-06/)).toBeInTheDocument()
    expect(screen.getByText(/2026-06-15/)).toBeInTheDocument()
  })

  it('renders a "Blocked by" badge for each upstream blocker', () => {
    render(<TaskCard task={baseTask} />)
    expect(screen.getByText('Design mockups', { selector: 'span' })).toBeInTheDocument()
  })

  it('renders a "Blocks" badge for each downstream task', () => {
    render(<TaskCard task={baseTask} />)
    expect(screen.getByText('Write tests', { selector: 'span' })).toBeInTheDocument()
  })

  it('renders nothing in the blocker section when no dependencies', () => {
    const noDeps: EnrichedTask = { ...baseTask, blockedByTasks: [], blocksTasks: [] }
    render(<TaskCard task={noDeps} />)
    expect(screen.queryByText(/Blocked by/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Blocks/i)).not.toBeInTheDocument()
  })
})
