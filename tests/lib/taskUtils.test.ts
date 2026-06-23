import { describe, it, expect } from 'vitest'
import { resolveBlockers, applyStatusTransition } from '@/lib/taskUtils'
import type { Task } from '@/types/task'

const BASE: Pick<Task, 'actualStartDate' | 'actualEndDate' | 'onHoldDate' | 'onHoldEndDate' | 'onHoldReason'> = {
  actualStartDate: '', actualEndDate: '', onHoldDate: '', onHoldEndDate: '', onHoldReason: '',
}

const tasks: Task[] = [
  { ...BASE, id: 'T1', name: 'Design', project: 'Alpha', description: '', assignee: 'Alice', storyPoints: 0, status: 'Done', startDate: '2026-06-01', endDate: '2026-06-05', blockedBy: [], dependsOn: [], notes: '' },
  { ...BASE, id: 'T2', name: 'Build', project: 'Alpha', description: '', assignee: 'Bob', storyPoints: 0, status: 'In Progress', startDate: '2026-06-06', endDate: '2026-06-15', blockedBy: ['T1'], dependsOn: [], notes: '' },
  { ...BASE, id: 'T3', name: 'Test', project: 'Alpha', description: '', assignee: 'Carol', storyPoints: 0, status: 'Todo', startDate: '2026-06-10', endDate: '2026-06-20', blockedBy: ['T1', 'T2'], dependsOn: [], notes: '' },
]

describe('resolveBlockers', () => {
  it('returns one EnrichedTask per input task', () => {
    expect(resolveBlockers(tasks)).toHaveLength(3)
  })

  it('populates blockedByTasks with full Task objects', () => {
    const enriched = resolveBlockers(tasks)
    const t3 = enriched.find((t) => t.id === 'T3')!
    expect(t3.blockedByTasks).toHaveLength(2)
    expect(t3.blockedByTasks.map((t) => t.id)).toEqual(['T1', 'T2'])
  })

  it('populates blocksTasks for tasks that others depend on', () => {
    const enriched = resolveBlockers(tasks)
    const t1 = enriched.find((t) => t.id === 'T1')!
    expect(t1.blocksTasks.map((t) => t.id)).toEqual(['T2', 'T3'])
  })

  it('T1 has empty blockedByTasks', () => {
    const enriched = resolveBlockers(tasks)
    const t1 = enriched.find((t) => t.id === 'T1')!
    expect(t1.blockedByTasks).toHaveLength(0)
  })

  it('silently ignores Blocked By IDs that do not exist', () => {
    const withOrphan: Task[] = [
      { ...BASE, ...tasks[0], blockedBy: ['GHOST'] },
    ]
    const enriched = resolveBlockers(withOrphan)
    expect(enriched[0].blockedByTasks).toHaveLength(0)
  })
})

describe('applyStatusTransition', () => {
  const TODAY = '2026-06-23'
  const YESTERDAY = '2026-06-22'

  const fresh   = { ...BASE }
  const started = { ...BASE, actualStartDate: '2026-06-10' }
  // Task currently on hold (no end date yet)
  const onHold  = { ...BASE, actualStartDate: '2026-06-10', onHoldDate: '2026-06-15', onHoldReason: 'Waiting for design' }
  // Task that was on hold and has since resumed
  const resumed = { ...BASE, actualStartDate: '2026-06-10', onHoldDate: '2026-06-15', onHoldEndDate: '2026-06-22', onHoldReason: 'Waiting for design' }

  // ── Todo → In Progress ────────────────────────────────────────────────────
  it('sets actualStartDate when first moving to In Progress', () => {
    const updates = applyStatusTransition(fresh, 'In Progress', TODAY)
    expect(updates.status).toBe('In Progress')
    expect(updates.actualStartDate).toBe(TODAY)
  })

  it('does not overwrite actualStartDate on subsequent In Progress moves', () => {
    const updates = applyStatusTransition(started, 'In Progress', TODAY)
    expect(updates.actualStartDate).toBeUndefined()
  })

  // ── On Hold → In Progress (resume) ────────────────────────────────────────
  it('sets onHoldEndDate to yesterday when resuming from On Hold to In Progress', () => {
    const updates = applyStatusTransition(onHold, 'In Progress', TODAY)
    expect(updates.status).toBe('In Progress')
    expect(updates.onHoldEndDate).toBe(YESTERDAY)
  })

  it('preserves onHoldDate and onHoldReason when resuming from On Hold', () => {
    const updates = applyStatusTransition(onHold, 'In Progress', TODAY)
    expect(updates.onHoldDate).toBeUndefined()
    expect(updates.onHoldReason).toBeUndefined()
  })

  it('does not reset actualStartDate when resuming from On Hold', () => {
    const updates = applyStatusTransition(onHold, 'In Progress', TODAY)
    expect(updates.actualStartDate).toBeUndefined()
  })

  it('does not set onHoldEndDate if task was never on hold', () => {
    const updates = applyStatusTransition(started, 'In Progress', TODAY)
    expect(updates.onHoldEndDate).toBeUndefined()
  })

  it('does not overwrite onHoldEndDate if already set (already resumed once)', () => {
    const updates = applyStatusTransition(resumed, 'In Progress', TODAY)
    expect(updates.onHoldEndDate).toBeUndefined()
  })

  // ── On Hold → Validation & Testing (resume) ───────────────────────────────
  it('sets onHoldEndDate to yesterday when resuming from On Hold to Validation & Testing', () => {
    const updates = applyStatusTransition(onHold, 'Validation & Testing', TODAY)
    expect(updates.status).toBe('Validation & Testing')
    expect(updates.onHoldEndDate).toBe(YESTERDAY)
  })

  it('preserves onHoldDate and onHoldReason when resuming to Validation & Testing', () => {
    const updates = applyStatusTransition(onHold, 'Validation & Testing', TODAY)
    expect(updates.onHoldDate).toBeUndefined()
    expect(updates.onHoldReason).toBeUndefined()
  })

  // ── → Done ────────────────────────────────────────────────────────────────
  it('sets actualEndDate when first moving to Done', () => {
    const updates = applyStatusTransition(started, 'Done', TODAY)
    expect(updates.status).toBe('Done')
    expect(updates.actualEndDate).toBe(TODAY)
  })

  it('does not overwrite actualEndDate if already set', () => {
    const alreadyDone = { ...started, actualEndDate: '2026-06-20' }
    const updates = applyStatusTransition(alreadyDone, 'Done', TODAY)
    expect(updates.actualEndDate).toBeUndefined()
  })

  // ── → On Hold ────────────────────────────────────────────────────────────
  it('sets onHoldDate and onHoldReason when moving to On Hold', () => {
    const updates = applyStatusTransition(started, 'On Hold', TODAY, { onHoldReason: 'Blocked by legal' })
    expect(updates.status).toBe('On Hold')
    expect(updates.onHoldDate).toBe(TODAY)
    expect(updates.onHoldReason).toBe('Blocked by legal')
  })

  it('clears onHoldEndDate when moving back to On Hold after a previous resume', () => {
    const updates = applyStatusTransition(resumed, 'On Hold', TODAY, { onHoldReason: 'New blocker' })
    expect(updates.onHoldEndDate).toBe('')
    expect(updates.onHoldDate).toBe(TODAY)
  })

  it('defaults onHoldReason to empty string when not provided', () => {
    const updates = applyStatusTransition(started, 'On Hold', TODAY)
    expect(updates.onHoldReason).toBe('')
  })
})
