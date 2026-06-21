interface BlockerBadgeProps {
  direction: 'blocked-by' | 'blocks'
  taskName: string
  taskId: string
}

export function BlockerBadge({ direction, taskName, taskId }: BlockerBadgeProps) {
  const isBlockedBy = direction === 'blocked-by'
  return (
    <span
      title={`${isBlockedBy ? 'Blocked by' : 'Blocks'} ${taskId}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isBlockedBy
          ? 'bg-red-100 text-red-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      <span>{isBlockedBy ? 'Blocked by' : 'Blocks'}</span>
      <span className="font-semibold">{taskName}</span>
    </span>
  )
}
