'use client'

import { useState } from 'react'

export function HowToUse() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">How to use this app</span>
        <span className="text-gray-400 dark:text-gray-500 text-lg leading-none">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-6 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">

          {/* Step 1 */}
          <section className="pt-5 space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">1 — Prepare your Excel file</h3>
            <p>Your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.xlsx</code> file must have a header row (row 1) with exactly these column names:</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">Column</th>
                    <th className="px-3 py-2 text-left">Required</th>
                    <th className="px-3 py-2 text-left">Example</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[
                    ['Task ID', 'Yes', 'T1', 'Unique identifier — used for dependencies'],
                    ['Task Name', 'Yes', 'Build login page', 'Short description of the task'],
                    ['Assignee', 'No', 'Alice', 'Person responsible'],
                    ['Status', 'No', 'In Progress', 'Todo · In Progress · Validation & Testing · On Hold · Done (defaults to Todo)'],
                    ['Target Start Date', 'No', '2026-06-01', 'YYYY-MM-DD or Excel date cell'],
                    ['Target End Date', 'No', '2026-06-15', 'YYYY-MM-DD or Excel date cell'],
                    ['Blocked By', 'No', 'T1,T3', 'Comma-separated Task IDs this task depends on'],
                  ].map(([col, req, ex, note]) => (
                    <tr key={col} className="even:bg-gray-50 dark:even:bg-gray-800/50">
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{col}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${req === 'Yes' ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{req}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{ex}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Step 2 */}
          <section className="space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">2 — Upload the file</h3>
            <p>Drag and drop your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.xlsx</code> file onto the upload zone above, or click it to browse. The app reads the file entirely in your browser — nothing is sent to a server.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">Tip: your OneDrive-synced file opens just like any local file.</p>
          </section>

          {/* Step 3 */}
          <section className="space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">3 — Explore the views</h3>
            <div className="space-y-1.5">
              {[
                ['Kanban', 'Tasks grouped into Todo / In Progress / Validation & Testing / On Hold / Done columns. Cards show who owns it, the date range, and dependency badges.'],
                ['Reports → Blocked', 'Tasks that can\'t proceed yet — split into "actively blocked" (blocker still open) vs "waiting" (blocker done but task not started).'],
                ['Reports → Workload', 'All tasks grouped by assignee with a summary count (done / in progress / todo) per person.'],
                ['Reports → Sprint', 'Tasks bucketed as Overdue, Due this week, Upcoming, or Completed based on End Date.'],
                ['Reports → Dependency Chains', 'Full dependency tree — see the chain from root tasks all the way to the final deliverables.'],
              ].map(([view, desc]) => (
                <div key={view} className="flex gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{view}:</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Step 4 */}
          <section className="space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">4 — Update statuses and download</h3>
            <p>You can change a task's status directly in the Kanban board. When done, click <strong>Download updated Excel</strong> to save the changes back to an <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.xlsx</code> file — replace your original to keep the team's shared file up to date.</p>
          </section>

          {/* Dependencies example */}
          <section className="space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Dependency example</h3>
            <p>If Task T3 has <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">Blocked By = T1,T2</code>, then:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400">
              <li>T3's card shows red "Blocked by" badges for T1 and T2</li>
              <li>T1 and T2's cards show an amber "Blocks T3" badge</li>
              <li>T3 appears in the Blocked report until T1 and T2 are both Done</li>
              <li>The Dependency Chains view renders: T1 → T3 and T2 → T3</li>
            </ul>
          </section>

        </div>
      )}
    </div>
  )
}
