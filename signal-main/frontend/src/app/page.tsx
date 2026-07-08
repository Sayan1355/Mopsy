"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Terminal, Activity, Crosshair, AlertTriangle, Play, Clock, Zap, Filter, RefreshCw, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';

const API = 'http://localhost:8000/api/v1';
const POLL_MS = 20000;

type ChatMsg = { role: 'user' | 'assistant'; content: string };

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([{ role: 'assistant', content: 'SYSTEM READY. Awaiting directive.' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterIntent, setFilterIntent] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [sortField, setSortField] = useState<'company_name' | 'intent' | 'lead_score'>('lead_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Live clock
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setCurrentTime(n.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const fetchStats = useCallback(async () => {
    try {
      const [s, q] = await Promise.all([
        fetch(`${API}/dashboard/stats`).then(r => r.json()),
        fetch(`${API}/queue`).then(r => r.json()),
      ]);
      setStats(s);
      setQueue(q.queue || []);
      setLastUpdate(new Date().toLocaleTimeString());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    } catch {}
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, POLL_MS);
    return () => clearInterval(t);
  }, [fetchStats]);

  const handleChatSubmit = async (e?: React.FormEvent, preset?: string) => {
    if (e) e.preventDefault();
    const msg = preset || chatInput;
    if (!msg.trim()) return;
    setChatHistory(p => [...p, { role: 'user', content: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const r = await fetch(`${API}/copilot/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const d = await r.json();
      setChatHistory(p => [...p, { role: 'assistant', content: d.response || 'NO_DATA' }]);
    } catch {
      setChatHistory(p => [...p, { role: 'assistant', content: 'ERR_CONNECTION' }]);
    } finally { setChatLoading(false); }
  };

  const handleSweep = async () => {
    setSweepLoading(true);
    setChatHistory(p => [...p, { role: 'user', content: 'INITIALIZE SWEEP — fetching live RSS (GitHub/AWS/Linear) + Tavily enrichment...' }]);
    try {
      const live = await fetch(`${API}/live/ingest`, { method: 'POST' }).then(r => r.json());
      setChatHistory(p => [...p, { role: 'assistant', content: `[PHASE 1] ${live.message}\n  New: ${live.processed} | Dupes: ${live.skipped_duplicates}\n${(live.results||[]).slice(0,3).map((r:any)=>`  • ${r.company} [${r.intent}] score=${r.final_score} +${r.tavily_boost}boost`).join('\n')}` }]);
      const sweep = await fetch(`${API}/signals/sweep`, { method: 'POST' }).then(r => r.json());
      setChatHistory(p => [...p, { role: 'assistant', content: `[PHASE 2] ${sweep.message}\n  Processed: ${sweep.processed} | DB Signals: ${sweep.totals?.signals} | DB Leads: ${sweep.totals?.leads}` }]);
      fetchStats();
    } catch {
      setChatHistory(p => [...p, { role: 'assistant', content: 'ERR: Sweep failed.' }]);
    } finally { setSweepLoading(false); }
  };

  const executeWorkflow = async (leadId: number, companyName: string) => {
    setChatHistory(p => [...p, { role: 'user', content: `Execute workflow for ${companyName}` }]);
    try {
      const d = await fetch(`${API}/automation/${leadId}`, { method: 'POST' }).then(r => r.json());
      setChatHistory(p => [...p, { role: 'assistant', content: `WORKFLOW GENERATED ✓ — ${companyName} moved to Execution Queue.\n\nSubject: ${d.workflow_summary?.email?.subject}\n\n${d.workflow_summary?.email?.body?.slice(0,300)}` }]);
      setSelectedLead(null);
      fetchStats();
    } catch { setChatHistory(p => [...p, { role: 'assistant', content: 'ERR: Workflow failed.' }]); }
  };

  const tableData = stats?.table_data || [];
  const intentData = stats?.intent_distribution || [];
  const timeSeries = stats?.time_series || [];
  const totalSignals = stats?.total_signals || 0;
  const highPriority = stats?.high_priority_leads || 0;
  const avgScore = stats?.avg_lead_score || 0;
  const queuedCount = stats?.queued_count || 0;

  const maxSignals = Math.max(...timeSeries.map((d: any) => d.signals), 1);

  // Derived: filtered + sorted table data
  const filteredData = [...tableData]
    .filter((sig: any) => {
      if (filterSearch && !sig.company_name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      if (filterIntent !== 'ALL' && sig.intent !== filterIntent) return false;
      if (filterPriority !== 'ALL' && sig.priority !== filterPriority) return false;
      if (filterMinScore > 0 && (Number(sig.lead_score) || 0) < filterMinScore) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      if (sortDir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans text-sm selection:bg-accent selection:text-background">

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-border overflow-y-auto">

        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full bg-accent ${pulse ? 'animate-ping' : 'animate-pulse'}`} />
            <h1 className="font-display font-bold text-lg tracking-tight uppercase">Signal Main</h1>
            <div className="h-4 w-px bg-border mx-2" />
            <span className="font-mono text-xs text-muted flex items-center gap-2"><Clock size={12} />{currentTime}</span>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && <span className="font-mono text-[10px] text-muted flex items-center gap-1"><Radio size={10} className="text-accent animate-pulse" /> LIVE · {lastUpdate}</span>}
            <button onClick={fetchStats} className="font-mono text-[10px] border border-border px-2 py-1 text-muted hover:text-accent flex items-center gap-1">
              <RefreshCw size={10} /> REFRESH
            </button>
          </div>
        </header>

        <div className="p-6 space-y-12">

          {/* ── SECTION 1: MISSION CONTROL KPIs ── */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">Mission Control</h2>
                <p className="text-muted mt-1 text-xs">Real-time signal aggregation · auto-refresh every {POLL_MS/1000}s</p>
              </div>
              <button onClick={handleSweep} disabled={sweepLoading} className="font-mono text-xs border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-background transition-colors flex items-center gap-2 uppercase disabled:opacity-50">
                {sweepLoading ? <><span className="w-2 h-2 rounded-full bg-accent animate-ping" /> SWEEPING...</> : <><Play size={12} className="fill-current" /> Initialize Sweep</>}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
              {[
                { label: 'Signals Captured', value: totalSignals, icon: <Activity size={12} className="text-accent" />, color: 'text-white' },
                { label: 'Critical Targets', value: highPriority, icon: <AlertTriangle size={12} className="text-danger" />, color: 'text-danger', sub: 'ACTIVE' },
                { label: 'Avg Score', value: avgScore, icon: <Crosshair size={12} className="text-warning" />, color: 'text-white' },
                { label: 'In Queue', value: queuedCount, icon: <CheckCircle2 size={12} className="text-accent" />, color: 'text-accent', sub: 'EXECUTED' },
              ].map((kpi, i) => (
                <div key={i} className="bg-background p-6 hover:bg-secondary transition-colors">
                  <p className="font-mono text-[10px] text-muted uppercase mb-4 flex justify-between">{kpi.label}{kpi.icon}</p>
                  <p className={`font-mono text-4xl ${kpi.color} ${pulse ? 'transition-all duration-300' : ''}`}>{kpi.value}</p>
                  {kpi.sub && <p className="font-mono text-[10px] mt-2 text-muted">{kpi.sub}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 2: CHARTS ── */}
          <section>
            <h2 className="font-display text-base font-bold uppercase tracking-tight text-white mb-6 border-b border-border pb-2">Telemetry · Live Feed</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Time-series area chart */}
              <div className="lg:col-span-2 border border-border bg-secondary p-5">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-mono text-[10px] uppercase text-muted">Signal Ingestion · 14 Days</p>
                  <span className="font-mono text-[10px] border border-accent px-1 text-accent animate-pulse">LIVE</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeries}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D9FF3F" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#D9FF3F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="1 3" stroke="#2A2D3A" vertical={false} />
                      <XAxis dataKey="day" stroke="#545864" fontSize={9} fontFamily="monospace" tickLine={false} axisLine={false} />
                      <YAxis stroke="#545864" fontSize={9} fontFamily="monospace" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0D12', border: '1px solid #2A2D3A', borderRadius: 0, fontFamily: 'monospace', fontSize: 10, color: '#E8E8E8' }} cursor={{ stroke: '#D9FF3F', strokeWidth: 1, strokeDasharray: '2 2' }} />
                      <Area type="monotone" dataKey="signals" stroke="#D9FF3F" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 3, fill: '#D9FF3F' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Intent distribution bar */}
              <div className="border border-border bg-secondary p-5">
                <p className="font-mono text-[10px] uppercase text-muted mb-4">Intent Matrix</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intentData} layout="vertical" barSize={8}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" stroke="#545864" fontSize={9} fontFamily="monospace" tickLine={false} axisLine={false} width={70} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0D12', border: '1px solid #2A2D3A', borderRadius: 0, fontFamily: 'monospace', fontSize: 10 }} cursor={false} />
                      <Bar dataKey="value" fill="#D9FF3F" radius={0} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 3: ACTIVE TARGETS ── */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-base font-bold uppercase tracking-tight text-white">
                Active Targets <span className="text-muted font-mono text-xs ml-2">({filteredData.length}/{tableData.length})</span>
              </h2>
              <div className="flex gap-2 items-center">
                <span className="font-mono text-[10px] text-muted border border-border px-2 py-1">AUTO-FILL ON</span>
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`font-mono text-[10px] border px-2 py-1 flex items-center gap-1 transition-colors ${
                    filterOpen || filterSearch || filterIntent !== 'ALL' || filterPriority !== 'ALL'
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-muted hover:text-white'
                  }`}>
                  <Filter size={10} /> FILTER {(filterSearch || filterIntent !== 'ALL' || filterPriority !== 'ALL') ? '●' : ''}
                </button>
              </div>
            </div>

            {/* Filter panel */}
            {filterOpen && (
              <div className="mb-3 border border-accent/40 bg-secondary p-4 flex flex-wrap gap-4 items-end">
                {/* Search */}
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] text-muted uppercase">Company Search</label>
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={e => { setFilterSearch(e.target.value); setSelectedLead(null); }}
                    placeholder="e.g. GitHub..."
                    className="bg-background border border-border px-3 py-1.5 font-mono text-[11px] text-white placeholder:text-muted focus:outline-none focus:border-accent w-44"
                  />
                </div>
                {/* Intent */}
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] text-muted uppercase">Intent</label>
                  <select
                    value={filterIntent}
                    onChange={e => { setFilterIntent(e.target.value); setSelectedLead(null); }}
                    className="bg-background border border-border px-3 py-1.5 font-mono text-[11px] text-white focus:outline-none focus:border-accent">
                    <option value="ALL">ALL INTENTS</option>
                    {[...new Set(tableData.map((d: any) => d.intent))].map((intent: any) => (
                      <option key={intent} value={intent}>{intent}</option>
                    ))}
                  </select>
                </div>
                {/* Priority */}
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] text-muted uppercase">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={e => { setFilterPriority(e.target.value); setSelectedLead(null); }}
                    className="bg-background border border-border px-3 py-1.5 font-mono text-[11px] text-white focus:outline-none focus:border-accent">
                    <option value="ALL">ALL PRIORITIES</option>
                    <option value="High">HIGH / CRITICAL</option>
                    <option value="Medium">MEDIUM</option>
                    <option value="Low">LOW</option>
                  </select>
                </div>
                {/* Min score */}
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] text-muted uppercase">Min Score</label>
                  <input
                    type="number" min={0} max={100}
                    value={filterMinScore}
                    onChange={e => { setFilterMinScore(Number(e.target.value)); setSelectedLead(null); }}
                    className="bg-background border border-border px-3 py-1.5 font-mono text-[11px] text-white focus:outline-none focus:border-accent w-20"
                  />
                </div>
                {/* Clear */}
                <button
                  onClick={() => { setFilterSearch(''); setFilterIntent('ALL'); setFilterPriority('ALL'); setFilterMinScore(0); setSelectedLead(null); }}
                  className="font-mono text-[10px] border border-border text-muted px-3 py-1.5 hover:border-danger hover:text-danger transition-colors">
                  CLEAR
                </button>
              </div>
            )}

            <div className="border border-border bg-secondary overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-background border-b border-border text-muted">
                    <tr>
                      <th className="px-4 py-3 font-normal border-r border-border w-10 text-center">ID</th>
                      <th className="px-4 py-3 font-normal border-r border-border cursor-pointer hover:text-white" onClick={() => setSortField('company_name')}>COMPANY {sortField==='company_name'?'↕':''}</th>
                      <th className="px-4 py-3 font-normal border-r border-border">SOURCE</th>
                      <th className="px-4 py-3 font-normal border-r border-border cursor-pointer hover:text-white" onClick={() => setSortField('intent')}>INTENT {sortField==='intent'?'↕':''}</th>
                      <th className="px-4 py-3 font-normal border-r border-border text-right cursor-pointer hover:text-white" onClick={() => { setSortField('lead_score'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>SCORE {sortField==='lead_score'? (sortDir==='asc'?'↑':'↓') :''}</th>
                      <th className="px-4 py-3 font-normal text-center w-20">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredData.map((sig: any, idx: number) => {
                      const isCrit = sig.priority === 'High' || sig.priority === 'HIGH';
                      const origIdx = tableData.indexOf(sig);
                      return (
                        <tr key={idx} onClick={() => setSelectedLead(origIdx === selectedLead ? null : origIdx)}
                          className={`hover:bg-background cursor-pointer group transition-colors ${selectedLead === origIdx ? 'bg-background border-l-2 border-l-accent' : ''}`}>
                          <td className={`px-4 py-2.5 border-r border-border text-center ${selectedLead === origIdx ? 'text-accent' : 'text-muted'}`}>
                            {String(sig.id).padStart(2, '0')}
                          </td>
                          <td className="px-4 py-2.5 border-r border-border text-white font-sans font-medium group-hover:text-accent transition-colors">
                            {filterSearch ? (
                              sig.company_name.split(new RegExp(`(${filterSearch})`, 'gi')).map((part: string, i: number) =>
                                part.toLowerCase() === filterSearch.toLowerCase()
                                  ? <mark key={i} className="bg-accent text-background">{part}</mark>
                                  : part
                              )
                            ) : sig.company_name}
                          </td>
                          <td className="px-4 py-2.5 border-r border-border text-muted text-[10px]">{sig.source || '—'}</td>
                          <td className="px-4 py-2.5 border-r border-border text-muted">{sig.intent}</td>
                          <td className="px-4 py-2.5 border-r border-border text-right">
                            <span className={isCrit ? 'text-accent font-bold' : 'text-white'}>{sig.lead_score}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-1.5 py-0.5 border text-[10px] ${isCrit ? 'border-danger text-danger bg-danger/10 animate-pulse' : 'border-border text-muted'}`}>
                              {isCrit ? 'CRIT' : 'IDLE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredData.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted font-mono text-xs">
                        {tableData.length === 0 ? 'NO ACTIVE TARGETS — run Initialize Sweep' : `NO RESULTS for current filters`}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Execute workflow panel */}
            {selectedLead !== null && tableData[selectedLead] && (
              <div className="mt-2 border border-accent/40 bg-accent/5 p-4 flex items-center justify-between">
                <div className="font-mono text-xs">
                  <span className="text-accent">LOCKED: </span>
                  <span className="text-white">{tableData[selectedLead].company_name}</span>
                  <span className="text-muted ml-3">score={tableData[selectedLead].lead_score} · {tableData[selectedLead].intent}</span>
                </div>
                <button onClick={() => executeWorkflow(tableData[selectedLead].lead_id, tableData[selectedLead].company_name)}
                  className="font-mono text-xs bg-white text-background hover:bg-accent px-4 py-2 transition-colors flex items-center gap-2">
                  <Zap size={10} className="fill-current" /> EXECUTE WORKFLOW <ArrowRight size={10} />
                </button>
              </div>
            )}
          </section>

          {/* ── SECTION 4: EXECUTION QUEUE ── */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-base font-bold uppercase tracking-tight text-white flex items-center gap-3">
                Execution Queue
                <span className="font-mono text-xs text-accent border border-accent px-2 py-0.5 animate-pulse">{queue.length} ACTIVE</span>
              </h2>
              <span className="font-mono text-[10px] text-muted">Companies move here after workflow execution</span>
            </div>

            {queue.length === 0 ? (
              <div className="border border-border bg-secondary p-8 text-center font-mono text-xs text-muted">
                NO COMPANIES IN QUEUE — Execute a workflow from Active Targets above
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {queue.map((item: any, i: number) => (
                  <div key={i} className="border border-border bg-secondary p-4 hover:border-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-sans font-semibold text-sm">{item.company_name}</p>
                        <p className="font-mono text-[10px] text-muted mt-0.5">{item.intent}</p>
                      </div>
                      <span className="font-mono text-[10px] border border-accent/50 text-accent px-1.5 py-0.5">
                        {item.action_status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-muted">SCORE</span>
                        <span className="text-white">{item.lead_score}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-muted">PRIORITY</span>
                        <span className={item.priority === 'High' ? 'text-danger' : 'text-muted'}>{item.priority?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-muted">STATUS</span>
                        <span className="text-accent">{item.status}</span>
                      </div>
                    </div>
                    <div className="mt-3 h-px w-full bg-border" />
                    <p className="font-mono text-[9px] text-muted mt-2 leading-relaxed line-clamp-2">{item.recommended_action}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => fetch(`${API}/queue/${item.lead_id}/status`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status:'Qualified'}) }).then(() => fetchStats())}
                        className="flex-1 font-mono text-[10px] border border-accent text-accent py-1 hover:bg-accent hover:text-background transition-colors">
                        QUALIFY
                      </button>
                      <button onClick={() => fetch(`${API}/queue/${item.lead_id}/status`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status:'Disqualified'}) }).then(() => fetchStats())}
                        className="flex-1 font-mono text-[10px] border border-border text-muted py-1 hover:border-danger hover:text-danger transition-colors">
                        DISQUALIFY
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      {/* ── AI TERMINAL SIDEBAR ── */}
      <aside className="w-80 shrink-0 bg-secondary flex flex-col border-l border-border h-screen sticky top-0">
        <div className="h-14 border-b border-border flex items-center px-4 bg-background justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-accent" />
            <span className="font-mono text-[10px] text-muted">TERMINAL // COPILOT</span>
          </div>
          <span className="font-mono text-[10px] border border-accent/30 px-1 text-accent text-[9px]">
            {chatLoading ? '⟳ PROCESSING' : 'ONLINE'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] leading-relaxed">
          {chatHistory.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className={`text-[9px] ${msg.role === 'user' ? 'text-white' : 'text-accent'}`}>
                {msg.role === 'user' ? 'USER_QUERY:' : 'SYS_RESPONSE:'}
              </span>
              <div className={`p-3 border ${msg.role === 'user' ? 'border-border bg-background text-muted' : 'border-accent/30 bg-accent/5 text-white'}`}>
                <p className="whitespace-pre-wrap text-[10px]">{msg.content}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-accent">SYS_RESPONSE:</span>
              <div className="p-3 border border-border bg-background text-muted flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-accent animate-ping" /> PROCESSING...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick actions */}
        <div className="px-4 pb-2 flex gap-1 flex-wrap">
          {['Top leads?', 'Recent signals?', 'Queue status?'].map(q => (
            <button key={q} onClick={() => handleChatSubmit(undefined, q)}
              className="font-mono text-[9px] border border-border px-2 py-1 text-muted hover:text-accent hover:border-accent transition-colors">
              {q}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={handleChatSubmit} className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-xs">&gt;</div>
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
              placeholder="ENTER DIRECTIVE..."
              className="w-full bg-secondary border border-border pl-7 pr-10 py-2.5 font-mono text-[11px] focus:outline-none focus:border-accent text-white placeholder:text-muted rounded-none" />
            <button type="submit" disabled={chatLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors disabled:opacity-50">
              <Play size={12} className="fill-current" />
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
