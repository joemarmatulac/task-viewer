# Kanban Task Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app that reads a local `.xlsx` file and renders a Kanban board with per-task blocker indicators showing which tasks are blocked by or blocking other tasks.

**Architecture:** The app is entirely client-side — no backend, no auth. The user drops/selects their OneDrive-synced Excel file, SheetJS parses it in the browser, dependency resolution runs in memory, and the Kanban board renders. Refreshing data means re-uploading the file.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, SheetJS (`xlsx`), Vitest + Testing Library for tests.

---

## Excel File Format Convention

The tool expects an `.xlsx` file where **row 1 is the header row** with exactly these column names:

| Column | Values |
|--------|--------|
| `Task ID` | Unique string or number (e.g. `T1`, `T2`) |
| `Task Name` | Free text |
| `Assignee` | Person's name |
| `Status` | `Todo`, `In Progress`, or `Done` |
| `Start Date` | Date cell or text `YYYY-MM-DD` |
| `End Date` | Date cell or text `YYYY-MM-DD` |
| `Blocked By` | Comma-separated Task IDs (e.g. `T1,T3`) or empty |

---

## File Structure

```
app/
  layout.tsx            # Root layout with Tailwind base
  page.tsx              # Main page: file upload state + board
components/
  FileUpload.tsx        # Drag-and-drop / click-to-upload .xlsx picker
  KanbanBoard.tsx       # Renders 3 columns from enriched task list
  KanbanColumn.tsx      # Single status column with task cards
  TaskCard.tsx          # Task card: name, assignee, dates, blocker badges
  BlockerBadge.tsx      # Small pill showing "Blocked by T1" or "Blocks T3"
lib/
  parseExcel.ts         # SheetJS → RawRow[] → Task[]
  taskUtils.ts          # resolveBlockers(tasks) → EnrichedTask[]
types/
  task.ts               # Task, EnrichedTask interfaces
tests/
  lib/parseExcel.test.ts
  lib/taskUtils.test.ts
  components/TaskCard.test.tsx
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts` (via CLI)
- Create: `vitest.config.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

Expected: project files created, `npm run dev` starts on port 3000.

- [ ] **Step 2: Install SheetJS and test dependencies**

```bash
npm install xlsx
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify setup**

```bash
npm test
```

Expected: "No test files found" (zero failures).

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: bootstrap Next.js project with SheetJS and Vitest"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `types/task.ts`

- [ ] **Step 1: Write types**

Create `types/task.ts`:

```ts
export type TaskStatus = 'Todo' | 'In Progress' | 'Done'

export interface Task {
  id: string
  name: string
  assignee: string
  status: TaskStatus
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  blockedBy: string[] // Task IDs
}

export interface EnrichedTask extends Task {
  blockedByTasks: Task[]  // full Task objects for tasks that block this one
  blocksTasks: Task[]     // full Task objects that this task blocks
}
```

- [ ] **Step 2: Commit**

```bash
git add types/task.ts
git commit -m "feat: add Task and EnrichedTask type definitions"
```

---

## Task 3: Excel Parsing Logic

**Files:**
- Create: `lib/parseExcel.ts`
- Create: `tests/lib/parseExcel.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/parseExcel.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseRows } from '@/lib/parseExcel'

describe('parseRows', () => {
  const validRows = [
    {
      'Task ID': 'T1',
      'Task Name': 'Design mockups',
      'Assignee': 'Alice',
      'Status': 'Done',
      'Start Date': '2026-06-01',
      'End Date': '2026-06-05',
      'Blocked By': '',
    },
    {
      'Task ID': 'T2',
      'Task Name': 'Build frontend',
      'Assignee': 'Bob',
      'Status': 'In Progress',
      'Start Date': '2026-06-06',
      'End Date': '2026-06-15',
      'Blocked By': 'T1',
    },
    {
      'Task ID': 'T3',
      'Task Name': 'Write tests',
      'Assignee': 'Carol',
      'Status': 'Todo',
      'Start Date': '2026-06-10',
      'End Date': '2026-06-20',
      'Blocked By': 'T1,T2',
    },
  ]

  it('returns a Task for each valid row', () => {
    const tasks = parseRows(validRows)
    expect(tasks).toHaveLength(3)
  })

  it('maps column names to Task fields', () => {
    const [t1] = parseRows(validRows)
    expect(t1).toEqual({
      id: 'T1',
      name: 'Design mockups',
      assignee: 'Alice',
      status: 'Done',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      blockedBy: [],
    })
  })

  it('parses comma-separated Blocked By into an array', () => {
    const tasks = parseRows(validRows)
    expect(tasks[2].blockedBy).toEqual(['T1', 'T2'])
  })

  it('skips rows with missing Task ID or Task Name', () => {
    const rows = [
      { 'Task ID': '', 'Task Name': 'Orphan', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '', 'End Date': '', 'Blocked By': '' },
      { 'Task ID': 'T4', 'Task Name': '', 'Assignee': 'X', 'Status': 'Todo', 'Start Date': '', 'End Date': '', 'Blocked By': '' },
    ]
    expect(parseRows(rows)).toHaveLength(0)
  })

  it('normalises unknown status to Todo', () => {
    const rows = [{ 'Task ID': 'T5', 'Task Name': 'X', 'Assignee': 'X', 'Status': 'Backlog', 'Start Date': '', 'End Date': '', 'Blocked By': '' }]
    const [task] = parseRows(rows)
    expect(task.status).toBe('Todo')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- parseExcel
```

Expected: FAIL — `Cannot find module '@/lib/parseExcel'`

- [ ] **Step 3: Implement parseExcel**

Create `lib/parseExcel.ts`:

```ts
import * as XLSX from 'xlsx'
import type { Task, TaskStatus } from '@/types/task'

type RawRow = Record<string, string | number | undefined>

const VALID_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'Done']

function toStr(val: string | number | undefined): string {
  if (val === undefined || val === null) return ''
  return String(val).trim()
}

function parseDate(val: string | number | undefined): string {
  if (typeof val === 'number') {
    // Excel serial date → JS Date
    const date = XLSX.SSF.parse_date_code(val)
    const y = date.y
    const m = String(date.m).padStart(2, '0')
    const d = String(date.d).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return toStr(val)
}

export function parseRows(rows: RawRow[]): Task[] {
  return rows.flatMap((row) => {
    const id = toStr(row['Task ID'])
    const name = toStr(row['Task Name'])
    if (!id || !name) return []

    const rawStatus = toStr(row['Status']) as TaskStatus
    const status: TaskStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'Todo'

    const blockedByRaw = toStr(row['Blocked By'])
    const blockedBy = blockedByRaw
      ? blockedByRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    return [{
      id,
      name,
      assignee: toStr(row['Assignee']),
      status,
      startDate: parseDate(row['Start Date']),
      endDate: parseDate(row['End Date']),
      blockedBy,
    }]
  })
}

export async function parseExcelFile(file: File): Promise<Task[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' })
  return parseRows(rows)
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- parseExcel
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/parseExcel.ts tests/lib/parseExcel.test.ts
git commit -m "feat: Excel parsing with SheetJS — parseRows and parseExcelFile"
```

---

## Task 4: Dependency Resolution Utility

**Files:**
- Create: `lib/taskUtils.ts`
- Create: `tests/lib/taskUtils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/taskUtils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveBlockers } from '@/lib/taskUtils'
import type { Task } from '@/types/task'

const tasks: Task[] = [
  { id: 'T1', name: 'Design', assignee: 'Alice', status: 'Done', startDate: '2026-06-01', endDate: '2026-06-05', blockedBy: [] },
  { id: 'T2', name: 'Build', assignee: 'Bob', status: 'In Progress', startDate: '2026-06-06', endDate: '2026-06-15', blockedBy: ['T1'] },
  { id: 'T3', name: 'Test', assignee: 'Carol', status: 'Todo', startDate: '2026-06-10', endDate: '2026-06-20', blockedBy: ['T1', 'T2'] },
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
      { ...tasks[0], blockedBy: ['GHOST'] },
    ]
    const enriched = resolveBlockers(withOrphan)
    expect(enriched[0].blockedByTasks).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- taskUtils
```

Expected: FAIL — `Cannot find module '@/lib/taskUtils'`

- [ ] **Step 3: Implement resolveBlockers**

Create `lib/taskUtils.ts`:

```ts
import type { Task, EnrichedTask } from '@/types/task'

export function resolveBlockers(tasks: Task[]): EnrichedTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))

  return tasks.map((task) => {
    const blockedByTasks = task.blockedBy
      .map((id) => byId.get(id))
      .filter((t): t is Task => t !== undefined)

    const blocksTasks = tasks.filter((other) =>
      other.blockedBy.includes(task.id)
    )

    return { ...task, blockedByTasks, blocksTasks }
  })
}

export function groupByStatus(tasks: EnrichedTask[]) {
  return {
    'Todo': tasks.filter((t) => t.status === 'Todo'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    'Done': tasks.filter((t) => t.status === 'Done'),
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- taskUtils
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/taskUtils.ts tests/lib/taskUtils.test.ts
git commit -m "feat: dependency resolution — resolveBlockers and groupByStatus"
```

---

## Task 5: BlockerBadge Component

**Files:**
- Create: `components/BlockerBadge.tsx`
- Create: `tests/components/TaskCard.test.tsx` (start the file here, extend in Task 6)

- [ ] **Step 1: Write failing test**

Create `tests/components/TaskCard.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- TaskCard
```

Expected: FAIL — `Cannot find module '@/components/BlockerBadge'`

- [ ] **Step 3: Implement BlockerBadge**

Create `components/BlockerBadge.tsx`:

```tsx
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
```

- [ ] **Step 4: Run tests**

```bash
npm test -- TaskCard
```

Expected: both BlockerBadge tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/BlockerBadge.tsx tests/components/TaskCard.test.tsx
git commit -m "feat: BlockerBadge component for dependency indicators"
```

---

## Task 6: TaskCard Component

**Files:**
- Create: `components/TaskCard.tsx`
- Modify: `tests/components/TaskCard.test.tsx`

- [ ] **Step 1: Add TaskCard tests to the existing test file**

Append to `tests/components/TaskCard.test.tsx`:

```tsx
import { TaskCard } from '@/components/TaskCard'
import type { EnrichedTask } from '@/types/task'

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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- TaskCard
```

Expected: FAIL — `Cannot find module '@/components/TaskCard'`

- [ ] **Step 3: Implement TaskCard**

Create `components/TaskCard.tsx`:

```tsx
import type { EnrichedTask } from '@/types/task'
import { BlockerBadge } from './BlockerBadge'

interface TaskCardProps {
  task: EnrichedTask
}

export function TaskCard({ task }: TaskCardProps) {
  const hasDeps = task.blockedByTasks.length > 0 || task.blocksTasks.length > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-gray-400 font-mono">{task.id}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{task.assignee}</span>
      </div>

      <p className="text-sm font-medium text-gray-800 leading-snug">{task.name}</p>

      {(task.startDate || task.endDate) && (
        <p className="text-xs text-gray-400">
          {task.startDate} → {task.endDate}
        </p>
      )}

      {hasDeps && (
        <div className="flex flex-wrap gap-1 pt-1">
          {task.blockedByTasks.map((t) => (
            <BlockerBadge key={t.id} direction="blocked-by" taskName={t.name} taskId={t.id} />
          ))}
          {task.blocksTasks.map((t) => (
            <BlockerBadge key={t.id} direction="blocks" taskName={t.name} taskId={t.id} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- TaskCard
```

Expected: all 7 tests PASS (2 BlockerBadge + 5 TaskCard).

- [ ] **Step 5: Commit**

```bash
git add components/TaskCard.tsx tests/components/TaskCard.test.tsx
git commit -m "feat: TaskCard component with blocker and blocks badges"
```

---

## Task 7: KanbanColumn and KanbanBoard Components

**Files:**
- Create: `components/KanbanColumn.tsx`
- Create: `components/KanbanBoard.tsx`

No unit tests for these — they are pure layout composition; covered by the integration smoke test in Task 9.

- [ ] **Step 1: Implement KanbanColumn**

Create `components/KanbanColumn.tsx`:

```tsx
import type { EnrichedTask } from '@/types/task'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  title: string
  tasks: EnrichedTask[]
  accentClass: string
}

export function KanbanColumn({ title, tasks, accentClass }: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-3 min-w-[280px] flex-1">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${accentClass}`}>
        <h2 className="font-semibold text-gray-700">{title}</h2>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 rounded-full px-2">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement KanbanBoard**

Create `components/KanbanBoard.tsx`:

```tsx
import type { EnrichedTask } from '@/types/task'
import { groupByStatus } from '@/lib/taskUtils'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  tasks: EnrichedTask[]
}

const COLUMNS = [
  { status: 'Todo' as const,        label: 'Todo',        accent: 'border-gray-300' },
  { status: 'In Progress' as const, label: 'In Progress', accent: 'border-blue-400' },
  { status: 'Done' as const,        label: 'Done',        accent: 'border-green-400' },
]

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const grouped = groupByStatus(tasks)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(({ status, label, accent }) => (
        <KanbanColumn
          key={status}
          title={label}
          tasks={grouped[status]}
          accentClass={accent}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/KanbanColumn.tsx components/KanbanBoard.tsx
git commit -m "feat: KanbanColumn and KanbanBoard layout components"
```

---

## Task 8: FileUpload Component

**Files:**
- Create: `components/FileUpload.tsx`

- [ ] **Step 1: Implement FileUpload**

Create `components/FileUpload.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'

interface FileUploadProps {
  onFile: (file: File) => void
  isLoading?: boolean
}

export function FileUpload({ onFile, isLoading }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.name.endsWith('.xlsx')) {
      alert('Please select an .xlsx file.')
      return
    }
    onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFile(e.dataTransfer.files[0])
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {isLoading ? (
        <p className="text-sm text-gray-500">Parsing…</p>
      ) : (
        <>
          <p className="text-gray-600 font-medium">Drop your .xlsx file here</p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/FileUpload.tsx
git commit -m "feat: FileUpload component with drag-and-drop"
```

---

## Task 9: Main Page — Wire Everything Together

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Task Board',
  description: 'Kanban board from your Excel task tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Implement main page**

Replace `app/page.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/FileUpload'
import { KanbanBoard } from '@/components/KanbanBoard'
import { parseExcelFile } from '@/lib/parseExcel'
import { resolveBlockers } from '@/lib/taskUtils'
import type { EnrichedTask } from '@/types/task'

export default function Page() {
  const [tasks, setTasks] = useState<EnrichedTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setIsLoading(true)
    setError(null)
    try {
      const parsed = await parseExcelFile(file)
      setTasks(resolveBlockers(parsed))
      setFileName(file.name)
    } catch (e) {
      setError('Failed to parse the Excel file. Check the column names match the expected format.')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          {fileName && <p className="text-sm text-gray-400 mt-0.5">Loaded: {fileName}</p>}
        </div>
        {tasks.length > 0 && (
          <button
            onClick={() => { setTasks([]); setFileName(null) }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Load different file
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <FileUpload onFile={handleFile} isLoading={isLoading} />
      ) : (
        <KanbanBoard tasks={tasks} />
      )}
    </main>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all 12 tests PASS.

- [ ] **Step 4: Run the dev server and smoke test manually**

```bash
npm run dev
```

Open `http://localhost:3000`. Steps to verify:
1. Upload a valid `.xlsx` file → Kanban board renders with correct columns
2. A task that has `Blocked By: T1` shows a red "Blocked by Design mockups" badge
3. T1 shows an amber "Blocks Build frontend" badge
4. A task with empty `Blocked By` shows no badges
5. Click "Load different file" → returns to upload screen

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: main page wires FileUpload → parseExcelFile → KanbanBoard"
```

---

## Task 10: Sample Excel File for Testing

**Files:**
- Create: `public/sample-tasks.xlsx` (generated via script)

- [ ] **Step 1: Create sample data script**

Create `scripts/generate-sample.mjs`:

```js
import * as XLSX from 'xlsx'

const rows = [
  { 'Task ID': 'T1', 'Task Name': 'Define requirements', 'Assignee': 'Alice', 'Status': 'Done',        'Start Date': '2026-06-01', 'End Date': '2026-06-03', 'Blocked By': '' },
  { 'Task ID': 'T2', 'Task Name': 'Design mockups',       'Assignee': 'Bob',   'Status': 'Done',        'Start Date': '2026-06-04', 'End Date': '2026-06-07', 'Blocked By': 'T1' },
  { 'Task ID': 'T3', 'Task Name': 'Build frontend',       'Assignee': 'Carol', 'Status': 'In Progress', 'Start Date': '2026-06-08', 'End Date': '2026-06-18', 'Blocked By': 'T2' },
  { 'Task ID': 'T4', 'Task Name': 'Build backend API',    'Assignee': 'Dave',  'Status': 'In Progress', 'Start Date': '2026-06-08', 'End Date': '2026-06-20', 'Blocked By': 'T1' },
  { 'Task ID': 'T5', 'Task Name': 'Write unit tests',     'Assignee': 'Eve',   'Status': 'Todo',        'Start Date': '2026-06-15', 'End Date': '2026-06-22', 'Blocked By': 'T3,T4' },
  { 'Task ID': 'T6', 'Task Name': 'Deploy to staging',    'Assignee': 'Alice', 'Status': 'Todo',        'Start Date': '2026-06-23', 'End Date': '2026-06-24', 'Blocked By': 'T5' },
]

const ws = XLSX.utils.json_to_sheet(rows)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
XLSX.writeFile(wb, 'public/sample-tasks.xlsx')
console.log('Generated public/sample-tasks.xlsx')
```

- [ ] **Step 2: Run the script**

```bash
node scripts/generate-sample.mjs
```

Expected: `Generated public/sample-tasks.xlsx`

- [ ] **Step 3: Add script to package.json**

In `package.json` scripts:
```json
"generate-sample": "node scripts/generate-sample.mjs"
```

- [ ] **Step 4: Test with the sample file**

Start `npm run dev`, open `http://localhost:3000`, upload `public/sample-tasks.xlsx`. Verify:
- T1 card shows no "Blocked by" badge; shows "Blocks" badges for T2, T4
- T5 shows "Blocked by T3" and "Blocked by T4" badges
- T6 shows "Blocked by T5" badge

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-sample.mjs public/sample-tasks.xlsx package.json
git commit -m "chore: add sample Excel file and generation script"
```

---

## Self-Review

**Spec coverage:**
- Team tasks, milestones, sprint work → Kanban covers all ✓
- 6-15 people, each updating own tasks in Excel → file upload model, no account needed ✓
- Status (Todo/In Progress/Done) → 3 columns ✓
- Assignee → shown on card ✓
- Start + end dates → shown on card ✓
- Dependencies (blocked by / blocks) → BlockerBadge, both directions ✓
- Hard to see dependencies → primary design concern addressed ✓
- OneDrive local sync → user opens the locally-synced file ✓

**Placeholder scan:** No TBDs, no "similar to Task N" shortcuts, all code complete.

**Type consistency:**
- `EnrichedTask` defined in Task 2, used consistently in Tasks 4, 5, 6, 7, 9 ✓
- `groupByStatus` defined in `lib/taskUtils.ts` Task 4, imported in `KanbanBoard` Task 7 ✓
- `parseExcelFile` defined in Task 3, imported in `page.tsx` Task 9 ✓
- `resolveBlockers` defined in Task 4, imported in `page.tsx` Task 9 ✓
