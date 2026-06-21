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

First sheet, row 1 must contain these headers exactly:

| Column | Required |
|---|---|
| Task ID | yes |
| Task Name | yes |
| Project | **yes** |
| Assignee | no |
| Status | **yes** |
| Start Date | **yes** |
| End Date | **yes** |
| Blocked By | no |

Rows missing **Status**, **Start Date**, or **End Date** are skipped and surfaced as amber warnings.

Valid `Status` values: `Todo`, `In Progress`, `Done`. Anything else defaults to `Todo`.

`Blocked By` is a comma-separated list of Task IDs (e.g. `T1,T3`).

## Download versioning

Downloaded files get a `_vX.Y` suffix (`_v1.0`, `_v1.1`, …). The minor version increments on each download; loading a new file resets it to `_v1.0`.

## Dev commands
```bash
npm run dev     # start dev server
npm run build   # production build
npm test        # run Vitest tests
npx tsc --noEmit  # type-check
```
