@AGENTS.md

# Daily Standup Board

A Next.js app for visualising sprint tasks from an Excel file on a Kanban board.

## Stack
- Next.js (App Router), TypeScript, Tailwind CSS
- `xlsx` (SheetJS) for Excel parsing and export
- Vitest for unit tests

## Key files
- `app/page.tsx` — root page: file upload, warnings, how-to guide
- `components/ReportsTabs.tsx` — tab switcher (Kanban / Reports) + filter bar
- `components/KanbanBoard.tsx` / `KanbanColumn.tsx` / `TaskCard.tsx` — drag-and-drop board
- `lib/parseExcel.ts` — Excel → `Task[]`; enforces required fields
- `lib/exportExcel.ts` — `EnrichedTask[]` → downloadable `.xlsx`
- `lib/taskUtils.ts` — `resolveBlockers`, `groupByStatus`
- `types/task.ts` — `Task`, `EnrichedTask`, `TaskStatus`

## Excel format

First sheet (or whichever sheet the user picks), row 1 must contain these headers exactly:

| Column | Required |
|---|---|
| Task ID | **yes** |
| Task Name | **yes** |
| Project | **yes** |
| Task Description | no |
| Assignee | no |
| Story Points | no |
| Status | **yes** |
| Target Start Date | **yes** |
| Target End Date | **yes** |
| Actual Start Date | no |
| Actual End Date | no |
| On Hold Date | no |
| On Hold End Date | no |
| On Hold Reason | no |
| Blocked By | no |
| Dependency | no |
| Notes | no |

Rows missing any **required** field are skipped and surfaced as amber warnings.

Valid `Status` values: `Todo`, `In Progress`, `Validation & Testing`, `On Hold`, `Done`. Anything else defaults to `Todo`.

`Blocked By` and `Dependency` accept comma-separated Task IDs (e.g. `T1,T3`).

Dates can be Excel date cells or text in `YYYY-MM-DD` format.

`Actual Start Date` is auto-set when a task moves to **In Progress**; `Actual End Date` when moved to **Done**; `On Hold Date` + `On Hold Reason` when moved to **On Hold**.

## Download versioning

Downloaded files get a `_vX.Y` suffix (`_v1.0`, `_v1.1`, …). The minor version increments on each download; loading a new file resets it to `_v1.0`.

## Dev commands
```bash
npm run dev     # start dev server
npm run build   # production build
npm test        # run Vitest tests
npx tsc --noEmit  # type-check
```
