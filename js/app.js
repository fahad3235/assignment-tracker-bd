// Assignment Tracker BD — UI. Depends on js/logic.js (window.ATLogic).
(function () {
  'use strict';
  var L = window.ATLogic;
  var STORE_KEY = 'assignment-tracker-bd-v1';
  var LANG_KEY = 'assignment-tracker-bd-lang';

  var I18N = {
    en: {
      appTitle: 'Assignment Tracker BD', tagline: 'Coursework deadlines, under control',
      tabDashboard: 'Dashboard', tabAssignments: 'Assignments', tabData: 'Data',
      total: 'Total', todo: 'To do', inProgress: 'In progress', submitted: 'Submitted',
      overdue: 'Overdue', dueToday: 'Due today', dueSoon: 'Due in 1–3 days',
      submittedRate: 'Submitted rate', bySubject: 'By subject',
      addTitle: 'Add assignment', title: 'Title', subject: 'Subject', due: 'Due date',
      priority: 'Priority', status: 'Status', notes: 'Notes (optional)',
      high: 'High', medium: 'Medium', low: 'Low',
      todoLabel: 'To do', progressLabel: 'In progress', submittedLabel: 'Submitted',
      addBtn: 'Add assignment', saveBtn: 'Save changes', cancelBtn: 'Cancel',
      searchPh: 'Search title or subject…', allStatuses: 'All statuses',
      sortDue: 'Sort: due date', sortPriority: 'Sort: priority',
      markSubmitted: 'Mark submitted', edit: 'Edit', delete: 'Delete',
      empty: 'No assignments yet. Add your first one above.',
      emptyFiltered: 'Nothing matches this filter.',
      exportTitle: 'Export / Import', exportBtn: 'Download JSON', importBtn: 'Import JSON',
      importPh: 'Paste exported JSON here…', clearBtn: 'Erase all data',
      clearConfirm: 'Type DELETE to erase all assignments.',
      daysLeft: 'days left', daysOverdue: 'days overdue', dueTodayTxt: 'due today',
      footer: 'Offline personal tool. Data stays in this browser (localStorage). Not affiliated with any university.',
      confirmDelete: 'Delete this assignment?',
      langBtn: 'বাংলা'
    },
    bn: {
      appTitle: 'অ্যাসাইনমেন্ট ট্র্যাকার বিডি', tagline: 'কোর্সওয়ার্কের ডেডলাইন এখন নিয়ন্ত্রণে',
      tabDashboard: 'ড্যাশবোর্ড', tabAssignments: 'অ্যাসাইনমেন্ট', tabData: 'ডেটা',
      total: 'মোট', todo: 'করতে হবে', inProgress: 'চলমান', submitted: 'জমা দেওয়া',
      overdue: 'মেয়াদোত্তীর্ণ', dueToday: 'আজ জমা', dueSoon: '১–৩ দিনের মধ্যে',
      submittedRate: 'জমা দেওয়ার হার', bySubject: 'বিষয় অনুযায়ী',
      addTitle: 'অ্যাসাইনমেন্ট যোগ করুন', title: 'শিরোনাম', subject: 'বিষয়', due: 'জমা দেওয়ার তারিখ',
      priority: 'অগ্রাধিকার', status: 'অবস্থা', notes: 'নোট (ঐচ্ছিক)',
      high: 'উচ্চ', medium: 'মাঝারি', low: 'কম',
      todoLabel: 'করতে হবে', progressLabel: 'চলমান', submittedLabel: 'জমা দেওয়া',
      addBtn: 'অ্যাসাইনমেন্ট যোগ করুন', saveBtn: 'পরিবর্তন সংরক্ষণ করুন', cancelBtn: 'বাতিল',
      searchPh: 'শিরোনাম বা বিষয় খুঁজুন…', allStatuses: 'সব অবস্থা',
      sortDue: 'সাজান: তারিখ অনুযায়ী', sortPriority: 'সাজান: অগ্রাধিকার অনুযায়ী',
      markSubmitted: 'জমা দেওয়া হয়েছে চিহ্নিত করুন', edit: 'সম্পাদনা', delete: 'মুছুন',
      empty: 'এখনো কোনো অ্যাসাইনমেন্ট নেই। উপরে প্রথমটি যোগ করুন।',
      emptyFiltered: 'এই ফিল্টারে কিছু মিলছে না।',
      exportTitle: 'এক্সপোর্ট / ইমপোর্ট', exportBtn: 'JSON ডাউনলোড', importBtn: 'JSON ইমপোর্ট',
      importPh: 'এখানে এক্সপোর্ট করা JSON পেস্ট করুন…', clearBtn: 'সব ডেটা মুছুন',
      clearConfirm: 'সব অ্যাসাইনমেন্ট মুছতে DELETE লিখুন।',
      daysLeft: 'দিন বাকি', daysOverdue: 'দিন মেয়াদোত্তীর্ণ', dueTodayTxt: 'আজ জমা',
      footer: 'অফলাইন ব্যক্তিগত টুল। ডেটা এই ব্রাউজারেই থাকে (localStorage)। কোনো বিশ্ববিদ্যালয়ের সঙ্গে সম্পৃক্ত নয়।',
      confirmDelete: 'এই অ্যাসাইনমেন্টটি মুছবেন?',
      langBtn: 'English'
    }
  };

  var BN_DIGITS = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  function bnDigits(s, lang) {
    if (lang !== 'bn') return String(s);
    return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[d]; });
  }

  function today() {
    var m = /[?&]asof=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    return (m && L.isValidDate(m[1])) ? m[1] : L.todayISO();
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.filter(function (a) { return L.validateAssignment(a).length === 0 && typeof a.id === 'string'; });
    } catch (e) { return []; }
  }
  function save(list) { localStorage.setItem(STORE_KEY, JSON.stringify(list)); }

  var state = {
    list: load(),
    lang: localStorage.getItem(LANG_KEY) || 'en',
    tab: 'dashboard',
    statusFilter: 'all',
    query: '',
    sort: 'due',
    editingId: null
  };
  function t(k) { return (I18N[state.lang] || I18N.en)[k] || k; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function uid() { return 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

  function render() {
    var lang = state.lang;
    document.getElementById('appTitle').textContent = t('appTitle');
    document.getElementById('tagline').textContent = t('tagline');
    document.getElementById('langBtn').textContent = t('langBtn');
    document.getElementById('tabDashboard').textContent = t('tabDashboard');
    document.getElementById('tabAssignments').textContent = t('tabAssignments');
    document.getElementById('tabData').textContent = t('tabData');
    document.getElementById('footerText').textContent = t('footer');
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === state.tab);
    });
    document.querySelectorAll('.tab-panel').forEach(function (p) {
      p.hidden = p.dataset.panel !== state.tab;
    });
    renderDashboard(); renderList(); renderFormLabels();
  }

  function renderFormLabels() {
    var map = { lblTitle: 'title', lblSubject: 'subject', lblDue: 'due', lblPriority: 'priority', lblStatus: 'status', lblNotes: 'notes' };
    Object.keys(map).forEach(function (id) { document.getElementById(id).textContent = t(map[id]); });
    document.getElementById('formTitle').textContent = t('addTitle');
    document.getElementById('addBtn').textContent = state.editingId ? t('saveBtn') : t('addBtn');
    document.getElementById('cancelBtn').textContent = t('cancelBtn');
    document.getElementById('cancelBtn').hidden = !state.editingId;
    document.getElementById('search').placeholder = t('searchPh');
    document.getElementById('exportTitle').textContent = t('exportTitle');
    document.getElementById('exportBtn').textContent = t('exportBtn');
    document.getElementById('importBtn').textContent = t('importBtn');
    document.getElementById('importBox').placeholder = t('importPh');
    document.getElementById('clearBtn').textContent = t('clearBtn');
    var pri = document.getElementById('priority');
    pri.options[0].text = t('high'); pri.options[1].text = t('medium'); pri.options[2].text = t('low');
    var st = document.getElementById('status');
    st.options[0].text = t('todoLabel'); st.options[1].text = t('progressLabel'); st.options[2].text = t('submittedLabel');
    var sf = document.getElementById('statusFilter');
    sf.options[0].text = t('allStatuses'); sf.options[1].text = t('todoLabel');
    sf.options[2].text = t('progressLabel'); sf.options[3].text = t('submittedLabel');
    var so = document.getElementById('sortSel');
    so.options[0].text = t('sortDue'); so.options[1].text = t('sortPriority');
  }

  function badgeText(a) {
    var b = L.badgeFor(a, today());
    var d = L.daysLeft(a.due, today());
    if (b === 'submitted') return t('submittedLabel');
    if (b === 'overdue') return bnDigits(-d, state.lang) + ' ' + t('daysOverdue');
    if (b === 'due-today') return t('dueTodayTxt');
    if (b === 'due-soon') return bnDigits(d, state.lang) + ' ' + t('daysLeft');
    return bnDigits(d, state.lang) + ' ' + t('daysLeft');
  }

  function renderDashboard() {
    var s = L.summarize(state.list, today());
    var cards = [
      ['total', s.total], ['todo', s.todo], ['inProgress', s.progress], ['submitted', s.submitted],
      ['overdue', s.overdue], ['dueToday', s.dueToday], ['dueSoon', s.dueSoon]
    ];
    document.getElementById('statCards').innerHTML = cards.map(function (c) {
      return '<div class="stat"><div class="stat-num">' + bnDigits(c[1], state.lang) + '</div><div class="stat-label">' + t(c[0]) + '</div></div>';
    }).join('');
    document.getElementById('rateText').textContent = t('submittedRate') + ': ' + bnDigits(s.submittedRate, state.lang) + '%';
    document.getElementById('rateBar').style.width = s.submittedRate + '%';
    var subjects = Object.keys(s.bySubject).sort();
    document.getElementById('bySubject').innerHTML = subjects.length
      ? subjects.map(function (sub) { return '<div class="subj-row"><span>' + esc(sub) + '</span><strong>' + bnDigits(s.bySubject[sub], state.lang) + '</strong></div>'; }).join('')
      : '<p class="muted">' + t('empty') + '</p>';
    document.getElementById('bySubjectTitle').textContent = t('bySubject');
  }

  function renderList() {
    var filtered = L.filterAssignments(state.list, state.statusFilter, state.query);
    var sorted = state.sort === 'priority'
      ? filtered.slice().sort(function (x, y) {
          var r = { high: 0, medium: 1, low: 2 };
          if (r[x.priority] !== r[y.priority]) return r[x.priority] - r[y.priority];
          return x.due < y.due ? -1 : 1;
        })
      : L.sortAssignments(filtered);
    var el = document.getElementById('list');
    if (!sorted.length) {
      el.innerHTML = '<p class="muted">' + (state.list.length ? t('emptyFiltered') : t('empty')) + '</p>';
      return;
    }
    el.innerHTML = sorted.map(function (a) {
      var b = L.badgeFor(a, today());
      return '<article class="card badge-' + b + '" data-id="' + esc(a.id) + '">' +
        '<div class="card-top"><h3>' + esc(a.title) + '</h3><span class="badge">' + esc(badgeText(a)) + '</span></div>' +
        '<p class="meta">' + esc(a.subject) + ' · ' + bnDigits(a.due, state.lang) + ' · ' + t(a.priority) + '</p>' +
        (a.notes ? '<p class="notes">' + esc(a.notes) + '</p>' : '') +
        '<div class="actions">' +
        (a.status !== 'submitted' ? '<button data-act="submit">' + t('markSubmitted') + '</button>' : '') +
        '<button data-act="edit">' + t('edit') + '</button>' +
        '<button data-act="delete">' + t('delete') + '</button></div></article>';
    }).join('');
    el.querySelectorAll('.card').forEach(function (card) {
      var id = card.dataset.id;
      card.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.dataset.act;
          if (act === 'submit') {
            state.list = state.list.map(function (a) { return a.id === id ? Object.assign({}, a, { status: 'submitted' }) : a; });
          } else if (act === 'edit') {
            var a = state.list.filter(function (x) { return x.id === id; })[0];
            if (a) {
              state.editingId = id;
              document.getElementById('title').value = a.title;
              document.getElementById('subject').value = a.subject;
              document.getElementById('due').value = a.due;
              document.getElementById('priority').value = a.priority;
              document.getElementById('status').value = a.status;
              document.getElementById('notes').value = a.notes || '';
              state.tab = 'assignments'; window.scrollTo(0, 0);
            }
          } else if (act === 'delete') {
            if (confirm(t('confirmDelete'))) state.list = state.list.filter(function (x) { return x.id !== id; });
          }
          save(state.list); render();
        });
      });
    });
  }

  function showFormError(msg) {
    var el = document.getElementById('formError');
    el.textContent = msg || ''; el.hidden = !msg;
  }

  document.getElementById('assignForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var a = {
      id: state.editingId || uid(),
      title: document.getElementById('title').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      due: document.getElementById('due').value,
      priority: document.getElementById('priority').value,
      status: document.getElementById('status').value,
      notes: document.getElementById('notes').value.trim()
    };
    var errs = L.validateAssignment(a);
    if (errs.length) { showFormError(errs.join(' · ')); return; }
    showFormError('');
    if (state.editingId) state.list = state.list.map(function (x) { return x.id === state.editingId ? a : x; });
    else state.list.push(a);
    state.editingId = null;
    e.target.reset();
    save(state.list); render();
  });
  document.getElementById('cancelBtn').addEventListener('click', function () {
    state.editingId = null; document.getElementById('assignForm').reset(); showFormError(''); render();
  });
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.addEventListener('click', function () { state.tab = b.dataset.tab; render(); });
  });
  document.getElementById('langBtn').addEventListener('click', function () {
    state.lang = state.lang === 'en' ? 'bn' : 'en';
    localStorage.setItem(LANG_KEY, state.lang); render();
  });
  document.getElementById('search').addEventListener('input', function (e) { state.query = e.target.value; renderList(); });
  document.getElementById('statusFilter').addEventListener('change', function (e) { state.statusFilter = e.target.value; renderList(); });
  document.getElementById('sortSel').addEventListener('change', function (e) { state.sort = e.target.value; renderList(); });
  document.getElementById('exportBtn').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify({ app: 'assignment-tracker-bd', version: 1, assignments: state.list }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'assignment-tracker-bd.json'; a.click();
  });
  document.getElementById('importBtn').addEventListener('click', function () {
    var el = document.getElementById('importBox'); var msg = document.getElementById('importMsg');
    try {
      var data = JSON.parse(el.value);
      var errs = L.validateImport(data);
      if (errs.length) { msg.textContent = errs.join(' · '); msg.className = 'error'; return; }
      state.list = data.assignments; save(state.list); msg.textContent = 'OK'; msg.className = 'ok'; render();
    } catch (err) { msg.textContent = 'Invalid JSON'; msg.className = 'error'; }
  });
  document.getElementById('clearBtn').addEventListener('click', function () {
    var v = prompt(t('clearConfirm'));
    if (v === 'DELETE') { state.list = []; state.editingId = null; save(state.list); render(); }
  });

  window.AT = {
    exportJSON: function () { return JSON.stringify({ app: 'assignment-tracker-bd', version: 1, assignments: state.list }); },
    importJSON: function (s) {
      var data = JSON.parse(s); var errs = L.validateImport(data);
      if (errs.length) return errs;
      state.list = data.assignments; save(state.list); render(); return [];
    },
    getState: function () { return state; }
  };

  render();
})();
