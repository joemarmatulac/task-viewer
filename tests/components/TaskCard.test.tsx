import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockerBadge } from '@/components/BlockerBadge'

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
