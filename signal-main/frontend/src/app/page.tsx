"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Terminal, Activity, Crosshair, AlertTriangle, Play,
  Command, Clock, ChevronRight, Zap, Filter
} from 'lucide-react';

export default function Dashboard() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  // AI Panel State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'SYSTEM READY. Awaiting directive.' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    // Live Clock
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/signals')
      .then(res => res.json())
      .then(data => {
        setSignals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  const handleChatSubmit = async (e?: React.FormEvent, presetMsg?: string) => {
    if (e) e.preventDefault();
    const msg = presetMsg || chatInput;
    if (!msg.trim()) return;

    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response || 'NO_DATA' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'ERR_CONNECTION' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalSignals = signals.length;
  const leadDistribution = [
    { time: '08:00', val: 12 }, { time: '09:00', val: 24 }, { time: '10:00', val: 18 },
    { time: '11:00', val: 42 }, { time: '12:00', val: 35 }, { time: '13:00', val: 55 }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans text-sm selection:bg-accent selection:text-background">
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-border">
        
        {/* Top Navbar / Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <h1 className="font-display font-bold text-lg tracking-tight uppercase">Signal Main</h1>
            <div className="h-4 w-px bg-border mx-2"></div>
            <span className="font-mono text-xs text-muted flex items-center gap-2">
              <Clock size={12}/> {currentTime || 'LOADING CLOCK...'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted font-mono border border-border px-2 py-1 bg-secondary">
              <SearchIcon size={12} />
              <span>SEARCH</span>
              <div className="flex gap-1 ml-2">
                <span className="border border-border px-1 bg-background">⌘</span>
                <span className="border border-border px-1 bg-background">K</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 overflow-y-auto">
          
          {/* SECTION 1: MISSION CONTROL */}
          <section className="mb-14">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">Mission Control</h2>
                <p className="text-muted mt-1">Real-time signal aggregation and threat-level assessment.</p>
              </div>
              <button className="font-mono text-xs border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-background transition-colors flex items-center gap-2 uppercase">
                <Play size={12} className="fill-current" /> Initialize Sweep
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border border border-border">
              <div className="bg-background p-6 hover:bg-secondary transition-colors cursor-crosshair">
                <p className="font-mono text-[10px] text-muted uppercase mb-4 flex justify-between">
                  Signals Captured <Activity size={12} className="text-accent" />
                </p>
                <p className="font-mono text-4xl text-white">{totalSignals || 1248}</p>
                <div className="mt-4 h-1 w-full bg-secondary overflow-hidden">
                  <div className="h-full bg-accent w-3/4"></div>
                </div>
              </div>
              <div className="bg-background p-6 hover:bg-secondary transition-colors cursor-crosshair">
                <p className="font-mono text-[10px] text-muted uppercase mb-4 flex justify-between">
                  Critical Targets <AlertTriangle size={12} className="text-danger" />
                </p>
                <p className="font-mono text-4xl text-danger">12</p>
                <p className="font-mono text-[10px] text-danger mt-2">+4 Δ vs T-24H</p>
              </div>
              <div className="bg-background p-6 hover:bg-secondary transition-colors cursor-crosshair">
                <p className="font-mono text-[10px] text-muted uppercase mb-4 flex justify-between">
                  Avg Velocity <Crosshair size={12} className="text-warning" />
                </p>
                <p className="font-mono text-4xl text-white">84<span className="text-lg text-muted">.2</span></p>
                <p className="font-mono text-[10px] text-warning mt-2">OPTIMAL RANGE</p>
              </div>
              <div className="bg-background p-6 hover:bg-secondary transition-colors cursor-crosshair">
                <p className="font-mono text-[10px] text-muted uppercase mb-4 flex justify-between">
                  System Load <Terminal size={12} className="text-muted" />
                </p>
                <p className="font-mono text-4xl text-white">24<span className="text-lg text-muted">%</span></p>
                <div className="mt-4 flex gap-1">
                  <div className="h-1.5 flex-1 bg-accent"></div>
                  <div className="h-1.5 flex-1 bg-accent"></div>
                  <div className="h-1.5 flex-1 bg-secondary"></div>
                  <div className="h-1.5 flex-1 bg-secondary"></div>
                  <div className="h-1.5 flex-1 bg-secondary"></div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: TIMELINE (Horizontal flow) */}
          <section className="mb-14">
            <h2 className="font-display text-base font-bold uppercase tracking-tight text-white mb-6 border-b border-border pb-2">Event Flow</h2>
            <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {['Signal Ingest', 'Intent Map', 'Scoring', 'Strategy Gen', 'Execution'].map((step, i) => (
                <React.Fragment key={i}>
                  <div className={`shrink-0 border p-3 ${i < 3 ? 'border-accent text-accent bg-accent/5' : 'border-border text-muted bg-secondary'}`}>
                    <span className="font-mono text-[10px] block mb-1">NODE 0{i+1}</span>
                    <span className="font-display font-bold uppercase text-xs">{step}</span>
                  </div>
                  {i < 4 && (
                    <div className="shrink-0 w-8 h-px bg-border relative">
                      <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${i < 2 ? 'bg-accent' : 'bg-muted'}`}></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* SECTION 3: ANALYTICS */}
          <section className="mb-14">
            <h2 className="font-display text-base font-bold uppercase tracking-tight text-white mb-6 border-b border-border pb-2">Telemetry Data</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border border-border bg-secondary p-5">
                <div className="flex justify-between items-center mb-6">
                  <p className="font-mono text-[10px] uppercase text-muted">Frequency Over Time</p>
                  <span className="font-mono text-[10px] border border-border px-1">LIVE</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={leadDistribution}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D9FF3F" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D9FF3F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="1 3" stroke="#2A2D3A" vertical={false} />
                      <XAxis dataKey="time" stroke="#545864" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                      <YAxis stroke="#545864" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{stroke: '#545864', strokeWidth: 1, strokeDasharray: '2 2'}} contentStyle={{backgroundColor: '#0B0D12', border: '1px solid #2A2D3A', borderRadius: '0', fontFamily: 'monospace', fontSize: '10px', color: '#E8E8E8'}} />
                      <Area type="step" dataKey="val" stroke="#D9FF3F" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="border border-border bg-secondary p-5 flex flex-col">
                <p className="font-mono text-[10px] uppercase text-muted mb-6">Intent Distribution Matrix</p>
                <div className="flex-1 space-y-4 font-mono text-[10px]">
                  {[
                    {lbl: 'Hiring Expansion', val: '42%'},
                    {lbl: 'Series A/B Funding', val: '28%'},
                    {lbl: 'Executive Move', val: '18%'},
                    {lbl: 'M&A Rumor', val: '12%'}
                  ].map((row, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-white mb-1">
                        <span>{row.lbl}</span>
                        <span className={i === 0 ? 'text-accent' : ''}>{row.val}</span>
                      </div>
                      <div className="w-full bg-background h-1.5 border border-border">
                        <div className={`h-full ${i === 0 ? 'bg-accent' : 'bg-muted'}`} style={{width: row.val}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: DENSE DATA TABLE */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-base font-bold uppercase tracking-tight text-white">Target Database</h2>
              <div className="flex gap-2">
                <button className="font-mono text-[10px] border border-border px-2 py-1 text-muted hover:text-white flex items-center gap-1">
                  <Filter size={10} /> FILTER
                </button>
              </div>
            </div>
            
            <div className="border border-border bg-secondary overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead className="bg-background border-b border-border text-muted">
                    <tr>
                      <th className="px-4 py-3 font-normal border-r border-border w-10 text-center">ID</th>
                      <th className="px-4 py-3 font-normal border-r border-border">IDENTIFIER (COMPANY)</th>
                      <th className="px-4 py-3 font-normal border-r border-border">VECTOR (INTENT)</th>
                      <th className="px-4 py-3 font-normal border-r border-border text-right">SCORE</th>
                      <th className="px-4 py-3 font-normal text-center w-24">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(signals.length > 0 ? signals.slice(0, 8) : [1,2,3,4,5]).map((sig: any, idx: number) => {
                      const isMock = !sig.company_name;
                      const score = isMock ? (98 - idx*4) : 'N/A';
                      const isCrit = idx === 0;
                      return (
                        <tr key={idx} 
                          className={`hover:bg-background cursor-pointer group ${selectedLead === idx ? 'bg-background' : ''}`}
                          onClick={() => setSelectedLead(idx)}
                        >
                          <td className={`px-4 py-2 border-r border-border text-center ${selectedLead === idx ? 'text-accent' : 'text-muted'}`}>
                            {idx < 9 ? `0${idx+1}` : idx+1}
                          </td>
                          <td className="px-4 py-2 border-r border-border text-white group-hover:text-accent font-sans text-sm font-medium">
                            {isMock ? `TechNova Systems ${idx}` : sig.company_name}
                          </td>
                          <td className="px-4 py-2 border-r border-border text-muted">
                            {isMock ? 'Hiring (Engineering)' : sig.signal_type || 'Unknown'}
                          </td>
                          <td className="px-4 py-2 border-r border-border text-right">
                            <span className={isCrit ? 'text-accent' : 'text-white'}>{score}</span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-1.5 py-0.5 border ${isCrit ? 'border-danger text-danger bg-danger/10' : 'border-border text-muted'}`}>
                              {isCrit ? 'CRIT' : 'IDLE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* AI SIDE PANEL (Fixed Width) */}
      <aside className="w-80 shrink-0 bg-secondary flex flex-col border-l border-border h-screen sticky top-0">
        <div className="h-14 border-b border-border flex items-center px-4 bg-background justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-accent" />
            <span className="font-mono text-[10px] text-muted">TERMINAL // ASSISTANT</span>
          </div>
          <span className="font-mono text-[10px] border border-border px-1 text-muted">CTRL+`</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] leading-relaxed">
          {chatHistory.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className={`text-[9px] ${msg.role === 'user' ? 'text-white' : 'text-accent'}`}>
                {msg.role === 'user' ? 'USER_QUERY:' : 'SYS_RESPONSE:'}
              </span>
              <div className={`p-3 border ${msg.role === 'user' ? 'border-border bg-background text-muted' : 'border-accent/30 bg-accent/5 text-white'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-accent">SYS_RESPONSE:</span>
              <div className="p-3 border border-border bg-background text-muted flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-accent animate-ping"></div>
                PROCESSING_QUERY...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={handleChatSubmit} className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-xs">&gt;</div>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="ENTER DIRECTIVE..." 
              className="w-full bg-secondary border border-border pl-7 pr-10 py-2.5 font-mono text-[11px] focus:outline-none focus:border-accent text-white placeholder:text-muted rounded-none" 
            />
            <button type="submit" disabled={chatLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors disabled:opacity-50">
              <Play size={12} className="fill-current" />
            </button>
          </form>
          {selectedLead !== null && (
            <div className="mt-4 border border-border bg-secondary p-3">
              <div className="flex justify-between items-center mb-2 border-b border-border pb-1">
                <span className="font-mono text-[9px] text-accent uppercase">Context Locked</span>
                <span className="font-mono text-[9px] text-muted">ID: 0{selectedLead+1}</span>
              </div>
              <button 
                onClick={() => alert('Executing Workflow')}
                className="w-full font-mono text-[10px] bg-white text-background hover:bg-accent py-2 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Zap size={10} className="fill-current" /> EXECUTE WORKFLOW
              </button>
            </div>
          )}
        </div>
      </aside>

    </div>
  );
}

// Utility icon component
function SearchIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}
