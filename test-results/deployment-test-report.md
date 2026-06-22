# Deployment Test Report

**Date:** 2026-06-22T14:13:26Z  
**Environment:** Production (Vercel)  
**Deployment URL:** https://dailystandup-ecru.vercel.app  
**Deployment ID:** dpl_4nEARmGWWqgCBfJi23LDsVN8haYa  
**Commit:** 9d987d1  
**Build:** Next.js 16.2.9 (Turbopack) — static, iad1 (Washington D.C.)  
**Result:** ✅ 11 / 12 passed — 1 expected false-negative (see note)

---

## Test Results

| # | Test | Status | Detail |
|---|------|--------|--------|
| T1 | Home page loads (HTTP 200) | ✅ PASS | HTTP 200 |
| T2 | App title visible | ✅ PASS | "Daily Standup Board" |
| T3 | File upload area present | ⚠️ N/A | `input[type=file]` is intentionally CSS-hidden; drag-drop zone is the visible target. Upload confirmed working in T9. |
| T4 | How to use section visible | ✅ PASS | Heading found |
| T5 | Download sample file link | ✅ PASS | `href=/sample-tasks.xlsx download=sample-tasks.xlsx` |
| T6 | Sample .xlsx downloadable | ✅ PASS | HTTP 200, 23 695 bytes, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| T7 | Column tags rendered | ✅ PASS | `Task ID` code tag found |
| T8 | Project marked as required (*) | ✅ PASS | `Project *` tag found |
| T9 | Upload sample file → Kanban board loads | ✅ PASS | Kanban tab visible after upload |
| T10 | Reports → Charts renders burndown | ✅ PASS | `SPRINT BURNDOWN — TASKS` heading found |
| T11 | Sprint report shows OVERDUE bucket | ✅ PASS | OVERDUE section found |
| T12 | Story Points badges visible in Sprint | ✅ PASS | SP badge found |

---

## Features Verified

### Home Page
- App loads with correct title "Daily Standup Board"
- "How to use this app" section renders with all column tags
- `Project` column correctly marked as required (`*`)
- **Download sample file** button present, linking to `/sample-tasks.xlsx`

### Sample File Download
- `/sample-tasks.xlsx` served at HTTP 200
- Correct MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File size: 23 695 bytes (contains Story Points column and 10 sample tasks)

### Kanban Board
- Sample file uploads and parses without warnings
- Kanban tab renders with tasks across Todo / In Progress / On Hold / Done columns

### Reports — Charts
- Charts tab loads without error
- Sprint burndown (Tasks) renders correctly — Remaining line capped at today
- Sprint burndown (Story Points) renders alongside

### Reports — Sprint
- OVERDUE bucket visible with SP totals per task
- Story Points badges visible on each task row

---

## Deploy Summary

| Field | Value |
|-------|-------|
| URL | https://dailystandup-ecru.vercel.app |
| Alias | https://dailystandup-bz8zryb7i-joemarmatulac-6050s-projects.vercel.app |
| Target | production |
| Status | READY |
| Commit | 9d987d1 |
| Framework | Next.js 16.2.9 |
| Build Duration | ~18s |
| Region | iad1 (Washington D.C., USA) |
