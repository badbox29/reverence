import { useState, useEffect, useCallback } from "react";

// ── KV Storage helpers ──────────────────────────────────────────────────────
const KV_PREFIX = "dance_trainer_";
const kv = {
  get: async (key) => {
    try { const r = await window.storage.get(KV_PREFIX + key); return r ? JSON.parse(r.value) : null; } catch { return null; }
  },
  set: async (key, val) => {
    try { await window.storage.set(KV_PREFIX + key, JSON.stringify(val)); } catch {}
  },
};

// ── Default seed data ───────────────────────────────────────────────────────
const STYLES = ["Ballet","Contemporary","Lyrical","Jazz","Tap","Hip-Hop"];
const GROUPS = ["Company","Competition","Pointe"];
const MOODS = ["✨ Inspired","😊 Good","😐 Okay","😓 Tired","💪 Strong"];
const BADGE_DEFS = [
  { id:"first_entry", label:"First Steps", desc:"Logged your first journal entry", icon:"🩰" },
  { id:"streak_7",    label:"Week Warrior", desc:"7-day practice streak", icon:"🔥" },
  { id:"goals_1",     label:"Goal Getter", desc:"Completed your first goal", icon:"⭐" },
  { id:"pointe_ready",label:"Pointe Ready", desc:"Completed pointe readiness checklist", icon:"🌟" },
  { id:"hours_10",    label:"10 Hours", desc:"Logged 10 hours of practice", icon:"⏱️" },
  { id:"comp_1",      label:"Competitor", desc:"Logged your first competition", icon:"🏆" },
];

const DEFAULT_SKILLS = {
  Ballet:["Pliés","Tendus","Dégagés","Ronds de jambe","Arabesques","Attitudes","Pirouettes","Grand battement","Adagio","Pointe work"],
  Contemporary:["Floor work","Improvisation","Partnering","Release technique","Contraction","Spiral","Balance","Jumps","Turns","Storytelling"],
  Lyrical:["Emotional expression","Flexibility","Turns","Leaps","Transitions","Musicality","Arms","Footwork","Lifts","Performance"],
  Jazz:["Isolations","Kicks","Turns","Leaps","Across the floor","Styling","Rhythmic accuracy","Performance energy","Flexibility","Strength"],
  Tap:["Shuffles","Flaps","Buffalo","Cramp roll","Wings","Paradiddle","Rhythm","Speed","Clarity","Improvisation"],
  "Hip-Hop":["Grooves","Popping","Locking","Footwork","Freestyle","Musicality","Levels","Strength","Battles","Cyphers"],
};

// ── Utility ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,10);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const today = () => new Date().toISOString().split("T")[0];

// ── Styles (CSS-in-JS via <style> tag) ─────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0d1b2a;
    --navy2: #152232;
    --navy3: #1e2f42;
    --navy4: #253650;
    --blush: #e8b4b8;
    --blush2: #f0cdd0;
    --gold: #c9a96e;
    --gold2: #e2c99a;
    --white: #f5f0eb;
    --muted: #7a93a8;
    --green: #7ec8a4;
    --red: #e07c7c;
    --radius: 14px;
    --radius-sm: 8px;
  }

  body { background: var(--navy); color: var(--white); font-family: 'DM Sans', sans-serif; font-weight: 300; min-height: 100vh; }

  h1,h2,h3,h4 { font-family: 'Cormorant Garamond', serif; font-weight: 400; }

  .app { max-width: 430px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; position: relative; }

  /* Nav */
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background: var(--navy2); border-top: 1px solid var(--navy4); display: flex; justify-content: space-around; padding: 10px 0 20px; z-index: 100; }
  .nav-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; padding: 6px 12px; color: var(--muted); transition: color .2s; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 400; }
  .nav-btn.active { color: var(--blush); }
  .nav-btn span:first-child { font-size: 22px; }

  /* Content area */
  .content { flex: 1; padding: 0 0 90px; overflow-y: auto; }

  /* Page header */
  .page-header { padding: 48px 20px 16px; }
  .page-header h1 { font-size: 36px; color: var(--white); line-height: 1.1; }
  .page-header p { color: var(--muted); font-size: 13px; margin-top: 4px; }

  /* Cards */
  .card { background: var(--navy2); border: 1px solid var(--navy4); border-radius: var(--radius); padding: 16px; margin: 0 16px 12px; }
  .card-sm { background: var(--navy3); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 8px; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 100px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; transition: all .2s; }
  .btn-primary { background: var(--blush); color: var(--navy); }
  .btn-primary:hover { background: var(--blush2); }
  .btn-gold { background: var(--gold); color: var(--navy); }
  .btn-outline { background: transparent; border: 1px solid var(--navy4); color: var(--white); }
  .btn-outline:hover { border-color: var(--blush); color: var(--blush); }
  .btn-danger { background: transparent; border: 1px solid var(--red); color: var(--red); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-icon { width: 36px; height: 36px; padding: 0; justify-content: center; border-radius: 50%; background: var(--navy3); border: 1px solid var(--navy4); color: var(--white); font-size: 16px; cursor: pointer; }

  /* FAB */
  .fab { position: fixed; bottom: 84px; right: calc(50% - 215px + 16px); width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, var(--blush), var(--gold)); border: none; color: var(--navy); font-size: 24px; cursor: pointer; box-shadow: 0 4px 20px rgba(232,180,184,.3); display: flex; align-items: center; justify-content: center; transition: transform .2s; z-index: 99; }
  .fab:hover { transform: scale(1.08); }

  /* Tags */
  .tag { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; }
  .tag-blush { background: rgba(232,180,184,.15); color: var(--blush); }
  .tag-gold { background: rgba(201,169,110,.15); color: var(--gold); }
  .tag-green { background: rgba(126,200,164,.15); color: var(--green); }
  .tag-muted { background: var(--navy3); color: var(--muted); }

  /* Progress bar */
  .prog-bar { height: 6px; background: var(--navy4); border-radius: 3px; overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--blush), var(--gold)); transition: width .4s ease; }

  /* Star rating */
  .stars { display: flex; gap: 4px; }
  .star { font-size: 18px; cursor: pointer; transition: transform .1s; line-height: 1; }
  .star:hover { transform: scale(1.2); }

  /* Form elements */
  .form-group { margin-bottom: 14px; }
  .form-label { display: block; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
  .form-input, .form-select, .form-textarea { width: 100%; background: var(--navy3); border: 1px solid var(--navy4); border-radius: var(--radius-sm); padding: 10px 12px; color: var(--white); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color .2s; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--blush); }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-select option { background: var(--navy2); }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(13,27,42,.85); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .modal { background: var(--navy2); border-radius: var(--radius) var(--radius) 0 0; width: 100%; max-width: 430px; max-height: 90vh; overflow-y: auto; padding: 24px 20px 40px; border-top: 1px solid var(--navy4); }
  .modal-handle { width: 36px; height: 4px; background: var(--navy4); border-radius: 2px; margin: 0 auto 20px; }
  .modal h2 { font-size: 26px; margin-bottom: 20px; }

  /* Section title */
  .section-title { font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); padding: 0 20px; margin-bottom: 10px; margin-top: 20px; }

  /* Divider */
  .divider { height: 1px; background: var(--navy4); margin: 16px 20px; }

  /* Empty state */
  .empty { text-align: center; padding: 48px 20px; color: var(--muted); }
  .empty .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty p { font-size: 14px; line-height: 1.6; }

  /* Streak ring */
  .streak-ring { width: 64px; height: 64px; border-radius: 50%; border: 3px solid var(--gold); display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .streak-num { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--gold); line-height: 1; }
  .streak-label { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

  /* Dashboard stat */
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 16px 12px; }
  .stat-card { background: var(--navy2); border: 1px solid var(--navy4); border-radius: var(--radius); padding: 14px; }
  .stat-val { font-family: 'Cormorant Garamond', serif; font-size: 32px; color: var(--white); line-height: 1; }
  .stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* Chip selector */
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { padding: 6px 14px; border-radius: 100px; border: 1px solid var(--navy4); background: var(--navy3); color: var(--muted); font-size: 12px; cursor: pointer; transition: all .2s; }
  .chip.active { background: rgba(232,180,184,.15); border-color: var(--blush); color: var(--blush); }

  /* Season badge */
  .season-active { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 100px; background: rgba(126,200,164,.12); border: 1px solid rgba(126,200,164,.3); font-size: 11px; color: var(--green); }
  .season-archived { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 100px; background: var(--navy3); border: 1px solid var(--navy4); font-size: 11px; color: var(--muted); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--navy4); border-radius: 2px; }

  /* Animations */
  @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
  .fade-up { animation: fadeUp .35s ease both; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
`;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load all data from KV
  useEffect(() => {
    (async () => {
      const stored = await kv.get("appdata");
      if (stored) {
        setData(stored);
      } else {
        const init = {
          userToken: uid(),
          userName: "",
          studioName: "",
          activeStyles: [...STYLES],
          activeGroups: [...GROUPS],
          theme: "dark",
          seasons: [],
          entries: [],
          skills: Object.fromEntries(
            STYLES.map(s => [s, DEFAULT_SKILLS[s].map(n => ({ id: uid(), name: n, level: 0 }))])
          ),
          goals: [],
          competitions: [],
          pointeLog: { readiness: {}, shoes: [], conditioning: {} },
          badges: [],
          injuryLog: [],
        };
        setData(init);
        await kv.set("appdata", init);
      }
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (updated) => {
    setData(updated);
    await kv.set("appdata", updated);
  }, []);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", flexDirection:"column", gap:16 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:48 }}>🩰</div>
      <p style={{ color:"var(--muted)", fontFamily:"'DM Sans',sans-serif" }}>Loading your journal…</p>
    </div>
  );

  const activeSeason = data.seasons.find(s => s.active) || null;

  const tabs = [
    { id:"home", icon:"🏠", label:"Home" },
    { id:"journal", icon:"📓", label:"Journal" },
    { id:"schedule", icon:"📅", label:"Schedule" },
    { id:"skills", icon:"⭐", label:"Skills" },
    { id:"profile", icon:"👤", label:"Profile" },
  ];

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="content">
        {tab === "home"     && <HomeTab     data={data} save={save} activeSeason={activeSeason} setTab={setTab} />}
        {tab === "journal"  && <JournalTab  data={data} save={save} activeSeason={activeSeason} />}
        {tab === "schedule" && <ScheduleTab data={data} save={save} activeSeason={activeSeason} />}
        {tab === "skills"   && <SkillsTab   data={data} save={save} />}
        {tab === "profile"  && <ProfileTab  data={data} save={save} />}
      </div>
      <nav className="bottom-nav">
        {tabs.map(t => (
          <button key={t.id} className={`nav-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME TAB
// ══════════════════════════════════════════════════════════════════════════════
function HomeTab({ data, save, activeSeason, setTab }) {
  const [showQuickLog, setShowQuickLog] = useState(false);

  const totalHours = data.entries.reduce((a,e) => a + (e.duration||0), 0) / 60;
  const thisWeek = data.entries.filter(e => {
    const d = new Date(e.date); const now = new Date();
    const diff = (now - d) / 86400000;
    return diff <= 7;
  });
  const weekHours = thisWeek.reduce((a,e) => a + (e.duration||0), 0) / 60;

  // Streak
  let streak = 0;
  const sorted = [...data.entries].sort((a,b) => b.date.localeCompare(a.date));
  let cur = new Date(); cur.setHours(0,0,0,0);
  for (let i=0; i<60; i++) {
    const ds = cur.toISOString().split("T")[0];
    if (sorted.some(e => e.date === ds)) { streak++; cur.setDate(cur.getDate()-1); }
    else if (i===0) { cur.setDate(cur.getDate()-1); } // allow today to be empty
    else break;
  }

  const activeGoals = data.goals.filter(g => !g.completed);
  const recentEntries = [...data.entries].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);

  // Today's classes from active season
  const todayStr = today();
  const dayName = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const todayClasses = activeSeason
    ? (activeSeason.classes||[]).filter(c => c.days && c.days.includes(dayName))
    : [];

  return (
    <div className="fade-up">
      {/* Hero */}
      <div style={{ padding:"48px 20px 20px", background:`linear-gradient(180deg, var(--navy2) 0%, var(--navy) 100%)` }}>
        <p style={{ color:"var(--muted)", fontSize:12, letterSpacing:".1em", textTransform:"uppercase", marginBottom:4 }}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
        </p>
        <h1 style={{ fontSize:34, lineHeight:1.1 }}>
          {data.userName ? `Hello, ${data.userName} 🩰` : "Welcome back 🩰"}
        </h1>
        {activeSeason && (
          <div style={{ marginTop:10 }}>
            <span className="season-active">● {activeSeason.name}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="streak-ring" style={{ marginBottom:8 }}>
            <span className="streak-num">{streak}</span>
            <span className="streak-label">streak</span>
          </div>
          <div className="stat-lbl">Day streak</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div className="stat-card" style={{ flex:1 }}>
            <div className="stat-val">{weekHours.toFixed(1)}</div>
            <div className="stat-lbl">Hours this week</div>
          </div>
          <div className="stat-card" style={{ flex:1 }}>
            <div className="stat-val">{data.entries.length}</div>
            <div className="stat-lbl">Total sessions</div>
          </div>
        </div>
      </div>

      {/* Today's Classes */}
      {todayClasses.length > 0 && (
        <>
          <div className="section-title">Today's Classes</div>
          {todayClasses.map(c => (
            <div key={c.id} className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:500 }}>{c.name}</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{c.time} · {c.teacher}</div>
              </div>
              <span className="tag tag-blush">{c.style}</span>
            </div>
          ))}
        </>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <>
          <div className="section-title">Active Goals</div>
          {activeGoals.slice(0,2).map(g => (
            <div key={g.id} className="card">
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontWeight:500, fontSize:14 }}>{g.title}</span>
                <span className="tag tag-muted">{g.style}</span>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{ width:`${g.progress||0}%` }}/></div>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:6 }}>Target: {fmtDate(g.targetDate)}</div>
            </div>
          ))}
        </>
      )}

      {/* Recent Journal */}
      {recentEntries.length > 0 && (
        <>
          <div className="section-title">Recent Journal</div>
          {recentEntries.map(e => (
            <div key={e.id} className="card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{fmtDate(e.date)}</div>
                  <div style={{ fontWeight:500, marginTop:2 }}>{e.title || e.style}</div>
                  {e.notes && <div style={{ fontSize:13, color:"var(--muted)", marginTop:4, lineHeight:1.5 }}>{e.notes.slice(0,80)}{e.notes.length>80?"…":""}</div>}
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                  <div style={{ fontSize:18 }}>{e.mood?.split(" ")[0]||""}</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>{e.duration}m</div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Badges */}
      {data.badges.length > 0 && (
        <>
          <div className="section-title">Badges Earned</div>
          <div className="card" style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
            {data.badges.map(bid => {
              const b = BADGE_DEFS.find(x => x.id===bid);
              return b ? (
                <div key={bid} style={{ textAlign:"center", width:60 }}>
                  <div style={{ fontSize:28 }}>{b.icon}</div>
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{b.label}</div>
                </div>
              ) : null;
            })}
          </div>
        </>
      )}

      <div style={{ height:20 }}/>

      {/* FAB */}
      <button className="fab" onClick={() => setShowQuickLog(true)}>＋</button>

      {showQuickLog && <QuickLogModal data={data} save={save} activeSeason={activeSeason} onClose={() => setShowQuickLog(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QUICK LOG MODAL
// ══════════════════════════════════════════════════════════════════════════════
function QuickLogModal({ data, save, activeSeason, onClose }) {
  const [form, setForm] = useState({
    title:"", date: today(), style: data.activeStyles[0]||"Ballet",
    seasonId: activeSeason?.id||"", classId:"",
    duration: 60, mood: MOODS[1], notes:"", mediaLink:"",
  });

  const seasonClasses = form.seasonId
    ? (data.seasons.find(s=>s.id===form.seasonId)?.classes||[])
    : [];

  const submit = async () => {
    if (!form.style) return;
    const entry = { ...form, id: uid() };
    const entries = [...data.entries, entry];
    // Badge check
    let badges = [...data.badges];
    if (!badges.includes("first_entry")) badges.push("first_entry");
    const hrs = entries.reduce((a,e)=>a+(e.duration||0),0)/60;
    if (hrs >= 10 && !badges.includes("hours_10")) badges.push("hours_10");
    await save({ ...data, entries, badges });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2>Log a Session</h2>
        <div className="form-group">
          <label className="form-label">Title (optional)</label>
          <input className="form-input" placeholder="e.g. Ballet class, Open practice…" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (min)</label>
            <input type="number" className="form-input" value={form.duration} onChange={e=>setForm({...form,duration:+e.target.value})}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Style</label>
          <select className="form-select" value={form.style} onChange={e=>setForm({...form,style:e.target.value})}>
            {data.activeStyles.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Season</label>
          <select className="form-select" value={form.seasonId} onChange={e=>setForm({...form,seasonId:e.target.value,classId:""})}>
            <option value="">No season / Open practice</option>
            {data.seasons.filter(s=>!s.archived).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {seasonClasses.length > 0 && (
          <div className="form-group">
            <label className="form-label">Class</label>
            <select className="form-select" value={form.classId} onChange={e=>setForm({...form,classId:e.target.value})}>
              <option value="">Open practice</option>
              {seasonClasses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Mood</label>
          <div className="chips">
            {MOODS.map(m=><span key={m} className={`chip ${form.mood===m?"active":""}`} onClick={()=>setForm({...form,mood:m})}>{m}</span>)}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" placeholder="What did you work on? Any breakthroughs?" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        </div>
        <div className="form-group">
          <label className="form-label">Media Link (optional)</label>
          <input className="form-input" placeholder="YouTube, Google Drive link…" value={form.mediaLink} onChange={e=>setForm({...form,mediaLink:e.target.value})}/>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={submit}>Save Entry ✓</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// JOURNAL TAB
// ══════════════════════════════════════════════════════════════════════════════
function JournalTab({ data, save, activeSeason }) {
  const [showLog, setShowLog] = useState(false);
  const [filterSeason, setFilterSeason] = useState("all");
  const [filterStyle, setFilterStyle] = useState("all");
  const [selected, setSelected] = useState(null);

  const entries = [...data.entries]
    .sort((a,b) => b.date.localeCompare(a.date))
    .filter(e => filterSeason==="all" || e.seasonId===filterSeason)
    .filter(e => filterStyle==="all" || e.style===filterStyle);

  const deleteEntry = async (id) => {
    await save({ ...data, entries: data.entries.filter(e=>e.id!==id) });
    setSelected(null);
  };

  // Check if entry is in archived season
  const isArchived = (e) => {
    const s = data.seasons.find(x=>x.id===e.seasonId);
    return s && s.archived;
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Journal</h1>
        <p>{data.entries.length} entries</p>
      </div>

      {/* Filters */}
      <div style={{ padding:"0 16px", display:"flex", gap:8, overflowX:"auto", paddingBottom:8 }}>
        <select className="form-select" style={{ flex:1 }} value={filterSeason} onChange={e=>setFilterSeason(e.target.value)}>
          <option value="all">All Seasons</option>
          {data.seasons.map(s=><option key={s.id} value={s.id}>{s.name}{s.archived?" (archived)":""}</option>)}
        </select>
        <select className="form-select" style={{ flex:1 }} value={filterStyle} onChange={e=>setFilterStyle(e.target.value)}>
          <option value="all">All Styles</option>
          {data.activeStyles.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📓</div>
          <p>No entries yet.<br/>Tap + to log your first session.</p>
        </div>
      ) : entries.map(e => {
        const season = data.seasons.find(s=>s.id===e.seasonId);
        const cls = season?.classes?.find(c=>c.id===e.classId);
        return (
          <div key={e.id} className="card" style={{ cursor:"pointer" }} onClick={()=>setSelected(e)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:"var(--muted)" }}>{fmtDate(e.date)}</div>
                <div style={{ fontWeight:500, marginTop:2 }}>{e.title||e.style}</div>
                <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                  <span className="tag tag-blush">{e.style}</span>
                  {season && <span className="tag tag-muted">{season.name}</span>}
                  {cls && <span className="tag tag-gold">{cls.name}</span>}
                </div>
                {e.notes && <div style={{ fontSize:13, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>{e.notes.slice(0,100)}{e.notes.length>100?"…":""}</div>}
              </div>
              <div style={{ textAlign:"right", marginLeft:12, flexShrink:0 }}>
                <div style={{ fontSize:20 }}>{e.mood?.split(" ")[0]||""}</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{e.duration}m</div>
                {isArchived(e) && <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>🔒</div>}
              </div>
            </div>
          </div>
        );
      })}

      <button className="fab" onClick={()=>setShowLog(true)}>＋</button>
      {showLog && <QuickLogModal data={data} save={save} activeSeason={activeSeason} onClose={()=>setShowLog(false)}/>}

      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:12, color:"var(--muted)" }}>{fmtDate(selected.date)}</div>
                <h2 style={{ marginBottom:0 }}>{selected.title||selected.style}</h2>
              </div>
              <div style={{ fontSize:28 }}>{selected.mood?.split(" ")[0]||""}</div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
              <span className="tag tag-blush">{selected.style}</span>
              <span className="tag tag-muted">{selected.duration} min</span>
              {selected.mood && <span className="tag tag-muted">{selected.mood}</span>}
            </div>
            {selected.notes && <p style={{ fontSize:14, lineHeight:1.7, color:"var(--white)", marginBottom:16 }}>{selected.notes}</p>}
            {selected.mediaLink && (
              <a href={selected.mediaLink} target="_blank" rel="noreferrer" style={{ color:"var(--blush)", fontSize:13 }}>🎬 View Media →</a>
            )}
            {!isArchived(selected) && (
              <div style={{ marginTop:20 }}>
                <button className="btn btn-danger btn-sm" onClick={()=>deleteEntry(selected.id)}>Delete Entry</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCHEDULE TAB
// ══════════════════════════════════════════════════════════════════════════════
function ScheduleTab({ data, save }) {
  const [view, setView] = useState("active"); // active | archived
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [showNewClass, setShowNewClass] = useState(null); // seasonId
  const [expandedSeason, setExpandedSeason] = useState(null);

  const seasons = data.seasons.filter(s => view==="active" ? !s.archived : s.archived);

  const createSeason = async (form) => {
    const s = { id:uid(), ...form, classes:[], active: data.seasons.filter(x=>!x.archived).length===0 };
    await save({ ...data, seasons:[...data.seasons, s] });
    setShowNewSeason(false);
  };

  const toggleActive = async (seasonId) => {
    const seasons = data.seasons.map(s => s.id===seasonId ? {...s,active:!s.active} : s);
    await save({ ...data, seasons });
  };

  const toggleArchive = async (seasonId) => {
    const seasons = data.seasons.map(s => s.id===seasonId ? {...s,archived:!s.archived,active:false} : s);
    await save({ ...data, seasons });
  };

  const deleteSeason = async (seasonId) => {
    await save({ ...data, seasons: data.seasons.filter(s=>s.id!==seasonId) });
  };

  const addClass = async (seasonId, cls) => {
    const seasons = data.seasons.map(s => s.id===seasonId ? {...s,classes:[...(s.classes||[]),{id:uid(),...cls}]} : s);
    await save({ ...data, seasons });
    setShowNewClass(null);
  };

  const deleteClass = async (seasonId, classId) => {
    const seasons = data.seasons.map(s => s.id===seasonId ? {...s,classes:(s.classes||[]).filter(c=>c.id!==classId)} : s);
    await save({ ...data, seasons });
  };

  // Entry count per season
  const entryCount = (sid) => data.entries.filter(e=>e.seasonId===sid).length;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Schedule</h1>
        <p>Seasons & classes</p>
      </div>

      {/* Toggle */}
      <div style={{ display:"flex", gap:8, margin:"0 16px 16px" }}>
        <button className={`btn btn-sm ${view==="active"?"btn-primary":"btn-outline"}`} onClick={()=>setView("active")}>Active</button>
        <button className={`btn btn-sm ${view==="archived"?"btn-primary":"btn-outline"}`} onClick={()=>setView("archived")}>Archived</button>
        {view==="active" && <button className="btn btn-gold btn-sm" style={{ marginLeft:"auto" }} onClick={()=>setShowNewSeason(true)}>+ Season</button>}
      </div>

      {seasons.length===0 && (
        <div className="empty">
          <div className="empty-icon">📅</div>
          <p>{view==="active" ? "No active seasons.\nTap '+ Season' to create one." : "No archived seasons yet."}</p>
        </div>
      )}

      {seasons.map(s => {
        const expanded = expandedSeason===s.id;
        const ec = entryCount(s.id);
        return (
          <div key={s.id} className="card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpandedSeason(expanded?null:s.id)}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20 }}>{s.name}</span>
                  {s.active && <span className="season-active">● Active</span>}
                  {s.archived && <span className="season-archived">🔒 Archived</span>}
                </div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{fmtDate(s.startDate)} – {fmtDate(s.endDate)}</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{(s.classes||[]).length} classes · {ec} journal entries</div>
              </div>
              <span style={{ color:"var(--muted)", fontSize:18 }}>{expanded?"▲":"▼"}</span>
            </div>

            {expanded && (
              <div style={{ marginTop:14, borderTop:"1px solid var(--navy4)", paddingTop:14 }}>
                {/* Action buttons */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                  {!s.archived && <button className="btn btn-outline btn-sm" onClick={()=>toggleActive(s.id)}>{s.active?"Deactivate":"Set Active"}</button>}
                  <button className="btn btn-outline btn-sm" onClick={()=>toggleArchive(s.id)}>{s.archived?"Unarchive":"Archive"}</button>
                  {!s.archived && <button className="btn btn-outline btn-sm" onClick={()=>setShowNewClass(s.id)}>+ Class</button>}
                  <button className="btn btn-danger btn-sm" onClick={()=>deleteSeason(s.id)}>Delete</button>
                </div>

                {/* Classes */}
                {(s.classes||[]).length===0 ? (
                  <p style={{ fontSize:13, color:"var(--muted)" }}>No classes added yet.</p>
                ) : (s.classes||[]).map(c => (
                  <div key={c.id} className="card-sm" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:500, fontSize:14 }}>{c.name}</div>
                      <div style={{ fontSize:12, color:"var(--muted)" }}>{c.days?.join(", ")} · {c.time} · {c.teacher}</div>
                      <div style={{ display:"flex", gap:6, marginTop:4 }}>
                        <span className="tag tag-blush">{c.style}</span>
                        {c.type && <span className="tag tag-muted">{c.type}</span>}
                      </div>
                    </div>
                    {!s.archived && <button className="btn-icon" style={{ fontSize:14, color:"var(--red)" }} onClick={()=>deleteClass(s.id,c.id)}>✕</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {showNewSeason && <NewSeasonModal onCreate={createSeason} onClose={()=>setShowNewSeason(false)}/>}
      {showNewClass && <NewClassModal data={data} onCreate={(cls)=>addClass(showNewClass,cls)} onClose={()=>setShowNewClass(null)}/>}
    </div>
  );
}

function NewSeasonModal({ onCreate, onClose }) {
  const [form, setForm] = useState({ name:"", startDate: today(), endDate:"" });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2>New Season</h2>
        <div className="form-group">
          <label className="form-label">Season Name</label>
          <input className="form-input" placeholder="e.g. Fall 2026, Competition Spring…" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={()=>{ if(form.name) onCreate(form); }}>Create Season</button>
        </div>
      </div>
    </div>
  );
}

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const CLASS_TYPES = ["Regular","Intensive","Masterclass","Camp","Rehearsal","Other"];

function NewClassModal({ data, onCreate, onClose }) {
  const [form, setForm] = useState({ name:"", style: data.activeStyles[0]||"Ballet", teacher:"", time:"", days:[], type:"Regular", location:"", group:"" });
  const toggleDay = (d) => setForm(f=>({ ...f, days: f.days.includes(d)?f.days.filter(x=>x!==d):[...f.days,d] }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2>Add Class</h2>
        <div className="form-group">
          <label className="form-label">Class Name</label>
          <input className="form-input" placeholder="e.g. Ballet Technique Level 3" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group">
            <label className="form-label">Style</label>
            <select className="form-select" value={form.style} onChange={e=>setForm({...form,style:e.target.value})}>
              {data.activeStyles.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              {CLASS_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Teacher</label>
          <input className="form-input" placeholder="Teacher name" value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input className="form-input" placeholder="e.g. 4:00 PM" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" placeholder="Studio room…" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Days</label>
          <div className="chips">
            {DAYS.map(d=><span key={d} className={`chip ${form.days.includes(d)?"active":""}`} onClick={()=>toggleDay(d)}>{d.slice(0,3)}</span>)}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Specialized Group (optional)</label>
          <select className="form-select" value={form.group} onChange={e=>setForm({...form,group:e.target.value})}>
            <option value="">None</option>
            {GROUPS.map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={()=>{ if(form.name) onCreate(form); }}>Add Class</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SKILLS TAB
// ══════════════════════════════════════════════════════════════════════════════
function SkillsTab({ data, save }) {
  const [activeStyle, setActiveStyle] = useState(data.activeStyles[0]||"Ballet");
  const [showGroups, setShowGroups] = useState(false);
  const [groupTab, setGroupTab] = useState(data.activeGroups[0]||"Company");

  const updateSkillLevel = async (style, skillId, level) => {
    const skills = { ...data.skills, [style]: data.skills[style].map(s => s.id===skillId?{...s,level}:s) };
    await save({ ...data, skills });
  };

  const styleSkills = data.skills[activeStyle]||[];
  const avgLevel = styleSkills.length ? styleSkills.reduce((a,s)=>a+s.level,0)/styleSkills.length/5*100 : 0;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Skills</h1>
      </div>

      {/* Style / Groups toggle */}
      <div style={{ display:"flex", gap:8, padding:"0 16px 12px" }}>
        <button className={`btn btn-sm ${!showGroups?"btn-primary":"btn-outline"}`} onClick={()=>setShowGroups(false)}>By Style</button>
        <button className={`btn btn-sm ${showGroups?"btn-primary":"btn-outline"}`} onClick={()=>setShowGroups(true)}>Groups</button>
      </div>

      {!showGroups ? (
        <>
          {/* Style selector */}
          <div style={{ display:"flex", gap:8, padding:"0 16px 16px", overflowX:"auto" }}>
            {data.activeStyles.map(s=>(
              <button key={s} className={`chip ${activeStyle===s?"active":""}`} onClick={()=>setActiveStyle(s)} style={{ whiteSpace:"nowrap" }}>{s}</button>
            ))}
          </div>

          {/* Overall progress */}
          <div className="card" style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>{activeStyle} Overview</div>
              <div style={{ marginTop:8 }}><div className="prog-bar"><div className="prog-fill" style={{ width:`${avgLevel}%` }}/></div></div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{Math.round(avgLevel)}% overall progress</div>
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, color:"var(--gold)" }}>{Math.round(avgLevel)}%</div>
          </div>

          {/* Skills list */}
          <div className="section-title">Techniques</div>
          {styleSkills.map(skill => (
            <div key={skill.id} className="card" style={{ padding:"12px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:500 }}>{skill.name}</span>
                <span style={{ fontSize:12, color:"var(--gold)" }}>{"★".repeat(skill.level)}{"☆".repeat(5-skill.level)}</span>
              </div>
              <div className="prog-bar" style={{ marginBottom:8 }}><div className="prog-fill" style={{ width:`${skill.level/5*100}%` }}/></div>
              <div className="stars">
                {[1,2,3,4,5].map(n=>(
                  <span key={n} className="star" onClick={()=>updateSkillLevel(activeStyle,skill.id,n)} style={{ color: n<=skill.level?"var(--gold)":"var(--navy4)" }}>★</span>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <GroupsSection data={data} save={save} groupTab={groupTab} setGroupTab={setGroupTab}/>
      )}
    </div>
  );
}

function GroupsSection({ data, save, groupTab, setGroupTab }) {
  const [showComp, setShowComp] = useState(false);
  const [showShoe, setShowShoe] = useState(false);

  const POINTE_READINESS = [
    "Teacher clearance obtained","Sufficient ankle strength","Consistent parallel relevé","Core strength assessed","Proper pointe shoe fitting","First pointe lesson completed",
  ];
  const POINTE_CONDITIONING = ["Theraband exercises","Calf raises","Ankle circles","Arch strengthening","Balance work","Core stability"];

  const updatePointe = async (field, val) => {
    const pointeLog = { ...data.pointeLog, [field]: val };
    let badges = [...data.badges];
    if (field==="readiness") {
      const all = Object.values(val).filter(Boolean).length === POINTE_READINESS.length;
      if (all && !badges.includes("pointe_ready")) badges.push("pointe_ready");
    }
    await save({ ...data, pointeLog, badges });
  };

  const addComp = async (comp) => {
    const competitions = [...data.competitions, { id:uid(), ...comp }];
    let badges = [...data.badges];
    if (!badges.includes("comp_1")) badges.push("comp_1");
    await save({ ...data, competitions, badges });
    setShowComp(false);
  };

  const addShoe = async (shoe) => {
    const pointeLog = { ...data.pointeLog, shoes: [...(data.pointeLog.shoes||[]), { id:uid(), ...shoe, date:today() }] };
    await save({ ...data, pointeLog });
    setShowShoe(false);
  };

  return (
    <>
      <div style={{ display:"flex", gap:8, padding:"0 16px 16px" }}>
        {data.activeGroups.map(g=>(
          <button key={g} className={`chip ${groupTab===g?"active":""}`} onClick={()=>setGroupTab(g)}>{g}</button>
        ))}
      </div>

      {groupTab==="Pointe" && (
        <>
          <div className="section-title">Readiness Checklist</div>
          <div className="card">
            {POINTE_READINESS.map(item => {
              const checked = data.pointeLog?.readiness?.[item]||false;
              return (
                <div key={item} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--navy4)" }}
                  onClick={()=>updatePointe("readiness",{...data.pointeLog?.readiness,[item]:!checked})}>
                  <div style={{ width:22, height:22, borderRadius:4, border:`2px solid ${checked?"var(--green)":"var(--navy4)"}`, background:checked?"var(--green)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }}>
                    {checked && <span style={{ color:"var(--navy)", fontSize:14 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:14, color:checked?"var(--white)":"var(--muted)" }}>{item}</span>
                </div>
              );
            })}
          </div>

          <div className="section-title">Conditioning Tracker</div>
          <div className="card">
            {POINTE_CONDITIONING.map(ex => {
              const done = data.pointeLog?.conditioning?.[ex]||false;
              return (
                <div key={ex} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--navy4)" }}
                  onClick={()=>updatePointe("conditioning",{...data.pointeLog?.conditioning,[ex]:!done})}>
                  <div style={{ width:22, height:22, borderRadius:4, border:`2px solid ${done?"var(--blush)":"var(--navy4)"}`, background:done?"var(--blush)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }}>
                    {done && <span style={{ color:"var(--navy)", fontSize:14 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:14, color:done?"var(--white)":"var(--muted)" }}>{ex}</span>
                </div>
              );
            })}
          </div>

          <div className="section-title">Pointe Shoe Log</div>
          <div style={{ padding:"0 16px", marginBottom:12 }}>
            <button className="btn btn-outline btn-sm" onClick={()=>setShowShoe(true)}>+ Add Shoe Fitting</button>
          </div>
          {(data.pointeLog?.shoes||[]).map(shoe => (
            <div key={shoe.id} className="card">
              <div style={{ fontWeight:500 }}>{shoe.brand}</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Size {shoe.size} · Vamp: {shoe.vamp} · Shank: {shoe.shank}</div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{fmtDate(shoe.date)}</div>
              {shoe.notes && <div style={{ fontSize:13, marginTop:6 }}>{shoe.notes}</div>}
            </div>
          ))}

          {showShoe && <ShoeModal onAdd={addShoe} onClose={()=>setShowShoe(false)}/>}
        </>
      )}

      {groupTab==="Competition" && (
        <>
          <div style={{ padding:"0 16px", marginBottom:12 }}>
            <button className="btn btn-gold btn-sm" onClick={()=>setShowComp(true)}>+ Log Competition</button>
          </div>
          {data.competitions.length===0 ? (
            <div className="empty"><div className="empty-icon">🏆</div><p>No competitions logged yet.</p></div>
          ) : [...data.competitions].reverse().map(c => (
            <div key={c.id} className="card">
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:500 }}>{c.event}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{fmtDate(c.date)} · {c.venue}</div>
                  <div style={{ display:"flex", gap:6, marginTop:6 }}>
                    <span className="tag tag-blush">{c.style}</span>
                    <span className="tag tag-blush">{c.piece}</span>
                  </div>
                </div>
                {c.placement && (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:"var(--gold)", lineHeight:1 }}>{c.placement}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>place</div>
                  </div>
                )}
              </div>
              {c.feedback && <div style={{ fontSize:13, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>{c.feedback}</div>}
            </div>
          ))}
          {showComp && <CompModal data={data} onAdd={addComp} onClose={()=>setShowComp(false)}/>}
        </>
      )}

      {groupTab==="Company" && (
        <div className="card">
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:8 }}>Company</div>
          <p style={{ fontSize:14, color:"var(--muted)", lineHeight:1.6 }}>
            Log company rehearsals as classes in your active season. Tag them with the Company group to track them here. Rehearsal notes appear in your journal filtered by the Company tag.
          </p>
          <div style={{ marginTop:12, fontSize:13, color:"var(--muted)" }}>
            Rehearsals this season: <strong style={{ color:"var(--white)" }}>
              {data.entries.filter(e=>{
                const s=data.seasons.find(x=>x.id===e.seasonId&&x.active);
                if(!s) return false;
                const c=s.classes?.find(x=>x.id===e.classId);
                return c?.group==="Company";
              }).length}
            </strong>
          </div>
        </div>
      )}
    </>
  );
}

function ShoeModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ brand:"", size:"", vamp:"", shank:"", notes:"" });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2>Shoe Fitting</h2>
        <div className="form-group"><label className="form-label">Brand</label><input className="form-input" placeholder="Bloch, Capezio, Gaynor Minden…" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div className="form-group"><label className="form-label">Size</label><input className="form-input" placeholder="4.5" value={form.size} onChange={e=>setForm({...form,size:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Vamp</label><input className="form-input" placeholder="Low/Med/High" value={form.vamp} onChange={e=>setForm({...form,vamp:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Shank</label><input className="form-input" placeholder="Soft/Med/Hard" value={form.shank} onChange={e=>setForm({...form,shank:e.target.value})}/></div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" placeholder="How they feel, sewing notes…" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={()=>{ if(form.brand) onAdd(form); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function CompModal({ data, onAdd, onClose }) {
  const [form, setForm] = useState({ event:"", date:today(), venue:"", style:data.activeStyles[0]||"Ballet", piece:"", placement:"", score:"", feedback:"", costume:"", music:"" });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2>Log Competition</h2>
        <div className="form-group"><label className="form-label">Event Name</label><input className="form-input" placeholder="e.g. Regional Dance Championships" value={form.event} onChange={e=>setForm({...form,event:e.target.value})}/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Venue</label><input className="form-input" placeholder="City or venue" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group"><label className="form-label">Style</label><select className="form-select" value={form.style} onChange={e=>setForm({...form,style:e.target.value})}>{data.activeStyles.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Piece Name</label><input className="form-input" placeholder="Routine title" value={form.piece} onChange={e=>setForm({...form,piece:e.target.value})}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group"><label className="form-label">Placement</label><input className="form-input" placeholder="1st, 2nd…" value={form.placement} onChange={e=>setForm({...form,placement:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Score</label><input className="form-input" placeholder="Score or rating" value={form.score} onChange={e=>setForm({...form,score:e.target.value})}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div className="form-group"><label className="form-label">Costume</label><input className="form-input" placeholder="Costume description" value={form.costume} onChange={e=>setForm({...form,costume:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Music</label><input className="form-input" placeholder="Song / artist" value={form.music} onChange={e=>setForm({...form,music:e.target.value})}/></div>
        </div>
        <div className="form-group"><label className="form-label">Judge Feedback</label><textarea className="form-textarea" placeholder="Notes from judges or director…" value={form.feedback} onChange={e=>setForm({...form,feedback:e.target.value})}/></div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" style={{ flex:2 }} onClick={()=>{ if(form.event) onAdd(form); }}>Log Competition</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE TAB
// ══════════════════════════════════════════════════════════════════════════════
function ProfileTab({ data, save }) {
  const [form, setForm] = useState({ userName: data.userName||"", studioName: data.studioName||"", userToken: data.userToken });
  const [showGoal, setShowGoal] = useState(false);
  const [showInjury, setShowInjury] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveProfile = async () => {
    await save({ ...data, userName: form.userName, studioName: form.studioName, userToken: form.userToken });
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  };

  const toggleStyle = async (s) => {
    const activeStyles = data.activeStyles.includes(s) ? data.activeStyles.filter(x=>x!==s) : [...data.activeStyles,s];
    await save({ ...data, activeStyles });
  };

  const toggleGroup = async (g) => {
    const activeGroups = data.activeGroups.includes(g) ? data.activeGroups.filter(x=>x!==g) : [...data.activeGroups,g];
    await save({ ...data, activeGroups });
  };

  const addGoal = async (goal) => {
    const goals = [...data.goals, { id:uid(), ...goal, progress:0, completed:false }];
    let badges = [...data.badges];
    await save({ ...data, goals, badges });
    setShowGoal(false);
  };

  const completeGoal = async (id) => {
    const goals = data.goals.map(g => g.id===id ? {...g,completed:true,progress:100} : g);
    let badges = [...data.badges];
    if (!badges.includes("goals_1")) badges.push("goals_1");
    await save({ ...data, goals, badges });
  };

  const updateGoalProgress = async (id, progress) => {
    const goals = data.goals.map(g => g.id===id ? {...g,progress} : g);
    await save({ ...data, goals });
  };

  const addInjury = async (inj) => {
    const injuryLog = [...data.injuryLog, { id:uid(), date:today(), ...inj }];
    await save({ ...data, injuryLog });
    setShowInjury(false);
  };

  const activeGoals = data.goals.filter(g=>!g.completed);
  const completedGoals = data.goals.filter(g=>g.completed);

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      {/* Personal info */}
      <div className="section-title">Personal</div>
      <div className="card">
        <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" placeholder="Dancer's name" value={form.userName} onChange={e=>setForm({...form,userName:e.target.value})}/></div>
        <div className="form-group"><label className="form-label">Studio Name</label><input className="form-input" placeholder="Studio name" value={form.studioName} onChange={e=>setForm({...form,studioName:e.target.value})}/></div>
        <div className="form-group">
          <label className="form-label">User Token (KV Sync)</label>
          <input className="form-input" value={form.userToken} onChange={e=>setForm({...form,userToken:e.target.value})} style={{ fontFamily:"monospace", fontSize:12 }}/>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>Use the same token on another device to sync your data.</div>
        </div>
        <button className="btn btn-primary" onClick={saveProfile}>{saved?"✓ Saved!":"Save Profile"}</button>
      </div>

      {/* Active Styles */}
      <div className="section-title">Active Styles</div>
      <div className="card">
        <div className="chips">
          {STYLES.map(s=><span key={s} className={`chip ${data.activeStyles.includes(s)?"active":""}`} onClick={()=>toggleStyle(s)}>{s}</span>)}
        </div>
      </div>

      {/* Active Groups */}
      <div className="section-title">Specialized Groups</div>
      <div className="card">
        <div className="chips">
          {GROUPS.map(g=><span key={g} className={`chip ${data.activeGroups.includes(g)?"active":""}`} onClick={()=>toggleGroup(g)}>{g}</span>)}
        </div>
      </div>

      {/* Goals */}
      <div className="section-title" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingRight:16 }}>
        <span>Goals</span>
        <button className="btn btn-outline btn-sm" onClick={()=>setShowGoal(true)}>+ Goal</button>
      </div>
      {activeGoals.length===0 && <div style={{ padding:"0 20px 12px", fontSize:13, color:"var(--muted)" }}>No active goals. Set one to track your progress!</div>}
      {activeGoals.map(g=>(
        <div key={g.id} className="card">
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontWeight:500 }}>{g.title}</span>
            <span className="tag tag-blush">{g.style}</span>
          </div>
          {g.description && <div style={{ fontSize:13, color:"var(--muted)", marginBottom:8 }}>{g.description}</div>}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div className="prog-bar" style={{ flex:1 }}><div className="prog-fill" style={{ width:`${g.progress}%` }}/></div>
            <span style={{ fontSize:12, color:"var(--muted)", width:32, textAlign:"right" }}>{g.progress}%</span>
          </div>
          <input type="range" min="0" max="100" value={g.progress} onChange={e=>updateGoalProgress(g.id,+e.target.value)}
            style={{ width:"100%", accentColor:"var(--blush)", marginBottom:8 }}/>
          <div style={{ display:"flex", gap:8 }}>
            <span style={{ fontSize:12, color:"var(--muted)", flex:1 }}>Target: {fmtDate(g.targetDate)}</span>
            <button className="btn btn-outline btn-sm" onClick={()=>completeGoal(g.id)}>Mark Complete ✓</button>
          </div>
        </div>
      ))}
      {completedGoals.length>0 && (
        <>
          <div className="section-title">Completed Goals 🎉</div>
          {completedGoals.map(g=>(
            <div key={g.id} className="card" style={{ opacity:.7 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ textDecoration:"line-through", color:"var(--muted)" }}>{g.title}</span>
                <span style={{ color:"var(--green)" }}>✓</span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Injury Log */}
      <div className="section-title" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingRight:16 }}>
        <span>Injury Log</span>
        <button className="btn btn-outline btn-sm" onClick={()=>setShowInjury(true)}>+ Log</button>
      </div>
      {data.injuryLog.length===0 && <div style={{ padding:"0 20px 12px", fontSize:13, color:"var(--muted)" }}>No injuries logged — keep it that way! 🤞</div>}
      {[...data.injuryLog].reverse().map(inj=>(
        <div key={inj.id} className="card">
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontWeight:500 }}>{inj.area}</span>
            <span className="tag tag-muted">{fmtDate(inj.date)}</span>
          </div>
          <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>{inj.description}</div>
          {inj.status && <div style={{ marginTop:6 }}><span className={`tag ${inj.status==="Healed"?"tag-green":"tag-blush"}`}>{inj.status}</span></div>}
        </div>
      ))}

      {/* Badges */}
      <div className="section-title">All Badges</div>
      <div className="card">
        <div style={{ display:"flex", flexWrap:"wrap", gap:16 }}>
          {BADGE_DEFS.map(b=>{
            const earned = data.badges.includes(b.id);
            return (
              <div key={b.id} style={{ textAlign:"center", width:64, opacity:earned?1:.3 }}>
                <div style={{ fontSize:30 }}>{b.icon}</div>
                <div style={{ fontSize:10, color:earned?"var(--gold)":"var(--muted)", marginTop:4, fontWeight:500 }}>{b.label}</div>
                <div style={{ fontSize:9, color:"var(--muted)", marginTop:2, lineHeight:1.3 }}>{b.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height:24 }}/>

      {showGoal && <GoalModal data={data} onAdd={addGoal} onClose={()=>setShowGoal(false)}/>}
      {showInjury && <InjuryModal onAdd={addInjury} onClose={()=>setShowInjury(false)}/>}
    </div>
  );
}

function GoalModal({ data, onAdd, onClose }) {
  const [form, setForm] = useState({ title:"", style:data.activeStyles[0]||"Ballet", description:"", targetDate:"" });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2>New Goal</h2>
        <div className="form-group"><label className="form-label">Goal</label><input className="form-input" placeholder="e.g. Land a clean double pirouette" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="form-group"><label className="form-label">Style</label><select className="form-select" value={form.style} onChange={e=>setForm({...form,style:e.target.value})}>{data.activeStyles.map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Description (optional)</label><textarea className="form-textarea" placeholder="More detail about this goal…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        <div className="form-group"><label className="form-label">Target Date</label><input type="date" className="form-input" value={form.targetDate} onChange={e=>setForm({...form,targetDate:e.target.value})}/></div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={()=>{ if(form.title) onAdd(form); }}>Set Goal ⭐</button>
        </div>
      </div>
    </div>
  );
}

const BODY_AREAS = ["Foot/Ankle","Knee","Hip","Lower Back","Upper Back","Shoulder","Wrist","Neck","Other"];
const INJURY_STATUS = ["Active","Recovering","Healed"];

function InjuryModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ area: BODY_AREAS[0], description:"", status: INJURY_STATUS[0] });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <h2>Log Injury / Soreness</h2>
        <div className="form-group"><label className="form-label">Body Area</label><select className="form-select" value={form.area} onChange={e=>setForm({...form,area:e.target.value})}>{BODY_AREAS.map(a=><option key={a}>{a}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="What happened? Pain level, circumstances…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        <div className="form-group"><label className="form-label">Status</label>
          <div className="chips">{INJURY_STATUS.map(s=><span key={s} className={`chip ${form.status===s?"active":""}`} onClick={()=>setForm({...form,status:s})}>{s}</span>)}</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={()=>{ if(form.description) onAdd(form); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
