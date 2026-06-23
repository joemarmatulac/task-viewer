'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  type PieLabelRenderProps,
} from 'recharts'
import type { EnrichedTask } from '@/types/task'

// ─── colours ─────────────────────────────────────────────────────────────────
const C = {
  todo:              '#9CA3AF',
  inProgress:        '#60A5FA',
  validationTesting: '#A78BFA',
  onHold:            '#F59E0B',
  done:              '#4ADE80',
  ideal:             '#C084FC',
  remaining:         '#F87171',
}

const STATUS_COLORS: Record<string, string> = {
  Todo:                  C.todo,
  'In Progress':         C.inProgress,
  'Validation & Testing': C.validationTesting,
  'On Hold':             C.onHold,
  Done:                  C.done,
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const thu = new Date(d)
  thu.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3)
  const jan4 = new Date(thu.getFullYear(), 0, 4)
  const week = Math.ceil(((thu.getTime() - jan4.getTime()) / 86_400_000 + 1) / 7)
  return `W${String(week).padStart(2, '0')}`
}

// ─── small UI pieces ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border-l-4 bg-white dark:bg-gray-800 shadow-sm p-4 flex flex-col gap-1" style={{ borderLeftColor: color }}>
      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</span>
      {sub && <span className="text-xs text-gray-400 dark:text-gray-500">{sub}</span>}
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-3 min-w-0 overflow-hidden">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h3>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-lg px-3 py-2 text-xs space-y-1">
      {label && <p className="font-semibold text-gray-600 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-medium text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export function ChartsView({ tasks }: { tasks: EnrichedTask[] }) {
  const data = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const done              = tasks.filter(t => t.status === 'Done')
    const inProgress        = tasks.filter(t => t.status === 'In Progress')
    const validationTesting = tasks.filter(t => t.status === 'Validation & Testing')
    const onHold            = tasks.filter(t => t.status === 'On Hold')
    const todo              = tasks.filter(t => t.status === 'Todo')

    // KPI
    const cycleTimes = done.filter(t => t.actualStartDate && t.actualEndDate)
      .map(t => daysBetween(t.actualStartDate, t.actualEndDate))
    const avgCycle = cycleTimes.length
      ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
      : null
    const donePercent = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0

    // Story Points KPI
    const hasStoryPoints = tasks.some(t => t.storyPoints > 0)
    const totalSP   = tasks.reduce((s, t) => s + (t.storyPoints || 0), 0)
    const doneSP    = done.reduce((s, t) => s + (t.storyPoints || 0), 0)
    const remainSP  = totalSP - doneSP
    const spPercent = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0

    // Pie
    const pie = [
      { name: 'Todo',                  value: todo.length },
      { name: 'In Progress',           value: inProgress.length },
      { name: 'Validation & Testing',  value: validationTesting.length },
      { name: 'On Hold',               value: onHold.length },
      { name: 'Done',                  value: done.length },
    ].filter(d => d.value > 0)

    // Stacked workload by assignee (task count + SP)
    type Counts = { Todo: number; 'In Progress': number; 'Validation & Testing': number; 'On Hold': number; Done: number; sp: number }
    const aMap = new Map<string, Counts>()
    for (const t of tasks) {
      const a = t.assignee || 'Unassigned'
      if (!aMap.has(a)) aMap.set(a, { Todo: 0, 'In Progress': 0, 'Validation & Testing': 0, 'On Hold': 0, Done: 0, sp: 0 })
      const c = aMap.get(a)!
      c[t.status as keyof Omit<Counts, 'sp'>] = (c[t.status as keyof Omit<Counts, 'sp'>] ?? 0) + 1
      c.sp += t.storyPoints || 0
    }
    const workload = Array.from(aMap.entries())
      .map(([assignee, counts]) => ({ assignee, ...counts }))
      .sort((a, b) => b.Done - a.Done)

    // SP workload by assignee
    type SpCounts = { 'SP Done': number; 'SP In Progress': number; 'SP Validation & Testing': number; 'SP On Hold': number; 'SP Todo': number }
    const spMap = new Map<string, SpCounts>()
    for (const t of tasks) {
      const a = t.assignee || 'Unassigned'
      if (!spMap.has(a)) spMap.set(a, { 'SP Done': 0, 'SP In Progress': 0, 'SP Validation & Testing': 0, 'SP On Hold': 0, 'SP Todo': 0 })
      const c = spMap.get(a)!
      const key = `SP ${t.status}` as keyof SpCounts
      c[key] = (c[key] ?? 0) + (t.storyPoints || 0)
    }
    const spWorkload = Array.from(spMap.entries())
      .map(([assignee, counts]) => ({ assignee, ...counts }))
      .filter(r => Object.values(r).some((v, i) => i > 0 && (v as number) > 0))
      .sort((a, b) => b['SP Done'] - a['SP Done'])

    // Burndown — only use valid ISO dates to prevent infinite loops from malformed strings
    const ISO = /^\d{4}-\d{2}-\d{2}$/
    const allDates = tasks
      .flatMap(t => [t.startDate, t.endDate].filter(Boolean))
      .filter(d => ISO.test(d))
    let burndown: { date: string; remaining: number | null; ideal: number; spRemaining?: number | null; spIdeal?: number }[] = []
    if (allDates.length > 0) {
      const minDate = allDates.reduce((a, b) => (a < b ? a : b))
      const maxDate = allDates.reduce((a, b) => (a > b ? a : b))
      const totalDays = daysBetween(minDate, maxDate) || 1
      const points: string[] = []
      let d = minDate
      while (d <= maxDate && points.length < 365) { points.push(d); d = addDays(d, 1) }
      burndown = points.map((date, i) => {
        const isFuture = date > today
        const remainingTasks = tasks.filter(t => {
          if (t.status === 'Done') return (t.actualEndDate || t.endDate) > date
          return true
        })
        return {
          date: date.slice(5),
          remaining: isFuture ? null : remainingTasks.length,
          ideal: Math.round(tasks.length * (1 - i / totalDays)),
          ...(hasStoryPoints ? {
            spRemaining: isFuture ? null : remainingTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
            spIdeal: Math.round(totalSP * (1 - i / totalDays)),
          } : {}),
        }
      })
    }

    // Velocity — completions + SP per ISO week
    const wMap = new Map<string, { completed: number; sp: number }>()
    for (const t of done) {
      const d = t.actualEndDate || t.endDate
      if (d) {
        const w = isoWeek(d)
        const cur = wMap.get(w) ?? { completed: 0, sp: 0 }
        cur.completed += 1
        cur.sp += t.storyPoints || 0
        wMap.set(w, cur)
      }
    }
    const velocity = Array.from(wMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, v]) => ({ week, ...v }))

    // Cycle time
    const cycleTime = done
      .filter(t => t.actualStartDate && t.actualEndDate)
      .map(t => ({
        label: t.name.length > 20 ? t.name.slice(0, 20) + '…' : t.name,
        days: daysBetween(t.actualStartDate, t.actualEndDate),
      }))
      .sort((a, b) => b.days - a.days)

    // Planned vs actual
    const plannedVsActual = done
      .filter(t => t.startDate && t.endDate && t.actualStartDate && t.actualEndDate)
      .map(t => ({
        label: t.name.length > 16 ? t.name.slice(0, 16) + '…' : t.name,
        planned: daysBetween(t.startDate, t.endDate),
        actual:  daysBetween(t.actualStartDate, t.actualEndDate),
      }))

    // On Hold impact
    const onHoldImpact = tasks
      .filter(t => t.onHoldDate)
      .map(t => {
        const end = t.actualEndDate && t.actualEndDate > t.onHoldDate ? t.actualEndDate : today
        return {
          label:  t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name,
          days:   daysBetween(t.onHoldDate, end),
          reason: t.onHoldReason,
        }
      })
      .sort((a, b) => b.days - a.days)

    return {
      kpi: { done, inProgress, validationTesting, onHold, todo, avgCycle, donePercent },
      sp: { hasStoryPoints, totalSP, doneSP, remainSP, spPercent },
      pie, workload, spWorkload, burndown, velocity, cycleTime, plannedVsActual, onHoldImpact,
    }
  }, [tasks])

  if (tasks.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">No tasks loaded.</p>
  }

  const renderPieLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, value } = props
    if (cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null) return null
    const R = Math.PI / 180
    const r = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 1.5
    const x = Number(cx) + r * Math.cos(-Number(midAngle) * R)
    const y = Number(cy) + r * Math.sin(-Number(midAngle) * R)
    const lbl = String(name ?? '')
    return (
      <text x={x} y={y} fill={STATUS_COLORS[lbl] ?? '#888'}
        textAnchor={x > Number(cx) ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600}>
        {lbl} ({value})
      </text>
    )
  }

  const { kpi, sp, pie, workload, spWorkload, burndown, velocity, cycleTime, plannedVsActual, onHoldImpact } = data

  return (
    <div className="space-y-6 min-w-0">

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Tasks"         value={tasks.length}                          color="#6B7280" />
        <KpiCard label="Completed"           value={`${kpi.donePercent}%`}                 sub={`${kpi.done.length} of ${tasks.length} tasks`} color={C.done} />
        <KpiCard label="In Progress"         value={kpi.inProgress.length}                 color={C.inProgress} />
        <KpiCard label="Validation & Testing" value={kpi.validationTesting.length}          color={C.validationTesting} />
        <KpiCard label="On Hold"             value={kpi.onHold.length}                     color={C.onHold} />
        <KpiCard label="Avg Cycle Time"      value={kpi.avgCycle != null ? `${kpi.avgCycle}d` : '—'}
          sub={kpi.avgCycle != null ? 'for completed tasks' : 'no completed tasks yet'} color={C.ideal} />
      </div>

      {/* Story Points KPI cards */}
      {sp.hasStoryPoints && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total Story Points" value={sp.totalSP}              color="#8B5CF6" />
          <KpiCard label="SP Completed"       value={`${sp.spPercent}%`}      sub={`${sp.doneSP} of ${sp.totalSP} SP`} color={C.done} />
          <KpiCard label="SP Remaining"       value={sp.remainSP}             color={C.remaining} />
          <KpiCard label="SP In Progress"     value={kpi.inProgress.reduce((s, t) => s + (t.storyPoints || 0), 0)} color={C.inProgress} />
        </div>
      )}

      {/* Status donut + Workload bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <Section title="Status Distribution">
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pie} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value" labelLine={false} label={renderPieLabel}>
                  {pie.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name] ?? '#ccc'} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Workload by Assignee" sub="Task count per assignee by status.">
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workload} margin={{ top: 4, right: 12, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="assignee" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Done"                  stackId="a" fill={C.done}              radius={[0,0,0,0]} />
                <Bar dataKey="In Progress"          stackId="a" fill={C.inProgress} />
                <Bar dataKey="Validation & Testing" stackId="a" fill={C.validationTesting} />
                <Bar dataKey="On Hold"              stackId="a" fill={C.onHold} />
                <Bar dataKey="Todo"                 stackId="a" fill={C.todo}              radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      {/* SP Workload by assignee */}
      {sp.hasStoryPoints && spWorkload.length > 0 && (
        <Section title="Story Points by Assignee" sub="Story points per assignee, stacked by status.">
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={spWorkload} margin={{ top: 4, right: 12, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="assignee" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'SP', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="SP Done"                  stackId="sp" fill={C.done}              radius={[0,0,0,0]} />
                <Bar dataKey="SP In Progress"          stackId="sp" fill={C.inProgress} />
                <Bar dataKey="SP Validation & Testing" stackId="sp" fill={C.validationTesting} />
                <Bar dataKey="SP On Hold"              stackId="sp" fill={C.onHold} />
                <Bar dataKey="SP Todo"                 stackId="sp" fill={C.todo}              radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Burndown */}
      {burndown.length > 1 && (
        <div className={`grid grid-cols-1 ${sp.hasStoryPoints ? 'lg:grid-cols-2' : ''} gap-6 min-w-0`}>
          <Section title="Sprint Burndown — Tasks" sub="Tasks remaining vs ideal burn rate over the sprint window.">
            <div className="w-full">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={burndown} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.ceil(burndown.length / 10)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ideal"     stroke={C.ideal}     strokeWidth={2} strokeDasharray="5 4" dot={false} name="Ideal" />
                  <Line type="monotone" dataKey="remaining" stroke={C.remaining} strokeWidth={2} dot={false} name="Remaining" activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {sp.hasStoryPoints && (
            <Section title="Sprint Burndown — Story Points" sub="Story points remaining vs ideal SP burn rate.">
              <div className="w-full">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={burndown} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.ceil(burndown.length / 10)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="spIdeal"     stroke={C.ideal}     strokeWidth={2} strokeDasharray="5 4" dot={false} name="Ideal SP" />
                    <Line type="monotone" dataKey="spRemaining" stroke={C.remaining} strokeWidth={2} dot={false} name="SP Remaining" activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Velocity */}
      {velocity.length > 0 && (
        <Section title="Velocity per Week" sub="Tasks and story points completed per ISO week.">
          <div className="w-full">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={velocity} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="tasks" tick={{ fontSize: 11 }} allowDecimals={false} />
                {sp.hasStoryPoints && (
                  <YAxis yAxisId="sp" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
                )}
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="tasks" dataKey="completed" fill={C.done}       radius={[4,4,0,0]} name="Tasks" />
                {sp.hasStoryPoints && (
                  <Bar yAxisId="sp"    dataKey="sp"        fill="#8B5CF6"      radius={[4,4,0,0]} name="Story Points" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Cycle time + Planned vs actual */}
      {(cycleTime.length > 0 || plannedVsActual.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
          {cycleTime.length > 0 && (
            <Section title="Cycle Time — Completed Tasks" sub="Days from actual start to actual end.">
              <div className="w-full">
                <ResponsiveContainer width="100%" height={Math.max(160, cycleTime.length * 32)}>
                  <BarChart layout="vertical" data={cycleTime} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} unit="d" />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="days" fill={C.inProgress} radius={[0,4,4,0]} name="Days" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {plannedVsActual.length > 0 && (
            <Section title="Planned vs Actual Duration" sub="Planned days vs actual days for completed tasks.">
              <div className="w-full">
                <ResponsiveContainer width="100%" height={Math.max(160, plannedVsActual.length * 40)}>
                  <BarChart layout="vertical" data={plannedVsActual} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} unit="d" />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="planned" fill={C.todo}       radius={[0,4,4,0]} name="Planned" />
                    <Bar dataKey="actual"  fill={C.inProgress} radius={[0,4,4,0]} name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* On Hold impact */}
      {onHoldImpact.length > 0 && (
        <Section title="On Hold Impact — Days Paused" sub="Time each task has spent in On Hold state.">
          <div className="w-full">
            <ResponsiveContainer width="100%" height={Math.max(120, onHoldImpact.length * 36)}>
              <BarChart layout="vertical" data={onHoldImpact} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} unit="d" />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const d = onHoldImpact.find(x => x.label === label)
                    return (
                      <div className="rounded-lg bg-white border border-gray-200 shadow-lg px-3 py-2 text-xs max-w-xs">
                        <p className="font-semibold text-gray-700 mb-1">{label}</p>
                        <p className="text-amber-600 font-medium">{payload[0].value}d on hold</p>
                        {d?.reason && <p className="text-gray-400 mt-1 italic">&ldquo;{d.reason}&rdquo;</p>}
                      </div>
                    )
                  }}
                />
                <Bar dataKey="days" fill={C.onHold} radius={[0,4,4,0]} name="Days on hold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

    </div>
  )
}
