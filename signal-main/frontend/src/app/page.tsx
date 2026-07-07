"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Bell, Search, Zap, ArrowUpRight, CheckSquare, AlertTriangle, 
  Terminal, TrendingUp, Users, Activity, Crosshair,
  Copy, Trash2, Loader2, Play
} from 'lucide-react';

const COLORS = ['#FF3300', '#00FF66', '#FFB300', '#E5E5E5', '#737373'];

export default function Dashboard() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Copilot State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: '> SYSTEM.INIT\n> Copilot online. Query database parameters.' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response || 'NO_DATA_RETURNED' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'ERR_CONNECTION_FAILED' }]);
    } finally {
      setChatLoading(false);
    }
  };

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

  const totalSignals = signals.length;
  const highPriorityLeads = 12; 
  const avgLeadScore = 84;
  const recsGenerated = 42;

  const leadDistribution = [
    { name: '0-50', count: 5 },
    { name: '50-74', count: 15 },
    { name: '75-89', count: 25 },
    { name: '90-100', count: 12 },
  ];

  const intentData = [
    { name: 'Hiring', value: 40 },
    { name: 'Funding', value: 30 },
    { name: 'Expansion', value: 20 },
    { name: 'Partnership', value: 10 },
  ];

  const heatMapData = [
    { sector: 'Healthcare', fill: '████████████████', percent: '80%' },
    { sector: 'AI / Tech', fill: '████████████', percent: '65%' },
    { sector: 'Finance', fill: '████████', percent: '40%' },
    { sector: 'Retail', fill: '████', percent: '20%' },
  ];

  const recentDecisions = [
    { text: "SIGNAL_DETECTED :: TechNova", icon: <Users size={14} className="text-accent" /> },
    { text: "SCORE_CALCULATED :: 94", icon: <Crosshair size={14} className="text-success" /> },
    { text: "STRATEGY :: Contact CTO", icon: <Zap size={14} className="text-warning" /> },
    { text: "AUTOMATION :: 24h Sequence", icon: <Activity size={14} className="text-accent" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans uppercase selection:bg-accent selection:text-white pb-12 tracking-wide">
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background border-b-2 border-border">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent flex items-center justify-center font-bold text-background font-mono text-xl border-2 border-border shadow-neo">
            SM
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tighter leading-none">SIGNAL-MAIN</h1>
            <span className="text-[10px] font-mono text-accent tracking-widest">SYS.VER. 4.0.1</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="QUERY DATABASE..." 
              className="bg-transparent border-2 border-border pl-10 pr-4 py-2 text-xs w-72 focus:outline-none focus:border-accent font-mono transition-none placeholder:text-muted focus:shadow-neo"
            />
          </div>
          <button className="relative text-foreground hover:text-accent transition-none">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent border-2 border-background"></span>
          </button>
          <div className="w-10 h-10 bg-secondary border-2 border-border flex items-center justify-center cursor-pointer hover:bg-foreground hover:text-background transition-none">
            <span className="font-mono text-xs font-bold">OP</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Executive Summary */}
        <section className="bg-secondary border-2 border-border p-6 relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-accent"></div>
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-accent" /> EXECUTIVE_SUMMARY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono text-muted">
            <div className="flex items-start gap-3 border-l border-border pl-3">
              <CheckSquare className="w-4 h-4 text-success shrink-0" />
              <span className="text-foreground">{totalSignals || 42} NEW SIGNALS ACQUIRED.</span>
            </div>
            <div className="flex items-start gap-3 border-l border-border pl-3">
              <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
              <span className="text-foreground">{highPriorityLeads} CRITICAL PRIORITY ASSETS.</span>
            </div>
            <div className="flex items-start gap-3 border-l border-border pl-3">
              <TrendingUp className="w-4 h-4 text-warning shrink-0" />
              <span className="text-foreground">HEALTHCARE VECTOR HIGH INTENT.</span>
            </div>
            <div className="flex items-start gap-3 border-l border-border pl-3">
              <Crosshair className="w-4 h-4 text-success shrink-0" />
              <span className="text-foreground">FOCUS: SERIES A FUNDING.</span>
            </div>
          </div>
        </section>

        {/* Top Row: KPIs & Copilot */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-background border-2 border-border p-5 hover:border-accent transition-none group cursor-default">
              <div className="flex justify-between items-start mb-6">
                <p className="text-muted font-mono text-[10px] tracking-widest">TOTAL_SIGNALS</p>
                <Activity className="w-4 h-4 text-muted group-hover:text-accent" />
              </div>
              <h3 className="text-4xl font-extrabold tracking-tighter font-sans">{totalSignals || 1248}</h3>
              <p className="text-[10px] font-mono text-success mt-2 flex items-center gap-1"><ArrowUpRight size={10}/> +12.5% Δ</p>
            </div>
            <div className="bg-background border-2 border-border p-5 hover:border-accent transition-none group cursor-default shadow-neo">
              <div className="flex justify-between items-start mb-6">
                <p className="text-muted font-mono text-[10px] tracking-widest">CRITICAL_LEADS</p>
                <AlertTriangle className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-4xl font-extrabold tracking-tighter text-accent font-sans">{highPriorityLeads}</h3>
              <p className="text-[10px] font-mono text-accent mt-2 flex items-center gap-1"><ArrowUpRight size={10}/> ACTIVE</p>
            </div>
            <div className="bg-background border-2 border-border p-5 hover:border-success transition-none group cursor-default">
              <div className="flex justify-between items-start mb-6">
                <p className="text-muted font-mono text-[10px] tracking-widest">AVG_SCORE</p>
                <Crosshair className="w-4 h-4 text-muted group-hover:text-success" />
              </div>
              <h3 className="text-4xl font-extrabold tracking-tighter font-sans">{avgLeadScore}</h3>
              <p className="text-[10px] font-mono text-success mt-2 flex items-center gap-1"><ArrowUpRight size={10}/> +2.1 PT</p>
            </div>
            <div className="bg-background border-2 border-border p-5 hover:border-warning transition-none group cursor-default">
              <div className="flex justify-between items-start mb-6">
                <p className="text-muted font-mono text-[10px] tracking-widest">RECOMMENDATIONS</p>
                <Zap className="w-4 h-4 text-muted group-hover:text-warning" />
              </div>
              <h3 className="text-4xl font-extrabold tracking-tighter font-sans">{recsGenerated}</h3>
              <p className="text-[10px] font-mono text-muted mt-2">SYS.GENERATED</p>
            </div>
          </div>
          
          {/* AI Copilot */}
          <div className="bg-secondary border-2 border-border p-5 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-muted font-mono text-[8px]">AI_THREAD_01</div>
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 tracking-widest">
                <Terminal className="w-4 h-4 text-accent" /> COPILOT.EXE
              </h3>
              <button onClick={() => setChatHistory([{ role: 'assistant', content: '> SYSTEM.INIT\n> Copilot online. Query database parameters.' }])} className="text-muted hover:text-accent transition-none">
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 font-mono text-xs">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-3 border-l-2 flex flex-col gap-1 ${msg.role === 'user' ? 'bg-background border-accent text-foreground ml-4' : 'bg-background border-muted text-muted mr-4'}`}>
                  <span className="text-[8px] tracking-widest opacity-50">{msg.role === 'user' ? 'USER_INPUT' : 'SYS_RESPONSE'}</span>
                  <div className="flex justify-between items-start">
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => navigator.clipboard.writeText(msg.content)} className="opacity-50 hover:opacity-100 hover:text-accent transition-none shrink-0 ml-2">
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="p-3 border-l-2 bg-background border-accent text-accent mr-4 flex items-center gap-2 w-fit">
                  <Loader2 size={12} className="animate-spin" /> PROCESSING...
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="relative mt-auto border-t border-border pt-4">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="> INPUT_QUERY_" 
                className="w-full bg-background border-2 border-border pl-3 pr-10 py-2 text-xs focus:outline-none focus:border-accent focus:shadow-neo font-mono transition-none" 
              />
              <button type="submit" disabled={chatLoading} className="absolute right-2 top-1/2 mt-2 -translate-y-1/2 bg-accent text-background p-1.5 hover:bg-foreground transition-none disabled:opacity-50">
                <Play size={12} className="fill-current" />
              </button>
            </form>
          </div>
        </div>

        {/* Charts & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-background border-2 border-border p-5 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent"></div>
            <h3 className="text-sm font-bold mb-6 font-mono tracking-widest">SCORE_DISTRIBUTION</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadDistribution}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#333333" vertical={false} />
                  <XAxis dataKey="name" stroke="#737373" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                  <YAxis stroke="#737373" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: '#141414'}} contentStyle={{backgroundColor: '#0A0A0A', borderColor: '#333333', borderRadius: 0, fontFamily: 'monospace', fontSize: '10px'}} />
                  <Bar dataKey="count" fill="#E5E5E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-background border-2 border-border p-5 relative">
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-accent"></div>
            <h3 className="text-sm font-bold mb-6 font-mono tracking-widest">INTENT_VECTORS</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={intentData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={0} stroke="none" dataKey="value">
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{backgroundColor: '#0A0A0A', borderColor: '#333333', borderRadius: 0, fontFamily: 'monospace', fontSize: '10px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-secondary border-2 border-border p-5">
              <h3 className="text-sm font-bold mb-4 font-mono tracking-widest">SECTOR_HEATMAP</h3>
              <div className="space-y-3 font-mono">
                {heatMapData.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>{item.sector}</span>
                      <span className={i === 0 ? "text-accent" : "text-foreground"}>{item.percent}</span>
                    </div>
                    <div className="text-[10px] text-accent overflow-hidden whitespace-nowrap select-none leading-none opacity-80">
                      {item.fill}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-background border-2 border-border">
            <div className="p-4 border-b-2 border-border flex justify-between items-center bg-secondary">
              <h3 className="text-sm font-bold tracking-widest font-mono">INTELLIGENCE_QUEUE</h3>
              <button className="text-[10px] font-mono border border-border px-2 py-1 hover:bg-foreground hover:text-background transition-none">VIEW_ALL</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-background text-[10px] tracking-widest text-muted border-b border-border">
                  <tr>
                    <th className="px-5 py-3 font-normal">ENTITY</th>
                    <th className="px-5 py-3 font-normal">VECTOR</th>
                    <th className="px-5 py-3 font-normal">SCORE</th>
                    <th className="px-5 py-3 font-normal">PRIORITY</th>
                    <th className="px-5 py-3 font-normal">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(signals.length > 0 ? signals.slice(0, 5) : [1,2,3,4]).map((sig: any, idx: number) => {
                    const isMock = !sig.company_name;
                    return (
                      <tr key={idx} className={`hover:bg-secondary cursor-pointer transition-none ${selectedLead === idx ? 'bg-secondary border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'}`} onClick={() => setSelectedLead(idx)}>
                        <td className="px-5 py-4 font-bold font-sans text-sm">{isMock ? `TechNova ${idx}` : sig.company_name}</td>
                        <td className="px-5 py-4">
                          <span className="border border-border px-2 py-1 text-[10px] bg-secondary">{isMock ? 'Hiring' : sig.signal_type || 'Unknown'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-bold text-sm ${idx === 0 ? 'text-accent' : 'text-foreground'}`}>{isMock ? (94 - idx*5) : 'N/A'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 text-[10px] font-bold border ${idx === 0 ? 'bg-accent text-background border-accent' : 'border-muted text-muted'}`}>
                            {idx === 0 ? 'CRITICAL' : 'STANDARD'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted hover:text-accent font-bold">&gt;&gt;</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendation Panel */}
          <div className="bg-secondary border-2 border-border p-5 flex flex-col h-full relative shadow-neo">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 font-mono tracking-widest">
              <Zap className="w-4 h-4 text-accent" /> STRATEGY_ENGINE
            </h3>
            
            {selectedLead !== null ? (
              <div className="space-y-4 flex-1 flex flex-col font-mono">
                <div className="bg-background border-2 border-border p-4">
                  <p className="text-[10px] text-muted tracking-widest mb-2 border-b border-border pb-1">TARGET_ACTION</p>
                  <p className="text-xs font-bold text-foreground">CONTACT CTO WITHIN 24 HOURS.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border-2 border-border p-3">
                    <p className="text-[10px] text-muted mb-1">CHANNEL</p>
                    <p className="text-[10px] text-foreground font-bold">LINKEDIN_EMAIL</p>
                  </div>
                  <div className="bg-background border-2 border-border p-3">
                    <p className="text-[10px] text-muted mb-1">TIMELINE</p>
                    <p className="text-[10px] text-accent font-bold">T-MINUS 24H</p>
                  </div>
                </div>

                <div className="bg-background border-2 border-border p-4">
                  <p className="text-[10px] text-muted tracking-widest mb-2 border-b border-border pb-1">AI_REASONING</p>
                  <p className="text-[10px] text-muted leading-relaxed lowercase">
                    rapid hiring indicates organizational growth and a high likelihood of purchasing enterprise software. engaging leadership early builds pipeline before competitors.
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-border">
                  <button 
                    onClick={() => {
                      alert('SYS_COMMAND: AUTOMATION_WORKFLOW_TRIGGERED\nSTATUS: 200 OK');
                    }}
                    className="w-full bg-accent text-background py-3 font-bold text-xs hover:bg-foreground transition-none flex items-center justify-center gap-2 shadow-neo active:translate-y-1 active:translate-x-1 active:shadow-none"
                  >
                    <Play size={12} className="fill-current" /> EXECUTE_AUTOMATION
                  </button>
                  <div className="flex justify-between mt-3 text-[8px] text-muted tracking-widest">
                    <span>GEN: EMAIL_TEMPLATE</span>
                    <span>GEN: CRM_PAYLOAD</span>
                    <span>GEN: CAL_REMINDER</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted border-2 border-dashed border-border m-2">
                <Crosshair className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-[10px] font-mono tracking-widest">AWAITING_TARGET<br/>SELECTION</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
