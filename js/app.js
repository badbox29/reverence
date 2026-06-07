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
  // ── Practice milestones ──────────────────────────────────────────
  { id:'first_entry',   icon:'🩰', label:'First Steps',      desc:'Logged your first session' },
  { id:'hours_10',      icon:'⏱️', label:'10 Hours',          desc:'Logged 10 hours of practice' },
  { id:'hours_25',      icon:'🌙', label:'25 Hours',          desc:'Logged 25 hours of practice' },
  { id:'hours_50',      icon:'💫', label:'50 Hours',          desc:'Logged 50 hours of practice' },
  { id:'hours_100',     icon:'💎', label:'100 Hours',         desc:'Logged 100 hours of practice' },
  { id:'hours_250',     icon:'🔮', label:'250 Hours',         desc:'Logged 250 hours of practice' },
  { id:'hours_500',     icon:'👑', label:'500 Hours',         desc:'Logged 500 hours of practice' },
  { id:'sessions_365',  icon:'📅', label:'365 Sessions',      desc:'Logged 365 total sessions' },
  // ── Streaks ──────────────────────────────────────────────────────
  { id:'streak_7',      icon:'🔥', label:'Week Warrior',      desc:'7-day practice streak' },
  { id:'streak_30',     icon:'🌶️', label:'Month of Fire',     desc:'30-day practice streak' },
  { id:'streak_90',     icon:'⚡', label:'Unstoppable',       desc:'90-day practice streak' },
  // ── Goals ────────────────────────────────────────────────────────
  { id:'goals_1',       icon:'⭐', label:'Goal Getter',       desc:'Completed your first goal' },
  { id:'goals_5',       icon:'🌠', label:'High Achiever',     desc:'Completed 5 goals' },
  { id:'goals_10',      icon:'🚀', label:'Dream Chaser',      desc:'Completed 10 goals' },
  // ── Skills ───────────────────────────────────────────────────────
  { id:'skill_5star',   icon:'✨', label:'Perfection',        desc:'Rated a skill 5 stars' },
  { id:'style_mastered',icon:'🎖️', label:'Style Mastered',   desc:'All skills maxed in one style' },
  { id:'styles_3',      icon:'🎨', label:'Multi-Stylist',     desc:'Tracked skills in 3+ styles' },
  { id:'styles_all',    icon:'🎭', label:'All Styles',        desc:'Logged sessions in all 6 styles' },
  // ── Events & Performance ─────────────────────────────────────────
  { id:'event_1',       icon:'🏆', label:'Performer',         desc:'Logged your first event' },
  { id:'event_comp_1',  icon:'🥇', label:'Competitor',        desc:'Logged your first competition' },
  { id:'event_recital_1',icon:'🎭',label:'On Stage',          desc:'Logged your first recital' },
  { id:'event_5',       icon:'🌟', label:'Seasoned Performer',desc:'Logged 5 events' },
  { id:'event_10',      icon:'💃', label:'Star',              desc:'Logged 10 events' },
  { id:'podium',        icon:'🥇', label:'Podium',            desc:'Logged a 1st place finish' },
  // ── Seasons & Classes ────────────────────────────────────────────
  { id:'first_season',  icon:'📆', label:'New Season',        desc:'Created your first season' },
  { id:'first_class',   icon:'🏫', label:'Class Act',         desc:'Logged a session tied to a class' },
  { id:'season_complete',icon:'🎓',label:'Season Complete',   desc:'Logged entries across a full season' },
  // ── Pointe ───────────────────────────────────────────────────────
  { id:'pointe_ready',  icon:'🌟', label:'Pointe Ready',      desc:'Completed pointe readiness checklist' },
  { id:'shoe_log_1',    icon:'👟', label:'Fitted',            desc:'Logged your first pointe shoe fitting' },
  { id:'pointe_cond',   icon:'💪', label:'Conditioned',       desc:'Completed the full conditioning checklist' },
  // ── Fun & Surprise ───────────────────────────────────────────────
  { id:'triple_threat', icon:'🌈', label:'Triple Threat',     desc:'Logged 3 different styles in one day' },
  { id:'early_bird',    icon:'🌅', label:'Early Bird',        desc:'Added a session note before 7am' },
  { id:'night_owl',     icon:'🦉', label:'Night Owl',         desc:'Added a session note after 10pm' },
  { id:'journaler',     icon:'📝', label:'Journaler',         desc:'Added notes to 50 sessions' },
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
let syncStatus  = 'idle';  // idle | syncing | ok | error | offline
let syncDirty   = false;   // true when local changes haven't reached worker yet
let syncPingTimer = null;

function workerBase() {
  const url = (D?.workerUrl||'').replace(/\/+$/, '');
  return url || null;
}

function setSyncStatus(s) {
  syncStatus = s;
  const map = {
    idle:    { icon:'☁️',  text:'Not synced', cls:'sync-idle'    },
    syncing: { icon:'⟳',   text:'Syncing…',   cls:'sync-syncing' },
    ok:      { icon:'✓',   text:'Synced',     cls:'sync-ok'      },
    error:   { icon:'✕',   text:'Sync error', cls:'sync-error'   },
    offline: { icon:'📵',  text:'Offline',    cls:'sync-error'   },
  };
  const s2 = map[s] || map.idle;
  const html = `<span id="sync-indicator" class="sync-indicator ${s2.cls}" title="${s2.text}">${s2.icon} ${s2.text}${syncDirty&&s!=='syncing'?' ·  unsaved':''}  </span>`;
  const el = document.getElementById('sync-indicator');
  if(el) el.outerHTML = html;
}

// Push D to worker for the given token (defaults to D.userToken)
async function pushToWorker(token) {
  const base = workerBase();
  token = token || D?.userToken;
  if(!base || !token) return false;
  setSyncStatus('syncing');
  try {
    const payload = { ...D }; // D.lastModified already stamped by save()
    const res = await fetch(`${base}/kv/${encodeURIComponent(token)}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if(res.ok) { syncDirty=false; setSyncStatus('ok'); return true; }
    setSyncStatus('error'); return false;
  } catch {
    setSyncStatus(navigator.onLine ? 'error' : 'offline');
    return false;
  }
}

// Pull data from worker for the given token
async function pullFromWorker(token) {
  const base = workerBase();
  // For Google accounts use the google:<sub> KV key, not the userToken
  token = token || (isGoogleAccount() ? D?.userToken : D?.userToken);
  if(!base || !token) return null;
  setSyncStatus('syncing');
  try {
    const res = await fetch(`${base}/kv/${encodeURIComponent(token)}`);

    // 410 = account migrated to Google — surface this to the caller
    if(res.status === 410) {
      setSyncStatus('idle');
      const data = await res.json().catch(() => ({}));
      if(data.migrated && data.authMethod === 'google') {
        toast('This account has been migrated to Google sign-in. Please sign in with Google.');
        setTimeout(showAccountSetup, 1200);
      }
      return null;
    }

    if(res.status===404){ setSyncStatus('idle'); return null; }
    if(!res.ok){ setSyncStatus('error'); return null; }
    const data = await res.json();
    setSyncStatus('ok');

    // ── Silent legacy migration on secondary devices ───────────────
    const migratedTo = res.headers.get('X-Token-Migrated');
    if(migratedTo && migratedTo !== D?.userToken) {
      data.userToken = migratedTo;
      KV.set('token_upgrade_dismissed', true);
      const base2 = (data.workerUrl || D?.workerUrl || '').replace(/\/+$/, '');
      if(base2) {
        fetch(`${base2}/kv/${encodeURIComponent(migratedTo)}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        }).catch(() => {});
      }
      toast('Account security upgraded automatically ✓');
    }

    return data;
  } catch {
    setSyncStatus(navigator.onLine ? 'error' : 'offline');
    return null;
  }
}

// Merge and validate a raw data object coming from worker or import
function mergeData(raw) {
  const defaults = initData();
  const merged = Object.assign({}, defaults, raw);
  if(!Array.isArray(merged.events))          merged.events=[];
  if(!Array.isArray(merged.entries))         merged.entries=[];
  if(!Array.isArray(merged.seasons))         merged.seasons=[];
  if(!Array.isArray(merged.goals))           merged.goals=[];
  if(!Array.isArray(merged.badges))          merged.badges=[];
  if(!Array.isArray(merged.injuryLog))       merged.injuryLog=[];
  if(!merged.pointeLog)                      merged.pointeLog={readiness:{},shoes:[],conditioning:{}};
  if(!Array.isArray(merged.pointeLog.shoes)) merged.pointeLog.shoes=[];
  if(typeof merged.showPointe==='undefined') merged.showPointe=false;
  if(typeof merged.workerUrl==='undefined')    merged.workerUrl='';
  if(typeof merged.authMethod==='undefined')   merged.authMethod='guest';
  if(typeof merged.linkedGoogle==='undefined') merged.linkedGoogle=null;
  if(typeof merged.createdAt==='undefined')    merged.createdAt=Date.now();
  if(typeof merged.lastModified==='undefined') merged.lastModified=0;
  // Migrate existing skills to include history array
  Object.keys(merged.skills||{}).forEach(style=>{
    (merged.skills[style]||[]).forEach(sk=>{ if(!Array.isArray(sk.history)) sk.history=[]; });
  });
  // Migrate completed goals that are missing completedDate
  (merged.goals||[]).forEach(g=>{
    if(g.completed && !g.completedDate) g.completedDate = g.targetDate||'2000-01-01';
  });
  return merged;
}

// Apply merged remote data and re-render everything
function applyData(merged) {
  D = merged;
  KV.set('appdata', D);
  checkBadges();
  applyTheme();
  updatePointeButton();
  renderSpotlight();
  renderSidebar();
  renderFeed();
}

// Save locally; stamp lastModified; push to worker; mark dirty if push fails
function save() {
  D.lastModified = Date.now();
  KV.set('appdata', D);
  if(workerBase()) {
    syncDirty = true;
    pushToWorker().then(ok => { if(ok) syncDirty=false; });
  }
}

// Periodic ping: check worker reachability, flush dirty changes
function startSyncPing() {
  if(syncPingTimer) clearInterval(syncPingTimer);
  syncPingTimer = setInterval(async () => {
    const base = workerBase();
    if(!base) return;
    if(syncDirty) {
      // Attempt to flush pending changes
      await pushToWorker();
    } else {
      // Just check connectivity with a lightweight pull
      try {
        const res = await fetch(`${base}/`, { method:'GET' });
        if(res.ok && syncStatus==='offline') setSyncStatus('ok');
      } catch { setSyncStatus('offline'); }
    }
  }, 60000); // every 60 seconds
}

// Switch to a different account token — pull remote data and replace local
async function switchToToken(newToken) {
  newToken = newToken.trim();
  if(!newToken) return { ok:false, msg:'Please enter a token.' };
  const base = workerBase();
  if(!base) return { ok:false, msg:'No worker URL configured. Add one in Settings first.' };
  const remote = await pullFromWorker(newToken);
  if(!remote) return { ok:false, msg:'No account found for that token. Check the token and try again.' };
  const merged = mergeData(remote);
  merged.workerUrl = D.workerUrl; // keep current worker URL
  applyData(merged);
  return { ok:true };
}

// ── Utilities ─────────────────────────────────────────────────────
// uid() — lightweight unique ID for internal records (entries, skills, etc.)
// Not used as a credential — does not need cryptographic strength.
const uid = () => Math.random().toString(36).slice(2,12).padEnd(10,'0');

// generateToken() — cryptographically strong account token.
// 16 random bytes → base64url → 22 chars, ~128 bits of entropy.
// Used ONLY for D.userToken (the account credential).
function generateToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// isLegacyToken() — detects old Math.random() tokens (10 chars, base-36).
// Used to offer the migration prompt at boot.
function isLegacyToken(token) {
  return typeof token === 'string' && token.length <= 16;
}

// ── Auth module (framework — Google OAuth not yet wired) ──────────
// These stubs define the interface the full implementation will use.
// Each function is safe to call now and will no-op or return false
// until the Google Client ID is configured and the implementation
// is complete. This keeps the rest of the app auth-aware from day one.

// The Google Client ID for OAuth. Set this when the Google Cloud
// project is created and credentials are issued.
// ── Auth module ───────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = '816310286560-4tgoor67vdu5jh65nlul0lr78rkrc5bc.apps.googleusercontent.com';

function isGoogleAuthAvailable() {
  return typeof GOOGLE_CLIENT_ID === 'string' && GOOGLE_CLIENT_ID.length > 0;
}

function isGoogleAccount() {
  return D?.authMethod === 'google';
}

// isGuest() — true if the user hasn't created a real account yet.
// Guest data is local-only; no worker sync, no token, no Google session.
function isGuest() {
  return !D?.authMethod || D?.authMethod === 'guest';
}

// waitForGIS() — resolves when the Google Identity Services library is ready.
// GIS loads async; this lets us await it cleanly without polling.
function waitForGIS() {
  return new Promise(resolve => {
    if(window.gisReady && window.google?.accounts?.id) return resolve();
    window.addEventListener('gis-ready', resolve, { once: true });
    // Fallback: if script loaded before our listener, check again shortly
    setTimeout(() => {
      if(window.google?.accounts?.id) resolve();
    }, 2000);
  });
}

// handleGoogleCredential() — core handler for a Google ID token.
// Called after GIS returns a credential (sign-in or One Tap).
// Posts the token to the worker, gets back the KV key, then
// loads or creates the account under that key.
// Returns { ok, isNewAccount } on success, null on failure.
async function handleGoogleCredential(idToken) {
  const base = workerBase();
  if(!base) {
    toast('Set your Worker URL in Settings first.');
    return null;
  }

  // Send ID token to worker for verification
  let workerRes;
  try {
    const res = await fetch(`${base}/auth/google`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken }),
    });
    workerRes = await res.json();
    if(!res.ok || !workerRes.ok) throw new Error(workerRes.error || 'Worker auth failed');
  } catch(err) {
    console.error('[Auth] handleGoogleCredential worker error:', err);
    return null;
  }

  const { kvKey, profile } = workerRes;

  // Try to load existing account data from the Google KV key
  const oldWorkerUrl = D?.workerUrl || '';
  const tempUrl = D || {};
  if(D) D.workerUrl = D.workerUrl || oldWorkerUrl;

  let remote = null;
  try {
    const res = await fetch(`${base}/kv/${encodeURIComponent(kvKey)}`);
    if(res.ok) remote = await res.json();
  } catch { /* new account */ }

  const isNewAccount = !remote;

  if(remote) {
    // Existing Google account — merge and apply
    const merged = mergeData(remote);
    merged.workerUrl    = oldWorkerUrl || merged.workerUrl;
    merged.authMethod   = 'google';
    merged.linkedGoogle = profile;
    applyData(merged);
  } else {
    // New Google account — init fresh data with Google auth fields
    if(!D) D = initData();
    D.authMethod   = 'google';
    D.linkedGoogle = profile;
    D.userToken    = kvKey; // use kvKey as the local token reference
    D.workerUrl    = oldWorkerUrl;
    KV.set('appdata', D);
    checkBadges();
    applyTheme();
    updatePointeButton();
    renderSpotlight();
    renderSidebar();
    renderFeed();
  }

  // Store the ID token for session verification at next boot
  KV.set('google_id_token', idToken);
  save();
  startSyncPing();

  return { ok: true, isNewAccount, profile };
}

// signInWithGoogle() — shows a Google sign-in button rendered by GIS.
// renderButton is reliable across all browsers; One Tap is suppressed
// too often (Edge, Firefox, cookies blocked) to use as primary.
// buttonEl: the DOM element to render the Google button into.
// Returns { ok, isNewAccount, profile } on success, null on cancel/fail.
async function signInWithGoogle(buttonEl) {
  if(!isGoogleAuthAvailable()) {
    console.warn('[Auth] Google sign-in not available — GOOGLE_CLIENT_ID not set.');
    return null;
  }

  await waitForGIS();

  return new Promise(resolve => {
    google.accounts.id.initialize({
      client_id:             GOOGLE_CLIENT_ID,
      use_fedcm_for_prompt:  true,  // opt into FedCM — silences deprecation warning
      callback: async (response) => {
        const result = await handleGoogleCredential(response.credential);
        resolve(result);
      },
    });

    if(buttonEl) {
      // Render a real Google-branded button into the provided element.
      // This is the most reliable path across all browsers.
      google.accounts.id.renderButton(buttonEl, {
        theme:  'filled_black',
        size:   'large',
        width:  buttonEl.offsetWidth || 280,
        text:   'continue_with',
        locale: 'en',
      });
    } else {
      // No element provided — attempt One Tap as fallback
      google.accounts.id.prompt(notification => {
        if(notification.isSkippedMoment() || notification.isDismissedMoment()) {
          resolve(null);
        }
      });
    }
  });
}

// signOutGoogle() — clears the Google session locally.
// Resets authMethod to 'token' so the account falls back to token auth.
async function signOutGoogle() {
  if(!isGoogleAccount()) return;
  const email = D.linkedGoogle?.email;
  if(email && window.google?.accounts?.id) {
    google.accounts.id.revoke(email, () => {});
  }
  KV.set('google_id_token', null);
  D.authMethod   = 'google'; // keep as google — don't downgrade silently
  D.linkedGoogle = null;
  save();
  toast('Signed out of Google. Your data is still stored securely.');
}

// verifyGoogleSession() — called at boot for Google accounts.
// Re-verifies the stored ID token against the worker.
// Returns true if valid, false if expired (triggers re-auth prompt).
async function verifyGoogleSession() {
  if(!isGoogleAccount()) return false;
  const base    = workerBase();
  const idToken = KV.get('google_id_token');
  if(!base || !idToken) return false;

  try {
    const res  = await fetch(`${base}/auth/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if(res.ok && data.ok) {
      // Refresh profile in case name/picture changed
      if(data.profile) {
        D.linkedGoogle = data.profile;
        save();
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
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
let schedView      = 'active';
let expandedSeason = null;
let skillsStyle    = null;
let addClassSeason = null;
let viewEntryId    = null;
let viewEventId    = null;

// ── Data init ─────────────────────────────────────────────────────
function initData() {
  return {
    userToken:    generateToken(),
    userName:     '',
    studioName:   '',
    // ── Auth ──────────────────────────────────────────────────────
    // authMethod: 'guest' | 'token' | 'google'
    // New sessions start as guest until the user creates an account.
    // linkedGoogle: null | { sub, email, name, picture }
    // createdAt: unix ms timestamp of account creation
    authMethod:   'guest',
    linkedGoogle: null,
    createdAt:    Date.now(),
    // ─────────────────────────────────────────────────────────────
    activeStyles: [...STYLES],
    showPointe:   false,
    seasons:      [],
    entries:      [],
    events:       [],
    skills:       Object.fromEntries(STYLES.map(s=>[s,DEFAULT_SKILLS[s].map(n=>({id:uid(),name:n,level:0,history:[]}))])),
    goals:        [],
    pointeLog:    { readiness:{}, shoes:[], conditioning:{} },
    badges:       [],
    injuryLog:    [],
    theme:        'dark',
    workerUrl:    '',
    lastModified: 0,
  };
}


// ── Badge checks ──────────────────────────────────────────────────
function checkBadges() {
  const b = D.badges;
  const add = id => { if(!b.includes(id)) b.push(id); };

  // ── Practice hours ─────────────────────────────────────────────
  const hrs = D.entries.reduce((a,e)=>a+(e.duration||0),0)/60;
  if(D.entries.length >= 1)   add('first_entry');
  if(hrs >= 10)  add('hours_10');
  if(hrs >= 25)  add('hours_25');
  if(hrs >= 50)  add('hours_50');
  if(hrs >= 100) add('hours_100');
  if(hrs >= 250) add('hours_250');
  if(hrs >= 500) add('hours_500');
  if(D.entries.length >= 365) add('sessions_365');

  // ── Streaks ────────────────────────────────────────────────────
  let streak=0, cur=new Date(); cur.setHours(0,0,0,0);
  for(let i=0;i<120;i++){
    const ds=cur.toISOString().split('T')[0];
    if(D.entries.some(e=>e.date===ds)){ streak++; cur.setDate(cur.getDate()-1); }
    else if(i===0){ cur.setDate(cur.getDate()-1); } else break;
  }
  if(streak >= 7)  add('streak_7');
  if(streak >= 30) add('streak_30');
  if(streak >= 90) add('streak_90');

  // ── Goals ──────────────────────────────────────────────────────
  const completedGoals = D.goals.filter(g=>g.completed).length;
  if(completedGoals >= 1)  add('goals_1');
  if(completedGoals >= 5)  add('goals_5');
  if(completedGoals >= 10) add('goals_10');

  // ── Skills ─────────────────────────────────────────────────────
  const allSkills = Object.values(D.skills||{}).flat();
  if(allSkills.some(s=>s.level===5)) add('skill_5star');

  // Style mastered: all skills in at least one style are 5 stars
  const stylesMastered = STYLES.filter(style=>{
    const sk = D.skills[style]||[];
    return sk.length > 0 && sk.every(s=>s.level===5);
  });
  if(stylesMastered.length >= 1) add('style_mastered');

  // Styles with at least one logged skill (level > 0)
  const stylesWithSkills = STYLES.filter(style=>(D.skills[style]||[]).some(s=>s.level>0));
  if(stylesWithSkills.length >= 3) add('styles_3');

  // All styles logged
  const usedStyles = new Set(D.entries.map(e=>e.style));
  if(STYLES.every(s=>usedStyles.has(s))) add('styles_all');

  // ── Events ─────────────────────────────────────────────────────
  if(D.events.length >= 1)  add('event_1');
  if(D.events.length >= 5)  add('event_5');
  if(D.events.length >= 10) add('event_10');
  if(D.events.some(e=>e.type==='Competition'))             add('event_comp_1');
  if(D.events.some(e=>e.type==='Recital'))                 add('event_recital_1');
  if(D.events.some(e=>e.placement&&e.placement.match(/^(1st|1|first|gold|platinum)/i))) add('podium');

  // ── Seasons & Classes ──────────────────────────────────────────
  if(D.seasons.length >= 1) add('first_season');
  if(D.entries.some(e=>e.classId)) add('first_class');

  // Season complete: season end date has passed and has at least 5 logged entries
  D.seasons.forEach(s=>{
    if(!s.endDate) return;
    if(s.endDate >= today()) return; // season not finished yet
    const seasonEntries = D.entries.filter(e=>e.seasonId===s.id);
    if(seasonEntries.length >= 5) add('season_complete');
  });

  // ── Pointe ─────────────────────────────────────────────────────
  if(POINTE_READINESS.every(r=>D.pointeLog.readiness[r]))  add('pointe_ready');
  if((D.pointeLog.shoes||[]).length >= 1)                  add('shoe_log_1');
  if(POINTE_COND.every(r=>D.pointeLog.conditioning[r]))    add('pointe_cond');

  // ── Fun & Surprise ─────────────────────────────────────────────
  // Triple threat: 3 different styles in one day
  const byDate = {};
  D.entries.forEach(e=>{ if(!byDate[e.date]) byDate[e.date]=new Set(); byDate[e.date].add(e.style); });
  if(Object.values(byDate).some(s=>s.size>=3)) add('triple_threat');

  // Journaler: 50 entries with notes
  if(D.entries.filter(e=>e.notes&&e.notes.trim().length>0).length >= 50) add('journaler');

  // Early bird / night owl: check entry dates for time-based hints
  // We don't store time, so award these based on lastModified hour when entry is created
  // We'll track this via a special flag set at log time instead
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

  // Upcoming classes — today and next class day from active season
  const nowDate   = new Date();
  const todayName = nowDate.toLocaleDateString('en-US',{weekday:'long'});
  const tomorrowDate = new Date(nowDate); tomorrowDate.setDate(tomorrowDate.getDate()+1);
  const tomorrowName = tomorrowDate.toLocaleDateString('en-US',{weekday:'long'});

  // Find all non-archived seasons with classes
  const activeSeasonsWithClasses = D.seasons.filter(s=>!s.archived&&(s.classes||[]).length>0);

  // Collect classes tagged to today or tomorrow
  const upcomingClasses = [];
  activeSeasonsWithClasses.forEach(s=>{
    (s.classes||[]).forEach(c=>{
      const days = c.days||[];
      if(days.includes(todayName))    upcomingClasses.push({...c, seasonName:s.name, when:'Today'});
      else if(days.includes(tomorrowName)) upcomingClasses.push({...c, seasonName:s.name, when:'Tomorrow'});
    });
  });

  // If nothing today or tomorrow, find the next class day within 7 days
  if(!upcomingClasses.length) {
    for(let offset=2; offset<=7; offset++){
      const d=new Date(nowDate); d.setDate(d.getDate()+offset);
      const dName=d.toLocaleDateString('en-US',{weekday:'long'});
      const dLabel=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
      let found=false;
      activeSeasonsWithClasses.forEach(s=>{
        (s.classes||[]).forEach(c=>{
          if((c.days||[]).includes(dName)){
            upcomingClasses.push({...c, seasonName:s.name, when:dLabel});
            found=true;
          }
        });
      });
      if(found) break;
    }
  }

  document.getElementById('sidebar-classes').innerHTML = upcomingClasses.length
    ? upcomingClasses.map(c=>`
      <div class="widget-row">
        <div style="flex:1;">
          <div class="row gap-8 mb-4" style="align-items:center;">
            <span class="upcoming-when upcoming-when-${c.when==='Today'?'today':c.when==='Tomorrow'?'tomorrow':'soon'}">${esc(c.when)}</span>
            <span class="f13 fw5" style="color:var(--cream);">${esc(c.name)}</span>
          </div>
          <div class="f12 muted">${c.time?esc(c.time)+' · ':''}${esc(c.style)}${c.teacher?' · '+esc(c.teacher):''}</div>
          ${c.seasonName?`<div class="f11 muted mt-4" style="opacity:.7;">${esc(c.seasonName)}</div>`:''}
        </div>
      </div>`).join('')
    : '<div class="widget-empty">No classes scheduled in the next 7 days.</div>';

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

  // Badges — only show earned ones
  const earnedBadges = BADGE_DEFS.filter(b=>D.badges.includes(b.id));
  const badgesEl = document.getElementById('sidebar-badges');
  if(!earnedBadges.length){
    badgesEl.innerHTML='<div class="widget-empty">No badges yet — keep dancing!</div>';
  } else {
    badgesEl.innerHTML = earnedBadges.map(b=>`
      <div class="badge-item" title="${esc(b.desc)}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-label">${esc(b.label)}</div>
      </div>`).join('');
  }
}

// ── Spotlight ─────────────────────────────────────────────────────
// ── Spotlight ─────────────────────────────────────────────────────
// Chosen once per calendar day and cached in localStorage.
// Priority: "on this day" anniversary → milestone moments → contrast pick.

function getSpotlightEntry() {
  const todayStr = today();

  // Return cached pick if it was chosen today
  const cached = KV.get('spotlight_cache');
  if(cached && cached.date === todayStr && cached.entryId) {
    const entry = D.entries.find(e=>e.id===cached.entryId);
    if(entry) return { entry, frame: cached.frame };
  }

  if(!D.entries.length) return null;

  const pastEntries = D.entries.filter(e=>e.date < todayStr);
  if(!pastEntries.length) return null;

  const todayMD   = todayStr.slice(5);      // "MM-DD"
  const todayFull = new Date(todayStr+'T12:00:00');

  // Helper: days between two date strings
  const daysBetween = (a,b) => Math.round(Math.abs(new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/86400000);

  // Helper: prefer entries that have notes
  const hasNotes = e => e.notes && e.notes.trim().length > 20;

  let pick = null;
  let frame = '';

  // ── Priority 1: "On this day" — exact MM-DD match in a prior year ─
  const anniversaries = pastEntries
    .filter(e => e.date.slice(5)===todayMD && e.date.slice(0,4)<todayStr.slice(0,4))
    .sort((a,b)=>a.date.localeCompare(b.date)); // oldest first

  if(anniversaries.length) {
    // Prefer ones with notes; among those pick the oldest (most nostalgic)
    pick = anniversaries.find(hasNotes) || anniversaries[0];
    const yrsAgo = todayFull.getFullYear() - new Date(pick.date+'T12:00:00').getFullYear();
    frame = yrsAgo === 1 ? 'One year ago today…' : `${yrsAgo} years ago today…`;
  }

  // ── Priority 2: "Around this time" — within 7 days, prior year ────
  if(!pick) {
    const nearby = pastEntries.filter(e=>{
      const yr = e.date.slice(0,4);
      if(yr >= todayStr.slice(0,4)) return false;
      const entryMD = new Date(todayStr.slice(0,4)+'-'+e.date.slice(5)+'T12:00:00');
      return Math.abs(entryMD - todayFull)/86400000 <= 7;
    }).sort((a,b)=>a.date.localeCompare(b.date));
    if(nearby.length) {
      pick = nearby.find(hasNotes) || nearby[0];
      const days = daysBetween(pick.date, todayStr);
      const yrsAgo = todayFull.getFullYear() - new Date(pick.date+'T12:00:00').getFullYear();
      frame = `Around this time, ${yrsAgo === 1 ? 'a year' : yrsAgo+' years'} ago…`;
    }
  }

  // ── Priority 3: Milestone moments ─────────────────────────────────
  if(!pick) {
    const sorted = [...pastEntries].sort((a,b)=>a.date.localeCompare(b.date));

    // First entry ever
    const firstEntry = sorted[0];

    // First entry per style
    const styleFirsts = {};
    sorted.forEach(e=>{ if(!styleFirsts[e.style]) styleFirsts[e.style]=e; });

    // Entry closest before a logged event — within 14 days only
    let preEventEntry = null;
    D.events.forEach(ev=>{
      const before = pastEntries
        .filter(e=>{
          if(e.date >= ev.date) return false;
          const daysApart = Math.round(
            (new Date(ev.date+'T12:00:00') - new Date(e.date+'T12:00:00')) / 86400000
          );
          return daysApart <= 14;
        })
        .sort((a,b)=>b.date.localeCompare(a.date))[0];
      if(before && (!preEventEntry || before.date > preEventEntry.date)) {
        const evYear = ev.date.slice(0,4);
        preEventEntry = { entry: before, eventName: ev.name, eventYear: evYear };
      }
    });

    // Pick a milestone with preference for notes
    const milestones = [
      { entry: firstEntry, frame: 'Your very first session…' },
      ...Object.entries(styleFirsts).map(([style,e])=>({ entry:e, frame:`Your first ${style} session…` })),
      ...(preEventEntry ? [{ entry: preEventEntry.entry, frame:`Just before "${esc(preEventEntry.eventName)}" · ${preEventEntry.eventYear}…` }] : []),
    ].filter(m=>m.entry);

    // Deterministically pick based on today's date so it's stable all day
    const seed = parseInt(todayStr.replace(/-/g,'')) % milestones.length;
    const milestone = milestones[seed];
    if(milestone) { pick = milestone.entry; frame = milestone.frame; }
  }

  // ── Priority 4: Contrast — oldest entry with notes ────────────────
  if(!pick) {
    const withNotes = pastEntries.filter(hasNotes).sort((a,b)=>a.date.localeCompare(b.date));
    pick = withNotes[0] || pastEntries.sort((a,b)=>a.date.localeCompare(b.date))[0];
    const days = daysBetween(pick.date, todayStr);
    if(days >= 365) {
      const yrs = Math.floor(days/365);
      frame = `${yrs === 1 ? 'A year' : yrs+' years'} ago…`;
    } else if(days >= 30) {
      frame = `${Math.floor(days/30)} month${Math.floor(days/30)>1?'s':''} ago…`;
    } else {
      frame = `${days} day${days!==1?'s':''} ago…`;
    }
  }

  // Cache the pick for today
  if(pick) KV.set('spotlight_cache', { date: todayStr, entryId: pick.id, frame });
  return pick ? { entry: pick, frame } : null;
}

function renderSpotlight() {
  const el = document.getElementById('spotlight-content');
  if(!D.entries.length) {
    el.innerHTML='<div class="spotlight-empty">Your past sessions will appear here as a daily highlight.</div>';
    return;
  }

  const result = getSpotlightEntry();
  if(!result) {
    el.innerHTML='<div class="spotlight-empty">Log a few sessions and this space will come alive.</div>';
    return;
  }

  const { entry: e, frame } = result;
  const season = D.seasons.find(s=>s.id===e.seasonId);

  // Skills growth callout — show if the style has improved since this entry
  const styleSkills = D.skills[e.style]||[];
  const avgNow = styleSkills.length ? styleSkills.reduce((a,s)=>a+s.level,0)/styleSkills.length : 0;

  el.innerHTML=`
    <div class="spotlight-frame">${esc(frame)}</div>
    <div class="spotlight-name">${esc(e.title||e.style)}</div>
    <div class="spotlight-meta">
      ${fmtDate(e.date)} · ${e.duration}min · ${esc(e.style)}
      ${season?` · ${esc(season.name)}`:''}
    </div>
    ${e.notes?`<div class="spotlight-excerpt">"${esc(e.notes)}"</div>`:''}
    ${avgNow>0?`<div class="spotlight-growth">Your ${esc(e.style)} skills are now at ${Math.round(avgNow/5*100)}% ✦</div>`:''}
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

  if(!slice.length){
    feed.innerHTML=`
      <div class="feed-empty" id="feed-empty">
        <div class="feed-empty-icon">🩰</div>
        <p>No entries yet. Log your first session to begin.</p>
      </div>`;
    document.getElementById('pagination').innerHTML=''; return;
  }

  feed.innerHTML=slice.map(e=>{
    const season=D.seasons.find(s=>s.id===e.seasonId);
    const cls=season?.classes?.find(c=>c.id===e.classId);
    const styleKey=e.style.toLowerCase().replace(/[\s-]+/g,'-');
    const moodEmoji=e.mood?.split(' ')[0]||'';
    // Fallback voice line when no notes
    const voiceLine=e.notes
      ? `<div class="entry-card-voice">"${esc(e.notes)}"</div>`
      : `<div class="entry-card-voice entry-card-voice--quiet">${esc(e.style)} · ${esc(e.mood||'')}</div>`;
    return `
    <article class="entry-card style-${styleKey}" onclick="openEntry('${e.id}')">
      <div class="entry-card-header">
        <div class="entry-card-title">
          ${esc(e.title||e.style)}
          ${moodEmoji?`<span class="entry-mood-emoji">${moodEmoji}</span>`:''}
        </div>
        <div class="entry-card-date">${fmtDateShort(e.date)}</div>
      </div>
      ${voiceLine}
      <div class="entry-card-meta">
        <span class="tag tag-season">${e.duration}min</span>
        ${season?`<span class="tag tag-season">${esc(season.name)}</span>`:''}
        ${cls?`<span class="tag tag-class">${esc(cls.name)}</span>`:''}
        ${season?.archived?'<span class="tag tag-archived">🔒</span>':''}
      </div>
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
    ${!archived?`
    <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border);">
      <button class="btn btn-ghost btn-sm" onclick="editEntry('${e.id}')">✏️ Edit Session</button>
    </div>`:''}
  `;
  openModal('modal-view-entry');
}

document.getElementById('btn-delete-entry').addEventListener('click',()=>{
  if(!viewEntryId||!confirm('Delete this entry?')) return;
  D.entries=D.entries.filter(e=>e.id!==viewEntryId);
  save(); renderFeed(); renderSidebar(); closeModal('modal-view-entry'); toast('Entry deleted.');
});

function editEntry(id) {
  const e = D.entries.find(x=>x.id===id); if(!e) return;
  closeModal('modal-view-entry');
  openLogModal(e);
}

// ── Log session ───────────────────────────────────────────────────
function openLogModal(editEntry) {
  const btn = document.getElementById('btn-submit-log');
  if(editEntry) {
    // Pre-fill form with existing entry data
    document.getElementById('ml-date').value  = editEntry.date||today();
    document.getElementById('ml-title').value = editEntry.title||'';
    document.getElementById('ml-notes').value = editEntry.notes||'';
    document.getElementById('ml-link').value  = editEntry.mediaLink||'';
    document.getElementById('ml-dur').value   = editEntry.duration||60;
    document.getElementById('ml-style').value = editEntry.style||D.activeStyles[0]||'Ballet';
    // Set mood chip
    document.querySelectorAll('#ml-mood-chips .chip').forEach(c=>{
      c.classList.toggle('on', c.dataset.mood===(editEntry.mood||'😊 Good'));
    });
    btn.textContent = 'Save Changes ✓';
    btn.dataset.editId = editEntry.id;
  } else {
    document.getElementById('ml-date').value=today();
    ['ml-title','ml-notes','ml-link'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('ml-dur').value='60';
    document.getElementById('ml-style').value=D.activeStyles[0]||'Ballet';
    document.querySelectorAll('#ml-mood-chips .chip').forEach((c,i)=>c.classList.toggle('on',i===1));
    btn.textContent = 'Save Entry ✓';
    btn.dataset.editId = '';
  }
  btn.disabled = false;
  const titleEl = document.getElementById('modal-log-title');
  if(titleEl) titleEl.textContent = editEntry ? 'Edit Session' : 'Log a Session';

  const activeSeason=D.seasons.find(s=>s.active);
  const seasonSel=document.getElementById('ml-season');
  seasonSel.innerHTML='<option value="">No season / Open practice</option>'+
    D.seasons.filter(s=>!s.archived).map(s=>`<option value="${s.id}"${(editEntry?.seasonId||activeSeason?.id)===s.id?' selected':''}>${esc(s.name)}</option>`).join('');
  updateLogClassDropdown();
  // For edit: set the class dropdown after updating it
  if(editEntry?.classId) {
    const classSel=document.getElementById('ml-class');
    if(classSel) classSel.value=editEntry.classId;
  }
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

document.getElementById('btn-submit-log').addEventListener('click', function(){
  if(this.disabled) return;
  this.disabled = true;
  this.textContent = 'Saving…';

  const editId = this.dataset.editId||'';
  const entryData = {
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

  if(editId) {
    // Editing existing entry
    D.entries = D.entries.map(e => e.id===editId ? {...e, ...entryData} : e);
  } else {
    // New entry — check time-based badges before pushing
    const nowHour = new Date().getHours();
    if(nowHour < 7)  { if(!D.badges.includes('early_bird')) D.badges.push('early_bird'); }
    if(nowHour >= 22){ if(!D.badges.includes('night_owl'))  D.badges.push('night_owl');  }
    D.entries.push({ id:uid(), ...entryData });
  }

  const beforeBadges = [...D.badges];
  checkBadges();
  const newBadges = D.badges.filter(id=>!beforeBadges.includes(id));
  save(); renderFeed(); renderSidebar(); renderSpotlight();
  closeModal('modal-log');
  if(newBadges.length) {
    const b = BADGE_DEFS.find(x=>x.id===newBadges[0]);
    if(b) setTimeout(()=>toast(`${b.icon} Badge unlocked: ${b.label}!`), 400);
  } else {
    toast(editId ? 'Session updated ✓' : 'Session logged ✓');
  }

  // Reset button state (modal is closed but reset anyway)
  this.disabled = false;
  this.textContent = editId ? 'Save Changes ✓' : 'Save Entry ✓';
  this.dataset.editId = '';
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
  if(g.progress===100 && confirm('Mark this goal as completed?')) { g.completed=true; g.completedDate=today(); }
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

document.getElementById('btn-submit-event').addEventListener('click',function(){
  if(this.disabled) return;
  this.disabled=true; this.textContent='Saving…';
  const type=document.getElementById('ev-type').value;
  const name=val('ev-name');
  if(!name){ this.disabled=false; this.textContent='Save Event'; return; }
  const fields=EVENT_FIELDS[type]||[];

  const ev={ id:uid(), type, name, date:document.getElementById('ev-date').value||today(), venue:val('ev-venue'), media:val('ev-media'), notes:val('ev-notes') };
  fields.forEach(f=>{ const key=f.id.replace('ev-',''); const el=document.getElementById(f.id); if(el) ev[key]=el.value.trim(); });

  D.events.push(ev);
  checkBadges(); save(); renderSidebar(); renderEventsList();
  closeModal('modal-new-event'); toast(`${EVENT_LABELS[type]} logged ${EVENT_ICONS[type]||'✓'}`);
  this.disabled=false; this.textContent='Save Event';
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
              <div class="f12 muted mt-4">${c.days?.join(', ')||''} · ${esc(c.time)} · ${esc(c.teacher)}${c.intensiveDuration&&c.intensiveDuration!=='custom'?' · '+esc(c.intensiveDuration):c.intensiveStart&&c.intensiveEnd?' · '+fmtDateShort(c.intensiveStart)+' – '+fmtDateShort(c.intensiveEnd):''}</div>
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
document.getElementById('btn-open-schedule-sidebar').addEventListener('click', openScheduleModal);

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
  document.getElementById('nc-type').value='Regular';
  const intensiveWrap=document.getElementById('nc-intensive-wrap');
  if(intensiveWrap) intensiveWrap.style.display='none';
  openModal('modal-new-class');
}

document.getElementById('nc-days-chips').addEventListener('click',e=>{
  const chip=e.target.closest('.chip'); if(chip) chip.classList.toggle('on');
});

document.getElementById('nc-type').addEventListener('change', function(){
  const intensiveWrap = document.getElementById('nc-intensive-wrap');
  const customDates   = document.getElementById('nc-intensive-custom');
  if(!intensiveWrap) return;
  intensiveWrap.style.display = this.value==='Intensive' ? '' : 'none';
  if(customDates) customDates.style.display = 'none';
});

// Intensive duration change — delegated to modal overlay so it works on dynamic content
document.getElementById('modal-new-class').addEventListener('change', function(e){
  if(e.target.id==='nc-intensive-duration'){
    const customDates = document.getElementById('nc-intensive-custom');
    if(customDates) customDates.style.display = e.target.value==='custom' ? '' : 'none';
  }
});

document.getElementById('btn-submit-class').addEventListener('click',()=>{
  const name=val('nc-name'); if(!name||!addClassSeason) return;
  const days=[...document.querySelectorAll('#nc-days-chips .chip.on')].map(c=>c.dataset.day);
  const classType=document.getElementById('nc-type').value;
  // Intensive duration
  let intensiveDuration='', intensiveStart='', intensiveEnd='';
  if(classType==='Intensive'){
    intensiveDuration=document.getElementById('nc-intensive-duration')?.value||'';
    if(intensiveDuration==='custom'){
      intensiveStart=document.getElementById('nc-intensive-start')?.value||'';
      intensiveEnd=document.getElementById('nc-intensive-end')?.value||'';
    }
  }
  const cls={
    id:uid(), name,
    style:    document.getElementById('nc-style').value,
    type:     classType,
    teacher:  val('nc-teacher'),
    time:     val('nc-time'),
    location: val('nc-loc'),
    days, group: document.getElementById('nc-group').value,
    intensiveDuration, intensiveStart, intensiveEnd,
  };
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
function setSkill(style,id,level){
  D.skills[style]=D.skills[style].map(s=>{
    if(s.id!==id) return s;
    if(s.level===level) return s; // no change — don't record duplicate history
    const history=[...(s.history||[]), { level, date:today() }];
    return { ...s, level, history };
  });
  save(); renderSkillsModal();
}

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

  // ── Auth method display ────────────────────────────────────────
  const authBadgeEl   = document.getElementById('settings-auth-badge');
  const tokenGroupEl  = document.getElementById('settings-token-group');
  const googleInfoEl  = document.getElementById('settings-google-info');
  const upgradeEl     = document.getElementById('settings-upgrade-google');
  const guestEl       = document.getElementById('settings-guest-section');
  const syncControlsEl= document.getElementById('settings-sync-controls');

  if(isGuest()) {
    if(authBadgeEl)    { authBadgeEl.textContent = 'Guest'; authBadgeEl.className = 'auth-badge auth-badge-guest'; }
    if(tokenGroupEl)   tokenGroupEl.style.display   = 'none';
    if(googleInfoEl)   googleInfoEl.style.display    = 'none';
    if(upgradeEl)      upgradeEl.style.display       = 'none';
    if(guestEl)        guestEl.style.display         = '';
    if(syncControlsEl) syncControlsEl.style.display  = 'none';
    // Hide worker URL field — guests don't use it
    const workerGroup = document.getElementById('settings-worker-group');
    if(workerGroup)    workerGroup.style.display      = 'none';
  } else if(isGoogleAccount()) {
    if(authBadgeEl)    { authBadgeEl.textContent = 'Google Account'; authBadgeEl.className = 'auth-badge auth-badge-google'; }
    if(tokenGroupEl)   tokenGroupEl.style.display   = 'none';
    if(upgradeEl)      upgradeEl.style.display       = 'none';
    if(guestEl)        guestEl.style.display         = 'none';
    if(syncControlsEl) syncControlsEl.style.display  = '';
    const workerGroup = document.getElementById('settings-worker-group');
    if(workerGroup)    workerGroup.style.display      = '';
    if(googleInfoEl) {
      const g = D.linkedGoogle;
      googleInfoEl.style.display = '';
      googleInfoEl.innerHTML = g
        ? `<div class="auth-google-info">
             ${g.picture ? `<img src="${g.picture}" class="auth-google-avatar" alt="">` : ''}
             <div>
               <div class="f13 fw5" style="color:var(--cream);">${esc(g.name||'')}</div>
               <div class="f12 muted">${esc(g.email||'')}</div>
             </div>
           </div>`
        : '';
    }
  } else {
    // Token account
    if(authBadgeEl)    { authBadgeEl.textContent = 'Token'; authBadgeEl.className = 'auth-badge auth-badge-token'; }
    if(tokenGroupEl)   tokenGroupEl.style.display   = '';
    if(googleInfoEl)   googleInfoEl.style.display    = 'none';
    if(guestEl)        guestEl.style.display         = 'none';
    if(syncControlsEl) syncControlsEl.style.display  = '';
    const workerGroup = document.getElementById('settings-worker-group');
    if(workerGroup)    workerGroup.style.display      = '';
    if(upgradeEl)      upgradeEl.style.display        = isGoogleAuthAvailable() ? '' : 'none';
  }

  openModal('modal-settings');
}

function renderInjuryLog() {
  const el = document.getElementById('injuries-list');
  if (!el) return;
  if (!D.injuryLog.length) {
    el.innerHTML = '<div class="feed-empty" style="padding:2.5rem 1rem;"><div class="feed-empty-icon">🩹</div><p>No injuries logged yet.<br>Use the button above to log one.</p></div>';
    return;
  }
  const statusColor = s => s === 'Healed' ? 'tag-group' : s === 'Recovering' ? 'tag-gold' : 'tag-style';
  el.innerHTML = [...D.injuryLog].reverse().map(inj => `
    <div class="injury-card">
      <div class="row sb" style="margin-bottom:.4rem;align-items:flex-start;gap:.75rem;">
        <div>
          <span class="fw5 f14" style="color:var(--cream);">${esc(inj.area)}</span>
          <span class="f12 muted" style="margin-left:.5rem;">${fmtDate(inj.date)}</span>
        </div>
        <div class="row gap-6" style="flex-shrink:0;align-items:center;">
          <span class="tag ${statusColor(inj.status)}">${esc(inj.status)}</span>
          <button class="injury-status-btn" onclick="cycleInjuryStatus('${inj.id}')" title="Cycle status">↻</button>
          <button class="injury-delete-btn" onclick="deleteInjury('${inj.id}')" title="Delete">✕</button>
        </div>
      </div>
      ${inj.description ? `<div class="f13 lh" style="color:var(--muted2);margin-bottom:.35rem;">${esc(inj.description)}</div>` : ''}
      ${inj.treatment   ? `<div class="f12 lh muted"><em>Treatment:</em> ${esc(inj.treatment)}</div>` : ''}
    </div>
  `).join('');
}

function cycleInjuryStatus(id) {
  const order = ['Active','Recovering','Healed'];
  const inj = D.injuryLog.find(x => x.id === id); if (!inj) return;
  inj.status = order[(order.indexOf(inj.status) + 1) % order.length];
  save(); renderInjuryLog();
  toast(`Status updated: ${inj.status}`);
}

function deleteInjury(id) {
  if (!confirm('Remove this injury entry?')) return;
  D.injuryLog = D.injuryLog.filter(x => x.id !== id);
  save(); renderInjuryLog();
}

function openInjuriesModal() {
  renderInjuryLog();
  openModal('modal-injuries');
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

document.getElementById('btn-recalc-badges').addEventListener('click', () => {
  if(!confirm('This will wipe all current badges and recalculate them from your actual data.\n\nAny badges earned through real practice will be re-awarded immediately. Badges that only existed due to deleted or corrected data will be removed.\n\nContinue?')) return;
  D.badges = [];
  checkBadges();
  save();
  renderSidebar();
  const earned = D.badges.length;
  toast(`Badges recalculated — ${earned} badge${earned !== 1 ? 's' : ''} earned from your current data.`);
});
document.getElementById('btn-injuries').addEventListener('click', openInjuriesModal);
document.getElementById('btn-open-log-injury').addEventListener('click', ()=>{
  ['inj-desc','inj-treatment'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('inj-area').value='Foot/Ankle';
  document.getElementById('inj-status').value='Active';
  openModal('modal-injury');
});
document.getElementById('btn-manual-sync').addEventListener('click', async ()=>{
  if(!workerBase()){ toast('No worker URL set in Settings.'); return; }
  toast('Syncing…');
  const ok = await pushToWorker();
  toast(ok ? 'Synced to worker ✓' : 'Sync failed — check worker URL.');
});

document.getElementById('btn-switch-account').addEventListener('click', ()=>{
  document.getElementById('switch-token-input').value='';
  document.getElementById('switch-account-status').textContent='';
  openModal('modal-switch-account');
});

// Use event delegation on the settings modal for dynamically-shown buttons.
// Calls are deferred with setTimeout to ensure they run fully outside the
// click event handler — prevents Edge/Firefox from swallowing the second
// call when closeModal mutates the DOM mid-propagation.
document.getElementById('modal-settings').addEventListener('click', e => {
  if(e.target.closest('#btn-guest-create-account')) {
    setTimeout(() => { closeModal('modal-settings'); showSetupFresh(); }, 0);
  }
  if(e.target.closest('#btn-upgrade-to-google')) {
    setTimeout(() => { closeModal('modal-settings'); showGoogleUpgradeFlow(); }, 0);
  }
});

document.getElementById('btn-submit-switch-account').addEventListener('click', async ()=>{
  const token = document.getElementById('switch-token-input').value.trim();
  const statusEl = document.getElementById('switch-account-status');
  statusEl.style.color='var(--gold2)';
  statusEl.textContent='Looking up account…';
  const result = await switchToToken(token);
  if(result.ok){
    closeModal('modal-switch-account');
    closeModal('modal-settings');
    startSyncPing();
    toast('Account switched ✓');
  } else {
    statusEl.style.color='var(--red)';
    statusEl.textContent=result.msg;
  }
});
document.getElementById('btn-submit-injury').addEventListener('click',()=>{
  const desc=val('inj-desc'); if(!desc) return;
  D.injuryLog.push({
    id:uid(), date:today(),
    area:      document.getElementById('inj-area').value,
    status:    document.getElementById('inj-status').value,
    description: desc,
    treatment:   val('inj-treatment'),
  });
  save(); renderInjuryLog(); closeModal('modal-injury');
  toast('Injury logged 🩹');
});

// ── Mobile menu ──────────────────────────────────────────────────
(function() {
  const menuBtn  = document.getElementById('btn-mobile-menu');
  const menuEl   = document.getElementById('mobile-menu');

  function toggleMenu() {
    const open = menuEl.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuEl.setAttribute('aria-hidden', !open);
    // Swap hamburger ↔ X
    menuBtn.innerHTML = open
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  }

  function closeMenu() {
    if(!menuEl.classList.contains('open')) return;
    menuEl.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuEl.setAttribute('aria-hidden', 'true');
    menuBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  }

  menuBtn.addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });

  // Close on outside click
  document.addEventListener('click', e => {
    if(!menuEl.contains(e.target) && e.target !== menuBtn) closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeMenu(); });

  // Wire mobile menu items — each fires the same action as its desktop twin
  // then closes the menu
  function mobAction(mobId, desktopId) {
    const mob = document.getElementById(mobId);
    const desk = document.getElementById(desktopId);
    if(mob && desk) {
      mob.addEventListener('click', () => {
        closeMenu();
        // Small delay so menu close animation completes before modal opens
        setTimeout(() => desk.click(), 80);
      });
    }
  }

  mobAction('mob-log-session', 'btn-log-session');
  mobAction('mob-events',      'btn-events');
  mobAction('mob-schedule',    'btn-schedule');
  mobAction('mob-skills',      'btn-skills');
  mobAction('mob-pointe',      'btn-pointe');
  mobAction('mob-injuries',    'btn-injuries');
  mobAction('mob-journey',     'btn-journey');
  mobAction('mob-settings',    'btn-settings');

  // Keep mob-pointe visibility in sync with desktop btn-pointe
  const origUpdatePointe = window.updatePointeButton;
  window.updatePointeButton = function() {
    if(origUpdatePointe) origUpdatePointe();
    const mobPointe = document.getElementById('mob-pointe');
    const deskPointe = document.getElementById('btn-pointe');
    if(mobPointe && deskPointe) {
      mobPointe.style.display = deskPointe.style.display;
    }
  };
})();

// ── Token upgrade prompt (legacy → secure) ────────────────────────
// Shown once to users whose token was generated by the old Math.random()
// method. Offers to generate a new secure token and migrate KV data.
// Dismissing sets a permanent flag so the prompt never shows again.
function showTokenUpgradePrompt() {
  document.getElementById('account-setup-title').textContent = 'Security Upgrade Available';
  document.getElementById('account-setup-body').innerHTML = `
    <p class="f13 lh muted" style="margin-bottom:1rem;">
      Your account token was created with an older method. A more secure token
      is now available — upgrading takes about 10 seconds and your data stays intact.
    </p>
    <p class="f13 lh muted" style="margin-bottom:1.25rem;">
      Any other devices using this account will upgrade automatically the next
      time they sync — no action needed on your part.
    </p>
    <div id="setup-status" style="min-height:1.4rem;font-size:.82rem;color:var(--red);margin-bottom:.75rem;"></div>
    <div class="form-actions" style="flex-direction:column;gap:.65rem;">
      <button class="btn btn-primary w100" id="btn-upgrade-token" style="justify-content:center;">
        Upgrade to secure token
      </button>
      <button class="btn btn-ghost w100" id="btn-upgrade-dismiss" style="justify-content:center;">
        Keep my current token
      </button>
    </div>
  `;
  openModal('modal-account-setup');

  document.getElementById('btn-upgrade-dismiss').addEventListener('click', () => {
    KV.set('token_upgrade_dismissed', true);
    closeModal('modal-account-setup');
    toast('Token kept — you can upgrade later from Settings.');
  });

  document.getElementById('btn-upgrade-token').addEventListener('click', async () => {
    const statusEl = document.getElementById('setup-status');
    const btn      = document.getElementById('btn-upgrade-token');
    btn.disabled   = true;
    btn.textContent = 'Upgrading…';

    const oldToken = D.userToken;
    const newToken = generateToken();
    const base     = workerBase();

    // If worker is configured, push data to new KV key with the legacy
    // pointer signal embedded. The worker strips _legacyToken before
    // storing and writes the forwarding pointer atomically.
    if(base) {
      statusEl.style.color = 'var(--gold2)';
      statusEl.textContent = 'Copying data to new token on worker…';

      D.userToken = newToken;
      const payload = { ...D, _legacyToken: oldToken };

      let ok = false;
      try {
        const res = await fetch(`${base}/kv/${encodeURIComponent(newToken)}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        ok = res.ok;
      } catch { ok = false; }

      if(!ok) {
        // Revert — don't leave the user stranded
        D.userToken = oldToken;
        btn.disabled = false;
        btn.textContent = 'Upgrade to secure token';
        statusEl.style.color = 'var(--red)';
        statusEl.textContent = 'Worker sync failed. Check your connection and try again. Your old token is unchanged.';
        return;
      }
    }

    // Commit new token locally
    D.userToken = newToken;
    KV.set('token_upgrade_dismissed', true);
    save();

    // Show the new token before closing so the user can note it
    document.getElementById('account-setup-title').textContent = 'Token Upgraded ✓';
    document.getElementById('account-setup-body').innerHTML = `
      <p class="f13 lh muted" style="margin-bottom:1rem;">
        Your account is now secured with a stronger token. Other devices will
        upgrade automatically on their next sync.
      </p>
      <p class="f13 lh muted" style="margin-bottom:.5rem;">Your new token:</p>
      <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:1.25rem;">
        <code class="input input-mono" style="flex:1;font-size:.78rem;padding:.5rem .65rem;
          user-select:all;cursor:text;">${newToken}</code>
        <button class="btn btn-outline btn-sm" id="btn-copy-new-token">Copy</button>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary w100" id="btn-upgrade-done" style="justify-content:center;">
          Done
        </button>
      </div>
    `;

    document.getElementById('btn-copy-new-token').addEventListener('click', () => {
      navigator.clipboard.writeText(newToken).then(() => {
        document.getElementById('btn-copy-new-token').textContent = 'Copied!';
        setTimeout(() => {
          const el = document.getElementById('btn-copy-new-token');
          if(el) el.textContent = 'Copy';
        }, 2000);
      }).catch(() => {
        toast('Select the token above and copy manually.');
      });
    });

    document.getElementById('btn-upgrade-done').addEventListener('click', () => {
      closeModal('modal-account-setup');
      toast('Token upgraded ✓');
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const stored = KV.get('appdata');

  // Clear spotlight cache only when app version changes (not every boot)
  const APP_VERSION = '0.5';
  const cachedVersion = KV.get('app_version');
  if(cachedVersion !== APP_VERSION) {
    KV.set('spotlight_cache', null);
    KV.set('app_version', APP_VERSION);
  }

  if(stored) {
    // Existing local data — merge and render immediately
    D = mergeData(stored);
    KV.set('appdata', D);
    checkBadges();
    applyTheme();
    updatePointeButton();
    renderSpotlight();
    renderSidebar();
    renderFeed();

    // ── Google session verification ────────────────────────────────
    // For Google accounts, verify the stored ID token is still valid
    // before attempting to sync. If expired, prompt re-auth silently.
    if(isGoogleAccount() && workerBase()) {
      const sessionValid = await verifyGoogleSession();
      if(!sessionValid) {
        // Token expired — show a gentle re-auth prompt after render
        setTimeout(() => {
          toast('Your Google session has expired — please sign in again.');
          showAccountSetup();
        }, 1000);
        return; // don't attempt sync with expired session
      }
    }

    // ── Worker sync + legacy token migration ───────────────────────
    // IMPORTANT: the worker pull must resolve BEFORE we decide whether
    // to show the upgrade prompt. If the worker returns X-Token-Migrated,
    // pullFromWorker() silently upgrades the token and sets
    // token_upgrade_dismissed — and the prompt should never appear.
    // Checking before the pull caused Browser B to show the manual upgrade
    // prompt even though auto-migration was about to handle it correctly.
    if(workerBase()) {
      const tokenBeforePull = D.userToken;
      const remote = await pullFromWorker();

      if(remote) {
        const remoteTs = remote.lastModified||0;
        const localTs  = D.lastModified||0;
        if(remoteTs > localTs) {
          const merged = mergeData(remote);
          merged.workerUrl = D.workerUrl;
          applyData(merged);
          // Only show generic sync toast if this wasn't a silent migration
          // (migration shows its own toast inside pullFromWorker)
          if(D.userToken === tokenBeforePull) toast('Data updated from sync ✓');
        } else {
          syncDirty = true;
          pushToWorker();
        }
      } else {
        if(D.entries.length > 0) {
          syncDirty = true;
          pushToWorker();
        }
      }
      startSyncPing();
    }

    // ── Legacy token upgrade prompt ────────────────────────────────
    // Only shown if the worker pull didn't already auto-migrate this
    // device (which sets token_upgrade_dismissed and swaps the token).
    // The 800ms delay lets the app finish rendering before the modal appears.
    if(isLegacyToken(D.userToken) && !KV.get('token_upgrade_dismissed')) {
      setTimeout(showTokenUpgradePrompt, 800);
    }

  } else {
    // No local data — new device. Show account setup wizard.
    D = initData();
    applyTheme();
    showAccountSetup();
  }
});

// ── Account setup wizard ──────────────────────────────────────────
// Screen flow:
//   S1 (Welcome) → S2A (Load: choose Google or Token)
//                → S2B (Start Fresh: name + worker + auth choice)
//   S2A → S3A (Google load: worker URL → unlock Google button)
//       → S3B (Token load: worker URL + token → load)
//
// Helper: set title and body together
function setupScreen(title, html) {
  document.getElementById('account-setup-title').textContent = title;
  document.getElementById('account-setup-body').innerHTML = html;
}

// Helper: test worker URL connectivity. Returns true if reachable.
async function testWorkerUrl(url) {
  try {
    const res = await fetch(`${url.replace(/\/+$/,'')}/`, { method: 'GET' });
    return res.ok;
  } catch { return false; }
}

// ── S1: Welcome ───────────────────────────────────────────────────
function showAccountSetup() {
  setupScreen('Welcome to Révérence', `
    <p class="f13 lh muted" style="margin-bottom:1.5rem;">
      Do you already have a Révérence account on another device?
    </p>
    <div class="form-actions" style="flex-direction:column;gap:.65rem;">
      <button class="btn btn-primary w100" id="btn-setup-has-account" style="justify-content:center;">
        Yes — load my existing account
      </button>
      <button class="btn btn-ghost w100" id="btn-setup-new-account" style="justify-content:center;">
        No — start fresh
      </button>
      <div class="auth-divider"><span>or</span></div>
      <button class="btn btn-ghost w100" id="btn-setup-guest" style="justify-content:center;opacity:.7;">
        Try as a guest
      </button>
    </div>
  `);
  openModal('modal-account-setup');
  document.getElementById('btn-setup-has-account').addEventListener('click', showSetupLoadChoice);
  document.getElementById('btn-setup-new-account').addEventListener('click', showSetupFresh);
  document.getElementById('btn-setup-guest').addEventListener('click', () => {
    // Stay as guest — data saves locally, no worker sync
    D.authMethod = 'guest';
    KV.set('appdata', D);
    checkBadges();
    applyTheme();
    updatePointeButton();
    renderSpotlight();
    renderSidebar();
    renderFeed();
    closeModal('modal-account-setup');
    toast('Exploring as guest — create an account anytime from Settings 🩰');
  });
}

// ── S2A: Load existing — choose auth method ───────────────────────
function showSetupLoadChoice() {
  const googleOption = isGoogleAuthAvailable()
    ? `<button class="btn btn-ghost w100" id="btn-load-via-google" style="justify-content:center;">
         Sign in with Google
       </button>`
    : '';

  setupScreen('Load Existing Account', `
    <p class="f13 lh muted" style="margin-bottom:1.25rem;">
      How is your account secured?
    </p>
    <div class="form-actions" style="flex-direction:column;gap:.65rem;">
      <button class="btn btn-primary w100" id="btn-load-via-token" style="justify-content:center;">
        Continue with Révérence token
      </button>
      ${googleOption}
      <div class="auth-divider" style="margin:.1rem 0;"></div>
      <button class="btn btn-ghost btn-sm" id="btn-setup-back" style="justify-content:center;">← Back</button>
    </div>
  `);
  document.getElementById('btn-setup-back').addEventListener('click', showAccountSetup);
  document.getElementById('btn-load-via-token').addEventListener('click', showSetupLoadToken);
  if(isGoogleAuthAvailable()) {
    document.getElementById('btn-load-via-google')?.addEventListener('click', showSetupLoadGoogle);
  }
}

// ── S3A: Load via Google — worker URL first, then Google button ───
function showSetupLoadGoogle() {
  setupScreen('Sign in with Google', `
    <p class="f13 lh muted" style="margin-bottom:1rem;">
      Enter your Worker URL to connect, then sign in with Google.
    </p>
    <div class="form-group">
      <label class="form-label">Worker URL</label>
      <div class="row gap-8">
        <input class="input" id="setup-worker-url" placeholder="https://reverence.yourname.workers.dev" style="flex:1;"/>
        <button class="btn btn-outline btn-sm" id="btn-test-worker" style="white-space:nowrap;">Test</button>
      </div>
      <div id="setup-status" style="min-height:1.3rem;font-size:.82rem;margin-top:.35rem;"></div>
    </div>
    <div id="google-btn-container" style="width:100%;min-height:44px;opacity:.35;pointer-events:none;transition:opacity .25s;"></div>
    <div class="row gap-8 mt-8" style="justify-content:flex-start;">
      <button class="btn btn-ghost btn-sm" id="btn-setup-back">← Back</button>
    </div>
  `);

  document.getElementById('btn-setup-back').addEventListener('click', showSetupLoadChoice);

  const workerInput  = document.getElementById('setup-worker-url');
  const statusEl     = document.getElementById('setup-status');
  const googleCtr    = document.getElementById('google-btn-container');

  // Render the Google button into the container immediately —
  // it's just visually locked until the worker URL is confirmed.
  signInWithGoogle(googleCtr).then(result => {
    if(result?.ok) {
      closeModal('modal-account-setup');
      toast(result.isNewAccount ? 'Welcome to Révérence 🩰' : 'Account loaded ✓');
      startSyncPing();
    } else if(result === null && D.workerUrl) {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = 'Sign-in cancelled — try again.';
      googleCtr.style.opacity    = '1';
      googleCtr.style.pointerEvents = 'auto';
    }
  });

  async function unlockGoogle() {
    const url = workerInput.value.trim();
    if(!url) { statusEl.style.color='var(--red)'; statusEl.textContent='Enter a Worker URL first.'; return; }
    statusEl.style.color = 'var(--gold2)';
    statusEl.textContent = 'Testing connection…';
    const ok = await testWorkerUrl(url);
    if(ok) {
      D.workerUrl = url.replace(/\/+$/,'');
      statusEl.style.color = 'var(--green)';
      statusEl.textContent = 'Connected ✓ — click the button below to sign in.';
      googleCtr.style.opacity    = '1';
      googleCtr.style.pointerEvents = 'auto';
    } else {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = 'Could not reach that URL — check it and try again.';
    }
  }

  document.getElementById('btn-test-worker').addEventListener('click', unlockGoogle);
  workerInput.addEventListener('keydown', e => { if(e.key==='Enter') unlockGoogle(); });
}

// ── S3B: Load via token ───────────────────────────────────────────
function showSetupLoadToken() {
  setupScreen('Load with Token', `
    <p class="f13 lh muted" style="margin-bottom:1rem;">
      Enter your Worker URL and token from your other device.
    </p>
    <div class="form-group">
      <label class="form-label">Worker URL</label>
      <input class="input" id="setup-worker-url" placeholder="https://reverence.yourname.workers.dev"/>
    </div>
    <div class="form-group">
      <label class="form-label">Your Token</label>
      <input class="input input-mono" id="setup-token" placeholder="Paste your token here…"/>
    </div>
    <div id="setup-status" style="min-height:1.4rem;font-size:.82rem;color:var(--red);margin-bottom:.5rem;"></div>
    <div class="row gap-8" style="justify-content:space-between;">
      <button class="btn btn-ghost" id="btn-setup-back">← Back</button>
      <button class="btn btn-primary" id="btn-setup-load">Load Account</button>
    </div>
  `);

  document.getElementById('btn-setup-back').addEventListener('click', showSetupLoadChoice);

  const workerInput = document.getElementById('setup-worker-url');
  const tokenInput  = document.getElementById('setup-token');
  const loadBtn     = document.getElementById('btn-setup-load');
  const statusEl    = document.getElementById('setup-status');

  // Enable load button only when both fields have content
  function checkFields() {
    loadBtn.disabled = !(workerInput.value.trim() && tokenInput.value.trim());
  }
  workerInput.addEventListener('input', checkFields);
  tokenInput.addEventListener('input', checkFields);
  loadBtn.disabled = true;

  loadBtn.addEventListener('click', async () => {
    const workerUrl = workerInput.value.trim();
    const token     = tokenInput.value.trim();
    loadBtn.disabled = true;
    statusEl.style.color = 'var(--gold2)';
    statusEl.textContent = 'Looking up account…';

    D.workerUrl = workerUrl;
    const remote = await pullFromWorker(token);

    if(!remote) {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = 'No account found. Check both fields and try again.';
      D.workerUrl = '';
      loadBtn.disabled = false;
      return;
    }

    const merged = mergeData(remote);
    merged.workerUrl = workerUrl;
    applyData(merged);
    closeModal('modal-account-setup');
    startSyncPing();
    toast('Account loaded ✓');
  });
}

// ── S2B: Start fresh (also used for guest → account conversion) ───
function showSetupFresh() {
  const googleOption = isGoogleAuthAvailable()
    ? `<button class="btn btn-ghost w100" id="btn-fresh-google" style="justify-content:center;">
         Link Google Account
       </button>`
    : '';

  // Pre-populate name if already set (guest may have entered it in Settings)
  const existingName = D?.userName || '';
  const title  = isGuest() ? 'Create Your Account' : 'Start Fresh';
  const intro  = isGuest()
    ? 'Set up your account to save your data across devices. Everything you\'ve done as a guest comes with you.'
    : 'Tell us a little about yourself to get started.';

  setupScreen(title, `
    <p class="f13 lh muted" style="margin-bottom:1rem;">${intro}</p>
    <div class="form-group">
      <label class="form-label">Your Name</label>
      <input class="input" id="fresh-name" placeholder="First name, last name, or username…"
             value="${esc(existingName)}"/>
      <div class="form-hint">This appears in your journal and year in review.</div>
    </div>
    <div class="form-group">
      <label class="form-label">Worker URL</label>
      <input class="input" id="fresh-worker-url" placeholder="https://reverence.yourname.workers.dev"/>
      <div class="form-hint">Required for cross-device sync. Deploy worker.js to Cloudflare Workers first.</div>
    </div>
    <div id="setup-status" style="min-height:1.3rem;font-size:.82rem;color:var(--red);margin-bottom:.5rem;"></div>
    <div class="form-actions" style="flex-direction:column;gap:.65rem;">
      <button class="btn btn-primary w100" id="btn-fresh-token" style="justify-content:center;">
        Use Révérence Token
      </button>
      ${googleOption}
      <div class="auth-divider" style="margin:.1rem 0;"></div>
      <button class="btn btn-ghost btn-sm" id="btn-setup-back" style="justify-content:center;">← Back</button>
    </div>
  `);

  // Guests converting from Settings close modal on back;
  // new users go back to S1.
  document.getElementById('btn-setup-back').addEventListener('click', () => {
    if(isGuest()) { closeModal('modal-account-setup'); } else { showAccountSetup(); }
  });

  const nameInput   = document.getElementById('fresh-name');
  const workerInput = document.getElementById('fresh-worker-url');
  const statusEl    = document.getElementById('setup-status');

  function validateFresh() {
    const name   = nameInput.value.trim();
    const worker = workerInput.value.trim();
    if(!name)   { statusEl.textContent = 'Please enter your name.';       return false; }
    if(!worker) { statusEl.textContent = 'Please enter your Worker URL.'; return false; }
    statusEl.textContent = '';
    return true;
  }

  // ── Use token ─────────────────────────────────────────────────
  document.getElementById('btn-fresh-token').addEventListener('click', async () => {
    if(!validateFresh()) return;
    const name   = nameInput.value.trim();
    const worker = workerInput.value.trim();

    statusEl.style.color = 'var(--gold2)';
    statusEl.textContent = 'Creating account…';

    D.userName  = name;
    D.workerUrl = worker.replace(/\/+$/,'');
    D.authMethod = 'token';
    KV.set('appdata', D);

    const ok = await pushToWorker();
    if(!ok) {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = 'Could not reach Worker URL — check it and try again.';
      D.workerUrl = '';
      return;
    }

    checkBadges(); applyTheme(); updatePointeButton();
    renderSpotlight(); renderSidebar(); renderFeed();
    closeModal('modal-account-setup');
    startSyncPing();
    toast(`Welcome to Révérence, ${name} 🩰`);
  });

  // ── Link Google ───────────────────────────────────────────────
  if(isGoogleAuthAvailable()) {
    document.getElementById('btn-fresh-google')?.addEventListener('click', async () => {
      if(!validateFresh()) return;
      const name   = nameInput.value.trim();
      const worker = workerInput.value.trim();

      statusEl.style.color = 'var(--gold2)';
      statusEl.textContent = 'Testing connection…';

      D.userName  = name;
      D.workerUrl = worker.replace(/\/+$/,'');

      const connected = await testWorkerUrl(D.workerUrl);
      if(!connected) {
        statusEl.style.color = 'var(--red)';
        statusEl.textContent = 'Could not reach Worker URL — check it and try again.';
        D.workerUrl = '';
        return;
      }

      statusEl.textContent = 'Connected — opening Google sign-in…';

      // Show a Google button screen for the final step
      showSetupFreshGoogle(name, worker);
    });
  }
}

// ── S2B → Google: final Google sign-in step for new accounts ─────
function showSetupFreshGoogle(name, workerUrl) {
  setupScreen('Link Google Account', `
    <p class="f13 lh muted" style="margin-bottom:1rem;">
      Sign in with Google to secure your new account.
    </p>
    <div id="fresh-google-container" style="width:100%;min-height:44px;"></div>
    <div id="setup-status" style="min-height:1.3rem;font-size:.82rem;margin-top:.5rem;"></div>
    <div class="row gap-8 mt-8" style="justify-content:flex-start;">
      <button class="btn btn-ghost btn-sm" id="btn-setup-back">← Back</button>
    </div>
  `);

  document.getElementById('btn-setup-back').addEventListener('click', showSetupFresh);

  const container = document.getElementById('fresh-google-container');
  const statusEl  = document.getElementById('setup-status');

  D.userName  = name;
  D.workerUrl = workerUrl.replace(/\/+$/,'');

  signInWithGoogle(container).then(result => {
    if(result?.ok) {
      closeModal('modal-account-setup');
      toast(`Welcome to Révérence, ${name} 🩰`);
      startSyncPing();
    } else {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = 'Sign-in cancelled — try again or go back.';
    }
  });
}

// ── Token → Google upgrade (called from Settings) ─────────────────
function showGoogleUpgradeFlow() {
  closeModal('modal-settings');
  setupScreen('Upgrade to Google Sign-In', `
    <p class="f13 lh muted" style="margin-bottom:1rem;">
      Upgrading links your account to Google permanently.
      Your token will stop working after this — it's a one-way change.
    </p>
    <div class="form-group">
      <label class="form-label">Worker URL</label>
      <div class="row gap-8">
        <input class="input" id="upgrade-worker-url" value="${D.workerUrl||''}" style="flex:1;"/>
        <button class="btn btn-outline btn-sm" id="btn-upgrade-test" style="white-space:nowrap;">Test</button>
      </div>
      <div id="upgrade-status" style="min-height:1.3rem;font-size:.82rem;margin-top:.35rem;"></div>
    </div>
    <div id="upgrade-google-container" style="width:100%;min-height:44px;opacity:.35;pointer-events:none;transition:opacity .25s;"></div>
    <div class="row gap-8 mt-8" style="justify-content:flex-start;">
      <button class="btn btn-ghost btn-sm" id="btn-upgrade-cancel">Cancel</button>
    </div>
  `);
  openModal('modal-account-setup');

  document.getElementById('btn-upgrade-cancel').addEventListener('click', () => {
    closeModal('modal-account-setup');
  });

  const workerInput  = document.getElementById('upgrade-worker-url');
  const statusEl     = document.getElementById('upgrade-status');
  const googleCtr    = document.getElementById('upgrade-google-container');

  // Wire Google button — completes migration on success
  signInWithGoogle(googleCtr).then(async result => {
    if(!result?.ok) {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = 'Sign-in cancelled — try again.';
      googleCtr.style.opacity = '1';
      googleCtr.style.pointerEvents = 'auto';
      return;
    }

    // Perform server-side migration
    const base     = workerBase();
    const idToken  = KV.get('google_id_token');
    const oldToken = D.userToken;

    statusEl.style.color = 'var(--gold2)';
    statusEl.textContent = 'Migrating account…';

    try {
      const res  = await fetch(`${base}/auth/migrate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken, oldToken }),
      });
      const data = await res.json();
      if(!res.ok || !data.ok) throw new Error(data.error || 'Migration failed');

      // Update local state
      D.authMethod   = 'google';
      D.linkedGoogle = data.profile;
      D.userToken    = data.kvKey;
      KV.set('token_upgrade_dismissed', true);
      save();

      closeModal('modal-account-setup');
      toast('Account upgraded to Google sign-in ✓');
    } catch(err) {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = `Migration failed: ${err.message}`;
    }
  });

  async function unlockUpgradeGoogle() {
    const url = workerInput.value.trim();
    if(!url) { statusEl.style.color='var(--red)'; statusEl.textContent='Enter a Worker URL first.'; return; }
    statusEl.style.color = 'var(--gold2)';
    statusEl.textContent = 'Testing connection…';
    const ok = await testWorkerUrl(url);
    if(ok) {
      D.workerUrl = url.replace(/\/+$/,'');
      statusEl.style.color = 'var(--green)';
      statusEl.textContent = 'Connected ✓ — sign in with Google below to complete upgrade.';
      googleCtr.style.opacity    = '1';
      googleCtr.style.pointerEvents = 'auto';
    } else {
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = 'Could not reach that URL — check it and try again.';
    }
  }

  document.getElementById('btn-upgrade-test').addEventListener('click', unlockUpgradeGoogle);
  // Pre-test if worker URL already set
  if(D.workerUrl) unlockUpgradeGoogle();
}

// ══════════════════════════════════════════════════════════════════
// JOURNEY — Year in Review & Your Story So Far
// ══════════════════════════════════════════════════════════════════

// ── Helpers ───────────────────────────────────────────────────────
function entriesForYear(yr) {
  return D.entries.filter(e=>e.date.startsWith(yr));
}

function availableYears() {
  const years = [...new Set(D.entries.map(e=>e.date.slice(0,4)))].sort((a,b)=>b-a);
  return years;
}

function bestExcerpts(entries, n=3) {
  return [...entries]
    .filter(e=>e.notes&&e.notes.trim().length>40)
    .sort((a,b)=>b.notes.length-a.notes.length)
    .slice(0,n);
}

function longestStreak(entries) {
  if(!entries.length) return 0;
  const dates = [...new Set(entries.map(e=>e.date))].sort();
  let best=1, cur=1;
  for(let i=1;i<dates.length;i++){
    const prev=new Date(dates[i-1]+'T12:00:00');
    const curr=new Date(dates[i]+'T12:00:00');
    if((curr-prev)/86400000===1){ cur++; best=Math.max(best,cur); } else cur=1;
  }
  return best;
}

function statCard(value, label) {
  return `<div class="review-stat-card"><div class="review-stat-val">${value}</div><div class="review-stat-lbl">${esc(label)}</div></div>`;
}

function sectionHead(text) {
  return `<div class="review-section-head">${esc(text)}</div>`;
}

function pullQuote(entry) {
  const season = D.seasons.find(s=>s.id===entry.seasonId);
  return `
    <div class="review-pull-quote">
      <div class="review-pull-text">"${esc(entry.notes)}"</div>
      <div class="review-pull-meta">${esc(entry.title||entry.style)} · ${fmtDateShort(entry.date)}${season?' · '+esc(season.name):''}</div>
    </div>`;
}

// ── Year in Review ────────────────────────────────────────────────
function openYearReview() {
  const years = availableYears();
  const sel   = document.getElementById('year-review-year-select');
  const prevYr= String(new Date().getFullYear()-1);

  sel.innerHTML = years.length
    ? years.map(y=>`<option value="${y}" ${y===prevYr?'selected':''}>${y}</option>`).join('')
    : `<option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>`;

  renderYearReview();
  openModal('modal-year-review');
}

function renderYearReview() {
  const yr     = document.getElementById('year-review-year-select')?.value || String(new Date().getFullYear()-1);
  const body   = document.getElementById('year-review-body');
  const entries= entriesForYear(yr);
  const events = D.events.filter(ev=>ev.date.startsWith(yr));
  const goals  = D.goals.filter(g=>g.completed && (g.completedDate||'').startsWith(yr));
  const curYr  = String(new Date().getFullYear());

  document.getElementById('year-review-title').textContent =
    yr===curYr ? `Your ${yr} So Far` : `${yr} Year in Review`;

  // ── Empty / sparse state ──────────────────────────────────────
  if(!entries.length) {
    body.innerHTML=`
      <div class="review-empty">
        <div class="review-empty-title">Avant la Révérence</div>
        <p>Before every révérence comes the work. The classes. The corrections. The moments of frustration and breakthrough that nobody sees but you.</p>
        <p>As you log your journey, this page will become the story of your year — your hours, your performances, your goals, the things you wrote when no one was watching.</p>
        <p class="review-empty-closing">The first page is waiting to be written.</p>
      </div>`;
    return;
  }

  const hrs       = entries.reduce((a,e)=>a+(e.duration||0),0)/60;
  const streak    = longestStreak(entries);
  const styles    = [...new Set(entries.map(e=>e.style))];
  const excerpts  = bestExcerpts(entries);

  // Skills portrait for this year — skills with history entries in this year
  const skillsThisYear = [];
  Object.entries(D.skills||{}).forEach(([style,sks])=>{
    sks.forEach(sk=>{
      const yearHistory = (sk.history||[]).filter(h=>h.date.startsWith(yr));
      if(yearHistory.length) {
        const startLevel = yearHistory[0].level;
        const endLevel   = sk.level;
        if(endLevel > startLevel) skillsThisYear.push({style,name:sk.name,from:startLevel,to:endLevel});
      }
    });
  });

  // First & last session
  const sorted    = [...entries].sort((a,b)=>a.date.localeCompare(b.date));
  const firstSess = sorted[0];
  const lastSess  = sorted[sorted.length-1];

  // Most logged style
  const styleCounts = {};
  entries.forEach(e=>{ styleCounts[e.style]=(styleCounts[e.style]||0)+1; });
  const topStyle = Object.entries(styleCounts).sort((a,b)=>b[1]-a[1])[0];

  body.innerHTML = `
    <div class="review-year-header">
      <div class="review-year-label">${yr===curYr?'Your year in dance, so far':'Your year in dance'}</div>
      ${D.userName?`<div class="review-dancer-name">${esc(D.userName)}</div>`:''}
    </div>

    ${sectionHead('The Numbers')}
    <div class="review-stats-grid">
      ${statCard(Math.round(hrs*10)/10, 'Hours danced')}
      ${statCard(entries.length, 'Sessions logged')}
      ${statCard(events.length, 'Performances')}
      ${statCard(streak, 'Longest streak (days)')}
      ${statCard(styles.length, 'Styles practiced')}
      ${statCard(goals.length||'—', 'Goals completed')}
    </div>

    ${sectionHead('The Year')}
    <div class="review-timeline">
      <div class="review-timeline-item">
        <div class="review-timeline-dot"></div>
        <div>
          <div class="review-timeline-label">First session of ${yr}</div>
          <div class="review-timeline-title">${esc(firstSess.title||firstSess.style)} · ${fmtDate(firstSess.date)}</div>
          ${firstSess.notes?`<div class="review-timeline-note">"${esc(firstSess.notes.slice(0,120))}${firstSess.notes.length>120?'…':''}"</div>`:''}
        </div>
      </div>
      ${topStyle?`
      <div class="review-timeline-item">
        <div class="review-timeline-dot"></div>
        <div>
          <div class="review-timeline-label">Most practiced style</div>
          <div class="review-timeline-title">${esc(topStyle[0])} — ${topStyle[1]} session${topStyle[1]!==1?'s':''}</div>
        </div>
      </div>`:''}
      ${events.map(ev=>`
      <div class="review-timeline-item">
        <div class="review-timeline-dot review-timeline-dot--event"></div>
        <div>
          <div class="review-timeline-label">${esc(EVENT_LABELS[ev.type]||ev.type)}</div>
          <div class="review-timeline-title">${esc(ev.name)} · ${fmtDateShort(ev.date)}</div>
          ${ev.placement?`<div class="review-timeline-note">Placed: ${esc(ev.placement)}</div>`:''}
          ${ev.notes?`<div class="review-timeline-note">"${esc(ev.notes.slice(0,100))}${ev.notes.length>100?'…':''}"</div>`:''}
        </div>
      </div>`).join('')}
      ${yr!==curYr?`
      <div class="review-timeline-item">
        <div class="review-timeline-dot"></div>
        <div>
          <div class="review-timeline-label">Last session of ${yr}</div>
          <div class="review-timeline-title">${esc(lastSess.title||lastSess.style)} · ${fmtDate(lastSess.date)}</div>
        </div>
      </div>`:''}
    </div>

    ${skillsThisYear.length?`
    ${sectionHead('Skills Growth')}
    <div class="review-skills-growth">
      ${skillsThisYear.map(sk=>`
        <div class="review-skill-row">
          <div class="review-skill-name">${esc(sk.style)} — ${esc(sk.name)}</div>
          <div class="review-skill-progress">
            <span class="review-skill-stars">${'★'.repeat(sk.from)}${'☆'.repeat(5-sk.from)}</span>
            <span class="review-skill-arrow">→</span>
            <span class="review-skill-stars review-skill-stars--after">${'★'.repeat(sk.to)}${'☆'.repeat(5-sk.to)}</span>
          </div>
        </div>`).join('')}
    </div>`:''}

    ${excerpts.length?`
    ${sectionHead('Your Words')}
    <div class="review-pull-quotes">
      ${excerpts.map(e=>pullQuote(e)).join('')}
    </div>`:''}

    ${yr===curYr&&D.goals.filter(g=>!g.completed).length?`
    ${sectionHead('Still Writing')}
    <div class="review-active-goals">
      ${D.goals.filter(g=>!g.completed).map(g=>`
        <div class="review-goal-row">
          <div class="review-goal-title">${esc(g.title)}</div>
          <div class="prog-track" style="flex:1;max-width:160px;"><div class="prog-fill" style="width:${g.progress||0}%"></div></div>
          <div class="f12 muted">${g.progress||0}%</div>
        </div>`).join('')}
    </div>`:''}

    <div class="review-footer">Révérence ✦ ${yr}</div>
  `;
}

// ── Your Story So Far ─────────────────────────────────────────────
function openStory() {
  renderStory();
  openModal('modal-story');
}

function renderStory() {
  const body = document.getElementById('story-body');

  if(!D.entries.length) {
    body.innerHTML=`
      <div class="review-empty">
        <div class="review-empty-title">The Empty Stage</div>
        <p>Every dancer stands here first.</p>
        <p>This is where your story will live — from your very first session to wherever the journey takes you. Every class logged, every goal set, every performance remembered becomes part of a record that grows with you.</p>
        <p>One day you'll open this and see years of work looking back at you.</p>
        <p class="review-empty-closing">Start anywhere. The stage is yours.</p>
      </div>`;
    return;
  }

  const allSorted = [...D.entries].sort((a,b)=>a.date.localeCompare(b.date));
  const firstEver = allSorted[0];
  const totalHrs  = D.entries.reduce((a,e)=>a+(e.duration||0),0)/60;
  const totalDays = Math.round((new Date()-new Date(firstEver.date+'T12:00:00'))/86400000);
  const allStyles = [...new Set(D.entries.map(e=>e.style))];
  const streak    = longestStreak(D.entries);
  const topExcerpts = bestExcerpts(D.entries, 2);

  // Style first-times
  const styleFirsts = {};
  allSorted.forEach(e=>{ if(!styleFirsts[e.style]) styleFirsts[e.style]=e; });

  // Year-by-year summary
  const years = availableYears().reverse(); // chronological
  const yearSummaries = years.map(yr=>{
    const yEntries = entriesForYear(yr);
    const yHrs     = yEntries.reduce((a,e)=>a+(e.duration||0),0)/60;
    const yEvents  = D.events.filter(ev=>ev.date.startsWith(yr));
    const yStyles  = [...new Set(yEntries.map(e=>e.style))];
    return { yr, sessions:yEntries.length, hrs:yHrs, events:yEvents.length, styles:yStyles };
  });

  // Skills portrait
  const skillPortrait = Object.entries(D.skills||{})
    .map(([style,sks])=>{
      const avg=sks.length?sks.reduce((a,s)=>a+s.level,0)/sks.length:0;
      return { style, avg, count: sks.filter(s=>s.level>0).length };
    })
    .filter(s=>s.count>0)
    .sort((a,b)=>b.avg-a.avg);

  // Badges in order earned — we don't store earn dates yet so show all earned
  const earnedBadges = BADGE_DEFS.filter(b=>D.badges.includes(b.id));

  body.innerHTML=`
    <div class="review-year-header">
      <div class="review-year-label">The full journey</div>
      ${D.userName?`<div class="review-dancer-name">${esc(D.userName)}</div>`:''}
    </div>

    ${sectionHead('The Numbers')}
    <div class="review-stats-grid">
      ${statCard(Math.round(totalHrs*10)/10, 'Total hours')}
      ${statCard(D.entries.length, 'Sessions logged')}
      ${statCard(D.events.length, 'Events performed')}
      ${statCard(D.goals.filter(g=>g.completed).length, 'Goals completed')}
      ${statCard(streak, 'Longest streak')}
      ${statCard(totalDays, 'Days since first session')}
    </div>

    ${sectionHead('Where It Began')}
    <div class="review-pull-quote review-pull-quote--featured">
      <div class="review-pull-label">Your very first session</div>
      <div class="review-timeline-title" style="margin-bottom:.5rem;">${esc(firstEver.title||firstEver.style)} · ${fmtDate(firstEver.date)}</div>
      ${firstEver.notes
        ?`<div class="review-pull-text">"${esc(firstEver.notes)}"</div>`
        :`<div class="f13 muted italic">${esc(firstEver.style)} · ${firstEver.duration} min · no notes</div>`}
    </div>

    ${sectionHead('Year by Year')}
    <div class="review-year-grid">
      ${yearSummaries.map(y=>`
        <div class="review-year-card">
          <div class="review-year-card-yr">${y.yr}</div>
          <div class="review-year-card-stat">${Math.round(y.hrs*10)/10} <span>hrs</span></div>
          <div class="f12 muted">${y.sessions} sessions</div>
          ${y.events?`<div class="f12 muted">${y.events} event${y.events!==1?'s':''}</div>`:''}
          <div class="f11 muted mt-4">${y.styles.join(', ')}</div>
        </div>`).join('')}
    </div>

    ${Object.keys(styleFirsts).length>1?`
    ${sectionHead('New Styles Added')}
    <div class="review-timeline">
      ${Object.entries(styleFirsts).sort((a,b)=>a[1].date.localeCompare(b[1].date)).map(([style,e])=>`
        <div class="review-timeline-item">
          <div class="review-timeline-dot"></div>
          <div>
            <div class="review-timeline-label">First ${esc(style)} session</div>
            <div class="review-timeline-title">${fmtDate(e.date)}</div>
          </div>
        </div>`).join('')}
    </div>`:''}

    ${skillPortrait.length?`
    ${sectionHead('Skills Portrait')}
    <div class="review-skills-portrait">
      ${skillPortrait.map(s=>`
        <div class="review-portrait-row">
          <div class="review-portrait-style">${esc(s.style)}</div>
          <div class="prog-track flex-1"><div class="prog-fill" style="width:${Math.round(s.avg/5*100)}%"></div></div>
          <div class="review-portrait-pct">${Math.round(s.avg/5*100)}%</div>
        </div>`).join('')}
    </div>`:''}

    ${topExcerpts.length?`
    ${sectionHead('Moments Worth Keeping')}
    <div class="review-pull-quotes">
      ${topExcerpts.map(e=>pullQuote(e)).join('')}
    </div>`:''}

    ${earnedBadges.length?`
    ${sectionHead('Milestones')}
    <div class="review-badges">
      ${earnedBadges.map(b=>`
        <div class="review-badge-item" title="${esc(b.desc)}">
          <span class="review-badge-icon">${b.icon}</span>
          <span class="review-badge-label">${esc(b.label)}</span>
        </div>`).join('')}
    </div>`:''}

    ${D.goals.filter(g=>!g.completed).length?`
    ${sectionHead('Still Writing')}
    <div class="review-active-goals">
      ${D.goals.filter(g=>!g.completed).map(g=>`
        <div class="review-goal-row">
          <div class="review-goal-title">${esc(g.title)}</div>
          <div class="prog-track" style="flex:1;max-width:160px;"><div class="prog-fill" style="width:${g.progress||0}%"></div></div>
          <div class="f12 muted">${g.progress||0}%</div>
        </div>`).join('')}
    </div>`:''}

    <div class="review-footer">Révérence ✦ Your Journey</div>
  `;
}

// ── Button wiring ─────────────────────────────────────────────────
document.getElementById('btn-journey').addEventListener('click',()=>openModal('modal-journey'));
document.getElementById('btn-open-year-review').addEventListener('click',()=>{
  closeModal('modal-journey'); openYearReview();
});
document.getElementById('btn-open-story').addEventListener('click',()=>{
  closeModal('modal-journey'); openStory();
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
window.cycleInjuryStatus  = cycleInjuryStatus;
window.deleteInjury       = deleteInjury;
window.showAccountSetup       = showAccountSetup;
window.showSetupAccountChoice  = showSetupLoadChoice;
window.editEntry          = editEntry;
window.renderYearReview   = renderYearReview;
