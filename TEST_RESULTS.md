# Test results — assignment-tracker-bd (run #170, 2026-10-29 10:00 slot)

## Unit tests — 9/9 groups green (`node tests/test.js`)

- daysLeft: today=0, tomorrow=1, yesterday=-1, +31 days across months.
- isValidDate rejects 2026-02-30, `29-10-2026`, month 13.
- badgeFor: overdue / due-today / due-soon (≤3 days) / upcoming / submitted-wins
  (a submitted item with a past due date is "submitted", never "overdue").
- validateAssignment flags empty title, bad date, bad priority; clean row passes.
- sortAssignments: due date first, then priority rank, then title.
- filterAssignments: status filter + case-insensitive title/subject query.
- summarize hand-verified: 5 items (1 overdue, 1 due today, 1 due soon,
  2 submitted) → total 5, submitted rate 40%, bySubject Math 2 / ENG 3.
- summarize on empty list: rate 0, not NaN.
- validateImport: good export passes; wrong app, version 2, duplicate id,
  invalid row, non-object all rejected.

One test-side fix during the run: the first summarize fixture marked the
due-soon item "submitted", which by design suppresses the due-soon badge;
the fixture was corrected (item made "todo", plus a second submitted item).
No app-logic change resulted.

## Headless-Chrome smoke — 17/17 green (`node tests/smoke.js`, ?asof=2026-10-29)

Title/tabs/empty state render; 2 assignments added through the real form;
overdue badge ("days overdue") on the past-due card; dashboard overdue count;
বাংলা toggle renders the Bengali title and Bengali digits (২) in stats;
export JSON parses with the app tag and 2 assignments; wipe via import → 0
cards; re-import → 2 cards back; bad import rejected with data intact;
390 px mobile: no horizontal overflow; 0 console/page errors overall.

Two harness-only fixes during the run: an `await` precedence bug in one
assertion, and a stale Chrome from the crashed first run holding the fixed
debug port (smoke port is now derived from the process id). No app bugs found
by the smoke run.
