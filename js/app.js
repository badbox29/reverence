/* ═══════════════════════════════════════════════════════════════════
   Reverence — app.js
   Dance Trainer & Journal
═══════════════════════════════════════════════════════════════════ */
'use strict';

// ── Constants ─────────────────────────────────────────────────────
const STYLES   = ['Ballet','Contemporary','Lyrical','Jazz','Tap','Hip-Hop'];
const PER_PAGE = 10;

const EVENT_TYPES = ['Competition','Recital','Parade','Holiday','Workshop','Other'];

const EVENT_LABELS = {
  Competition: 'Competition',
  Recital:     'Recital',
  Parade:      'Parade / March',
  Holiday:     'Holiday Performance',
  Workshop:    'Workshop / Masterclass',
  Other:       'Other',
};

const EVENT_ICONS = {
  Competition: '🏆',
  Recital:     '🎭',
  Parade:      '🥁',
  Holiday:     '✨',
  Workshop:    '🎓',
  Other:       '📌',
};

const BADGE_DEFS = [
  { id:'first_entry',  icon:'🩰', label:'First Steps',   desc:'Logged your first session' },
  { id:'streak_7',     icon:'🔥', label:'Week Warrior',  desc:'7-day practice streak' },
  { id:'goals_1',      icon:'⭐', label:'Goal Getter',   desc:'Completed your first goal' },
  { id:'pointe_ready', icon:'🌟', label:'Pointe Ready',  desc:'Completed readiness checklist' },
  { id:'hours_10',     icon:'⏱️', label:'10 Hours',      desc:'Logged 10 hours of practice' },
  { id:'event_1',      icon:'🏆', label:'Performer',     desc:'Logged your first event' },
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
  'Teacher clearance obtained', 'Sufficient ankle strength',
  'Consistent parallel relevé',  'Core strength assessed',
  'Proper pointe shoe fitting',   'First pointe lesson completed',
];
const POINTE_COND = [
  'Theraband exercises','Calf raises','Ankle circles',
  'Arch strengthening', 'Balance work','Core stability',
];

// ── Storage (localStorage) ───────────────────────────────────────
const KV = {
  get(k)   { try { const v=localStorage.getItem('rev_'+k); return v?JSON.parse(v):null; } catch { return null; } },
  set(k,v) { try { localStorage.setItem('rev_'+k,JSON.stringify(v)); } catch {} },
};

// ── Remote sync (Cloudflare Worker) ──────────────────────────────
let syncStatus = 'idle'; // idle | syncing | ok | error

function workerBase() {
  const url = (D?.workerUrl||'').replace(/\/+$/, '');
  return url || null;
}

function syncIndicatorHTML(status) {
  const map = {
    idle:    { icon:'☁️',  text:'Not synced',  cls:'sync-idle'    },
    syncing: { icon:'⟳',   text:'Syncing…',    cls:'sync-syncing' },
    ok:      { icon:'✓',   text:'Synced',      cls:'sync-ok'      },
    error:   { icon:'✕',   text:'Sync failed', cls:'sync-error'   },
  };
  const s = map[status] || map.idle;
  return `<span class="sync-indicator ${s.cls}" title="${s.text}">${s.icon} ${s.text}</span>`;
}

function updateSyncIndicator() {
  const el = document.getElementById('sync-indicator');
  if(el) el.outerHTML = `<span id="sync-indicator">${syncIndicatorHTML(syncStatus)}</span>`;
  const el2 = document.getElementById('sync-indicator');
  if(el2) el2.outerHTML = syncIndicatorHTML(syncStatus).replace('<span class=','<span id="sync-indicator" class=');
}

async function pushToWorker() {
  const base = workerBase();
  if(!base || !D?.userToken) return;
  syncStatus = 'syncing'; updateSyncIndicator();
  try {
    const res = await fetch(`${base}/kv/${encodeURIComponent(D.userToken)}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(D),
    });
    syncStatus = res.ok ? 'ok' : 'error';
  } catch { syncStatus = 'error'; }
  updateSyncIndicator();
}

async function pullFromWorker() {
  const base = workerBase();
  if(!base || !D?.userToken) return null;
  syncStatus = 'syncing'; updateSyncIndicator();
  try {
    const res  = await fetch(`${base}/kv/${encodeURIComponent(D.userToken)}`);
    if(!res.ok){ syncStatus = res.status===404 ? 'idle' : 'error'; updateSyncIndicator(); return null; }
    const data = await res.json();
    syncStatus = 'ok'; updateSyncIndicator();
    return data;
  } catch { syncStatus = 'error'; updateSyncIndicator(); return null; }
}

// save locally and push to worker
function save() {
  KV.set('appdata', D);
  if(workerBase()) pushToWorker();
}

// ── Utilities ─────────────────────────────────────────────────────
const uid          = () => Math.random().toString(36).slice(2,10);
const today        = () => new Date().toISOString().split('T')[0];
const fmtDate      = d  => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const fmtDateShort = d  => new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const dayName      = () => new Date().toLocaleDateString('en-US',{weekday:'long'});
const esc          = s  => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const val          = id => document.getElementById(id)?.value.trim()||'';

// ── State ─────────────────────────────────────────────────────────
let D              = null;
let currentPage    = 1;
let filterStyle    = 'all';
let filterSeason   = 'all';
let eventsFilter   = 'all';
let schedView      = 'active';
let expandedSeason = null;
let skillsStyle    = null;
let addClassSeason = null;
let viewEntryId    = null;
let viewEventId    = null;

// ── Data init ─────────────────────────────────────────────────────
function initData() {
  return {
    userToken:    uid(),
    userName:     '',
    studioName:   '',
    activeStyles: [...STYLES],
    showPointe:   false,
    seasons:      [],
    entries:      [],
    events:       [],
    skills:       Object.fromEntries(STYLES.map(s=>[s,DEFAULT_SKILLS[s].map(n=>({id:uid(),name:n,level:0}))])),
    goals:        [],
    pointeLog:    { readiness:{}, shoes:[], conditioning:{} },
    badges:       [],
    injuryLog:    [],
    theme:        'dark',
    workerUrl:    '',
  };
}

function save() { KV.set('appdata', D); }

// ── Badge checks ──────────────────────────────────────────────────
function checkBadges() {
  const b=D.badges, add=id=>{ if(!b.includes(id)) b.push(id); };
  if(D.entries.length>=1) add('first_entry');
  const hrs=D.entries.reduce((a,e)=>a+(e.duration||0),0)/60;
  if(hrs>=10) add('hours_10');
  if(hrs>=50) add('hours_50');
  if(D.events.length>=1) add('event_1');
  if(D.goals.some(g=>g.completed)) add('goals_1');
  if(POINTE_READINESS.every(r=>D.pointeLog.readiness[r])) add('pointe_ready');
  const usedStyles=new Set(D.entries.map(e=>e.style));
  if(STYLES.every(s=>usedStyles.has(s))) add('styles_all');
  let streak=0, cur=new Date(); cur.setHours(0,0,0,0);
  for(let i=0;i<60;i++){
    const ds=cur.toISOString().split('T')[0];
    if(D.entries.some(e=>e.date===ds)){ streak++; cur.setDate(cur.getDate()-1); }
    else if(i===0){ cur.setDate(cur.getDate()-1); } else break;
  }
  if(streak>=7) add('streak_7');
}

// ── Modal system ──────────────────────────────────────────────────
function openModal(id) {
  const el=document.getElementById(id);
  if(el){ el.classList.add('open'); document.body.style.overflow='hidden'; }
}
function closeModal(id) {
  const el=document.getElementById(id);
  if(el){ el.classList.remove('open'); document.body.style.overflow=''; }
}

document.addEventListener('click', e => {
  const btn=e.target.closest('[data-close]');
  if(btn){ closeModal(btn.dataset.close); return; }
  if(e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

document.addEventListener('keydown', e => {
  if(e.key==='Escape')
    document.querySelectorAll('.modal-overlay.open').forEach(m=>closeModal(m.id));
});

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, dur=2400) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), dur);
}

// ── Theme ─────────────────────────────────────────────────────────
function applyTheme() {
  const light=D.theme==='light';
  document.body.classList.toggle('light', light);
  document.getElementById('theme-toggle').textContent = light?'☀️':'🌙';
}
document.getElementById('theme-toggle').addEventListener('click',()=>{
  D.theme=D.theme==='dark'?'light':'dark'; applyTheme(); save();
});

// ── Pointe button visibility ───────────────────────────────────────
function updatePointeButton() {
  document.getElementById('btn-pointe').style.display = D.showPointe ? '' : 'none';
}

// ── Sidebar render ────────────────────────────────────────────────
function renderSidebar() {
  // Streak
  let streak=0, cur=new Date(); cur.setHours(0,0,0,0);
  for(let i=0;i<60;i++){
    const ds=cur.toISOString().split('T')[0];
    if(D.entries.some(e=>e.date===ds)){ streak++; cur.setDate(cur.getDate()-1); }
    else if(i===0){ cur.setDate(cur.getDate()-1); } else break;
  }
  document.getElementById('streak-num').textContent=streak;

  const weekHrs=D.entries
    .filter(e=>(new Date()-new Date(e.date+'T12:00:00'))/86400000<=7)
    .reduce((a,e)=>a+(e.duration||0),0)/60;
  document.getElementById('stat-week-hrs').textContent=weekHrs.toFixed(1);
  document.getElementById('stat-total').textContent=D.entries.length;

  // Active season strip
  const as=D.seasons.find(s=>s.active);
  document.getElementById('active-season-strip').innerHTML = as
    ? `<div class="row gap-8 mt-4"><span class="tag tag-active">● ${esc(as.name)}</span><span class="f12 muted">${fmtDateShort(as.startDate)} – ${fmtDateShort(as.endDate)}</span></div>`
    : '';

  // Goals
  const activeGoals=D.goals.filter(g=>!g.completed);
  document.getElementById('sidebar-goals').innerHTML = activeGoals.length
    ? activeGoals.map(g=>`
      <div class="goal-item">
        <div class="goal-item-header">
          <span class="goal-item-label">${esc(g.title)}</span>
          <span class="goal-item-value">${g.progress||0}%</span>
        </div>
        <div class="goal-bar-track"><div class="goal-bar-fill${(g.progress||0)>=100?' complete':''}" style="width:${g.progress||0}%"></div></div>
        <div class="row sb mt-4">
          <div class="f12 muted">${esc(g.style)} · ${g.targetDate?fmtDateShort(g.targetDate):'No target'}</div>
          <button class="btn btn-xs btn-ghost" onclick="updateGoalProgress('${g.id}')">Update</button>
        </div>
      </div>`).join('')
    : '<div class="widget-empty">No active goals yet.</div>';

  // Upcoming events (next 90 days)
  const todayStr=today();
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()+90);
  const cutoffStr=cutoff.toISOString().split('T')[0];
  const upcoming=[...D.events]
    .filter(ev=>ev.date>=todayStr&&ev.date<=cutoffStr)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(0,4);
  document.getElementById('sidebar-events').innerHTML = upcoming.length
    ? upcoming.map(ev=>`
      <div class="widget-row" style="cursor:pointer;" onclick="openEventDetail('${ev.id}')">
        <div>
          <div class="f13 fw5" style="color:var(--cream);">${EVENT_ICONS[ev.type]||'📌'} ${esc(ev.name)}</div>
          <div class="f12 muted">${fmtDateShort(ev.date)} · ${esc(EVENT_LABELS[ev.type]||ev.type)}</div>
        </div>
      </div>`).join('')
    : '<div class="widget-empty">No upcoming events.</div>';

  // Seasons
  document.getElementById('sidebar-seasons').innerHTML = D.seasons.length
    ? D.seasons.slice(0,4).map(s=>`
      <div class="season-item">
        <div class="row gap-8">
          <span class="season-item-name">${esc(s.name)}</span>
          ${s.active?'<span class="tag tag-active" style="font-size:9px;">Active</span>':''}
          ${s.archived?'<span class="tag tag-archived" style="font-size:9px;">🔒</span>':''}
        </div>
        <div class="season-item-meta">${s.startDate?fmtDateShort(s.startDate):''} – ${s.endDate?fmtDateShort(s.endDate):''} · ${(s.classes||[]).length} classes</div>
      </div>`).join('')
    : '<div class="widget-empty">No seasons created yet.</div>';

  // Badges
  document.getElementById('sidebar-badges').innerHTML = BADGE_DEFS.map(b=>`
    <div class="badge-item${D.badges.includes(b.id)?'':' locked'}" title="${esc(b.desc)}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-label">${esc(b.label)}</div>
    </div>`).join('');
}

// ── Spotlight ─────────────────────────────────────────────────────
function renderSpotlight() {
  const el=document.getElementById('spotlight-content');
  if(!D.entries.length){ el.innerHTML='<div class="spotlight-empty">Your past sessions will appear here as a daily highlight.</div>'; return; }
  const past=D.entries.filter(e=>e.date<today()).sort((a,b)=>b.date.localeCompare(a.date));
  const pick=past[Math.floor(Math.random()*Math.max(past.length,1))]||D.entries[D.entries.length-1];
  if(!pick) return;
  el.innerHTML=`
    <div class="spotlight-name">${esc(pick.title||pick.style)}</div>
    <div class="spotlight-meta">${fmtDate(pick.date)} · ${pick.duration}min · ${esc(pick.style)}</div>
    ${pick.notes?`<div class="spotlight-excerpt">${esc(pick.notes)}</div>`:''}
  `;
}

// ── Journal feed ──────────────────────────────────────────────────
function renderFeed() {
  // Sync season filter options
  const seasonSel=document.getElementById('filter-season');
  const prev=seasonSel.value;
  seasonSel.innerHTML='<option value="all">All seasons</option>'+
    D.seasons.map(s=>`<option value="${s.id}"${prev===s.id?' selected':''}>${esc(s.name)}${s.archived?' (archived)':''}</option>`).join('');

  let entries=[...D.entries].sort((a,b)=>b.date.localeCompare(a.date));
  if(filterStyle!=='all')  entries=entries.filter(e=>e.style===filterStyle);
  if(filterSeason!=='all') entries=entries.filter(e=>e.seasonId===filterSeason);

  const pages=Math.max(1,Math.ceil(entries.length/PER_PAGE));
  if(currentPage>pages) currentPage=1;
  const slice=entries.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  const feed=document.getElementById('entry-feed');
  const empty=document.getElementById('feed-empty');

  if(!slice.length){
    feed.innerHTML=''; feed.appendChild(empty); empty.style.display='';
    document.getElementById('pagination').innerHTML=''; return;
  }
  empty.style.display='none';

  feed.innerHTML=slice.map(e=>{
    const season=D.seasons.find(s=>s.id===e.seasonId);
    const cls=season?.classes?.find(c=>c.id===e.classId);
    const styleKey=e.style.toLowerCase().replace(/[\s-]+/g,'-');
    return `
    <article class="entry-card style-${styleKey}" onclick="openEntry('${e.id}')">
      <div class="entry-card-header">
        <div class="entry-card-title">${esc(e.title||e.style)}</div>
        <div class="entry-card-date">${fmtDateShort(e.date)}</div>
      </div>
      <div class="entry-card-meta">
        <span class="tag tag-style">${esc(e.style)}</span>
        ${e.mood?`<span class="tag tag-mood">${esc(e.mood)}</span>`:''}
        <span class="tag tag-season">${e.duration}min</span>
        ${season?`<span class="tag tag-season">${esc(season.name)}</span>`:''}
        ${cls?`<span class="tag tag-class">${esc(cls.name)}</span>`:''}
        ${season?.archived?'<span class="tag tag-archived">🔒</span>':''}
      </div>
      ${e.notes?`<div class="entry-card-excerpt">${esc(e.notes)}</div>`:''}
    </article>`;
  }).join('');

  // Pagination
  const pag=document.getElementById('pagination');
  if(pages<=1){ pag.innerHTML=''; return; }
  let html='';
  if(currentPage>1) html+=`<button class="page-btn" onclick="goPage(${currentPage-1})">‹</button>`;
  for(let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-currentPage)<=1)
      html+=`<button class="page-btn${i===currentPage?' active':''}" onclick="goPage(${i})">${i}</button>`;
    else if(Math.abs(i-currentPage)===2)
      html+=`<span style="color:var(--muted);padding:0 4px">…</span>`;
  }
  if(currentPage<pages) html+=`<button class="page-btn" onclick="goPage(${currentPage+1})">›</button>`;
  pag.innerHTML=html;
}

function goPage(n){ currentPage=n; renderFeed(); window.scrollTo({top:0,behavior:'smooth'}); }

document.getElementById('filter-style').addEventListener('change', function(){ filterStyle=this.value; currentPage=1; renderFeed(); });
document.getElementById('filter-season').addEventListener('change', function(){ filterSeason=this.value; currentPage=1; renderFeed(); });

// ── View entry ────────────────────────────────────────────────────
function openEntry(id) {
  const e=D.entries.find(x=>x.id===id); if(!e) return;
  viewEntryId=id;
  const season=D.seasons.find(s=>s.id===e.seasonId);
  const cls=season?.classes?.find(c=>c.id===e.classId);
  const archived=season?.archived;
  document.getElementById('view-entry-title').textContent=e.title||e.style;
  document.getElementById('btn-delete-entry').style.display=archived?'none':'';
  document.getElementById('view-entry-body').innerHTML=`
    <div class="row gap-8 mb-12" style="flex-wrap:wrap;">
      <span class="tag tag-style">${esc(e.style)}</span>
      <span class="tag tag-season">${e.duration} min</span>
      <span class="tag tag-season">${fmtDate(e.date)}</span>
      ${e.mood?`<span class="tag tag-mood">${esc(e.mood)}</span>`:''}
      ${season?`<span class="tag tag-season">${esc(season.name)}</span>`:''}
      ${cls?`<span class="tag tag-class">${esc(cls.name)}</span>`:''}
      ${archived?`<span class="tag tag-archived">🔒 Archived Season</span>`:''}
    </div>
    ${e.notes
      ?`<div class="serif italic lh" style="font-size:1.05rem;color:var(--cream);margin-bottom:1rem;white-space:pre-wrap;">${esc(e.notes)}</div>`
      :'<p class="muted italic" style="margin-bottom:1rem;">No notes for this session.</p>'}
    ${e.mediaLink?`<a href="${esc(e.mediaLink)}" target="_blank" rel="noreferrer" style="color:var(--rose2);font-size:.9rem;">🎬 View Media →</a>`:''}
  `;
  openModal('modal-view-entry');
}

document.getElementById('btn-delete-entry').addEventListener('click',()=>{
  if(!viewEntryId||!confirm('Delete this entry?')) return;
  D.entries=D.entries.filter(e=>e.id!==viewEntryId);
  save(); renderFeed(); renderSidebar(); closeModal('modal-view-entry'); toast('Entry deleted.');
});

// ── Log session ───────────────────────────────────────────────────
function openLogModal() {
  document.getElementById('ml-date').value=today();
  ['ml-title','ml-notes','ml-link'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ml-dur').value='60';
  document.getElementById('ml-style').value=D.activeStyles[0]||'Ballet';
  document.querySelectorAll('#ml-mood-chips .chip').forEach((c,i)=>c.classList.toggle('on',i===1));
  const activeSeason=D.seasons.find(s=>s.active);
  const seasonSel=document.getElementById('ml-season');
  seasonSel.innerHTML='<option value="">No season / Open practice</option>'+
    D.seasons.filter(s=>!s.archived).map(s=>`<option value="${s.id}"${activeSeason?.id===s.id?' selected':''}>${esc(s.name)}</option>`).join('');
  updateLogClassDropdown();
  openModal('modal-log');
}

function updateLogClassDropdown() {
  const sid=document.getElementById('ml-season')?.value;
  const wrap=document.getElementById('ml-class-wrap');
  const sel=document.getElementById('ml-class');
  const classes=D.seasons.find(x=>x.id===sid)?.classes||[];
  wrap.style.display=classes.length?'':'none';
  sel.innerHTML='<option value="">Open practice</option>'+
    classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
}

document.getElementById('ml-mood-chips').addEventListener('click',e=>{
  const chip=e.target.closest('.chip'); if(!chip) return;
  document.querySelectorAll('#ml-mood-chips .chip').forEach(c=>c.classList.remove('on'));
  chip.classList.add('on');
});

document.getElementById('btn-submit-log').addEventListener('click',()=>{
  const entry={
    id:uid(),
    title:    val('ml-title'),
    date:     document.getElementById('ml-date').value||today(),
    style:    document.getElementById('ml-style').value,
    duration: parseInt(document.getElementById('ml-dur').value)||60,
    seasonId: document.getElementById('ml-season').value,
    classId:  document.getElementById('ml-class').value,
    mood:     document.querySelector('#ml-mood-chips .chip.on')?.dataset.mood||'😊 Good',
    notes:    val('ml-notes'),
    mediaLink:val('ml-link'),
  };
  D.entries.push(entry);
  checkBadges(); save(); renderFeed(); renderSidebar(); renderSpotlight();
  closeModal('modal-log'); toast('Session logged ✓');
});

document.getElementById('btn-log-session').addEventListener('click', openLogModal);

// ── Goals ─────────────────────────────────────────────────────────
function openGoalModal() {
  ['gl-title','gl-desc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('gl-date').value='';
  openModal('modal-goal');
}

document.getElementById('btn-submit-goal').addEventListener('click',()=>{
  const title=val('gl-title'); if(!title) return;
  D.goals.push({ id:uid(), title, style:document.getElementById('gl-style').value, description:val('gl-desc'), targetDate:document.getElementById('gl-date').value, progress:0, completed:false });
  checkBadges(); save(); renderSidebar(); closeModal('modal-goal'); toast('Goal set ⭐');
});

function updateGoalProgress(id) {
  const g=D.goals.find(x=>x.id===id); if(!g) return;
  const pct=parseInt(prompt(`Progress for "${g.title}" (0–100%):`, g.progress||0));
  if(isNaN(pct)) return;
  g.progress=Math.min(100,Math.max(0,pct));
  if(g.progress===100 && confirm('Mark this goal as completed?')) g.completed=true;
  checkBadges(); save(); renderSidebar();
}

// ── Events ────────────────────────────────────────────────────────
// Type-specific field definitions
const EVENT_FIELDS = {
  Competition: [
    { id:'ev-style',     label:'Style',          type:'select', options:['Ballet','Contemporary','Lyrical','Jazz','Tap','Hip-Hop'] },
    { id:'ev-piece',     label:'Piece Name',      type:'text',   placeholder:'Routine title' },
    { id:'ev-placement', label:'Placement',       type:'text',   placeholder:'1st, 2nd, Gold…' },
    { id:'ev-score',     label:'Score / Rating',  type:'text',   placeholder:'e.g. 87.4 or Platinum' },
    { id:'ev-costume',   label:'Costume',         type:'text',   placeholder:'Costume description' },
    { id:'ev-music',     label:'Music',           type:'text',   placeholder:'Song / artist' },
    { id:'ev-feedback',  label:'Judge Feedback',  type:'textarea',placeholder:'Notes from judges or directors…' },
  ],
  Recital: [
    { id:'ev-pieces',    label:'Piece(s) Performed', type:'text',   placeholder:'e.g. Sleeping Beauty excerpt, jazz combo' },
    { id:'ev-style',     label:'Style(s)',            type:'text',   placeholder:'e.g. Ballet, Jazz' },
    { id:'ev-role',      label:'Role / Part',         type:'text',   placeholder:'e.g. Soloist, Corps, Lead' },
    { id:'ev-costume',   label:'Costume',             type:'text',   placeholder:'Costume description' },
  ],
  Parade: [
    { id:'ev-formation', label:'Formation / Group',   type:'text',   placeholder:'e.g. Front line, Color guard' },
    { id:'ev-duration',  label:'Duration (min)',       type:'number', placeholder:'e.g. 45' },
    { id:'ev-weather',   label:'Weather Conditions',  type:'text',   placeholder:'e.g. Sunny, 78°F' },
    { id:'ev-route',     label:'Route / Distance',    type:'text',   placeholder:'e.g. 1.2 miles downtown loop' },
  ],
  Holiday: [
    { id:'ev-role',      label:'Role / Character',    type:'text',   placeholder:'e.g. Sugar Plum Fairy, Snowflake' },
    { id:'ev-pieces',    label:'Piece(s)',             type:'text',   placeholder:'e.g. Waltz of the Snowflakes' },
    { id:'ev-costume',   label:'Costume',             type:'text',   placeholder:'Costume description' },
    { id:'ev-nights',    label:'Number of Performances', type:'number', placeholder:'e.g. 3' },
  ],
  Workshop: [
    { id:'ev-instructor',label:'Instructor',           type:'text',   placeholder:'Instructor or guest artist' },
    { id:'ev-host',      label:'Host / Organization',  type:'text',   placeholder:'Studio, company, or event name' },
    { id:'ev-style',     label:'Style Focus',          type:'select', options:['Ballet','Contemporary','Lyrical','Jazz','Tap','Hip-Hop','Multiple'] },
    { id:'ev-takeaways', label:'Key Takeaways',        type:'textarea',placeholder:'What did you learn? What will you work on?' },
  ],
  Other: [
    { id:'ev-role',      label:'Your Role',            type:'text',   placeholder:'e.g. Performer, Volunteer, Observer' },
    { id:'ev-details',   label:'Additional Details',   type:'textarea',placeholder:'Any other relevant details…' },
  ],
};

function renderEventFields() {
  const type=document.getElementById('ev-type')?.value;
  const fields=EVENT_FIELDS[type]||EVENT_FIELDS.Other;
  const wrap=document.getElementById('ev-type-fields');

  // Group into rows of 2 for text inputs, full-width for textareas
  let html='';
  let i=0;
  while(i<fields.length){
    const f=fields[i];
    if(f.type==='textarea'){
      html+=fieldHTML(f); i++;
    } else {
      // Pair with next if it's also not a textarea
      const next=fields[i+1];
      if(next&&next.type!=='textarea'){
        html+=`<div class="form-row">${fieldHTML(f)}${fieldHTML(next)}</div>`; i+=2;
      } else {
        html+=fieldHTML(f); i++;
      }
    }
  }
  wrap.innerHTML=html;
}

function fieldHTML(f) {
  const wrap=`<div class="form-group">
    <label class="form-label">${esc(f.label)}</label>`;
  if(f.type==='select'){
    return wrap+`<select class="input" id="${f.id}">${f.options.map(o=>`<option>${o}</option>`).join('')}</select></div>`;
  } else if(f.type==='textarea'){
    return wrap+`<textarea class="input textarea" id="${f.id}" style="min-height:80px;" placeholder="${esc(f.placeholder||'')}"></textarea></div>`;
  } else {
    return wrap+`<input class="${f.type==='number'?'input':'input'}" type="${f.type||'text'}" id="${f.id}" placeholder="${esc(f.placeholder||'')}"/></div>`;
  }
}

function openEventsModal() {
  renderEventsList();
  openModal('modal-events');
}

function renderEventsList() {
  const typeFilter=document.getElementById('events-filter-type')?.value||'all';
  let events=[...D.events].sort((a,b)=>b.date.localeCompare(a.date));
  if(typeFilter!=='all') events=events.filter(e=>e.type===typeFilter);

  const list=document.getElementById('events-list');
  if(!events.length){
    list.innerHTML=`<div class="feed-empty" style="padding:2.5rem 1rem;">
      <div class="feed-empty-icon">${typeFilter!=='all'?EVENT_ICONS[typeFilter]||'📌':'🎭'}</div>
      <p>No events logged yet${typeFilter!=='all'?' of this type':''}.</p>
    </div>`; return;
  }

  list.innerHTML=events.map(ev=>`
    <div class="event-card" onclick="openEventDetail('${ev.id}')">
      <div class="event-card-header">
        <div class="event-type-badge">
          <span class="event-icon">${EVENT_ICONS[ev.type]||'📌'}</span>
          <span class="event-type-label">${esc(EVENT_LABELS[ev.type]||ev.type)}</span>
        </div>
        <div class="entry-card-date">${fmtDateShort(ev.date)}</div>
      </div>
      <div class="event-card-title">${esc(ev.name)}</div>
      ${ev.venue?`<div class="f12 muted mt-4">📍 ${esc(ev.venue)}</div>`:''}
      <div class="row gap-6 mt-8" style="flex-wrap:wrap;">
        ${ev.placement?`<span class="tag tag-gold-solid">🏅 ${esc(ev.placement)}</span>`:''}
        ${ev.style?`<span class="tag tag-style">${esc(ev.style)}</span>`:''}
        ${ev.instructor?`<span class="tag tag-season">👤 ${esc(ev.instructor)}</span>`:''}
        ${ev.role?`<span class="tag tag-season">${esc(ev.role)}</span>`:''}
        ${ev.nights?`<span class="tag tag-season">${ev.nights} performances</span>`:''}
      </div>
      ${ev.notes?`<div class="entry-card-excerpt mt-8">${esc(ev.notes)}</div>`:''}
    </div>
  `).join('');
}

document.getElementById('events-filter-type').addEventListener('change', renderEventsList);

function openNewEventModal() {
  ['ev-name','ev-venue','ev-media','ev-notes'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('ev-date').value=today();
  document.getElementById('ev-type').value='Competition';
  document.getElementById('new-event-title').textContent='Log Event';
  document.getElementById('btn-submit-event').dataset.editId='';
  renderEventFields();
  openModal('modal-new-event');
}

function openEventDetail(id) {
  const ev=D.events.find(x=>x.id===id); if(!ev) return;
  viewEventId=id;
  document.getElementById('view-event-title').textContent=`${EVENT_ICONS[ev.type]||'📌'} ${ev.name}`;
  document.getElementById('btn-delete-event').style.display='';

  // Build detail rows from all stored fields
  const knownShared=['id','type','name','date','venue','media','notes'];
  const typeFields=EVENT_FIELDS[ev.type]||[];
  const typeFieldIds=typeFields.map(f=>f.id.replace('ev-',''));

  let details='';
  typeFields.forEach(f=>{
    const key=f.id.replace('ev-','');
    const v=ev[key];
    if(v) details+=`<div class="widget-row"><span class="widget-row-label">${esc(f.label)}</span><span class="widget-row-value">${esc(v)}</span></div>`;
  });

  document.getElementById('view-event-body').innerHTML=`
    <div class="row gap-8 mb-12" style="flex-wrap:wrap;">
      <span class="event-type-badge-lg">${EVENT_ICONS[ev.type]||'📌'} ${esc(EVENT_LABELS[ev.type]||ev.type)}</span>
      <span class="tag tag-season">${fmtDate(ev.date)}</span>
      ${ev.venue?`<span class="tag tag-season">📍 ${esc(ev.venue)}</span>`:''}
    </div>
    ${details?`<div style="background:var(--ink3);border-radius:var(--r-sm);padding:.5rem .85rem;margin-bottom:1rem;">${details}</div>`:''}
    ${ev.notes?`
      <div class="section-heading" style="margin-top:1rem;">Journal Notes</div>
      <div class="serif italic lh" style="font-size:1rem;color:var(--cream);white-space:pre-wrap;">${esc(ev.notes)}</div>`:''}
    ${ev.media?`<div class="mt-12"><a href="${esc(ev.media)}" target="_blank" rel="noreferrer" style="color:var(--rose2);font-size:.9rem;">🎬 View Media →</a></div>`:''}
  `;
  openModal('modal-view-event');
}

document.getElementById('btn-delete-event').addEventListener('click',()=>{
  if(!viewEventId||!confirm('Delete this event?')) return;
  D.events=D.events.filter(e=>e.id!==viewEventId);
  checkBadges(); save(); renderSidebar(); renderEventsList();
  closeModal('modal-view-event'); toast('Event deleted.');
});

document.getElementById('btn-submit-event').addEventListener('click',()=>{
  const type=document.getElementById('ev-type').value;
  const name=val('ev-name'); if(!name) return;
  const fields=EVENT_FIELDS[type]||[];

  const ev={ id:uid(), type, name, date:document.getElementById('ev-date').value||today(), venue:val('ev-venue'), media:val('ev-media'), notes:val('ev-notes') };
  fields.forEach(f=>{ const key=f.id.replace('ev-',''); const el=document.getElementById(f.id); if(el) ev[key]=el.value.trim(); });

  D.events.push(ev);
  checkBadges(); save(); renderSidebar(); renderEventsList();
  closeModal('modal-new-event'); toast(`${EVENT_LABELS[type]} logged ${EVENT_ICONS[type]||'✓'}`);
});

document.getElementById('btn-events').addEventListener('click', openEventsModal);
document.getElementById('btn-open-new-event').addEventListener('click', openNewEventModal);
document.getElementById('btn-sidebar-events').addEventListener('click', openEventsModal);

// ── Schedule ──────────────────────────────────────────────────────
function openScheduleModal() { renderScheduleModal(); openModal('modal-schedule'); }

function renderScheduleModal() {
  const active=schedView==='active';
  document.getElementById('sched-tab-active').className  =`btn btn-sm ${active?'btn-primary':'btn-ghost'}`;
  document.getElementById('sched-tab-archived').className=`btn btn-sm ${!active?'btn-primary':'btn-ghost'}`;
  const seasons=D.seasons.filter(s=>active?!s.archived:s.archived);
  const list=document.getElementById('schedule-seasons-list');
  if(!seasons.length){
    list.innerHTML=`<div class="widget-empty" style="text-align:center;padding:2rem;">${active?'No active seasons. Click "+ New Season" above.':'No archived seasons.'}</div>`; return;
  }
  list.innerHTML=seasons.map(s=>{
    const exp=expandedSeason===s.id;
    const ec=D.entries.filter(e=>e.seasonId===s.id).length;
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
        <span class="muted" style="font-size:16px;">${exp?'▲':'▼'}</span>
      </div>
      ${exp?`
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
            ${!s.archived?`<button onclick="deleteClass('${s.id}','${c.id}')" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;padding:4px;">✕</button>`:''}
          </div>`).join('')}
      </div>`:''}`
    ;}).join('');
}

function toggleExpand(id){ expandedSeason=expandedSeason===id?null:id; renderScheduleModal(); }
function toggleSeasonActive(id){ D.seasons=D.seasons.map(s=>s.id===id?{...s,active:!s.active}:s); save();renderSidebar();renderScheduleModal();renderFeed(); }
function toggleArchive(id){ D.seasons=D.seasons.map(s=>s.id===id?{...s,archived:!s.archived,active:false}:s); save();renderSidebar();renderScheduleModal();renderFeed(); }
function deleteSeason(id){ if(!confirm('Delete this season? Journal entries will remain but lose the season link.')) return; D.seasons=D.seasons.filter(s=>s.id!==id); expandedSeason=null; save();renderSidebar();renderScheduleModal();renderFeed(); }
function deleteClass(sid,cid){ D.seasons=D.seasons.map(s=>s.id===sid?{...s,classes:(s.classes||[]).filter(c=>c.id!==cid)}:s); save();renderScheduleModal(); }

document.getElementById('sched-tab-active').addEventListener('click',   ()=>{ schedView='active';   renderScheduleModal(); });
document.getElementById('sched-tab-archived').addEventListener('click',  ()=>{ schedView='archived'; renderScheduleModal(); });
document.getElementById('btn-schedule').addEventListener('click',        openScheduleModal);
document.getElementById('btn-open-schedule').addEventListener('click',   openScheduleModal);

document.getElementById('btn-new-season').addEventListener('click',()=>{
  ['ns-name','ns-end'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ns-start').value=today();
  openModal('modal-new-season');
});

document.getElementById('btn-submit-season').addEventListener('click',()=>{
  const name=val('ns-name'); if(!name) return;
  const isFirst=D.seasons.filter(s=>!s.archived).length===0;
  D.seasons.push({id:uid(),name,startDate:document.getElementById('ns-start').value,endDate:document.getElementById('ns-end').value,classes:[],active:isFirst,archived:false});
  save();renderSidebar();renderFeed();renderScheduleModal();
  closeModal('modal-new-season'); toast('Season created ✓');
});

function startAddClass(seasonId){
  addClassSeason=seasonId;
  document.querySelectorAll('#nc-days-chips .chip').forEach(c=>c.classList.remove('on'));
  ['nc-name','nc-teacher','nc-time','nc-loc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('nc-group').value='';
  openModal('modal-new-class');
}

document.getElementById('nc-days-chips').addEventListener('click',e=>{
  const chip=e.target.closest('.chip'); if(chip) chip.classList.toggle('on');
});

document.getElementById('btn-submit-class').addEventListener('click',()=>{
  const name=val('nc-name'); if(!name||!addClassSeason) return;
  const days=[...document.querySelectorAll('#nc-days-chips .chip.on')].map(c=>c.dataset.day);
  const cls={id:uid(),name,style:document.getElementById('nc-style').value,type:document.getElementById('nc-type').value,teacher:val('nc-teacher'),time:val('nc-time'),location:val('nc-loc'),days,group:document.getElementById('nc-group').value};
  D.seasons=D.seasons.map(s=>s.id===addClassSeason?{...s,classes:[...(s.classes||[]),cls]}:s);
  save();renderScheduleModal();renderSidebar();
  closeModal('modal-new-class'); toast('Class added ✓');
});

// ── Skills ────────────────────────────────────────────────────────
function openSkillsModal() {
  if(!skillsStyle) skillsStyle=D.activeStyles[0]||'Ballet';
  renderSkillsModal(); openModal('modal-skills');
}

function renderSkillsModal() {
  document.getElementById('skills-style-chips').innerHTML=
    D.activeStyles.map(s=>`<span class="chip${skillsStyle===s?' on':''}" onclick="setSkillsStyle('${s}')">${s}</span>`).join('');
  const sk=D.skills[skillsStyle]||[];
  const avg=sk.length?sk.reduce((a,s)=>a+s.level,0)/sk.length/5*100:0;
  document.getElementById('skills-overview').innerHTML=`
    <div class="row gap-12" style="background:var(--ink3);border-radius:var(--r-sm);padding:1rem;align-items:center;">
      <div style="flex:1;">
        <div class="serif" style="font-size:1.1rem;color:var(--cream);margin-bottom:.5rem;">${skillsStyle} Overview</div>
        <div class="prog-track"><div class="prog-fill" style="width:${avg}%"></div></div>
        <div class="f12 muted mt-4">${Math.round(avg)}% overall progress</div>
      </div>
      <div class="serif text-gold" style="font-size:3rem;line-height:1;">${Math.round(avg)}%</div>
    </div>`;
  document.getElementById('skills-list').innerHTML=sk.map(s=>`
    <div style="border-top:1px solid var(--border);padding:.7rem 0;">
      <div class="row sb mb-8">
        <span class="fw5 f14" style="color:var(--cream);">${esc(s.name)}</span>
        <span class="f13 text-gold">${'★'.repeat(s.level)}${'☆'.repeat(5-s.level)}</span>
      </div>
      <div class="prog-track mb-8" style="height:4px;"><div class="prog-fill" style="width:${s.level/5*100}%"></div></div>
      <div class="stars">
        ${[1,2,3,4,5].map(n=>`<span class="star${n<=s.level?' lit':''}" onclick="setSkill('${skillsStyle}','${s.id}',${n})">★</span>`).join('')}
      </div>
    </div>`).join('');
}

function setSkillsStyle(s){ skillsStyle=s; renderSkillsModal(); }
function setSkill(style,id,level){ D.skills[style]=D.skills[style].map(s=>s.id===id?{...s,level}:s); save();renderSkillsModal(); }

document.getElementById('btn-skills').addEventListener('click', openSkillsModal);

// ── Pointe ────────────────────────────────────────────────────────
function openPointeModal() { renderPointeModal(); openModal('modal-pointe'); }

function renderPointeModal() {
  const rd=D.pointeLog.readiness||{}, cd=D.pointeLog.conditioning||{}, shoes=D.pointeLog.shoes||[];
  const done=POINTE_READINESS.filter(r=>rd[r]).length;
  document.getElementById('pointe-body').innerHTML=`
    <div class="section-heading">Readiness Checklist <span class="text-gold">${done}/${POINTE_READINESS.length}</span></div>
    ${POINTE_READINESS.map(item=>`
      <div class="check-row" onclick="togglePointe('readiness','${esc(item)}')">
        <div class="check-box${rd[item]?' checked':''}"> ${rd[item]?'<span class="check-tick">✓</span>':''}</div>
        <span class="check-label${rd[item]?' done':''}">${esc(item)}</span>
      </div>`).join('')}
    <div class="section-heading" style="margin-top:1.25rem;">Conditioning</div>
    ${POINTE_COND.map(item=>`
      <div class="check-row" onclick="togglePointe('conditioning','${esc(item)}')">
        <div class="check-box${cd[item]?' checked-rose':''}"> ${cd[item]?'<span class="check-tick">✓</span>':''}</div>
        <span class="check-label${cd[item]?' done':''}">${esc(item)}</span>
      </div>`).join('')}
    <div class="section-heading row sb" style="margin-top:1.25rem;">
      <span>Pointe Shoe Log</span>
      <button class="btn btn-outline btn-xs" onclick="openShoeModal()">+ Add Fitting</button>
    </div>
    ${!shoes.length?'<div class="widget-empty">No shoe fittings logged yet.</div>'
    :shoes.map(sh=>`
      <div class="shoe-item">
        <div class="shoe-brand">${esc(sh.brand)}</div>
        <div class="shoe-meta">Size ${esc(sh.size)} · Vamp: ${esc(sh.vamp)} · Shank: ${esc(sh.shank)} · ${fmtDateShort(sh.date)}</div>
        ${sh.notes?`<div class="f13 muted mt-4 lh">${esc(sh.notes)}</div>`:''}
      </div>`).join('')}
  `;
}

function togglePointe(field,item){
  D.pointeLog[field]={...D.pointeLog[field],[item]:!D.pointeLog[field][item]};
  checkBadges(); save(); renderPointeModal(); renderSidebar();
}

function openShoeModal(){
  ['sh-brand','sh-size','sh-vamp','sh-shank','sh-notes'].forEach(id=>document.getElementById(id).value='');
  openModal('modal-shoe');
}

document.getElementById('btn-submit-shoe').addEventListener('click',()=>{
  const brand=val('sh-brand'); if(!brand) return;
  D.pointeLog.shoes=[...(D.pointeLog.shoes||[]),{id:uid(),date:today(),brand,size:val('sh-size'),vamp:val('sh-vamp'),shank:val('sh-shank'),notes:val('sh-notes')}];
  save(); renderPointeModal(); closeModal('modal-shoe'); toast('Shoe fitting saved 🩰');
});

document.getElementById('btn-pointe').addEventListener('click', openPointeModal);

// ── Settings ──────────────────────────────────────────────────────
function openSettingsModal() {
  document.getElementById('p-name').value      = D.userName||'';
  document.getElementById('p-studio').value    = D.studioName||'';
  document.getElementById('p-token').value     = D.userToken||'';
  document.getElementById('p-worker-url').value= D.workerUrl||'';
  document.getElementById('setting-pointe').checked = !!D.showPointe;
  document.getElementById('settings-styles-chips').innerHTML=
    STYLES.map(s=>`<span class="chip${D.activeStyles.includes(s)?' on':''}" onclick="this.classList.toggle('on')" data-style="${s}">${s}</span>`).join('');
  renderInjuryLog();
  openModal('modal-settings');
}

function renderInjuryLog() {
  const el=document.getElementById('injury-log-list');
  if(!D.injuryLog.length){ el.innerHTML='<div class="widget-empty">No injuries logged.</div>'; return; }
  el.innerHTML=[...D.injuryLog].reverse().map(inj=>`
    <div class="row sb" style="padding:.45rem 0;border-top:1px solid var(--border);font-size:.85rem;gap:.5rem;">
      <div>
        <span class="fw5" style="color:var(--cream);">${esc(inj.area)}</span>
        <span class="f12 muted" style="margin-left:.4rem;">${fmtDateShort(inj.date)}</span>
        <div class="f12 muted">${esc(inj.description.slice(0,60))}${inj.description.length>60?'…':''}</div>
      </div>
      <span class="tag ${inj.status==='Healed'?'tag-group':'tag-style'}">${esc(inj.status)}</span>
    </div>`).join('');
}

document.getElementById('btn-save-settings').addEventListener('click',()=>{
  D.userName    = val('p-name');
  D.studioName  = val('p-studio');
  D.userToken   = val('p-token')||D.userToken;
  D.workerUrl   = val('p-worker-url');
  D.showPointe  = document.getElementById('setting-pointe').checked;
  D.activeStyles=[...document.querySelectorAll('#settings-styles-chips .chip.on')].map(c=>c.dataset.style);
  if(!D.activeStyles.length) D.activeStyles=[...STYLES];
  save(); renderSidebar(); updatePointeButton();
  closeModal('modal-settings'); toast('Settings saved ✓');
});

document.getElementById('btn-settings').addEventListener('click', openSettingsModal);
document.getElementById('btn-manual-sync').addEventListener('click', async ()=>{
  if(!workerBase()){ toast('No worker URL set in Settings.'); return; }
  toast('Syncing…');
  await pushToWorker();
  toast(syncStatus==='ok' ? 'Synced to worker ✓' : 'Sync failed — check worker URL.');
});
document.getElementById('btn-log-injury').addEventListener('click',()=>openModal('modal-injury'));

document.getElementById('btn-submit-injury').addEventListener('click',()=>{
  const desc=val('inj-desc'); if(!desc) return;
  D.injuryLog.push({id:uid(),date:today(),area:document.getElementById('inj-area').value,description:desc,status:document.getElementById('inj-status').value});
  save(); renderInjuryLog(); closeModal('modal-injury'); toast('Injury logged.');
});

// ── Boot ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded',()=>{
  const stored=KV.get('appdata');
  const defaults=initData();
  if(stored){
    // Merge new fields into legacy saved data so nothing breaks
    D=Object.assign({},defaults,stored);
    if(!Array.isArray(D.events))          D.events=[];
    if(!Array.isArray(D.entries))         D.entries=[];
    if(!Array.isArray(D.seasons))         D.seasons=[];
    if(!Array.isArray(D.goals))           D.goals=[];
    if(!Array.isArray(D.badges))          D.badges=[];
    if(!Array.isArray(D.injuryLog))       D.injuryLog=[];
    if(!D.pointeLog)                      D.pointeLog={readiness:{},shoes:[],conditioning:{}};
    if(!Array.isArray(D.pointeLog.shoes)) D.pointeLog.shoes=[];
    if(typeof D.showPointe==='undefined') D.showPointe=false;
    if(typeof D.workerUrl==='undefined')  D.workerUrl='';
    save();
  } else {
    D=defaults;
    save();
  }
  checkBadges();
  applyTheme();
  updatePointeButton();
  renderSpotlight();
  renderSidebar();
  renderFeed();
  // After local render, try to pull fresher data from worker
  if(workerBase()) {
    pullFromWorker().then(remote => {
      if(!remote) return;
      // Only adopt remote data if it has more entries (simple conflict resolution)
      const localEntries = D.entries.length;
      const remoteEntries = (remote.entries||[]).length;
      if(remoteEntries >= localEntries) {
        const defaults = initData();
        D = Object.assign({}, defaults, remote);
        if(!Array.isArray(D.events))    D.events=[];
        if(!Array.isArray(D.entries))   D.entries=[];
        if(!Array.isArray(D.seasons))   D.seasons=[];
        if(!Array.isArray(D.goals))     D.goals=[];
        if(!Array.isArray(D.badges))    D.badges=[];
        if(!Array.isArray(D.injuryLog)) D.injuryLog=[];
        if(!D.pointeLog) D.pointeLog={readiness:{},shoes:[],conditioning:{}};
        if(!Array.isArray(D.pointeLog.shoes)) D.pointeLog.shoes=[];
        KV.set('appdata', D);
        checkBadges();
        applyTheme();
        updatePointeButton();
        renderSpotlight();
        renderSidebar();
        renderFeed();
      }
    });
  }
});

// ── Global onclick handlers (called from rendered HTML strings) ───
window.openEntry          = openEntry;
window.openEventDetail    = openEventDetail;
window.openGoalModal      = openGoalModal;
window.openShoeModal      = openShoeModal;
window.goPage             = goPage;
window.toggleExpand       = toggleExpand;
window.toggleSeasonActive = toggleSeasonActive;
window.toggleArchive      = toggleArchive;
window.deleteSeason       = deleteSeason;
window.deleteClass        = deleteClass;
window.startAddClass      = startAddClass;
window.setSkillsStyle     = setSkillsStyle;
window.setSkill           = setSkill;
window.togglePointe       = togglePointe;
window.updateGoalProgress = updateGoalProgress;
window.openModal          = openModal;
