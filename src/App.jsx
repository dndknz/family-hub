import { useState, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zoklykwduugvzjauuxhk.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva2x5a3dkdXVndnpqYXV1eGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTc2MjgsImV4cCI6MjA5MjM3MzYyOH0.XtIctGZK9gNgVVjkyEWVWmGAnhU5nLV5Prb7g_A1vj8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const MEMBERS = [
  { id: "dad",  label: "Tatay",    avatar: "👨", color: "#1a73e8" },
  { id: "mom",  label: "Nanay",    avatar: "👩", color: "#e91e8c" },
  { id: "kuya", label: "Kuya Pax", avatar: "🧑", color: "#ff6d00" },
  { id: "lil",  label: "Lex",      avatar: "🧒", color: "#00897b" },
];

const VOCAB_WORDS = [
  { word: "Perseverance", def: "Continued effort despite difficulty.",      example: "His perseverance helped him finish the project." },
  { word: "Diligent",     def: "Hardworking and careful.",                  example: "She was diligent in completing her homework." },
  { word: "Accountable",  def: "Responsible for your actions.",             example: "Being accountable means owning your mistakes." },
  { word: "Gratitude",    def: "Thankfulness for what you have.",           example: "He showed gratitude by saying thank you." },
  { word: "Initiative",   def: "Taking action without being told.",         example: "She took initiative and cleaned the house." },
  { word: "Consistent",   def: "Doing something regularly and reliably.",   example: "Being consistent builds good habits." },
  { word: "Empathy",      def: "Understanding another person's feelings.",  example: "He showed empathy when his friend was sad." },
  { word: "Resilient",    def: "Able to recover quickly from difficulties.", example: "She stayed resilient even after failing the test." },
  { word: "Integrity",    def: "Being honest and doing the right thing.",   example: "He showed integrity by returning the lost wallet." },
  { word: "Persevere",    def: "To keep going despite obstacles.",          example: "We must persevere even when things are hard." },
];

const todayVocab = () => VOCAB_WORDS[Math.floor(Date.now() / 86400000) % VOCAB_WORDS.length];
const todayStr = () => new Date().toISOString().split("T")[0];

export default function FamilyHub() {
  const [view, setView]               = useState("home");
  const [activeMember, setActiveMember] = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [completions, setCompletions] = useState([]);
  const [metrics, setMetrics]         = useState([]);
  const [requests, setRequests]       = useState([]);
  const [incentive, setIncentive]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [t, c, m, r, i] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("task_completions").select("*").eq("date", todayStr()),
        supabase.from("metrics").select("*").order("created_at"),
        supabase.from("requests").select("*").order("created_at", { ascending: false }),
        supabase.from("incentive").select("*").limit(1).maybeSingle(),
      ]);
      if (t.error) throw t.error;
      setTasks(t.data || []);
      setCompletions(c.data || []);
      setMetrics(m.data || []);
      setRequests(r.data || []);
      setIncentive(i.data || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const ch = supabase.channel("family-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "task_completions" }, () =>
        supabase.from("task_completions").select("*").eq("date", todayStr()).then(r => setCompletions(r.data || [])))
      .on("postgres_changes", { event: "*", schema: "public", table: "metrics" }, () =>
        supabase.from("metrics").select("*").order("created_at").then(r => setMetrics(r.data || [])))
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () =>
        supabase.from("requests").select("*").order("created_at", { ascending: false }).then(r => setRequests(r.data || [])))
      .on("postgres_changes", { event: "*", schema: "public", table: "incentive" }, () =>
        supabase.from("incentive").select("*").limit(1).maybeSingle().then(r => setIncentive(r.data || null)))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [loadAll]);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0f1117", color:"#f0ede6", gap:16 }}>
      <div style={{ fontSize:"3rem" }}>🏠</div>
      <div style={{ fontSize:"1.2rem", fontWeight:700 }}>Loading Family Hub…</div>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0f1117", color:"#ef5350", gap:12, padding:24, textAlign:"center" }}>
      <div style={{ fontSize:"2rem" }}>⚠️</div>
      <div style={{ fontWeight:700 }}>Connection error</div>
      <div style={{ fontSize:".85rem", color:"#6b7494" }}>{error}</div>
      <div style={{ fontSize:".8rem", color:"#4a5070" }}>Make sure you ran the SQL setup in Supabase.</div>
    </div>
  );

  const goMember = (m) => { setActiveMember(m); setView("member"); };
  const goHome   = ()  => { setView("home"); setActiveMember(null); };

  return (
    <div style={{ fontFamily:"'Georgia', serif", background:"#0f1117", minHeight:"100vh", color:"#f0ede6" }}>
      <div style={{ background:"#181c27", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid #2a2e3e", position:"sticky", top:0, zIndex:10 }}>
        {view !== "home" && (
          <button onClick={goHome} style={{ background:"none", border:"none", color:"#a0a8c0", fontSize:"1.3rem", cursor:"pointer", lineHeight:1 }}>←</button>
        )}
        <span style={{ fontSize:"1.05rem", fontWeight:700 }}>
          {{ home:"🏠 Family Hub", member: activeMember ? `${activeMember.avatar} ${activeMember.label}` : "", incentive:"🎯 Family Goal", requests:"📬 Requests", vocab:"📖 Word of the Day" }[view]}
        </span>
      </div>

      <main style={{ maxWidth:600, margin:"0 auto", padding:"0 16px 80px" }}>
        {view === "home"      && <HomeView goMember={goMember} setView={setView} requests={requests} incentive={incentive} />}
        {view === "member"    && activeMember && <MemberView member={activeMember} tasks={tasks} completions={completions} metrics={metrics} />}
        {view === "incentive" && <IncentiveView incentive={incentive} setIncentive={setIncentive} />}
        {view === "requests"  && <RequestsView requests={requests} />}
        {view === "vocab"     && <VocabView />}
      </main>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#181c27", borderTop:"1px solid #2a2e3e", display:"flex", justifyContent:"space-around", padding:"10px 0 18px" }}>
        {[{id:"home",icon:"🏠",label:"Home"},{id:"incentive",icon:"🎯",label:"Goal"},{id:"requests",icon:"📬",label:"Requests"},{id:"vocab",icon:"📖",label:"Word"}].map(it => (
          <button key={it.id} onClick={it.id==="home" ? goHome : () => setView(it.id)}
            style={{ background:"none", border:"none", color:view===it.id?"#f0c040":"#6b7494", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, fontSize:".68rem" }}>
            <span style={{ fontSize:"1.4rem" }}>{it.icon}</span>{it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeView({ goMember, setView, requests, incentive }) {
  const today = new Date().toLocaleDateString("en-PH", { weekday:"long", month:"long", day:"numeric" });
  const vocab = todayVocab();
  const pending = requests.filter(r => r.status === "pending").length;
  return (
    <div>
      <div style={{ textAlign:"center", padding:"28px 0 8px" }}>
        <div style={{ fontSize:".78rem", color:"#6b7494", letterSpacing:1 }}>{today.toUpperCase()}</div>
        <div style={{ fontSize:"1.9rem", fontWeight:700, marginTop:6 }}>Magandang araw, pamilya! 👋</div>
      </div>

      <Card onClick={() => setView("vocab")} style={{ background:"linear-gradient(135deg,#1a3a2a,#0f2218)", border:"1px solid #2a5a3a", cursor:"pointer" }}>
        <div style={{ fontSize:".68rem", color:"#4caf88", letterSpacing:2, marginBottom:4 }}>WORD OF THE DAY</div>
        <div style={{ fontSize:"1.4rem", fontWeight:700, color:"#a8ffcc" }}>{vocab.word}</div>
        <div style={{ fontSize:".82rem", color:"#6fa88a", marginTop:4 }}>Tap to learn & practice spelling →</div>
      </Card>

      {incentive ? (
        <Card onClick={() => setView("incentive")} style={{ background:"linear-gradient(135deg,#2a1a3a,#180f22)", border:"1px solid #5a2a7a", cursor:"pointer" }}>
          <div style={{ fontSize:".68rem", color:"#b47aff", letterSpacing:2, marginBottom:4 }}>FAMILY GOAL</div>
          <div style={{ fontSize:"1.1rem", fontWeight:700, color:"#d8b4fe" }}>{incentive.title}</div>
          <Progress value={incentive.current} max={incentive.target} color="#b47aff" />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:".8rem", color:"#9a6aff" }}>{incentive.current} / {incentive.target} {incentive.unit}</span>
            <span style={{ fontSize:".8rem", color:"#9a7aae" }}>🎁 {incentive.reward}</span>
          </div>
        </Card>
      ) : (
        <Card onClick={() => setView("incentive")} style={{ border:"1px dashed #3a2e5a", cursor:"pointer", textAlign:"center", padding:"20px 16px" }}>
          <div style={{ color:"#5a4080" }}>🎯 Tap to set a Family Goal</div>
        </Card>
      )}

      {pending > 0 && (
        <Card onClick={() => setView("requests")} style={{ background:"#1e1a10", border:"1px solid #5a4a00", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:"#f0c040" }}>📬 {pending} pending request{pending > 1 ? "s" : ""}</span>
          <span style={{ color:"#8a7a40" }}>View →</span>
        </Card>
      )}

      <SectionLabel style={{ marginTop:24 }}>FAMILY MEMBERS</SectionLabel>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:8 }}>
        {MEMBERS.map(m => (
          <button key={m.id} onClick={() => goMember(m)}
            style={{ background:"#181c27", border:`1px solid ${m.color}44`, borderRadius:16, padding:"22px 16px", textAlign:"center", cursor:"pointer" }}>
            <div style={{ fontSize:"2.6rem" }}>{m.avatar}</div>
            <div style={{ fontWeight:700, marginTop:8, color:"#f0ede6" }}>{m.label}</div>
            <div style={{ fontSize:".72rem", color:m.color, marginTop:4 }}>View dashboard →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MemberView({ member, tasks, completions, metrics }) {
  const [newTask, setNewTask]         = useState("");
  const [metricInput, setMetricInput] = useState({});
  const [saving, setSaving]           = useState(false);

  const memberTasks   = tasks.filter(t => t.member_id === member.id);
  const today         = todayStr();
  const completedIds  = new Set(completions.filter(c => c.member_id === member.id).map(c => c.task_id));
  const completedCount = memberTasks.filter(t => completedIds.has(t.id)).length;

  const toggleTask = async (task) => {
    if (completedIds.has(task.id)) {
      await supabase.from("task_completions").delete().eq("member_id", member.id).eq("task_id", task.id).eq("date", today);
    } else {
      await supabase.from("task_completions").insert({ member_id: member.id, task_id: task.id, date: today });
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || saving) return;
    setSaving(true);
    await supabase.from("tasks").insert({ member_id: member.id, task: newTask.trim() });
    setNewTask("");
    setSaving(false);
  };

  const removeTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
  };

  const logMetric = async (key) => {
    const val = metricInput[key];
    if (!val) return;
    await supabase.from("metrics").insert({ member_id: member.id, metric_key: key, value: parseFloat(val), date: today });
    setMetricInput(prev => ({ ...prev, [key]: "" }));
  };

  const memberMetrics = metrics.filter(m => m.member_id === member.id);
  const METRIC_KEYS = [
    { key:"weight",     label:"⚖️ Weight (kg)" },
    { key:"screentime", label:"📱 Screen Time (hrs)" },
    { key:"sleep",      label:"😴 Sleep (hrs)" },
  ];

  return (
    <div>
      <Card style={{ background:`linear-gradient(135deg,${member.color}22,${member.color}08)`, border:`1px solid ${member.color}44`, textAlign:"center", paddingTop:28, paddingBottom:24 }}>
        <div style={{ fontSize:"3rem" }}>{member.avatar}</div>
        <div style={{ fontSize:"1.5rem", fontWeight:700, marginTop:8 }}>{member.label}</div>
        <div style={{ fontSize:".9rem", color:member.color, marginTop:6 }}>{completedCount} / {memberTasks.length} tasks done today</div>
        <Progress value={completedCount} max={memberTasks.length || 1} color={member.color} style={{ marginTop:10 }} />
      </Card>

      <SectionLabel style={{ marginTop:24 }}>TODAY'S CHECKLIST</SectionLabel>
      {memberTasks.length === 0 && (
        <div style={{ color:"#4a5070", textAlign:"center", padding:"16px 0", fontSize:".9rem" }}>No tasks yet — add one below!</div>
      )}
      {memberTasks.map(task => {
        const done = completedIds.has(task.id);
        return (
          <div key={task.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#181c27", borderRadius:12, padding:"13px 14px", marginBottom:8, border:`1px solid ${done ? member.color+"55" : "#2a2e3e"}` }}>
            <button onClick={() => toggleTask(task)}
              style={{ width:26, height:26, borderRadius:8, border:`2px solid ${member.color}`, background:done ? member.color : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {done && <span style={{ color:"#fff", fontSize:13, fontWeight:700 }}>✓</span>}
            </button>
            <span style={{ flex:1, textDecoration:done?"line-through":"none", color:done?"#5a6080":"#f0ede6", fontSize:".93rem" }}>{task.task}</span>
            <button onClick={() => removeTask(task.id)} style={{ background:"none", border:"none", color:"#3a3e50", cursor:"pointer", fontSize:"1rem", padding:"0 4px" }}>✕</button>
          </div>
        );
      })}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key==="Enter" && addTask()}
          placeholder="Add a task…"
          style={{ flex:1, background:"#181c27", border:"1px solid #2a2e3e", borderRadius:10, padding:"10px 14px", color:"#f0ede6", fontSize:".9rem", outline:"none" }} />
        <button onClick={addTask} disabled={saving}
          style={{ background:member.color, border:"none", borderRadius:10, padding:"10px 20px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"1.1rem" }}>+</button>
      </div>

      <SectionLabel style={{ marginTop:28 }}>MY METRICS</SectionLabel>
      {METRIC_KEYS.map(({ key, label }) => {
        const history = memberMetrics.filter(m => m.metric_key === key).slice(-5);
        const latest  = history[history.length - 1];
        return (
          <Card key={key} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontWeight:600, fontSize:".95rem" }}>{label}</span>
              {latest && <span style={{ color:member.color, fontWeight:700 }}>{latest.value}</span>}
            </div>
            {history.length > 0 && (
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ flex:1, textAlign:"center", background:"#0f1117", borderRadius:8, padding:"6px 4px" }}>
                    <div style={{ fontSize:".6rem", color:"#4a5070" }}>{h.date.slice(5)}</div>
                    <div style={{ fontSize:".85rem", color:"#a0a8c0", marginTop:2 }}>{h.value}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <input type="number" value={metricInput[key] || ""} onChange={e => setMetricInput(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder="Log today's value"
                style={{ flex:1, background:"#0f1117", border:"1px solid #2a2e3e", borderRadius:8, padding:"8px 12px", color:"#f0ede6", fontSize:".88rem", outline:"none" }} />
              <button onClick={() => logMetric(key)}
                style={{ background:`${member.color}22`, border:`1px solid ${member.color}`, borderRadius:8, padding:"8px 16px", color:member.color, cursor:"pointer", fontWeight:700 }}>Log</button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function IncentiveView({ incentive, setIncentive }) {
  const [form, setForm] = useState({ title:"", target:"", unit:"", reward:"" });
  const [editing, setEditing] = useState(!incentive);
  const [logVal, setLogVal]   = useState("");

  const submit = async () => {
    if (!form.title || !form.target) return;
    const row = { title:form.title, target:parseFloat(form.target), current:0, unit:form.unit, reward:form.reward };
    if (incentive?.id) {
      await supabase.from("incentive").update(row).eq("id", incentive.id);
    } else {
      await supabase.from("incentive").insert(row);
    }
    setEditing(false);
  };

  const logProgress = async () => {
    if (!logVal || !incentive) return;
    const updated = Math.min(incentive.target, incentive.current + parseFloat(logVal));
    await supabase.from("incentive").update({ current: updated }).eq("id", incentive.id);
    setLogVal("");
  };

  const reset = async () => {
    if (incentive?.id) await supabase.from("incentive").delete().eq("id", incentive.id);
    setIncentive(null);
    setForm({ title:"", target:"", unit:"", reward:"" });
    setEditing(true);
  };

  const pct      = incentive ? Math.min(100, Math.round((incentive.current / incentive.target) * 100)) : 0;
  const achieved = pct >= 100;

  if (editing || !incentive) return (
    <Card style={{ marginTop:16 }}>
      <div style={{ fontWeight:700, fontSize:"1.1rem", marginBottom:18 }}>Set a Family Goal 🎯</div>
      {[["title","Goal title","e.g. Lower screen time this week"],["target","Target number","e.g. 20"],["unit","Unit","e.g. hours saved"],["reward","🎁 Reward","e.g. Dinner out at your fave place"]].map(([k,lbl,ph]) => (
        <div key={k} style={{ marginBottom:12 }}>
          <label style={{ fontSize:".78rem", color:"#6b7494", display:"block", marginBottom:4 }}>{lbl}</label>
          <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={ph}
            style={{ width:"100%", background:"#0f1117", border:"1px solid #2a2e3e", borderRadius:10, padding:"10px 14px", color:"#f0ede6", fontSize:".9rem", outline:"none", boxSizing:"border-box" }} />
        </div>
      ))}
      <button onClick={submit} style={{ width:"100%", background:"#7c3aed", border:"none", borderRadius:10, padding:"14px", color:"#fff", fontWeight:700, fontSize:"1rem", cursor:"pointer", marginTop:8 }}>
        Set Goal 🎯
      </button>
    </Card>
  );

  return (
    <div>
      <Card style={{ background:"linear-gradient(135deg,#2a1a3a,#180f22)", border:"1px solid #7c3aed55", textAlign:"center", paddingTop:32, paddingBottom:32 }}>
        {achieved ? (
          <>
            <div style={{ fontSize:"3.5rem" }}>🎉</div>
            <div style={{ fontSize:"1.6rem", fontWeight:700, color:"#d8b4fe", marginTop:12 }}>Goal Achieved!</div>
            <div style={{ color:"#b47aff", marginTop:10 }}>Time to celebrate:<br/><strong>{incentive.reward}</strong></div>
          </>
        ) : (
          <>
            <div style={{ fontSize:".72rem", color:"#9a6aff", letterSpacing:2, marginBottom:10 }}>FAMILY GOAL</div>
            <div style={{ fontSize:"1.3rem", fontWeight:700, color:"#d8b4fe" }}>{incentive.title}</div>
            <div style={{ fontSize:"3rem", fontWeight:700, color:"#b47aff", margin:"16px 0 4px" }}>{pct}%</div>
            <Progress value={incentive.current} max={incentive.target} color="#b47aff" />
            <div style={{ fontSize:".85rem", color:"#7a5aae", marginTop:8 }}>{incentive.current} / {incentive.target} {incentive.unit}</div>
            <div style={{ fontSize:".9rem", color:"#9a7aae", marginTop:12 }}>🎁 {incentive.reward}</div>
          </>
        )}
      </Card>
      {!achieved && (
        <Card>
          <div style={{ fontWeight:600, marginBottom:12 }}>Log Progress (anyone can add!)</div>
          <div style={{ display:"flex", gap:8 }}>
            <input type="number" value={logVal} onChange={e => setLogVal(e.target.value)} placeholder={`Add ${incentive.unit || "progress"}…`}
              style={{ flex:1, background:"#0f1117", border:"1px solid #2a2e3e", borderRadius:10, padding:"10px 14px", color:"#f0ede6", fontSize:".9rem", outline:"none" }} />
            <button onClick={logProgress}
              style={{ background:"#7c3aed", border:"none", borderRadius:10, padding:"10px 22px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"1.1rem" }}>+</button>
          </div>
        </Card>
      )}
      <button onClick={() => { setForm({ title:incentive.title, target:String(incentive.target), unit:incentive.unit, reward:incentive.reward }); setEditing(true); }}
        style={{ width:"100%", background:"none", border:"1px solid #2a2e3e", borderRadius:10, padding:"12px", color:"#6b7494", cursor:"pointer", marginTop:10 }}>Edit Goal</button>
      <button onClick={reset}
        style={{ width:"100%", background:"none", border:"none", color:"#3a2050", cursor:"pointer", marginTop:6, padding:8, fontSize:".85rem" }}>Reset & start over</button>
    </div>
  );
}

function RequestsView({ requests }) {
  const [form, setForm]     = useState({ from_member:"", to_member:"", message:"" });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.from_member || !form.to_member || !form.message.trim() || sending) return;
    setSending(true);
    await supabase.from("requests").insert({ from_member:form.from_member, to_member:form.to_member, message:form.message.trim() });
    setForm({ from_member:"", to_member:"", message:"" });
    setSending(false);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("requests").update({ status }).eq("id", id);
  };

  const statusColor = { pending:"#f0c040", approved:"#4caf88", declined:"#ef5350" };

  return (
    <div>
      <Card>
        <div style={{ fontWeight:700, marginBottom:14 }}>New Request / Message 📬</div>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[["from_member","From"],["to_member","To"]].map(([field,lbl]) => (
            <div key={field} style={{ flex:1 }}>
              <label style={{ fontSize:".74rem", color:"#6b7494", display:"block", marginBottom:4 }}>{lbl}</label>
              <select value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                style={{ width:"100%", background:"#0f1117", border:"1px solid #2a2e3e", borderRadius:8, padding:"9px 10px", color:form[field]?"#f0ede6":"#6b7494", fontSize:".88rem", outline:"none" }}>
                <option value="">Select…</option>
                {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.avatar} {m.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <textarea value={form.message} onChange={e => setForm({ ...form, message:e.target.value })}
          placeholder="Write your request or message…" rows={3}
          style={{ width:"100%", background:"#0f1117", border:"1px solid #2a2e3e", borderRadius:10, padding:"10px 14px", color:"#f0ede6", fontSize:".9rem", outline:"none", resize:"none", boxSizing:"border-box" }} />
        <button onClick={send} disabled={sending}
          style={{ width:"100%", background:"#1a73e8", border:"none", borderRadius:10, padding:"13px", color:"#fff", fontWeight:700, cursor:"pointer", marginTop:10 }}>
          {sending ? "Sending…" : "Send 📬"}
        </button>
      </Card>

      <SectionLabel style={{ marginTop:20 }}>MESSAGE BOARD</SectionLabel>
      {requests.length === 0 && <div style={{ color:"#5a6080", textAlign:"center", padding:"24px 0", fontSize:".9rem" }}>No messages yet.</div>}
      {requests.map(r => {
        const from = MEMBERS.find(m => m.id === r.from_member);
        const to   = MEMBERS.find(m => m.id === r.to_member);
        return (
          <Card key={r.id} style={{ marginBottom:10, border:`1px solid ${statusColor[r.status]}33` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, alignItems:"center" }}>
              <span style={{ fontSize:".85rem" }}>{from?.avatar} {from?.label} → {to?.avatar} {to?.label}</span>
              <span style={{ fontSize:".72rem", color:statusColor[r.status], textTransform:"uppercase", fontWeight:700 }}>{r.status}</span>
            </div>
            <div style={{ color:"#c8c4bc", marginBottom:10, lineHeight:1.5 }}>{r.message}</div>
            <div style={{ fontSize:".72rem", color:"#3a4060", marginBottom:r.status==="pending"?10:0 }}>
              {new Date(r.created_at).toLocaleDateString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
            </div>
            {r.status === "pending" && (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => updateStatus(r.id, "approved")}
                  style={{ flex:1, background:"#1a3a2a", border:"1px solid #4caf88", borderRadius:8, padding:"9px", color:"#4caf88", cursor:"pointer", fontWeight:600 }}>✓ Approve</button>
                <button onClick={() => updateStatus(r.id, "declined")}
                  style={{ flex:1, background:"#3a1a1a", border:"1px solid #ef5350", borderRadius:8, padding:"9px", color:"#ef5350", cursor:"pointer", fontWeight:600 }}>✕ Decline</button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function VocabView() {
  const vocab = todayVocab();
  const [spelled, setSpelled] = useState("");
  const [checked, setChecked] = useState(null);
  return (
    <div>
      <Card style={{ background:"linear-gradient(135deg,#1a3a2a,#0a2218)", border:"1px solid #2a5a3a", textAlign:"center", padding:"36px 24px" }}>
        <div style={{ fontSize:".72rem", color:"#4caf88", letterSpacing:2, marginBottom:12 }}>TODAY'S WORD</div>
        <div style={{ fontSize:"2.6rem", fontWeight:700, color:"#a8ffcc" }}>{vocab.word}</div>
        <div style={{ height:2, background:"#2a5a3a", margin:"20px auto", width:60 }} />
        <div style={{ fontSize:"1rem", color:"#8ac8a8", lineHeight:1.7 }}>{vocab.def}</div>
        <div style={{ marginTop:18, background:"#0a2218", borderRadius:12, padding:"14px 16px" }}>
          <div style={{ fontSize:".7rem", color:"#4caf88", marginBottom:6, letterSpacing:1 }}>EXAMPLE</div>
          <div style={{ fontStyle:"italic", color:"#a8d8b8", lineHeight:1.6 }}>"{vocab.example}"</div>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight:700, marginBottom:6 }}>🖊️ Spelling Practice</div>
        <div style={{ fontSize:".88rem", color:"#6b7494", marginBottom:14 }}>Can you spell it from memory?</div>
        <input value={spelled} onChange={e => { setSpelled(e.target.value); setChecked(null); }}
          placeholder="Type the word here…"
          style={{ width:"100%", background:"#0f1117", border:"1px solid #2a2e3e", borderRadius:10, padding:"13px 14px", color:"#f0ede6", fontSize:"1.1rem", outline:"none", textAlign:"center", boxSizing:"border-box", letterSpacing:2 }} />
        <button onClick={() => setChecked(spelled.trim().toLowerCase() === vocab.word.toLowerCase())}
          style={{ width:"100%", background:"#1a3a2a", border:"1px solid #4caf88", borderRadius:10, padding:"13px", color:"#4caf88", fontWeight:700, cursor:"pointer", marginTop:10 }}>
          Check ✓
        </button>
        {checked !== null && (
          <div style={{ textAlign:"center", marginTop:16, fontSize:"1.2rem", fontWeight:700, color:checked?"#4caf88":"#ef5350" }}>
            {checked ? "🎉 Correct! Great job, Lex!" : `❌ Almost! The word is "${vocab.word}"`}
          </div>
        )}
      </Card>
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background:"#181c27", borderRadius:16, padding:"18px 16px", marginTop:12, border:"1px solid #2a2e3e", ...style }}>
      {children}
    </div>
  );
}
function SectionLabel({ children, style }) {
  return <div style={{ fontSize:".68rem", color:"#4a5070", letterSpacing:2, marginTop:20, marginBottom:2, ...style }}>{children}</div>;
}
function Progress({ value, max, color, style }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background:"#2a2e3e", borderRadius:99, height:7, marginTop:8, ...style }}>
      <div style={{ width:`${pct}%`, background:color, borderRadius:99, height:"100%", transition:"width .5s ease" }} />
    </div>
  );
}
