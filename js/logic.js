// Assignment Tracker BD — DOM-free logic.
// Used verbatim by the web UI (js/app.js) and by the Node unit tests.
// Dates are ISO YYYY-MM-DD strings compared as UTC calendar days, so
// "days left" never depends on the viewer's timezone.
(function (root) {
  'use strict';

  var PRIORITIES = ['high', 'medium', 'low'];
  var STATUSES = ['todo', 'progress', 'submitted'];
  var PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

  function isValidDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + 'T00:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }

  function dayNumber(iso) {
    // Days since epoch, UTC — safe for date-only arithmetic.
    var p = iso.split('-').map(Number);
    return Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000);
  }

  function todayISO(now) {
    var d = now ? new Date(now) : new Date();
    return d.toISOString().slice(0, 10);
  }

  // Days from today until due: 0 = due today, negative = overdue.
  function daysLeft(due, today) {
    return dayNumber(due) - dayNumber(today);
  }

  function badgeFor(a, today) {
    if (a.status === 'submitted') return 'submitted';
    var d = daysLeft(a.due, today);
    if (d < 0) return 'overdue';
    if (d === 0) return 'due-today';
    if (d <= 3) return 'due-soon';
    return 'upcoming';
  }

  function validateAssignment(a) {
    var errors = [];
    if (!a || typeof a !== 'object') return ['Invalid assignment'];
    if (typeof a.title !== 'string' || a.title.trim().length === 0) errors.push('Title is required');
    else if (a.title.trim().length > 120) errors.push('Title is too long (max 120)');
    if (typeof a.subject !== 'string' || a.subject.trim().length === 0) errors.push('Subject is required');
    else if (a.subject.trim().length > 60) errors.push('Subject is too long (max 60)');
    if (!isValidDate(a.due)) errors.push('Due date must be a valid YYYY-MM-DD date');
    if (PRIORITIES.indexOf(a.priority) === -1) errors.push('Priority must be high, medium or low');
    if (STATUSES.indexOf(a.status) === -1) errors.push('Status must be todo, progress or submitted');
    if (a.notes !== undefined && typeof a.notes !== 'string') errors.push('Notes must be text');
    else if (typeof a.notes === 'string' && a.notes.length > 500) errors.push('Notes are too long (max 500)');
    return errors;
  }

  function sortAssignments(list) {
    return list.slice().sort(function (x, y) {
      if (x.due !== y.due) return x.due < y.due ? -1 : 1;
      if (PRIORITY_RANK[x.priority] !== PRIORITY_RANK[y.priority]) {
        return PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority];
      }
      return x.title.localeCompare(y.title);
    });
  }

  function filterAssignments(list, statusFilter, query) {
    var q = (query || '').trim().toLowerCase();
    return list.filter(function (a) {
      if (statusFilter && statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (q && (a.title.toLowerCase().indexOf(q) === -1 && a.subject.toLowerCase().indexOf(q) === -1)) return false;
      return true;
    });
  }

  function summarize(list, today) {
    var s = { total: 0, todo: 0, progress: 0, submitted: 0, overdue: 0, dueToday: 0, dueSoon: 0, bySubject: {} };
    list.forEach(function (a) {
      s.total++;
      s[a.status]++;
      var b = badgeFor(a, today);
      if (b === 'overdue') s.overdue++;
      if (b === 'due-today') s.dueToday++;
      if (b === 'due-soon') s.dueSoon++;
      s.bySubject[a.subject] = (s.bySubject[a.subject] || 0) + 1;
    });
    s.submittedRate = s.total ? Math.round((s.submitted / s.total) * 100) : 0;
    return s;
  }

  function validateImport(data) {
    var errors = [];
    if (!data || typeof data !== 'object') return ['Import must be a JSON object'];
    if (data.app !== 'assignment-tracker-bd') errors.push('Not an Assignment Tracker BD export (app mismatch)');
    if (data.version !== 1) errors.push('Unsupported export version');
    if (!Array.isArray(data.assignments)) errors.push('assignments must be an array');
    else {
      if (data.assignments.length > 500) errors.push('Too many assignments (max 500)');
      var ids = {};
      data.assignments.forEach(function (a, i) {
        if (typeof a.id !== 'string' || !a.id) errors.push('Assignment ' + (i + 1) + ' is missing an id');
        else if (ids[a.id]) errors.push('Duplicate id: ' + a.id);
        else ids[a.id] = true;
        validateAssignment(a).forEach(function (e) { errors.push('Assignment ' + (i + 1) + ': ' + e); });
      });
    }
    return errors;
  }

  var api = {
    PRIORITIES: PRIORITIES, STATUSES: STATUSES, isValidDate: isValidDate,
    dayNumber: dayNumber, todayISO: todayISO, daysLeft: daysLeft,
    badgeFor: badgeFor, validateAssignment: validateAssignment,
    sortAssignments: sortAssignments, filterAssignments: filterAssignments,
    summarize: summarize, validateImport: validateImport
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ATLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
