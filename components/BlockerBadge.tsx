interface BlockerBadgeProps {
  direction: 'blocked-by' | 'blocks' | 'depends-on' | 'depended-on-by'
  taskName: string
  taskId: string
}

const DIRECTION_CONFIG = {
  'blocked-by':     { label: 'Blocked by',    cls: 'bg-red-100 text-red-700' },
  'blocks':         { label: 'Blocks',         cls: 'bg-amber-100 text-amber-700' },
  'depends-on':     { label: 'Depends on',     cls: 'bg-purple-100 text-purple-700' },
  'depended-on-by': { label: 'Depended on by', cls: 'bg-violet-100 text-violet-700' },
}

export function BlockerBadge({ direction, taskName, taskId }: BlockerBadgeProps) {
  const { label, cls } = DIRECTION_CONFIG[direction]
  return (
    <span
      title={`${label} ${taskId}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      <span>{label}</span>
      <span className="font-semibold">{taskName}</span>
    </span>
  )
}
