/* ═══════════════════════════════════════════════════════════════════
   Reverence — app.js
   Dance Trainer & Journal (full-page website edition)
═══════════════════════════════════════════════════════════════════ */
'use strict';

// ── Constants ─────────────────────────────────────────────────────
const STYLES      = ['Ballet','Contemporary','Lyrical','Jazz','Tap','Hip-Hop'];
const GROUPS      = ['Company','Competition','Pointe'];
const MOODS       = ['✨ Inspired','😊 Good','😐 Okay','😓 Tired','💪 Strong'];
const DAYS        = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const CLASS_TYPES = ['Regular','Intensive','Masterclass','Camp','Rehearsal','Other'];
const BODY_AREAS  = ['Foot/Ankle','Knee','Hip','Lower Back','Upper Back','Shoulder','Wrist','Neck','Other'];
const INJ_STATUS  = ['Active','Recovering','Healed'];
const PER_PAGE    = 10;

const BADGE_DEFS = [
  { id:'first_entry',  icon:'🩰', label:'First Steps',   desc:'Logged your first session' },
  { id:'streak_7',     icon:'🔥', label:'Week Warrior',  desc:'7-day practice streak' },
  { id:'goals_1',      icon:'⭐', label:'Goal Getter',   desc:'Completed your first goal' },
  { id:'pointe_ready', icon:'🌟', label:'Pointe Ready',  desc:'Completed readiness checklist' },
  { id:'hours_10',     icon:'⏱️', label:'10 Hours',      desc:'Logged 10 hours of practice' },
  { id:'comp_1',       icon:'🏆', label:'Competitor',    desc:'Logged first competition' },
  { id:'hours_50',     icon:'💫', label:'50 Hours',      desc:'Logged 50 hours of practice' },
  { id:'styles_all',   icon:'🎭', label:'All Styles',    desc:'Logged sessions in all 6 styles' },
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
  'Teacher clearance obtained','Sufficient ankle strength',
  'Consistent parallel relevé','Core strength assessed',
  'Proper pointe shoe fitting','First pointe lesson completed',
];
const POINTE_COND = [
  'Theraband exercises','Calf raises','Ankle circles',
  'Arch strengthening','Balance work','Core stability',
];

// ── Storage ───────────────────────────────────────────────────────
const KV = {
  get(k)    { try { const v = localStorage.getItem('rev_'+k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k,v)  { try { localStorage.setItem('rev_'+k, JSON.stringify(v)); } catch {} },
};

// ── Utilities ─────────────────────────────────────────────────────
const uid          = () => Math.random().toString(36).slice(2,10);
const today        = () => new Date().toISOString().split('T')[0];
const fmtDate      = d  => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const fmtDateShort = d  => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const dayName      = () => new Date().toLocaleDateString('en-US',{weekday:'long'});
const esc          = s  => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── State ─────────────────────────────────────────────────────────
let D            = null;
let currentPage  = 1;
let filterStyle  = 'all';
let filterSeason = 'all';
let schedView    = 'active';
let expandedSeason = null;
let skillsStyle  = null;
let activeGroup  = 'Company';
let addingClassToSeason = null;
let viewingEntryId = null;

// ── Init data ─────────────────────────────────────────────────────
function initData() {
  return {
    userToken:    uid(),
    userName:     '',
    studioName:   '',
    activeStyles: [...STYLES],
    seasons:      [],
    entries:      [],
    skills:       Object.fromEntries(STYLES.map(s=>[s,DEFAULT_SKILLS[s].map(n=>({id:uid(),name:n,level:0}))])),
    goals:        [],
    competitions: [],
    pointeLog:    { readiness:{}, shoes:[], conditioning:{} },
    badges:       [],
    injuryLog:    [],
    theme:        'dark',
  };
}

function save() { KV.set('appdata', D); }

function checkBadges() {
  const b=D.badges, add=id=>{ if(!b.includes(id)) b.push(id); };
  if(D.entries.length>=1) add('first_entry');
  const hrs=D.entries.reduce((a,e)=>a+(e.duration||0),0)/60;
  if(hrs>=10) add('hours_10');
  if(hrs>=50) add('hours_50');
  if(D.competitions.length>=1) add('comp_1');
  if(D.goals.some(g=>g.completed)) add('goals_1');
  if(POINTE_READINESS.every(r=>D.pointeLog.readiness[r])) add('pointe_ready');
  const usedStyles=new Set(D.entries.map(e=>e.style));
  if(STYLES.every(s=>usedStyles.has(s))) add('styles_all');
  let streak=0, cur=new Date(); cur.setHours(0,0,0,0);
  for(let i=0;i<60;i++){
    const ds=cur.toISOString().split('T')[0];
    if(D.entries.some(e=>e.date===ds)){streak++;cur.setDate(cur.getDate()-1);}
    else if(i===0){cur.setDate(cur.getDate()-1);} else break;
  }
  if(streak>=7) add('streak_7');
}

// ── Modal system ──────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if(el) { el.classList.add('open'); document.body.style.overflow='hidden'; }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if(el) { el.classList.remove('open'); document.body.style.overflow=''; }
}

// Close buttons (data-close attribute)
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-close]');
  if(btn) { closeModal(btn.dataset.close); return; }
  // Click backdrop
  if(e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
  }
});

document.addEventListener('keydown', e => {
  if(e.key==='Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m=>closeModal(m.id));
  }
});

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, dur=2400) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), dur);
}

// ── Theme ─────────────────────────────────────────────────────────
function applyTheme() {
  if(D.theme==='light') { document.body.classList.add('light'); document.getElementById('theme-toggle').textContent='☀️'; }
  else                  { document.body.classList.remove('light'); document.getElementById('theme-toggle').textContent='🌙'; }
}

document.getElementById('theme-toggle').addEventListener('click',()=>{
  D.theme = D.theme==='dark' ? 'light' : 'dark';
  applyTheme(); save();
});

// ── Render sidebar ────────────────────────────────────────────────
function renderSidebar() {
  // Streak
  let streak=0, cur=new Date(); cur.setHours(0,0,0,0);
  for(let i=0;i<60;i++){
    const ds=cur.toISOString().split('T')[0];
    if(D.entries.some(e=>e.date===ds)){streak++;cur.setDate(cur.getDate()-1);}
    else if(i===0){cur.setDate(cur.getDate()-1);} else break;
  }
  document.getElementById('streak-num').textContent = streak;

  // Week hours
  const weekHrs=D.entries.filter(e=>(new Date()-new Date(e.date+'T12:00:00'))/86400000<=7)
    .reduce((a,e)=>a+(e.duration||0),0)/60;
  document.getElementById('stat-week-hrs').textContent = weekHrs.toFixed(1);
  document.getElementById('stat-total').textContent    = D.entries.length;

  // Active season strip
  const activeSeason = D.seasons.find(s=>s.active);
  const strip = document.getElementById('active-season-strip');
  strip.innerHTML = activeSeason
    ? `<div class="row gap-8 mt-4"><span class="tag tag-active">● ${esc(activeSeason.name)}</span><span class="f12 muted">${fmtDateShort(activeSeason.startDate)} – ${fmtDateShort(activeSeason.endDate)}</span></div>`
    : '';

  // Goals
  const goalsEl = document.getElementById('sidebar-goals');
  const activeGoals = D.goals.filter(g=>!g.completed);
  if(!activeGoals.length) {
    goalsEl.innerHTML = '<div class="widget-empty">No active goals.</div>';
  } else {
    goalsEl.innerHTML = activeGoals.map(g=>`
      <div class="goal-item">
        <div class="goal-item-header">
          <span class="goal-item-label">${esc(g.title)}</span>
          <span class="goal-item-value">${g.progress||0}%</span>
        </div>
        <div class="goal-bar-track"><div class="goal-bar-fill${g.progress>=100?' complete':''}" style="width:${g.progress||0}%"></div></div>
        <div class="f12 muted mt-4">${esc(g.style)} · ${g.targetDate?fmtDateShort(g.targetDate):'No target'}</div>
      </div>
    `).join('');
  }

  // Seasons
  const seasonsEl = document.getElementById('sidebar-seasons');
  if(!D.seasons.length) {
    seasonsEl.innerHTML='<div class="widget-empty">No seasons yet.</div>';
  } else {
    seasonsEl.innerHTML = D.seasons.slice(0,4).map(s=>`
      <div class="season-item">
        <div class="row gap-8">
          <span class="season-item-name">${esc(s.name)}</span>
          ${s.active?'<span class="tag tag-active" style="font-size:9px;">Active</span>':''}
          ${s.archived?'<span class="tag tag-archived" style="font-size:9px;">🔒</span>':''}
        </div>
        <div class="season-item-meta">${s.startDate?fmtDateShort(s.startDate):''} – ${s.endDate?fmtDateShort(s.endDate):''} · ${(s.classes||[]).length} classes</div>
      </div>
    `).join('');
  }

  // Badges
  const badgesEl = document.getElementById('sidebar-badges');
  badgesEl.innerHTML = BADGE_DEFS.map(b=>`
    <div class="badge-item${D.badges.includes(b.id)?'':' locked'}" title="${esc(b.desc)}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-label">${esc(b.label)}</div>
    </div>
  `).join('');
}

// ── Render spotlight ──────────────────────────────────────────────
function renderSpotlight() {
  const content = document.getElementById('spotlight-content');
  if(!D.entries.length) { content.innerHTML='<div class="spotlight-empty">Your past sessions will appear here as a daily highlight.</div>'; return; }
  // Pick a "this day in history" or a random past entry
  const old = D.entries.filter(e=>e.date<today()).sort((a,b)=>b.date.localeCompare(a.date));
  const pick = old[Math.floor(Math.random()*Math.max(old.length,1))] || D.entries[D.entries.length-1];
  if(!pick) return;
  content.innerHTML = `
    <div class="spotlight-name">${esc(pick.title||pick.style)}</div>
    <div class="spotlight-meta">${fmtDate(pick.date)} · ${pick.duration}min · ${esc(pick.style)}</div>
    ${pick.notes?`<div class="spotlight-excerpt">${esc(pick.notes)}</div>`:''}
  `;
}

// ── Render feed ───────────────────────────────────────────────────
function renderFeed() {
  // Update season filter options
  const seasonSel = document.getElementById('filter-season');
  const curVal = seasonSel.value;
  seasonSel.innerHTML = '<option value="all">All seasons</option>' +
    D.seasons.map(s=>`<option value="${s.id}"${curVal===s.id?' selected':''}>${esc(s.name)}${s.archived?' (archived)':''}</option>`).join('');

  let entries = [...D.entries].sort((a,b)=>b.date.localeCompare(a.date));
  if(filterStyle!=='all')  entries = entries.filter(e=>e.style===filterStyle);
  if(filterSeason!=='all') entries = entries.filter(e=>e.seasonId===filterSeason);

  const total = entries.length;
  const pages = Math.max(1, Math.ceil(total/PER_PAGE));
  if(currentPage>pages) currentPage=1;
  const slice = entries.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  const feed  = document.getElementById('entry-feed');
  const empty = document.getElementById('feed-empty');

  if(!slice.length) {
    feed.innerHTML='';
    feed.appendChild(empty);
    empty.style.display='';
    document.getElementById('pagination').innerHTML='';
    return;
  }

  empty.style.display='none';
  feed.innerHTML = slice.map(e=>{
    const season = D.seasons.find(s=>s.id===e.seasonId);
    const cls    = season?.classes?.find(c=>c.id===e.classId);
    const styleKey = e.style.toLowerCase().replace(/[\s-]+/g,'-');
    return `
    <article class="entry-card style-${styleKey}" onclick="openEntry('${e.id}')">
      <div class="entry-card-header">
        <div class="entry-card-title">${esc(e.title||e.style)}</div>
        <div class="entry-card-date">${fmtDateShort(e.date)}</div>
      </div>
      <div class="entry-card-meta">
        <span class="tag tag-style">${esc(e.style)}</span>
        <span class="tag tag-mood">${e.mood?.split(' ')[0]||''} ${e.mood?.split(' ').slice(1).join(' ')||''}</span>
        <span class="tag tag-season" style="font-size:10px;">${e.duration}min</span>
        ${season?`<span class="tag tag-season">${esc(season.name)}</span>`:''}
        ${cls?`<span class="tag tag-class">${esc(cls.name)}</span>`:''}
        ${season?.archived?'<span class="tag tag-archived">🔒</span>':''}
      </div>
      ${e.notes?`<div class="entry-card-excerpt">${esc(e.notes)}</div>`:''}
    </article>`;
  }).join('');

  // Pagination
  const pag = document.getElementById('pagination');
  if(pages<=1) { pag.innerHTML=''; return; }
  let html='';
  if(currentPage>1) html+=`<button class="page-btn" onclick="goPage(${currentPage-1})">‹</button>`;
  for(let i=1;i<=pages;i++) {
    if(i===1||i===pages||Math.abs(i-currentPage)<=1)
      html+=`<button class="page-btn${i===currentPage?' active':''}" onclick="goPage(${i})">${i}</button>`;
    else if(Math.abs(i-currentPage)===2)
      html+=`<span style="color:var(--muted);padding:0 4px;">…</span>`;
  }
  if(currentPage<pages) html+=`<button class="page-btn" onclick="goPage(${currentPage+1})">›</button>`;
  pag.innerHTML=html;
}

function goPage(n) { currentPage=n; renderFeed(); window.scrollTo({top:0,behavior:'smooth'}); }

// Filters
document.getElementById('filter-style').addEventListener('change', function(){ filterStyle=this.value; currentPage=1; renderFeed(); });
document.getElementById('filter-season').addEventListener('change', function(){ filterSeason=this.value; currentPage=1; renderFeed(); });

// ── Open entry detail ─────────────────────────────────────────────
function openEntry(id) {
  const e = D.entries.find(x=>x.id===id);
  if(!e) return;
  viewingEntryId = id;
  const season   = D.seasons.find(s=>s.id===e.seasonId);
  const cls      = season?.classes?.find(c=>c.id===e.classId);
  const archived = season?.archived;

  document.getElementById('view-entry-title').textContent = e.title||e.style;
  document.getElementById('btn-delete-entry').style.display = archived ? 'none' : '';

  document.getElementById('view-entry-body').innerHTML = `
    <div class="row gap-8 mb-12" style="flex-wrap:wrap;">
      <span class="tag tag-style">${esc(e.style)}</span>
      <span class="tag tag-season">${e.duration} min</span>
      <span class="tag tag-season">${fmtDate(e.date)}</span>
      ${e.mood?`<span class="tag tag-mood">${esc(e.mood)}</span>`:''}
      ${season?`<span class="tag tag-season">${esc(season.name)}</span>`:''}
      ${cls?`<span class="tag tag-class">${esc(cls.name)}</span>`:''}
      ${archived?`<span class="tag tag-archived">🔒 Archived Season — read only</span>`:''}
    </div>
    ${e.notes?`<div class="serif italic lh" style="font-size:1.05rem;color:var(--cream);margin-bottom:1.1rem;white-space:pre-wrap;">${esc(e.notes)}</div>`:'<p class="muted italic" style="margin-bottom:1rem;">No notes for this session.</p>'}
    ${e.mediaLink?`<a href="${esc(e.mediaLink)}" target="_blank" rel="noreferrer" style="color:var(--rose2);font-size:.9rem;">🎬 View Media →</a>`:''}
  `;
  openModal('modal-view-entry');
}

document.getElementById('btn-delete-entry').addEventListener('click',()=>{
  if(!viewingEntryId||!confirm('Delete this entry?')) return;
  D.entries = D.entries.filter(e=>e.id!==viewingEntryId);
  save(); renderFeed(); renderSidebar();
  closeModal('modal-view-entry');
  toast('Entry deleted.');
});

// ── Log session ───────────────────────────────────────────────────
function openLogModal() {
  document.getElementById('ml-date').value = today();
  document.getElementById('ml-title').value = '';
  document.getElementById('ml-notes').value = '';
  document.getElementById('ml-link').value  = '';
  document.getElementById('ml-dur').value   = '60';
  document.getElementById('ml-style').value = D.activeStyles[0]||'Ballet';

  // Reset mood chips
  document.querySelectorAll('#ml-mood-chips .chip').forEach((c,i)=>{ c.classList.toggle('on', i===1); });

  // Populate seasons
  const activeSeason = D.seasons.find(s=>s.active);
  const seasonSel = document.getElementById('ml-season');
  seasonSel.innerHTML = '<option value="">No season / Open practice</option>' +
    D.seasons.filter(s=>!s.archived).map(s=>`<option value="${s.id}"${activeSeason&&s.id===activeSeason.id?' selected':''}>${esc(s.name)}</option>`).join('');
  updateLogClassDropdown();
  openModal('modal-log');
}

function updateLogClassDropdown() {
  const sid  = document.getElementById('ml-season')?.value;
  const wrap = document.getElementById('ml-class-wrap');
  const sel  = document.getElementById('ml-class');
  const s    = D.seasons.find(x=>x.id===sid);
  const classes = s?.classes||[];
  wrap.style.display = classes.length ? '' : 'none';
  sel.innerHTML = '<option value="">Open practice</option>' +
    classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
}

// Mood chip toggle
document.getElementById('ml-mood-chips').addEventListener('click', e=>{
  const chip = e.target.closest('.chip');
  if(!chip) return;
  document.querySelectorAll('#ml-mood-chips .chip').forEach(c=>c.classList.remove('on'));
  chip.classList.add('on');
});

document.getElementById('btn-submit-log').addEventListener('click',()=>{
  const title     = document.getElementById('ml-title').value.trim();
  const date      = document.getElementById('ml-date').value || today();
  const style     = document.getElementById('ml-style').value;
  const duration  = parseInt(document.getElementById('ml-dur').value)||60;
  const seasonId  = document.getElementById('ml-season').value;
  const classId   = document.getElementById('ml-class').value;
  const mood      = document.querySelector('#ml-mood-chips .chip.on')?.dataset.mood || '😊 Good';
  const notes     = document.getElementById('ml-notes').value.trim();
  const mediaLink = document.getElementById('ml-link').value.trim();
  D.entries.push({id:uid(),title,date,style,duration,seasonId,classId,mood,notes,mediaLink});
  checkBadges(); save(); renderFeed(); renderSidebar(); renderSpotlight();
  closeModal('modal-log');
  toast('Session logged ✓');
});

document.getElementById('btn-log-session').addEventListener('click', openLogModal);

// ── Goals ─────────────────────────────────────────────────────────
document.getElementById('btn-new-goal').addEventListener('click', ()=>{
  document.getElementById('gl-title').value='';
  document.getElementById('gl-desc').value='';
  document.getElementById('gl-date').value='';
  openModal('modal-goal');
});

document.getElementById('btn-submit-goal').addEventListener('click',()=>{
  const title = document.getElementById('gl-title').value.trim();
  if(!title) return;
  D.goals.push({
    id:uid(), title,
    style:       document.getElementById('gl-style').value,
    description: document.getElementById('gl-desc').value.trim(),
    targetDate:  document.getElementById('gl-date').value,
    progress:    0, completed: false,
  });
  checkBadges(); save(); renderSidebar();
  closeModal('modal-goal');
  toast('Goal set ⭐');
});

// ── Schedule ──────────────────────────────────────────────────────
function openScheduleModal() {
  renderScheduleModal();
  openModal('modal-schedule');
}

function renderScheduleModal() {
  const isActive = schedView==='active';
  document.getElementById('sched-tab-active').className   = `btn btn-sm ${isActive?'btn-primary':'btn-ghost'}`;
  document.getElementById('sched-tab-archived').className = `btn btn-sm ${!isActive?'btn-primary':'btn-ghost'}`;

  const seasons = D.seasons.filter(s=>isActive?!s.archived:s.archived);
  const list    = document.getElementById('schedule-seasons-list');

  if(!seasons.length) {
    list.innerHTML=`<div class="widget-empty" style="text-align:center;padding:2rem;">
      ${isActive?'No active seasons. Click "+ New Season" above.':'No archived seasons.'}
    </div>`;
    return;
  }

  list.innerHTML = seasons.map(s=>{
    const expanded = expandedSeason===s.id;
    const ec = D.entries.filter(e=>e.seasonId===s.id).length;
    return `
    <div class="season-card">
      <div class="season-card-head" onclick="toggleExpand('${s.id}')">
        <div>
          <div class="row gap-10 mb-4">
            <span class="season-name">${esc(s.name)}</span>
            ${s.active?'<span class="tag tag-active">● Active</span>':''}
            ${s.archived?'<span class="tag tag-archived">🔒 Archived</span>':''}
          </div>
          <div class="f13 muted">${s.startDate?fmtDate(s.startDate):''} – ${s.endDate?fmtDate(s.endDate):''}</div>
          <div class="f12 muted mt-4">${(s.classes||[]).length} classes · ${ec} journal entries</div>
        </div>
        <span class="muted" style="font-size:16px;">${expanded?'▲':'▼'}</span>
      </div>
      ${expanded?`
      <div class="season-card-body">
        <div class="row gap-8" style="flex-wrap:wrap;margin-bottom:.85rem;padding-top:.85rem;">
          ${!s.archived?`<button class="btn btn-ghost btn-xs" onclick="toggleSeasonActive('${s.id}')">${s.active?'Deactivate':'Set Active'}</button>`:''}
          <button class="btn btn-ghost btn-xs" onclick="toggleArchive('${s.id}')">${s.archived?'Unarchive':'Archive'}</button>
          ${!s.archived?`<button class="btn btn-outline btn-xs" onclick="startAddClass('${s.id}')">+ Add Class</button>`:''}
          <button class="btn btn-danger btn-xs" onclick="deleteSeason('${s.id}')">Delete</button>
        </div>
        ${!(s.classes||[]).length?'<p class="f13 muted">No classes yet.</p>':
          (s.classes||[]).map(c=>`
          <div class="class-item">
            <div>
              <div class="fw5 f14" style="color:var(--cream);">${esc(c.name)}</div>
              <div class="f12 muted mt-4">${c.days?.join(', ')||''} · ${esc(c.time)} · ${esc(c.teacher)}</div>
              <div class="row gap-6 mt-6">
                <span class="tag tag-style">${esc(c.style)}</span>
                <span class="tag tag-season">${esc(c.type)}</span>
                ${c.group?`<span class="tag tag-group">${esc(c.group)}</span>`:''}
              </div>
            </div>
            ${!s.archived?`<button onclick="deleteClass('${s.id}','${c.id}')" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;padding:4px;flex-shrink:0;">✕</button>`:''}
          </div>`).join('')}
      </div>`:''}`
    ;
  }).join('');
}

function toggleExpand(id) {
  expandedSeason = expandedSeason===id ? null : id;
  renderScheduleModal();
}

document.getElementById('sched-tab-active').addEventListener('click',   ()=>{ schedView='active';   renderScheduleModal(); });
document.getElementById('sched-tab-archived').addEventListener('click',  ()=>{ schedView='archived'; renderScheduleModal(); });
document.getElementById('btn-open-schedule').addEventListener('click',   openScheduleModal);
document.getElementById('btn-schedule').addEventListener('click',        openScheduleModal);

// New season
document.getElementById('btn-new-season').addEventListener('click',()=>{
  document.getElementById('ns-name').value='';
  document.getElementById('ns-start').value=today();
  document.getElementById('ns-end').value='';
  openModal('modal-new-season');
});

document.getElementById('btn-submit-season').addEventListener('click',()=>{
  const name=document.getElementById('ns-name').value.trim();
  if(!name) return;
  const isFirst=D.seasons.filter(s=>!s.archived).length===0;
  D.seasons.push({id:uid(),name,startDate:document.getElementById('ns-start').value,endDate:document.getElementById('ns-end').value,classes:[],active:isFirst,archived:false});
  save(); renderSidebar(); renderFeed(); renderScheduleModal();
  closeModal('modal-new-season');
  toast('Season created ✓');
});

// New class
function startAddClass(seasonId) {
  addingClassToSeason=seasonId;
  document.querySelectorAll('#nc-days-chips .chip').forEach(c=>c.classList.remove('on'));
  ['nc-name','nc-teacher','nc-time','nc-loc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('nc-group').value='';
  openModal('modal-new-class');
}

document.getElementById('nc-days-chips').addEventListener('click',e=>{
  const chip=e.target.closest('.chip');
  if(chip) chip.classList.toggle('on');
});

document.getElementById('btn-submit-class').addEventListener('click',()=>{
  const name=document.getElementById('nc-name').value.trim();
  if(!name||!addingClassToSeason) return;
  const days=[...document.querySelectorAll('#nc-days-chips .chip.on')].map(c=>c.dataset.day);
  const cls={id:uid(),name,style:document.getElementById('nc-style').value,type:document.getElementById('nc-type').value,teacher:document.getElementById('nc-teacher').value.trim(),time:document.getElementById('nc-time').value.trim(),location:document.getElementById('nc-loc').value.trim(),days,group:document.getElementById('nc-group').value};
  D.seasons=D.seasons.map(s=>s.id===addingClassToSeason?{...s,classes:[...(s.classes||[]),cls]}:s);
  save(); renderScheduleModal(); renderSidebar();
  closeModal('modal-new-class');
  toast('Class added ✓');
});

function toggleSeasonActive(id) { D.seasons=D.seasons.map(s=>s.id===id?{...s,active:!s.active}:s); save();renderSidebar();renderScheduleModal();renderFeed(); }
function toggleArchive(id)      { D.seasons=D.seasons.map(s=>s.id===id?{...s,archived:!s.archived,active:false}:s); save();renderSidebar();renderScheduleModal();renderFeed(); }
function deleteSeason(id)       { if(!confirm('Delete this season?')) return; D.seasons=D.seasons.filter(s=>s.id!==id); expandedSeason=null; save();renderSidebar();renderScheduleModal();renderFeed(); }
function deleteClass(sid,cid)   { D.seasons=D.seasons.map(s=>s.id===sid?{...s,classes:(s.classes||[]).filter(c=>c.id!==cid)}:s); save();renderScheduleModal(); }

// ── Skills ────────────────────────────────────────────────────────
function openSkillsModal() {
  if(!skillsStyle) skillsStyle=D.activeStyles[0]||'Ballet';
  renderSkillsModal();
  openModal('modal-skills');
}

function renderSkillsModal() {
  const chips=document.getElementById('skills-style-chips');
  chips.innerHTML=D.activeStyles.map(s=>`<span class="chip${skillsStyle===s?' on':''}" onclick="setSkillsStyle('${s}')">${s}</span>`).join('');

  const styleSkills=D.skills[skillsStyle]||[];
  const avg=styleSkills.length?styleSkills.reduce((a,s)=>a+s.level,0)/styleSkills.length/5*100:0;

  document.getElementById('skills-overview').innerHTML=`
    <div class="row gap-12" style="background:var(--ink3);border-radius:var(--r-sm);padding:1rem;align-items:center;">
      <div style="flex:1;">
        <div class="serif" style="font-size:1.1rem;color:var(--cream);margin-bottom:.5rem;">${skillsStyle} Overview</div>
        <div class="prog-track"><div class="prog-fill" style="width:${avg}%"></div></div>
        <div class="f12 muted mt-4">${Math.round(avg)}% overall progress</div>
      </div>
      <div class="serif" style="font-size:3rem;color:var(--gold2);line-height:1;">${Math.round(avg)}%</div>
    </div>
  `;

  document.getElementById('skills-list').innerHTML=styleSkills.map(sk=>`
    <div style="border-top:1px solid var(--border);padding:.75rem 0;">
      <div class="row sb mb-8">
        <span class="fw5 f14" style="color:var(--cream);">${esc(sk.name)}</span>
        <span class="f13 text-gold">${'★'.repeat(sk.level)}${'☆'.repeat(5-sk.level)}</span>
      </div>
      <div class="prog-track mb-8" style="height:4px;"><div class="prog-fill" style="width:${sk.level/5*100}%"></div></div>
      <div class="stars">
        ${[1,2,3,4,5].map(n=>`<span class="star${n<=sk.level?' lit':''}" onclick="setSkill('${skillsStyle}','${sk.id}',${n})">★</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function setSkillsStyle(s) { skillsStyle=s; renderSkillsModal(); }

function setSkill(style,skillId,level) {
  D.skills[style]=D.skills[style].map(s=>s.id===skillId?{...s,level}:s);
  save(); renderSkillsModal();
}

document.getElementById('btn-skills').addEventListener('click', openSkillsModal);

// ── Groups ────────────────────────────────────────────────────────
function openGroupsModal(group) {
  if(group) activeGroup=group;
  renderGroupsModal();
  openModal('modal-groups');
}

function renderGroupsModal() {
  document.querySelectorAll('#group-tabs button').forEach(btn=>{
    btn.className=`btn btn-sm ${btn.dataset.group===activeGroup?'btn-primary':'btn-ghost'}`;
  });
  const c=document.getElementById('groups-content');
  if(activeGroup==='Pointe')      c.innerHTML=renderPointe();
  if(activeGroup==='Competition') c.innerHTML=renderCompetition();
  if(activeGroup==='Company')     c.innerHTML=renderCompany();
}

document.getElementById('group-tabs').addEventListener('click',e=>{
  const btn=e.target.closest('[data-group]');
  if(btn){activeGroup=btn.dataset.group;renderGroupsModal();}
});

document.getElementById('btn-groups').addEventListener('click',()=>openGroupsModal());

function renderPointe() {
  const rd=D.pointeLog.readiness||{}, cd=D.pointeLog.conditioning||{}, shoes=D.pointeLog.shoes||[];
  const done=POINTE_READINESS.filter(r=>rd[r]).length;
  return `
    <h3 class="section-heading">Readiness Checklist <span class="text-gold">${done}/${POINTE_READINESS.length}</span></h3>
    ${POINTE_READINESS.map(item=>`
      <div class="check-row" onclick="togglePointe('readiness','${esc(item)}')">
        <div class="check-box${rd[item]?' checked':''}"> ${rd[item]?'<span class="check-tick">✓</span>':''}</div>
        <span class="check-label${rd[item]?' done':''}">${esc(item)}</span>
      </div>`).join('')}
    <h3 class="section-heading">Conditioning</h3>
    ${POINTE_COND.map(item=>`
      <div class="check-row" onclick="togglePointe('conditioning','${esc(item)}')">
        <div class="check-box${cd[item]?' checked-rose':''}"> ${cd[item]?'<span class="check-tick">✓</span>':''}</div>
        <span class="check-label${cd[item]?' done':''}">${esc(item)}</span>
      </div>`).join('')}
    <h3 class="section-heading row sb">
      <span>Pointe Shoe Log</span>
      <button class="btn btn-outline btn-xs" onclick="openModal('modal-shoe')">+ Add Fitting</button>
    </h3>
    ${!shoes.length?'<div class="widget-empty">No shoe fittings logged yet.</div>'
    :shoes.map(sh=>`
      <div class="shoe-item">
        <div class="shoe-brand">${esc(sh.brand)}</div>
        <div class="shoe-meta">Size ${esc(sh.size)} · Vamp: ${esc(sh.vamp)} · Shank: ${esc(sh.shank)} · ${fmtDateShort(sh.date)}</div>
        ${sh.notes?`<div class="f13 muted mt-4 lh">${esc(sh.notes)}</div>`:''}
      </div>`).join('')}
  `;
}

function renderCompetition() {
  return `
    <div class="row sb mb-12">
      <span class="f13 muted">${D.competitions.length} competition${D.competitions.length!==1?'s':''} logged</span>
      <button class="btn btn-gold btn-sm" onclick="openCompModal()">+ Log Competition</button>
    </div>
    ${!D.competitions.length?'<div class="widget-empty">No competitions logged yet.</div>'
    :[...D.competitions].reverse().map(c=>`
      <div class="comp-card">
        <div class="row sb" style="align-items:flex-start;gap:1rem;">
          <div>
            <div class="fw5 f14" style="color:var(--cream);">${esc(c.event)}</div>
            <div class="f12 muted mt-4">${fmtDateShort(c.date)} · ${esc(c.venue)}</div>
            <div class="row gap-6 mt-6">
              <span class="tag tag-style">${esc(c.style)}</span>
              ${c.piece?`<span class="tag tag-season">${esc(c.piece)}</span>`:''}
            </div>
            ${c.score?`<div class="f12 muted mt-6">Score: ${esc(c.score)}</div>`:''}
            ${c.costume||c.music?`<div class="f12 muted mt-4">${c.costume?'Costume: '+esc(c.costume):''}${c.costume&&c.music?' · ':''}${c.music?'Music: '+esc(c.music):''}</div>`:''}
            ${c.feedback?`<div class="f13 muted mt-8 lh italic">${esc(c.feedback)}</div>`:''}
          </div>
          ${c.placement?`<div class="comp-placement">${esc(c.placement)}<div class="f11 muted" style="text-align:center;">place</div></div>`:''}
        </div>
      </div>`).join('')}
  `;
}

function renderCompany() {
  const rehearsals=D.entries.filter(e=>{
    const s=D.seasons.find(x=>x.id===e.seasonId&&x.active);
    if(!s) return false;
    return s.classes?.find(x=>x.id===e.classId)?.group==='Company';
  });
  return `
    <div style="background:var(--ink3);border-radius:var(--r-sm);padding:1.1rem;margin-bottom:1rem;">
      <div class="serif" style="font-size:1.15rem;color:var(--cream);margin-bottom:.5rem;">Company</div>
      <p class="f13 lh muted">Log company rehearsals as classes in your active season tagged with the "Company" group. They're counted here automatically.</p>
    </div>
    <div class="row sb" style="background:var(--ink3);border-radius:var(--r-sm);padding:.85rem 1rem;">
      <span class="f13 muted">Rehearsals this active season</span>
      <span class="serif text-gold" style="font-size:1.8rem;">${rehearsals.length}</span>
    </div>
  `;
}

function togglePointe(field, item) {
  D.pointeLog[field]={...D.pointeLog[field],[item]:!D.pointeLog[field][item]};
  checkBadges(); save(); renderGroupsModal(); renderSidebar();
}

function openCompModal() {
  document.getElementById('cp-date').value=today();
  ['cp-event','cp-venue','cp-piece','cp-place','cp-score','cp-costume','cp-music','cp-feedback'].forEach(id=>document.getElementById(id).value='');
  openModal('modal-comp');
}

document.getElementById('btn-submit-comp').addEventListener('click',()=>{
  const event=document.getElementById('cp-event').value.trim();
  if(!event) return;
  D.competitions.push({id:uid(),event,date:document.getElementById('cp-date').value||today(),venue:document.getElementById('cp-venue').value.trim(),style:document.getElementById('cp-style').value,piece:document.getElementById('cp-piece').value.trim(),placement:document.getElementById('cp-place').value.trim(),score:document.getElementById('cp-score').value.trim(),costume:document.getElementById('cp-costume').value.trim(),music:document.getElementById('cp-music').value.trim(),feedback:document.getElementById('cp-feedback').value.trim()});
  checkBadges(); save(); renderGroupsModal(); renderSidebar();
  closeModal('modal-comp');
  toast('Competition logged 🏆');
});

// Shoe modal
document.getElementById('btn-submit-shoe').addEventListener('click',()=>{
  const brand=document.getElementById('sh-brand').value.trim();
  if(!brand) return;
  D.pointeLog.shoes=[...(D.pointeLog.shoes||[]),{id:uid(),date:today(),brand,size:document.getElementById('sh-size').value.trim(),vamp:document.getElementById('sh-vamp').value.trim(),shank:document.getElementById('sh-shank').value.trim(),notes:document.getElementById('sh-notes').value.trim()}];
  save(); renderGroupsModal();
  closeModal('modal-shoe');
  toast('Shoe fitting saved 🩰');
});

// ── Settings ──────────────────────────────────────────────────────
function openSettingsModal() {
  document.getElementById('p-name').value   = D.userName||'';
  document.getElementById('p-studio').value = D.studioName||'';
  document.getElementById('p-token').value  = D.userToken||'';

  // Styles chips
  const sc=document.getElementById('settings-styles-chips');
  sc.innerHTML=STYLES.map(s=>`<span class="chip${D.activeStyles.includes(s)?' on':''}" onclick="this.classList.toggle('on')" data-style="${s}">${s}</span>`).join('');

  // Injury log
  renderInjuryLog();

  openModal('modal-settings');
}

function renderInjuryLog() {
  const el=document.getElementById('injury-log-list');
  if(!D.injuryLog.length){el.innerHTML='<div class="widget-empty">No injuries logged.</div>';return;}
  el.innerHTML=[...D.injuryLog].reverse().map(inj=>`
    <div class="row sb" style="padding:.45rem 0;border-top:1px solid var(--border);font-size:.85rem;">
      <div>
        <span class="fw5" style="color:var(--cream);">${esc(inj.area)}</span>
        <span class="f12 muted" style="margin-left:.4rem;">${fmtDateShort(inj.date)}</span>
        <div class="f12 muted">${esc(inj.description.slice(0,60))}${inj.description.length>60?'…':''}</div>
      </div>
      <span class="tag ${inj.status==='Healed'?'tag-group':'tag-style'}">${esc(inj.status)}</span>
    </div>`).join('');
}

document.getElementById('btn-save-settings').addEventListener('click',()=>{
  D.userName   = document.getElementById('p-name').value.trim();
  D.studioName = document.getElementById('p-studio').value.trim();
  D.userToken  = document.getElementById('p-token').value.trim()||D.userToken;
  D.activeStyles=[...document.querySelectorAll('#settings-styles-chips .chip.on')].map(c=>c.dataset.style);
  if(!D.activeStyles.length) D.activeStyles=[...STYLES];
  save(); renderSidebar();
  closeModal('modal-settings');
  toast('Settings saved ✓');
});

document.getElementById('btn-settings').addEventListener('click', openSettingsModal);

// Injury
document.getElementById('btn-log-injury').addEventListener('click',()=>openModal('modal-injury'));

document.getElementById('btn-submit-injury').addEventListener('click',()=>{
  const desc=document.getElementById('inj-desc').value.trim();
  if(!desc) return;
  D.injuryLog.push({id:uid(),date:today(),area:document.getElementById('inj-area').value,description:desc,status:document.getElementById('inj-status').value});
  save(); renderInjuryLog();
  closeModal('modal-injury');
  toast('Injury logged.');
});

// ── Boot ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded',()=>{
  const stored=KV.get('appdata');
  D=stored||initData();
  if(!stored) save();
  checkBadges();
  applyTheme();
  renderSpotlight();
  renderSidebar();
  renderFeed();
});

// Expose globals needed by inline onclick handlers in rendered HTML
window.openEntry         = openEntry;
window.goPage            = goPage;
window.toggleExpand      = toggleExpand;
window.toggleSeasonActive= toggleSeasonActive;
window.toggleArchive     = toggleArchive;
window.deleteSeason      = deleteSeason;
window.deleteClass       = deleteClass;
window.startAddClass     = startAddClass;
window.setSkillsStyle    = setSkillsStyle;
window.setSkill          = setSkill;
window.togglePointe      = togglePointe;
window.openCompModal     = openCompModal;
window.openModal         = openModal;
