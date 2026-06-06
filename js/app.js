/* ═══════════════════════════════════════════════════════════════════
   Reverence — app.js
   Dance Trainer & Journal
═══════════════════════════════════════════════════════════════════ */

'use strict';

// ── Constants ────────────────────────────────────────────────────────
const STYLES      = ['Ballet','Contemporary','Lyrical','Jazz','Tap','Hip-Hop'];
const GROUPS      = ['Company','Competition','Pointe'];
const MOODS       = ['✨ Inspired','😊 Good','😐 Okay','😓 Tired','💪 Strong'];
const DAYS        = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const CLASS_TYPES = ['Regular','Intensive','Masterclass','Camp','Rehearsal','Other'];
const BODY_AREAS  = ['Foot/Ankle','Knee','Hip','Lower Back','Upper Back','Shoulder','Wrist','Neck','Other'];
const INJ_STATUS  = ['Active','Recovering','Healed'];

const BADGE_DEFS = [
  { id: 'first_entry',  icon: '🩰', label: 'First Steps',   desc: 'Logged your first session' },
  { id: 'streak_7',     icon: '🔥', label: 'Week Warrior',  desc: '7-day practice streak' },
  { id: 'goals_1',      icon: '⭐', label: 'Goal Getter',   desc: 'Completed your first goal' },
  { id: 'pointe_ready', icon: '🌟', label: 'Pointe Ready',  desc: 'Completed readiness checklist' },
  { id: 'hours_10',     icon: '⏱️', label: '10 Hours',      desc: 'Logged 10 hours of practice' },
  { id: 'comp_1',       icon: '🏆', label: 'Competitor',    desc: 'Logged first competition' },
  { id: 'hours_50',     icon: '💫', label: '50 Hours',      desc: 'Logged 50 hours of practice' },
  { id: 'styles_all',   icon: '🎭', label: 'All Styles',    desc: 'Logged sessions in all 6 styles' },
];

const DEFAULT_SKILLS = {
  Ballet:        ['Pliés','Tendus','Dégagés','Ronds de jambe','Arabesques','Attitudes','Pirouettes','Grand battement','Adagio','Pointe work'],
  Contemporary:  ['Floor work','Improvisation','Partnering','Release technique','Contraction','Spiral','Balance','Jumps','Turns','Storytelling'],
  Lyrical:       ['Emotional expression','Flexibility','Turns','Leaps','Transitions','Musicality','Arms','Footwork','Lifts','Performance'],
  Jazz:          ['Isolations','Kicks','Turns','Leaps','Across the floor','Styling','Rhythmic accuracy','Performance energy','Flexibility','Strength'],
  Tap:           ['Shuffles','Flaps','Buffalo','Cramp roll','Wings','Paradiddle','Rhythm','Speed','Clarity','Improvisation'],
  'Hip-Hop':     ['Grooves','Popping','Locking','Footwork','Freestyle','Musicality','Levels','Strength','Battles','Cyphers'],
};

const POINTE_READINESS = [
  'Teacher clearance obtained', 'Sufficient ankle strength',
  'Consistent parallel relevé',  'Core strength assessed',
  'Proper pointe shoe fitting',   'First pointe lesson completed',
];

const POINTE_COND = [
  'Theraband exercises', 'Calf raises', 'Ankle circles',
  'Arch strengthening',  'Balance work', 'Core stability',
];

// ── Storage ───────────────────────────────────────────────────────────
const KV = {
  get(k)    { try { const v = localStorage.getItem('rev_' + k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem('rev_' + k, JSON.stringify(v)); } catch {} },
};

// ── Utilities ─────────────────────────────────────────────────────────
const uid          = () => Math.random().toString(36).slice(2, 10);
const today        = () => new Date().toISOString().split('T')[0];
const fmtDate      = d  => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtDateShort = d  => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const esc          = s  => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const dayName      = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });
const todayFmt     = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// ── App State ─────────────────────────────────────────────────────────
let D           = null;   // global data object
let currentTab  = 'home';
let modalStack  = [];     // stack of closers for layered modals

// Tab-local UI state
let jFilterSeason  = 'all';
let jFilterStyle   = 'all';
let schedView      = 'active';
let expandedSeason = null;
let skillsView     = 'styles';
let activeStyle    = null;
let activeGroup    = null;

// Modal-local mutable state
let selectedMood      = MOODS[1];
let selectedDays      = [];
let newClassSeasonId  = null;
let selectedInjStatus = INJ_STATUS[0];

// ── Data initialisation ───────────────────────────────────────────────
function initData() {
  return {
    userToken:    uid(),
    userName:     '',
    studioName:   '',
    activeStyles: [...STYLES],
    activeGroups: [...GROUPS],
    seasons:      [],
    entries:      [],
    skills:       Object.fromEntries(
      STYLES.map(s => [s, DEFAULT_SKILLS[s].map(n => ({ id: uid(), name: n, level: 0 }))])
    ),
    goals:        [],
    competitions: [],
    pointeLog:    { readiness: {}, shoes: [], conditioning: {} },
    badges:       [],
    injuryLog:    [],
  };
}

function save() {
  KV.set('appdata', D);
}

function checkBadges() {
  const b   = D.badges;
  const add = id => { if (!b.includes(id)) b.push(id); };

  if (D.entries.length >= 1) add('first_entry');

  const hrs = D.entries.reduce((a, e) => a + (e.duration || 0), 0) / 60;
  if (hrs >= 10) add('hours_10');
  if (hrs >= 50) add('hours_50');

  if (D.competitions.length >= 1)         add('comp_1');
  if (D.goals.some(g => g.completed))     add('goals_1');
  if (POINTE_READINESS.every(r => D.pointeLog.readiness[r])) add('pointe_ready');

  const usedStyles = new Set(D.entries.map(e => e.style));
  if (STYLES.every(s => usedStyles.has(s))) add('styles_all');

  // Streak
  let streak = 0;
  let cur = new Date(); cur.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const ds = cur.toISOString().split('T')[0];
    if (D.entries.some(e => e.date === ds)) { streak++; cur.setDate(cur.getDate() - 1); }
    else if (i === 0)                        { cur.setDate(cur.getDate() - 1); }
    else                                      break;
  }
  if (streak >= 7) add('streak_7');
}

// ── Navigation ────────────────────────────────────────────────────────
const TABS = [
  { id: 'home',     icon: '🏠', label: 'Home' },
  { id: 'journal',  icon: '📓', label: 'Journal' },
  { id: 'schedule', icon: '📅', label: 'Schedule' },
  { id: 'skills',   icon: '⭐', label: 'Skills' },
  { id: 'profile',  icon: '👤', label: 'Profile' },
];

function renderNav() {
  document.getElementById('bottom-nav').innerHTML = TABS.map(t => `
    <button class="nav-btn${currentTab === t.id ? ' active' : ''}" onclick="switchTab('${t.id}')">
      <span class="nav-icon">${t.icon}</span>
      <span>${t.label}</span>
    </button>
  `).join('');
}

function switchTab(tab) {
  currentTab = tab;
  renderNav();
  renderContent();
}

function renderContent() {
  const el = document.getElementById('main-content');
  el.innerHTML = '';
  if (currentTab === 'home')     el.innerHTML = renderHome();
  if (currentTab === 'journal')  el.innerHTML = renderJournal();
  if (currentTab === 'schedule') el.innerHTML = renderSchedule();
  if (currentTab === 'skills')   el.innerHTML = renderSkills();
  if (currentTab === 'profile')  el.innerHTML = renderProfile();
  el.scrollTop = 0;
}

// ── Home Tab ──────────────────────────────────────────────────────────
function renderHome() {
  const activeSeason = D.seasons.find(s => s.active) || null;
  const todayClasses = activeSeason
    ? (activeSeason.classes || []).filter(c => c.days && c.days.includes(dayName()))
    : [];

  const weekEntries = D.entries.filter(e => {
    const diff = (new Date() - new Date(e.date + 'T12:00:00')) / 86400000;
    return diff <= 7;
  });
  const weekHrs = weekEntries.reduce((a, e) => a + (e.duration || 0), 0) / 60;

  let streak = 0;
  let cur = new Date(); cur.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const ds = cur.toISOString().split('T')[0];
    if (D.entries.some(e => e.date === ds)) { streak++; cur.setDate(cur.getDate() - 1); }
    else if (i === 0)                        { cur.setDate(cur.getDate() - 1); }
    else                                      break;
  }

  const recentEntries = [...D.entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const activeGoals   = D.goals.filter(g => !g.completed).slice(0, 2);
  const earnedBadges  = BADGE_DEFS.filter(b => D.badges.includes(b.id));

  return `
  <div class="fade-up">
    <div class="hero">
      <div class="hero-date">${todayFmt()}</div>
      <div class="row gap-8 mb-8"><span class="app-wordmark">Reverence</span></div>
      <div class="hero-name">${D.userName ? `Hello, <em>${esc(D.userName)}</em> 🩰` : 'Welcome back <em>dancer</em> 🩰'}</div>
      ${activeSeason ? `<div class="mt-8"><span class="tag tag-active">● ${esc(activeSeason.name)}</span></div>` : ''}
    </div>

    <div class="stat-grid">
      <div class="stat-card" style="display:flex;flex-direction:column;align-items:center;">
        <div class="streak-ring">
          <div class="streak-num">${streak}</div>
          <div class="streak-lbl">streak</div>
        </div>
        <div class="stat-lbl" style="text-align:center;">Day streak</div>
      </div>
      <div class="mini-stats">
        <div class="stat-card">
          <div class="stat-val">${weekHrs.toFixed(1)}</div>
          <div class="stat-lbl">Hours this week</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${D.entries.length}</div>
          <div class="stat-lbl">Total sessions</div>
        </div>
      </div>
    </div>

    ${todayClasses.length ? `
    <div class="sec-title">Today's Classes</div>
    ${todayClasses.map(c => `
      <div class="card fade-up-1 row sb">
        <div>
          <div class="fw5 f14">${esc(c.name)}</div>
          <div class="f12 muted mt-4">${esc(c.time)} · ${esc(c.teacher)}</div>
        </div>
        <span class="tag tag-rose">${esc(c.style)}</span>
      </div>
    `).join('')}` : ''}

    ${activeGoals.length ? `
    <div class="sec-title">Active Goals</div>
    ${activeGoals.map((g, i) => `
      <div class="card fade-up-${i + 1}">
        <div class="row sb mb-8">
          <span class="fw5 f14">${esc(g.title)}</span>
          <span class="tag tag-rose">${esc(g.style)}</span>
        </div>
        <div class="prog-track"><div class="prog-fill" style="width:${g.progress || 0}%"></div></div>
        <div class="f11 muted mt-6">Target: ${g.targetDate ? fmtDate(g.targetDate) : '—'}</div>
      </div>
    `).join('')}` : ''}

    ${recentEntries.length ? `
    <div class="sec-title">Recent Journal</div>
    ${recentEntries.map((e, i) => {
      const season = D.seasons.find(s => s.id === e.seasonId);
      return `
      <div class="card fade-up-${i + 1}" onclick="openEntryDetail('${e.id}')" style="cursor:pointer;">
        <div class="row sb">
          <div style="flex:1">
            <div class="f11 muted">${fmtDateShort(e.date)}</div>
            <div class="fw5 f14 mt-4">${esc(e.title || e.style)}</div>
            <div class="flex gap-8 mt-6" style="flex-wrap:wrap;">
              <span class="tag tag-rose">${esc(e.style)}</span>
              ${season ? `<span class="tag tag-muted">${esc(season.name)}</span>` : ''}
            </div>
            ${e.notes ? `<div class="f13 muted mt-8 lh">${esc(e.notes.slice(0, 90))}${e.notes.length > 90 ? '…' : ''}</div>` : ''}
          </div>
          <div style="text-align:right;margin-left:12px;flex-shrink:0;">
            <div style="font-size:22px;">${e.mood?.split(' ')[0] || ''}</div>
            <div class="f11 muted mt-4">${e.duration}m</div>
          </div>
        </div>
      </div>`;
    }).join('')}` : ''}

    ${earnedBadges.length ? `
    <div class="sec-title">Badges</div>
    <div class="card fade-up-3" style="display:flex;flex-wrap:wrap;gap:16px;">
      ${earnedBadges.map(b => `
        <div style="text-align:center;width:58px;">
          <div style="font-size:26px;">${b.icon}</div>
          <div class="f11 mt-4" style="color:var(--gold2);">${b.label}</div>
        </div>
      `).join('')}
    </div>` : ''}

    <div style="height:24px;"></div>
    <button class="fab" onclick="openLogModal()">＋</button>
  </div>`;
}

// ── Journal Tab ───────────────────────────────────────────────────────
function renderJournal() {
  const entries = [...D.entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(e => jFilterSeason === 'all' || e.seasonId === jFilterSeason)
    .filter(e => jFilterStyle  === 'all' || e.style    === jFilterStyle);

  return `
  <div class="fade-up">
    <div class="page-head">
      <span class="app-wordmark">Reverence</span>
      <h1>Journal</h1>
      <p>${D.entries.length} entries total</p>
    </div>

    <div class="flex gap-8" style="padding:0 16px 14px;">
      <select class="form-select flex-1" onchange="jFilterSeason=this.value;renderContent()">
        <option value="all">All Seasons</option>
        ${D.seasons.map(s => `<option value="${s.id}" ${jFilterSeason === s.id ? 'selected' : ''}>${esc(s.name)}${s.archived ? ' (archived)' : ''}</option>`).join('')}
      </select>
      <select class="form-select flex-1" onchange="jFilterStyle=this.value;renderContent()">
        <option value="all">All Styles</option>
        ${D.activeStyles.map(s => `<option value="${s}" ${jFilterStyle === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>

    ${entries.length === 0
      ? `<div class="empty"><div class="empty-icon">📓</div><p>No entries yet.<br>Tap + to log your first session.</p></div>`
      : entries.map(e => {
          const season   = D.seasons.find(s => s.id === e.seasonId);
          const cls      = season?.classes?.find(c => c.id === e.classId);
          const archived = season?.archived;
          return `
          <div class="card" onclick="openEntryDetail('${e.id}')" style="cursor:pointer;">
            <div class="row sb">
              <div style="flex:1">
                <div class="f11 muted">${fmtDateShort(e.date)}</div>
                <div class="fw5 f14 mt-4">${esc(e.title || e.style)}</div>
                <div class="flex gap-8 mt-6" style="flex-wrap:wrap;">
                  <span class="tag tag-rose">${esc(e.style)}</span>
                  ${season ? `<span class="tag tag-muted">${esc(season.name)}</span>` : ''}
                  ${cls    ? `<span class="tag tag-gold">${esc(cls.name)}</span>` : ''}
                </div>
                ${e.notes ? `<div class="f13 muted mt-8 lh">${esc(e.notes.slice(0, 100))}${e.notes.length > 100 ? '…' : ''}</div>` : ''}
              </div>
              <div style="text-align:right;margin-left:12px;flex-shrink:0;">
                <div style="font-size:22px;">${e.mood?.split(' ')[0] || ''}</div>
                <div class="f11 muted mt-4">${e.duration}m</div>
                ${archived ? '<div class="f11 muted mt-4">🔒</div>' : ''}
              </div>
            </div>
          </div>`;
        }).join('')}

    <div style="height:24px;"></div>
    <button class="fab" onclick="openLogModal()">＋</button>
  </div>`;
}

// ── Schedule Tab ──────────────────────────────────────────────────────
function renderSchedule() {
  const seasons = D.seasons.filter(s => schedView === 'active' ? !s.archived : s.archived);

  return `
  <div class="fade-up">
    <div class="page-head">
      <span class="app-wordmark">Reverence</span>
      <h1>Schedule</h1>
      <p>Seasons &amp; classes</p>
    </div>

    <div class="flex gap-8" style="padding:0 16px 14px;align-items:center;">
      <button class="btn btn-sm ${schedView === 'active'   ? 'btn-rose' : 'btn-ghost'}" onclick="schedView='active';renderContent()">Active</button>
      <button class="btn btn-sm ${schedView === 'archived' ? 'btn-rose' : 'btn-ghost'}" onclick="schedView='archived';renderContent()">Archived</button>
      ${schedView === 'active' ? `<button class="btn btn-gold btn-sm" style="margin-left:auto;" onclick="openNewSeasonModal()">＋ Season</button>` : ''}
    </div>

    ${seasons.length === 0
      ? `<div class="empty"><div class="empty-icon">📅</div><p>${schedView === 'active' ? 'No active seasons.<br>Tap "+ Season" to create one.' : 'No archived seasons yet.'}</p></div>`
      : seasons.map(s => {
          const expanded = expandedSeason === s.id;
          const ec       = D.entries.filter(e => e.seasonId === s.id).length;
          return `
          <div class="season-card">
            <div class="season-card-head" onclick="expandedSeason='${expanded ? '' : s.id}';renderContent()">
              <div>
                <div class="row gap-8 mb-8">
                  <span class="season-name">${esc(s.name)}</span>
                  ${s.active   ? `<span class="tag tag-active">● Active</span>` : ''}
                  ${s.archived ? `<span class="tag tag-archived">🔒 Archived</span>` : ''}
                </div>
                <div class="f12 muted">${s.startDate ? fmtDate(s.startDate) : ''} – ${s.endDate ? fmtDate(s.endDate) : ''}</div>
                <div class="f12 muted mt-4">${(s.classes || []).length} classes · ${ec} journal entries</div>
              </div>
              <span class="muted" style="font-size:16px;">${expanded ? '▲' : '▼'}</span>
            </div>
            ${expanded ? `
            <div class="season-card-body">
              <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:14px;padding-top:14px;">
                ${!s.archived ? `<button class="btn btn-ghost btn-xs" onclick="toggleSeasonActive('${s.id}')">${s.active ? 'Deactivate' : 'Set Active'}</button>` : ''}
                <button class="btn btn-ghost btn-xs" onclick="toggleArchive('${s.id}')">${s.archived ? 'Unarchive' : 'Archive'}</button>
                ${!s.archived ? `<button class="btn btn-ghost btn-xs" onclick="openNewClassModal('${s.id}')">＋ Class</button>` : ''}
                <button class="btn btn-danger btn-xs" onclick="deleteSeason('${s.id}')">Delete</button>
              </div>
              ${(s.classes || []).length === 0
                ? `<p class="f13 muted">No classes added yet.</p>`
                : (s.classes || []).map(c => `
                  <div class="card-inner row sb">
                    <div>
                      <div class="fw5 f14">${esc(c.name)}</div>
                      <div class="f12 muted mt-4">${c.days?.join(', ') || ''} · ${esc(c.time)} · ${esc(c.teacher)}</div>
                      <div class="flex gap-8 mt-6">
                        <span class="tag tag-rose">${esc(c.style)}</span>
                        <span class="tag tag-muted">${esc(c.type)}</span>
                        ${c.group ? `<span class="tag tag-gold">${esc(c.group)}</span>` : ''}
                      </div>
                    </div>
                    ${!s.archived ? `<button onclick="deleteClass('${s.id}','${c.id}')" style="background:none;border:none;color:var(--red);font-size:18px;cursor:pointer;padding:4px;">✕</button>` : ''}
                  </div>
                `).join('')}
            </div>` : ''}
          </div>`;
        }).join('')}
  </div>`;
}

// ── Skills Tab ────────────────────────────────────────────────────────
function renderSkills() {
  if (!activeStyle) activeStyle = D.activeStyles[0] || 'Ballet';
  if (!activeGroup) activeGroup = D.activeGroups[0] || 'Company';

  const styleSkills = D.skills[activeStyle] || [];
  const avg = styleSkills.length
    ? styleSkills.reduce((a, s) => a + s.level, 0) / styleSkills.length / 5 * 100
    : 0;

  return `
  <div class="fade-up">
    <div class="page-head">
      <span class="app-wordmark">Reverence</span>
      <h1>Skills</h1>
    </div>

    <div class="flex gap-8" style="padding:0 16px 12px;">
      <button class="btn btn-sm ${skillsView === 'styles' ? 'btn-rose' : 'btn-ghost'}" onclick="skillsView='styles';renderContent()">By Style</button>
      <button class="btn btn-sm ${skillsView === 'groups' ? 'btn-rose' : 'btn-ghost'}" onclick="skillsView='groups';renderContent()">Groups</button>
    </div>

    ${skillsView === 'styles' ? `
      <div class="flex" style="gap:8px;padding:0 16px 8px;overflow-x:auto;">
        ${D.activeStyles.map(s => `<span class="chip${activeStyle === s ? ' on' : ''}" onclick="activeStyle='${s}';renderContent()" style="white-space:nowrap;">${s}</span>`).join('')}
      </div>
      <div class="card row" style="gap:16px;">
        <div style="flex:1;">
          <div class="serif" style="font-size:18px;">${activeStyle} Overview</div>
          <div class="prog-track mt-8"><div class="prog-fill" style="width:${avg}%"></div></div>
          <div class="f12 muted mt-6">${Math.round(avg)}% overall progress</div>
        </div>
        <div class="serif" style="font-size:44px;color:var(--gold2);line-height:1;">${Math.round(avg)}%</div>
      </div>
      <div class="sec-title">Techniques</div>
      ${styleSkills.map(sk => `
        <div class="card" style="padding:13px 16px;">
          <div class="row sb mb-8">
            <span class="fw5 f14">${esc(sk.name)}</span>
            <span class="f13" style="color:var(--gold2);">${'★'.repeat(sk.level)}${'☆'.repeat(5 - sk.level)}</span>
          </div>
          <div class="prog-track mb-8"><div class="prog-fill" style="width:${sk.level / 5 * 100}%"></div></div>
          <div class="stars">
            ${[1,2,3,4,5].map(n => `<span class="star${n <= sk.level ? ' lit' : ''}" onclick="setSkill('${activeStyle}','${sk.id}',${n})">★</span>`).join('')}
          </div>
        </div>
      `).join('')}
    ` : renderGroupsSection()}
  </div>`;
}

function renderGroupsSection() {
  return `
    <div class="flex gap-8" style="padding:0 16px 14px;">
      ${D.activeGroups.map(g => `<span class="chip${activeGroup === g ? ' on' : ''}" onclick="activeGroup='${g}';renderContent()">${g}</span>`).join('')}
    </div>
    ${activeGroup === 'Pointe'      ? renderPointe()      : ''}
    ${activeGroup === 'Competition' ? renderCompetition() : ''}
    ${activeGroup === 'Company'     ? renderCompany()     : ''}
  `;
}

function renderPointe() {
  const rd        = D.pointeLog.readiness    || {};
  const cd        = D.pointeLog.conditioning || {};
  const shoes     = D.pointeLog.shoes        || [];
  const doneCount = POINTE_READINESS.filter(r => rd[r]).length;

  return `
    <div class="sec-title">Readiness Checklist <span style="color:var(--gold2);">${doneCount}/${POINTE_READINESS.length}</span></div>
    <div class="card">
      ${POINTE_READINESS.map(item => `
        <div class="check-row" onclick="togglePointe('readiness','${esc(item)}')">
          <div class="check-box${rd[item] ? ' checked' : ''}">
            ${rd[item] ? '<span class="check-tick">✓</span>' : ''}
          </div>
          <span class="check-label${rd[item] ? ' done' : ''}">${esc(item)}</span>
        </div>
      `).join('')}
    </div>

    <div class="sec-title">Conditioning</div>
    <div class="card">
      ${POINTE_COND.map(item => `
        <div class="check-row" onclick="togglePointe('conditioning','${esc(item)}')">
          <div class="check-box${cd[item] ? ' checked-rose' : ''}">
            ${cd[item] ? '<span class="check-tick">✓</span>' : ''}
          </div>
          <span class="check-label${cd[item] ? ' done' : ''}">${esc(item)}</span>
        </div>
      `).join('')}
    </div>

    <div class="sec-title row sb" style="padding-right:16px;">
      <span>Pointe Shoe Log</span>
      <button class="btn btn-ghost btn-xs" onclick="openShoeModal()">＋ Add Fitting</button>
    </div>
    ${shoes.length === 0
      ? `<div class="empty" style="padding:24px;"><div class="empty-icon" style="font-size:32px;">🩰</div><p>No shoe fittings logged yet.</p></div>`
      : shoes.map(sh => `
        <div class="card">
          <div class="row sb">
            <div class="fw5 f14">${esc(sh.brand)}</div>
            <span class="tag tag-muted">${fmtDateShort(sh.date)}</span>
          </div>
          <div class="f13 muted mt-6">Size ${esc(sh.size)} · Vamp: ${esc(sh.vamp)} · Shank: ${esc(sh.shank)}</div>
          ${sh.notes ? `<div class="f13 mt-8 lh">${esc(sh.notes)}</div>` : ''}
        </div>
      `).join('')}
  `;
}

function renderCompetition() {
  return `
    <div style="padding:0 16px 12px;">
      <button class="btn btn-gold btn-sm" onclick="openCompModal()">＋ Log Competition</button>
    </div>
    ${D.competitions.length === 0
      ? `<div class="empty"><div class="empty-icon">🏆</div><p>No competitions logged yet.</p></div>`
      : [...D.competitions].reverse().map(c => `
        <div class="card">
          <div class="row sb">
            <div>
              <div class="fw5 f14">${esc(c.event)}</div>
              <div class="f12 muted mt-4">${fmtDateShort(c.date)} · ${esc(c.venue)}</div>
              <div class="flex gap-8 mt-6">
                <span class="tag tag-rose">${esc(c.style)}</span>
                ${c.piece ? `<span class="tag tag-muted">${esc(c.piece)}</span>` : ''}
              </div>
            </div>
            ${c.placement ? `
            <div style="text-align:center;flex-shrink:0;margin-left:12px;">
              <div class="serif" style="font-size:36px;color:var(--gold2);line-height:1;">${esc(c.placement)}</div>
              <div class="f11 muted">place</div>
            </div>` : ''}
          </div>
          ${c.score ? `<div class="f12 muted mt-8">Score: ${esc(c.score)}</div>` : ''}
          ${c.costume || c.music ? `<div class="f12 muted mt-4">${c.costume ? `Costume: ${esc(c.costume)}` : ''}${c.costume && c.music ? ' · ' : ''}${c.music ? `Music: ${esc(c.music)}` : ''}</div>` : ''}
          ${c.feedback ? `<div class="divider"></div><div class="f13 lh" style="color:var(--muted2);">${esc(c.feedback)}</div>` : ''}
        </div>
      `).join('')}
  `;
}

function renderCompany() {
  const companyEntries = D.entries.filter(e => {
    const s = D.seasons.find(x => x.id === e.seasonId && x.active);
    if (!s) return false;
    const c = s.classes?.find(x => x.id === e.classId);
    return c?.group === 'Company';
  });

  return `
    <div class="card">
      <div class="serif" style="font-size:20px;margin-bottom:10px;">Company</div>
      <p class="f13 lh muted">Log company rehearsals as classes in your active season, tagged with the Company group. They'll be tracked here and appear in your journal.</p>
      <div class="divider"></div>
      <div class="row sb">
        <span class="f13 muted">Rehearsals this season</span>
        <span class="serif" style="font-size:24px;color:var(--gold2);">${companyEntries.length}</span>
      </div>
    </div>
  `;
}

// ── Profile Tab ───────────────────────────────────────────────────────
function renderProfile() {
  const activeGoals    = D.goals.filter(g => !g.completed);
  const completedGoals = D.goals.filter(g =>  g.completed);

  return `
  <div class="fade-up">
    <div class="page-head">
      <span class="app-wordmark">Reverence</span>
      <h1>Profile</h1>
    </div>

    <div class="sec-title">Personal</div>
    <div class="card">
      <div class="form-group">
        <label class="form-label">Your Name</label>
        <input class="form-input" id="p-name" placeholder="Dancer's name" value="${esc(D.userName)}"/>
      </div>
      <div class="form-group">
        <label class="form-label">Studio Name</label>
        <input class="form-input" id="p-studio" placeholder="Studio name" value="${esc(D.studioName)}"/>
      </div>
      <div class="form-group">
        <label class="form-label">User Token (KV Sync)</label>
        <input class="form-input" id="p-token" value="${esc(D.userToken)}" style="font-family:monospace;font-size:12px;"/>
        <div class="f11 muted mt-4">Use the same token on another device to sync your data.</div>
      </div>
      <button class="btn btn-rose" onclick="saveProfile()">Save Profile</button>
    </div>

    <div class="sec-title">Active Styles</div>
    <div class="card">
      <div class="chips">
        ${STYLES.map(s => `<span class="chip${D.activeStyles.includes(s) ? ' on' : ''}" onclick="toggleStyle('${s}')">${s}</span>`).join('')}
      </div>
    </div>

    <div class="sec-title">Specialized Groups</div>
    <div class="card">
      <div class="chips">
        ${GROUPS.map(g => `<span class="chip${D.activeGroups.includes(g) ? ' on' : ''}" onclick="toggleGroup('${g}')">${g}</span>`).join('')}
      </div>
    </div>

    <div class="sec-title row sb" style="padding-right:16px;">
      <span>Goals</span>
      <button class="btn btn-ghost btn-xs" onclick="openGoalModal()">＋ Goal</button>
    </div>
    ${activeGoals.length === 0
      ? `<div style="padding:0 20px 12px;font-size:13px;color:var(--muted2);">No active goals. Set one to track your progress!</div>`
      : ''}
    ${activeGoals.map(g => `
      <div class="card">
        <div class="row sb mb-8">
          <span class="fw5 f14">${esc(g.title)}</span>
          <span class="tag tag-rose">${esc(g.style)}</span>
        </div>
        ${g.description ? `<div class="f13 muted mb-8 lh">${esc(g.description)}</div>` : ''}
        <div class="row" style="gap:10px;margin-bottom:8px;">
          <div class="prog-track flex-1"><div class="prog-fill" style="width:${g.progress || 0}%"></div></div>
          <span class="f12 muted" style="width:34px;text-align:right;">${g.progress || 0}%</span>
        </div>
        <input type="range" min="0" max="100" value="${g.progress || 0}" oninput="updateGoalProgress('${g.id}',this.value)" style="margin-bottom:8px;"/>
        <div class="row sb">
          <span class="f12 muted">Target: ${g.targetDate ? fmtDate(g.targetDate) : '—'}</span>
          <button class="btn btn-ghost btn-xs" onclick="completeGoal('${g.id}')">Mark Complete ✓</button>
        </div>
      </div>
    `).join('')}

    ${completedGoals.length ? `
      <div class="sec-title">Completed 🎉</div>
      ${completedGoals.map(g => `
        <div class="card" style="opacity:.6;">
          <div class="row sb">
            <span style="text-decoration:line-through;color:var(--muted2);font-size:14px;">${esc(g.title)}</span>
            <span style="color:var(--green);">✓</span>
          </div>
        </div>
      `).join('')}` : ''}

    <div class="sec-title row sb" style="padding-right:16px;">
      <span>Injury Log</span>
      <button class="btn btn-ghost btn-xs" onclick="openInjuryModal()">＋ Log</button>
    </div>
    ${D.injuryLog.length === 0
      ? `<div style="padding:0 20px 12px;font-size:13px;color:var(--muted2);">No injuries logged — keep it that way! 🤞</div>`
      : ''}
    ${[...D.injuryLog].reverse().map(inj => `
      <div class="card">
        <div class="row sb">
          <span class="fw5 f14">${esc(inj.area)}</span>
          <span class="tag tag-muted">${fmtDateShort(inj.date)}</span>
        </div>
        <div class="f13 muted mt-4 lh">${esc(inj.description)}</div>
        <div class="mt-8"><span class="tag ${inj.status === 'Healed' ? 'tag-green' : 'tag-rose'}">${esc(inj.status)}</span></div>
      </div>
    `).join('')}

    <div class="sec-title">All Badges</div>
    <div class="card" style="display:flex;flex-wrap:wrap;gap:16px;">
      ${BADGE_DEFS.map(b => {
        const earned = D.badges.includes(b.id);
        return `
        <div style="text-align:center;width:64px;opacity:${earned ? 1 : .25};">
          <div style="font-size:28px;">${b.icon}</div>
          <div class="f11 mt-4" style="color:${earned ? 'var(--gold2)' : 'var(--muted)'};">${b.label}</div>
          <div style="font-size:9px;color:var(--muted);margin-top:2px;line-height:1.3;">${b.desc}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="height:24px;"></div>
  </div>`;
}

// ── Modal System ──────────────────────────────────────────────────────
function showModal(html, onClose) {
  const overlay       = document.createElement('div');
  overlay.className   = 'modal-bg';
  overlay.innerHTML   = `<div class="modal"><div class="modal-handle"></div>${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeTopModal(); });
  document.body.appendChild(overlay);
  modalStack.push(() => { overlay.remove(); if (onClose) onClose(); });
}

function closeTopModal() {
  if (modalStack.length) modalStack.pop()();
}

// ── Log Session Modal ─────────────────────────────────────────────────
function openLogModal() {
  const activeSeason = D.seasons.find(s => s.active) || null;
  const seasons      = D.seasons.filter(s => !s.archived);
  selectedMood       = MOODS[1];

  showModal(`
    <h2>Log a Session</h2>
    <div class="form-group">
      <label class="form-label">Title (optional)</label>
      <input class="form-input" id="ml-title" placeholder="e.g. Ballet class, Open practice…"/>
    </div>
    <div class="form-grid2">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="ml-date" value="${today()}"/>
      </div>
      <div class="form-group">
        <label class="form-label">Duration (min)</label>
        <input type="number" class="form-input" id="ml-dur" value="60"/>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Style</label>
      <select class="form-select" id="ml-style">
        ${D.activeStyles.map(s => `<option>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Season</label>
      <select class="form-select" id="ml-season" onchange="updateClassDropdown()">
        <option value="">No season / Open practice</option>
        ${seasons.map(s => `<option value="${s.id}" ${activeSeason && s.id === activeSeason.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select>
    </div>
    <div id="ml-class-wrap" class="form-group" style="display:${activeSeason && (activeSeason.classes || []).length ? 'block' : 'none'}">
      <label class="form-label">Class</label>
      <select class="form-select" id="ml-class">
        <option value="">Open practice</option>
        ${(activeSeason?.classes || []).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Mood</label>
      <div class="chips">
        ${MOODS.map((m, i) => `<span class="chip${i === 1 ? ' on' : ''}" onclick="selectMood(this,'${esc(m)}')">${m}</span>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="ml-notes" placeholder="What did you work on? Any breakthroughs?"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Media Link (optional)</label>
      <input class="form-input" id="ml-link" placeholder="YouTube, Google Drive link…"/>
    </div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeTopModal()">Cancel</button>
      <button class="btn btn-rose" style="flex:2;" onclick="submitLog()">Save Entry ✓</button>
    </div>
  `);
}

function updateClassDropdown() {
  const sid  = document.getElementById('ml-season')?.value;
  const wrap = document.getElementById('ml-class-wrap');
  const sel  = document.getElementById('ml-class');
  if (!sid || !wrap || !sel) return;
  const s       = D.seasons.find(x => x.id === sid);
  const classes = s?.classes || [];
  if (classes.length === 0) {
    wrap.style.display = 'none';
  } else {
    wrap.style.display = 'block';
    sel.innerHTML = `<option value="">Open practice</option>${classes.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}`;
  }
}

function selectMood(el, m) {
  selectedMood = m;
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
}

function submitLog() {
  const title     = document.getElementById('ml-title')?.value.trim() || '';
  const date      = document.getElementById('ml-date')?.value || today();
  const duration  = parseInt(document.getElementById('ml-dur')?.value) || 60;
  const style     = document.getElementById('ml-style')?.value || D.activeStyles[0];
  const seasonId  = document.getElementById('ml-season')?.value || '';
  const classId   = document.getElementById('ml-class')?.value  || '';
  const notes     = document.getElementById('ml-notes')?.value.trim() || '';
  const mediaLink = document.getElementById('ml-link')?.value.trim()  || '';

  D.entries.push({ id: uid(), title, date, duration, style, seasonId, classId, mood: selectedMood, notes, mediaLink });
  checkBadges();
  save();
  closeTopModal();
  renderContent();
}

// ── Entry Detail Modal ────────────────────────────────────────────────
function openEntryDetail(id) {
  const e = D.entries.find(x => x.id === id);
  if (!e) return;
  const season   = D.seasons.find(s => s.id === e.seasonId);
  const cls      = season?.classes?.find(c => c.id === e.classId);
  const archived = season?.archived;

  showModal(`
    <div class="row sb" style="margin-bottom:16px;align-items:flex-start;">
      <div>
        <div class="f12 muted">${fmtDate(e.date)}</div>
        <h2 style="margin-bottom:0;">${esc(e.title || e.style)}</h2>
      </div>
      <div style="font-size:28px;">${e.mood?.split(' ')[0] || ''}</div>
    </div>
    <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:16px;">
      <span class="tag tag-rose">${esc(e.style)}</span>
      <span class="tag tag-muted">${e.duration} min</span>
      ${e.mood   ? `<span class="tag tag-muted">${esc(e.mood)}</span>` : ''}
      ${season   ? `<span class="tag tag-muted">${esc(season.name)}</span>` : ''}
      ${cls      ? `<span class="tag tag-gold">${esc(cls.name)}</span>` : ''}
      ${archived ? `<span class="tag tag-archived">🔒 Archived Season</span>` : ''}
    </div>
    ${e.notes     ? `<p class="f14 lh" style="color:var(--cream);margin-bottom:16px;">${esc(e.notes)}</p>` : ''}
    ${e.mediaLink ? `<a href="${esc(e.mediaLink)}" target="_blank" rel="noreferrer" style="color:var(--rose2);font-size:13px;display:block;margin-bottom:16px;">🎬 View Media →</a>` : ''}
    ${!archived   ? `<div class="divider"></div><button class="btn btn-danger btn-sm" onclick="deleteEntry('${e.id}')">Delete Entry</button>` : ''}
  `);
}

function deleteEntry(id) {
  D.entries = D.entries.filter(e => e.id !== id);
  save();
  closeTopModal();
  renderContent();
}

// ── New Season Modal ──────────────────────────────────────────────────
function openNewSeasonModal() {
  showModal(`
    <h2>New Season</h2>
    <div class="form-group">
      <label class="form-label">Season Name</label>
      <input class="form-input" id="ns-name" placeholder="e.g. Fall 2026, Competition Spring…"/>
    </div>
    <div class="form-grid2">
      <div class="form-group">
        <label class="form-label">Start Date</label>
        <input type="date" class="form-input" id="ns-start" value="${today()}"/>
      </div>
      <div class="form-group">
        <label class="form-label">End Date</label>
        <input type="date" class="form-input" id="ns-end"/>
      </div>
    </div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeTopModal()">Cancel</button>
      <button class="btn btn-rose" style="flex:2;" onclick="submitNewSeason()">Create Season</button>
    </div>
  `);
}

function submitNewSeason() {
  const name = document.getElementById('ns-name')?.value.trim();
  if (!name) return;
  const startDate = document.getElementById('ns-start')?.value || '';
  const endDate   = document.getElementById('ns-end')?.value   || '';
  const isFirst   = D.seasons.filter(s => !s.archived).length === 0;
  D.seasons.push({ id: uid(), name, startDate, endDate, classes: [], active: isFirst, archived: false });
  save();
  closeTopModal();
  renderContent();
}

// ── New Class Modal ───────────────────────────────────────────────────
function openNewClassModal(seasonId) {
  newClassSeasonId = seasonId;
  selectedDays     = [];

  showModal(`
    <h2>Add Class</h2>
    <div class="form-group">
      <label class="form-label">Class Name</label>
      <input class="form-input" id="nc-name" placeholder="e.g. Ballet Technique Level 3"/>
    </div>
    <div class="form-grid2">
      <div class="form-group">
        <label class="form-label">Style</label>
        <select class="form-select" id="nc-style">
          ${D.activeStyles.map(s => `<option>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-select" id="nc-type">
          ${CLASS_TYPES.map(t => `<option>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Teacher</label>
      <input class="form-input" id="nc-teacher" placeholder="Teacher name"/>
    </div>
    <div class="form-grid2">
      <div class="form-group">
        <label class="form-label">Time</label>
        <input class="form-input" id="nc-time" placeholder="e.g. 4:00 PM"/>
      </div>
      <div class="form-group">
        <label class="form-label">Location</label>
        <input class="form-input" id="nc-loc" placeholder="Studio room…"/>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Days</label>
      <div class="chips">
        ${DAYS.map(d => `<span class="chip" onclick="toggleDay(this,'${d}')">${d.slice(0, 3)}</span>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Specialized Group (optional)</label>
      <select class="form-select" id="nc-group">
        <option value="">None</option>
        ${GROUPS.map(g => `<option>${g}</option>`).join('')}
      </select>
    </div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeTopModal()">Cancel</button>
      <button class="btn btn-rose" style="flex:2;" onclick="submitNewClass()">Add Class</button>
    </div>
  `);
}

function toggleDay(el, day) {
  if (selectedDays.includes(day)) {
    selectedDays = selectedDays.filter(d => d !== day);
    el.classList.remove('on');
  } else {
    selectedDays.push(day);
    el.classList.add('on');
  }
}

function submitNewClass() {
  const name = document.getElementById('nc-name')?.value.trim();
  if (!name) return;
  const cls = {
    id:       uid(),
    name,
    style:    document.getElementById('nc-style')?.value   || 'Ballet',
    type:     document.getElementById('nc-type')?.value    || 'Regular',
    teacher:  document.getElementById('nc-teacher')?.value.trim() || '',
    time:     document.getElementById('nc-time')?.value.trim()    || '',
    location: document.getElementById('nc-loc')?.value.trim()     || '',
    days:     [...selectedDays],
    group:    document.getElementById('nc-group')?.value   || '',
  };
  D.seasons = D.seasons.map(s => s.id === newClassSeasonId ? { ...s, classes: [...(s.classes || []), cls] } : s);
  save();
  closeTopModal();
  renderContent();
}

// ── Shoe Modal ────────────────────────────────────────────────────────
function openShoeModal() {
  showModal(`
    <h2>Shoe Fitting</h2>
    <div class="form-group">
      <label class="form-label">Brand</label>
      <input class="form-input" id="sh-brand" placeholder="Bloch, Capezio, Gaynor Minden…"/>
    </div>
    <div class="form-grid3">
      <div class="form-group"><label class="form-label">Size</label>  <input class="form-input" id="sh-size"  placeholder="4.5"/></div>
      <div class="form-group"><label class="form-label">Vamp</label>  <input class="form-input" id="sh-vamp"  placeholder="Low/Med/High"/></div>
      <div class="form-group"><label class="form-label">Shank</label> <input class="form-input" id="sh-shank" placeholder="Soft/Med/Hard"/></div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="sh-notes" placeholder="How they feel, sewing notes, box width…"></textarea>
    </div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeTopModal()">Cancel</button>
      <button class="btn btn-rose" style="flex:2;" onclick="submitShoe()">Save Fitting</button>
    </div>
  `);
}

function submitShoe() {
  const brand = document.getElementById('sh-brand')?.value.trim();
  if (!brand) return;
  const shoe = {
    id:    uid(),
    date:  today(),
    brand,
    size:  document.getElementById('sh-size')?.value.trim()  || '',
    vamp:  document.getElementById('sh-vamp')?.value.trim()  || '',
    shank: document.getElementById('sh-shank')?.value.trim() || '',
    notes: document.getElementById('sh-notes')?.value.trim() || '',
  };
  D.pointeLog.shoes = [...(D.pointeLog.shoes || []), shoe];
  save();
  closeTopModal();
  renderContent();
}

// ── Competition Modal ─────────────────────────────────────────────────
function openCompModal() {
  showModal(`
    <h2>Log Competition</h2>
    <div class="form-group">
      <label class="form-label">Event Name</label>
      <input class="form-input" id="cp-event" placeholder="e.g. Regional Dance Championships"/>
    </div>
    <div class="form-grid2">
      <div class="form-group"><label class="form-label">Date</label>  <input type="date" class="form-input" id="cp-date" value="${today()}"/></div>
      <div class="form-group"><label class="form-label">Venue</label> <input class="form-input" id="cp-venue" placeholder="City or venue"/></div>
    </div>
    <div class="form-grid2">
      <div class="form-group">
        <label class="form-label">Style</label>
        <select class="form-select" id="cp-style">
          ${D.activeStyles.map(s => `<option>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Piece Name</label> <input class="form-input" id="cp-piece" placeholder="Routine title"/></div>
    </div>
    <div class="form-grid2">
      <div class="form-group"><label class="form-label">Placement</label> <input class="form-input" id="cp-place" placeholder="1st, 2nd, Gold…"/></div>
      <div class="form-group"><label class="form-label">Score</label>     <input class="form-input" id="cp-score" placeholder="Score or rating"/></div>
    </div>
    <div class="form-grid2">
      <div class="form-group"><label class="form-label">Costume</label> <input class="form-input" id="cp-costume" placeholder="Costume description"/></div>
      <div class="form-group"><label class="form-label">Music</label>   <input class="form-input" id="cp-music"   placeholder="Song / artist"/></div>
    </div>
    <div class="form-group">
      <label class="form-label">Judge Feedback</label>
      <textarea class="form-textarea" id="cp-feedback" placeholder="Notes from judges or director…"></textarea>
    </div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeTopModal()">Cancel</button>
      <button class="btn btn-gold" style="flex:2;" onclick="submitComp()">Log Competition 🏆</button>
    </div>
  `);
}

function submitComp() {
  const event = document.getElementById('cp-event')?.value.trim();
  if (!event) return;
  D.competitions.push({
    id:        uid(),
    event,
    date:      document.getElementById('cp-date')?.value    || today(),
    venue:     document.getElementById('cp-venue')?.value.trim()   || '',
    style:     document.getElementById('cp-style')?.value          || 'Ballet',
    piece:     document.getElementById('cp-piece')?.value.trim()   || '',
    placement: document.getElementById('cp-place')?.value.trim()   || '',
    score:     document.getElementById('cp-score')?.value.trim()   || '',
    costume:   document.getElementById('cp-costume')?.value.trim() || '',
    music:     document.getElementById('cp-music')?.value.trim()   || '',
    feedback:  document.getElementById('cp-feedback')?.value.trim()|| '',
  });
  checkBadges();
  save();
  closeTopModal();
  renderContent();
}

// ── Goal Modal ────────────────────────────────────────────────────────
function openGoalModal() {
  showModal(`
    <h2>New Goal</h2>
    <div class="form-group">
      <label class="form-label">Goal</label>
      <input class="form-input" id="gl-title" placeholder="e.g. Land a clean double pirouette"/>
    </div>
    <div class="form-group">
      <label class="form-label">Style</label>
      <select class="form-select" id="gl-style">
        ${D.activeStyles.map(s => `<option>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Description (optional)</label>
      <textarea class="form-textarea" id="gl-desc" placeholder="More detail…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Target Date</label>
      <input type="date" class="form-input" id="gl-date"/>
    </div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeTopModal()">Cancel</button>
      <button class="btn btn-rose" style="flex:2;" onclick="submitGoal()">Set Goal ⭐</button>
    </div>
  `);
}

function submitGoal() {
  const title = document.getElementById('gl-title')?.value.trim();
  if (!title) return;
  D.goals.push({
    id:          uid(),
    title,
    style:       document.getElementById('gl-style')?.value       || 'Ballet',
    description: document.getElementById('gl-desc')?.value.trim() || '',
    targetDate:  document.getElementById('gl-date')?.value        || '',
    progress:    0,
    completed:   false,
  });
  save();
  closeTopModal();
  renderContent();
}

// ── Injury Modal ──────────────────────────────────────────────────────
function openInjuryModal() {
  selectedInjStatus = INJ_STATUS[0];

  showModal(`
    <h2>Log Injury / Soreness</h2>
    <div class="form-group">
      <label class="form-label">Body Area</label>
      <select class="form-select" id="inj-area">
        ${BODY_AREAS.map(a => `<option>${a}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="inj-desc" placeholder="What happened? Pain level, circumstances…"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <div class="chips">
        ${INJ_STATUS.map((s, i) => `<span class="chip${i === 0 ? ' on' : ''}" onclick="selectInjStatus(this,'${s}')">${s}</span>`).join('')}
      </div>
    </div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeTopModal()">Cancel</button>
      <button class="btn btn-rose" style="flex:2;" onclick="submitInjury()">Save</button>
    </div>
  `);
}

function selectInjStatus(el, s) {
  selectedInjStatus = s;
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
}

function submitInjury() {
  const desc = document.getElementById('inj-desc')?.value.trim();
  if (!desc) return;
  D.injuryLog.push({
    id:          uid(),
    date:        today(),
    area:        document.getElementById('inj-area')?.value || 'Other',
    description: desc,
    status:      selectedInjStatus,
  });
  save();
  closeTopModal();
  renderContent();
}

// ── Data Actions ──────────────────────────────────────────────────────
function setSkill(style, skillId, level) {
  D.skills[style] = D.skills[style].map(s => s.id === skillId ? { ...s, level } : s);
  save();
  renderContent();
}

function togglePointe(field, item) {
  D.pointeLog[field] = { ...D.pointeLog[field], [item]: !D.pointeLog[field][item] };
  checkBadges();
  save();
  renderContent();
}

function toggleSeasonActive(id) {
  D.seasons = D.seasons.map(s => s.id === id ? { ...s, active: !s.active } : s);
  save();
  renderContent();
}

function toggleArchive(id) {
  D.seasons = D.seasons.map(s => s.id === id ? { ...s, archived: !s.archived, active: false } : s);
  save();
  renderContent();
}

function deleteSeason(id) {
  if (!confirm('Delete this season? Journal entries will remain but lose the season link.')) return;
  D.seasons      = D.seasons.filter(s => s.id !== id);
  expandedSeason = null;
  save();
  renderContent();
}

function deleteClass(seasonId, classId) {
  D.seasons = D.seasons.map(s =>
    s.id === seasonId ? { ...s, classes: (s.classes || []).filter(c => c.id !== classId) } : s
  );
  save();
  renderContent();
}

function toggleStyle(s) {
  D.activeStyles = D.activeStyles.includes(s)
    ? D.activeStyles.filter(x => x !== s)
    : [...D.activeStyles, s];
  save();
  renderContent();
}

function toggleGroup(g) {
  D.activeGroups = D.activeGroups.includes(g)
    ? D.activeGroups.filter(x => x !== g)
    : [...D.activeGroups, g];
  save();
  renderContent();
}

function saveProfile() {
  D.userName    = document.getElementById('p-name')?.value.trim()   || '';
  D.studioName  = document.getElementById('p-studio')?.value.trim() || '';
  D.userToken   = document.getElementById('p-token')?.value.trim()  || D.userToken;
  save();
  const btn = document.querySelector('[onclick="saveProfile()"]');
  if (btn) { btn.textContent = '✓ Saved!'; setTimeout(() => { btn.textContent = 'Save Profile'; }, 2000); }
}

function updateGoalProgress(id, val) {
  D.goals = D.goals.map(g => g.id === id ? { ...g, progress: parseInt(val) } : g);
  save();
  // Progress bar updates inline via the range input; no full re-render needed.
}

function completeGoal(id) {
  D.goals = D.goals.map(g => g.id === id ? { ...g, completed: true, progress: 100 } : g);
  checkBadges();
  save();
  renderContent();
}

// ── Global Keyboard Handler ───────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalStack.length) closeTopModal();
});

// ── Boot ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const stored = KV.get('appdata');
  D = stored || initData();
  if (!stored) save();
  checkBadges();

  setTimeout(() => {
    const loader = document.getElementById('loading');
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      renderNav();
      renderContent();
    }, 400);
  }, 800);
});
