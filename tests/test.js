// Node unit tests for js/logic.js. Usage: node tests/test.js
const assert = require('assert');
const L = require('../js/logic.js');
let n = 0;
function ok(name, fn) { fn(); n++; console.log('ok - ' + name); }
const T = '2026-10-29'; // fixed "today" for deterministic tests

ok('daysLeft: today=0, tomorrow=1, yesterday=-1', () => {
  assert.strictEqual(L.daysLeft('2026-10-29', T), 0);
  assert.strictEqual(L.daysLeft('2026-10-30', T), 1);
  assert.strictEqual(L.daysLeft('2026-10-28', T), -1);
  assert.strictEqual(L.daysLeft('2026-11-29', T), 31);
});
ok('isValidDate rejects 2026-02-30 and bad formats', () => {
  assert.strictEqual(L.isValidDate('2026-02-30'), false);
  assert.strictEqual(L.isValidDate('2026-10-29'), true);
  assert.strictEqual(L.isValidDate('29-10-2026'), false);
  assert.strictEqual(L.isValidDate('2026-13-01'), false);
});
ok('badgeFor: overdue / due-today / due-soon / upcoming / submitted-wins', () => {
  const base = { title: 'X', subject: 'S', priority: 'low' };
  assert.strictEqual(L.badgeFor({ ...base, due: '2026-10-28', status: 'todo' }, T), 'overdue');
  assert.strictEqual(L.badgeFor({ ...base, due: '2026-10-29', status: 'todo' }, T), 'due-today');
  assert.strictEqual(L.badgeFor({ ...base, due: '2026-11-01', status: 'progress' }, T), 'due-soon');
  assert.strictEqual(L.badgeFor({ ...base, due: '2026-11-02', status: 'todo' }, T), 'upcoming');
  assert.strictEqual(L.badgeFor({ ...base, due: '2026-10-20', status: 'submitted' }, T), 'submitted');
});
ok('validateAssignment: empty title, bad date, bad priority each flagged', () => {
  assert.ok(L.validateAssignment({ title: ' ', subject: 'S', due: '2026-10-29', priority: 'high', status: 'todo' }).length > 0);
  assert.ok(L.validateAssignment({ title: 'X', subject: 'S', due: '2026-02-30', priority: 'high', status: 'todo' }).length > 0);
  assert.ok(L.validateAssignment({ title: 'X', subject: 'S', due: '2026-10-29', priority: 'urgent', status: 'todo' }).length > 0);
  assert.strictEqual(L.validateAssignment({ title: 'X', subject: 'S', due: '2026-10-29', priority: 'high', status: 'todo' }).length, 0);
});
ok('sortAssignments: due first, then priority, then title', () => {
  const list = [
    { title: 'B', subject: 'S', due: '2026-10-30', priority: 'low', status: 'todo' },
    { title: 'A', subject: 'S', due: '2026-10-30', priority: 'high', status: 'todo' },
    { title: 'C', subject: 'S', due: '2026-10-28', priority: 'low', status: 'todo' },
  ];
  assert.deepStrictEqual(L.sortAssignments(list).map(a => a.title), ['C', 'A', 'B']);
});
ok('filterAssignments: status + case-insensitive query', () => {
  const list = [
    { title: 'DS Lab', subject: 'Data Structure', due: '2026-10-30', priority: 'high', status: 'todo' },
    { title: 'Essay', subject: 'English', due: '2026-10-30', priority: 'low', status: 'submitted' },
  ];
  assert.strictEqual(L.filterAssignments(list, 'todo', '').length, 1);
  assert.strictEqual(L.filterAssignments(list, 'all', 'ds lab').length, 1);
  assert.strictEqual(L.filterAssignments(list, 'all', 'english').length, 1);
  assert.strictEqual(L.filterAssignments(list, 'all', 'zzz').length, 0);
});
ok('summarize: hand-verified counts and rate', () => {
  const list = [
    { title: 'A', subject: 'Math', due: '2026-10-28', priority: 'high', status: 'todo' },
    { title: 'B', subject: 'Math', due: '2026-10-29', priority: 'high', status: 'progress' },
    { title: 'C', subject: 'ENG', due: '2026-10-31', priority: 'low', status: 'todo' },
    { title: 'D', subject: 'ENG', due: '2026-11-20', priority: 'low', status: 'submitted' },
    { title: 'E', subject: 'ENG', due: '2026-10-25', priority: 'low', status: 'submitted' },
  ];
  const s = L.summarize(list, T);
  assert.strictEqual(s.total, 5); assert.strictEqual(s.overdue, 1);
  assert.strictEqual(s.dueToday, 1); assert.strictEqual(s.dueSoon, 1);
  assert.strictEqual(s.submitted, 2); assert.strictEqual(s.submittedRate, 40);
  assert.deepStrictEqual(s.bySubject, { Math: 2, ENG: 3 });
});
ok('summarize: empty list has 0 rate, not NaN', () => {
  const s = L.summarize([], T);
  assert.strictEqual(s.total, 0); assert.strictEqual(s.submittedRate, 0);
});
ok('validateImport: good passes; wrong app, dup id, bad row rejected', () => {
  const good = { app: 'assignment-tracker-bd', version: 1, assignments: [{ id: 'a1', title: 'X', subject: 'S', due: '2026-10-29', priority: 'high', status: 'todo' }] };
  assert.strictEqual(L.validateImport(good).length, 0);
  assert.ok(L.validateImport({ ...good, app: 'other' }).length > 0);
  assert.ok(L.validateImport({ ...good, version: 2 }).length > 0);
  assert.ok(L.validateImport({ ...good, assignments: [good.assignments[0], good.assignments[0]] }).length > 0);
  assert.ok(L.validateImport({ app: 'assignment-tracker-bd', version: 1, assignments: [{ id: 'a1', title: '', subject: 'S', due: '2026-10-29', priority: 'high', status: 'todo' }] }).length > 0);
  assert.ok(L.validateImport('nope').length > 0);
});
console.log(n + '/9 unit groups passed');
