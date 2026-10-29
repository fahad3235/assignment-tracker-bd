# Assignment Tracker BD

Offline, bilingual (English / বাংলা) coursework deadline tracker for Bangladeshi
students. Add assignments with subject, due date, priority and status, and see
at a glance what is overdue, due today, or due within 3 days.

## Problem

Students juggle deadlines across subjects in notebooks, chat messages and
memory. A missed submission date costs marks. This tool keeps every deadline in
one place, in the browser, with no account and no internet connection.

## Features

1. **Assignment CRUD** — title, subject, due date, priority (High/Medium/Low),
   status (To do / In progress / Submitted), optional notes; inline validation
   (empty title/subject, invalid date, over-long fields are refused with a message).
2. **Dashboard** — total / to-do / in-progress / submitted / overdue / due-today /
   due-in-1–3-days counts, submitted-rate bar, and per-subject breakdown.
3. **Deadline badges** — every card shows days left, days overdue, "due today",
   or "submitted"; submitted items never count as overdue.
4. **Search, filter & sort** — live title/subject search, status filter chips,
   sort by due date or by priority.
5. **Export / Import** — JSON export (download) and strict import validation
   (wrong app, wrong version, duplicate ids and invalid rows are rejected whole,
   leaving existing data intact); typed-`DELETE` erase-all.
6. **Bilingual + mobile** — EN/বাংলা toggle persisted in localStorage, Bengali
   digits in the Bengali view, responsive down to 390 px, zero network requests.

## Stack

Vanilla HTML + CSS + JavaScript. No build step, no dependencies, no framework.
Pure logic lives in `js/logic.js` and is shared verbatim between the UI
(`js/app.js`) and the Node unit tests (`tests/test.js`).

## Prerequisites

Any modern browser. For the tests: Node.js 18+ and a headless Chromium at
`/opt/meta-chromium/chrome` (the smoke test's default; edit `tests/smoke.js`
if yours lives elsewhere).

## Run

Open `index.html` in a browser — that is all. Data is stored in this browser's
`localStorage` under `assignment-tracker-bd-v1` and never leaves the device.

Tip for deterministic dates while testing: append `?asof=YYYY-MM-DD` to the
URL and the app treats that date as "today".

## Tests

```sh
node tests/test.js    # 9 unit groups: date math, badges, validation, sort, filter, summary, import
node tests/smoke.js   # 17 headless-Chrome checks: render, add via form, badges,
                      # dashboard counts, BN toggle + digits, export→wipe→import
                      # round-trip, bad-import rejection, 390 px overflow, 0 console errors
```

## Deployment

Static site — serve the repository root with any static host (GitHub Pages:
main branch, root folder).

## Limitations

- Single-device: data lives in one browser's localStorage; there is no sync,
  account, or cloud backup (use Export for backups).
- No reminders/notifications: the app shows overdue items when opened but does
  not send alerts.
- Dates are calendar days (UTC date-only math); times of day are not tracked.
- This is a personal organizer, not affiliated with any university, and it
  makes no claim about any institution's deadline rules.

## Status

MVP complete. See `TEST_RESULTS.md` for the verified test run.
