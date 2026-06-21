# Daily Standup Board

A Next.js app that turns an Excel sprint sheet into an interactive Kanban board — with drag-and-drop status updates, filters, and versioned Excel export.

## Features

- **Upload any `.xlsx` sprint file** — parsed client-side, nothing leaves the browser
- **Kanban board** — tasks grouped into Todo / In Progress / Done columns
- **Drag and drop** — move cards between columns to update status
- **Filters** — narrow by assignee, start date, and end date
- **Reports tab** — workload, sprint summary, blocked tasks, and dependency chain views
- **Download updated Excel** — exports current board state with a `_v1.0`, `_v1.1` … version suffix

## Excel format

The first sheet must have these column headers in row 1:

| Column | Required | Notes |
|---|---|---|
| Task ID | yes | Unique identifier, e.g. `T1` |
| Task Name | yes | |
| Assignee | no | |
| **Status** | **yes** | `Todo`, `In Progress`, or `Done` |
| **Start Date** | **yes** | `YYYY-MM-DD` or Excel date |
| **End Date** | **yes** | `YYYY-MM-DD` or Excel date |
| Blocked By | no | Comma-separated Task IDs, e.g. `T1,T3` |

Rows missing **Status**, **Start Date**, or **End Date** are skipped and shown as warnings after upload.

A sample file is available at [`public/sample-tasks.xlsx`](public/sample-tasks.xlsx).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload an `.xlsx` file to get started.

## Running tests

```bash
npm test
```
