"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Bell, Search, Zap, ArrowUpRight, CheckCircle2, AlertCircle, 
  MessageSquare, TrendingUp, Users, Activity, Target,
  Copy, Trash2, Loader2, Sparkles, ChevronRight, BarChart3
} from 'lucide-react';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Copilot State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hello! I am your AI Business Copilot. How can I help you discover new opportunities today?' }
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
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response || 'No data returned.' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection failed. Please try again.' }]);
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
    { sector: 'Healthcare', percent: '80%', color: 'bg-blue-500' },
    { sector: 'AI / Tech', percent: '65%', color: 'bg-purple-500' },
    { sector: 'Finance', percent: '40%', color: 'bg-emerald-500' },
    { sector: 'Retail', percent: '20%', color: 'bg-amber-500' },
  ];

  const recentDecisions = [
    { text: "Growth signal detected at TechNova", icon: <Users size={16} className="text-blue-400" /> },
    { text: "Lead Score dynamically adjusted to 94", icon: <Target size={16} className="text-emerald-400" /> },
    { text: "Strategic Recommendation: Contact CTO", icon: <Sparkles size={16} className="text-amber-400" /> },
    { text: "Automation: Outreach sequence drafted", icon: <Activity size={16} className="text-purple-400" /> },
  ];

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-accent/30 selection:text-white pb-12 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 glass-panel border-b-0 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-glow">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold font-['Outfit'] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Signal-Main
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4 transition-colors group-focus-within:text-accent" />
            <input 
              type="text" 
              placeholder="Search companies & signals..." 
              className="bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm w-72 focus:outline-none focus:border-accent/50 focus:bg-white/10 focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-muted"
            />
          </div>
          <button className="relative text-muted hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-background shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 cursor-pointer border-2 border-background shadow-md"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8 relative z-10">
        
        {/* Executive Summary */}
        <section className="glass-panel rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-50"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold font-['Outfit'] mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" /> Executive Intelligence Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-white/70">
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="p-2 bg-emerald-500/10 rounded-xl shrink-0"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
                <span><strong className="text-white font-medium">{totalSignals || 42}</strong> new business signals detected and mapped.</span>
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="p-2 bg-amber-500/10 rounded-xl shrink-0"><AlertCircle className="w-5 h-5 text-amber-400" /></div>
                <span><strong className="text-white font-medium">{highPriorityLeads}</strong> critical priority leads requiring attention.</span>
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="p-2 bg-purple-500/10 rounded-xl shrink-0"><TrendingUp className="w-5 h-5 text-purple-400" /></div>
                <span>Healthcare & AI sectors show maximum buying intent.</span>
              </div>
              <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="p-2 bg-blue-500/10 rounded-xl shrink-0"><Target className="w-5 h-5 text-blue-400" /></div>
                <span>Recommended strategic focus: Series A Funding rounds.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Top Row: KPIs & Copilot */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-panel rounded-3xl p-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Total Signals</p>
                <div className="p-2 bg-blue-500/10 rounded-xl"><Activity className="w-4 h-4 text-blue-400" /></div>
              </div>
              <h3 className="text-3xl font-bold font-['Outfit']">{totalSignals || 1248}</h3>
              <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1 font-medium"><ArrowUpRight size={14}/> +12.5% vs last week</p>
            </div>
            
            <div className="glass-panel rounded-3xl p-6 hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-muted text-xs font-medium uppercase tracking-wider">High Priority</p>
                  <div className="p-2 bg-amber-500/10 rounded-xl"><AlertCircle className="w-4 h-4 text-amber-400" /></div>
                </div>
                <h3 className="text-3xl font-bold font-['Outfit'] text-amber-400">{highPriorityLeads}</h3>
                <p className="text-xs text-amber-400/80 mt-3 flex items-center gap-1 font-medium">Requires immediate action</p>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Avg Score</p>
                <div className="p-2 bg-emerald-500/10 rounded-xl"><Target className="w-4 h-4 text-emerald-400" /></div>
              </div>
              <h3 className="text-3xl font-bold font-['Outfit']">{avgLeadScore}</h3>
              <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1 font-medium"><ArrowUpRight size={14}/> +2.1 pts aggregate</p>
            </div>

            <div className="glass-panel rounded-3xl p-6 hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Actions</p>
                <div className="p-2 bg-purple-500/10 rounded-xl"><Zap className="w-4 h-4 text-purple-400" /></div>
              </div>
              <h3 className="text-3xl font-bold font-['Outfit']">{recsGenerated}</h3>
              <p className="text-xs text-white/50 mt-3 font-medium">AI generated today</p>
            </div>
          </div>
          
          {/* AI Copilot */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col h-full relative overflow-hidden shadow-glow border border-accent/20">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <h3 className="text-sm font-semibold flex items-center gap-2 font-['Outfit']">
                <Sparkles className="w-5 h-5 text-accent" /> Business Copilot
              </h3>
              <button onClick={() => setChatHistory([{ role: 'assistant', content: 'Hello! I am your AI Business Copilot. How can I help you discover new opportunities today?' }])} className="text-muted hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`text-sm flex flex-col ${msg.role === 'user' ? 'items-end ml-6' : 'items-start mr-6'}`}>
                  <div className={`p-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-accent text-white rounded-br-sm shadow-md' : 'bg-white/5 border border-white/5 text-white/80 rounded-bl-sm'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                      {msg.role === 'assistant' && (
                        <button onClick={() => navigator.clipboard.writeText(msg.content)} className="opacity-0 group-hover:opacity-100 hover:text-accent transition-all shrink-0 mt-0.5">
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="text-sm p-3.5 rounded-2xl bg-white/5 border border-white/5 text-white/80 rounded-bl-sm mr-6 flex items-center gap-3 w-fit">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="relative mt-auto">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about leads or trends..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all shadow-inner" 
              />
              <button type="submit" disabled={chatLoading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-blue-500 text-white p-2 rounded-xl transition-colors disabled:opacity-50">
                <ArrowUpRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Charts & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-3xl p-6 flex flex-col">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 font-['Outfit']"><BarChart3 size={16} className="text-muted"/> Score Distribution</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'}} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 flex flex-col">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 font-['Outfit']"><PieChart size={16} className="text-muted"/> Intent Vectors</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={intentData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} stroke="none" dataKey="value">
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{backgroundColor: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6 flex flex-col h-full">
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-sm font-semibold mb-5 font-['Outfit']">Sector Heatmap</h3>
              <div className="space-y-4">
                {heatMapData.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-white/70 font-medium">
                      <span>{item.sector}</span>
                      <span>{item.percent}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{width: item.percent}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-base font-bold font-['Outfit'] flex items-center gap-2">
                <Target size={18} className="text-accent" /> Intelligence Queue
              </h3>
              <button className="text-xs text-muted hover:text-white transition-colors flex items-center gap-1 font-medium">
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.02] text-xs uppercase text-muted font-semibold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Intent</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(signals.length > 0 ? signals.slice(0, 5) : [1,2,3,4]).map((sig: any, idx: number) => {
                    const isMock = !sig.company_name;
                    return (
                      <tr key={idx} className={`hover:bg-white/[0.04] cursor-pointer transition-colors ${selectedLead === idx ? 'bg-white/[0.04] border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'}`} onClick={() => setSelectedLead(idx)}>
                        <td className="px-6 py-5 font-semibold text-white flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-rose-500' : 'bg-white/10'}`}>
                            {isMock ? 'T' : sig.company_name.charAt(0)}
                          </div>
                          {isMock ? `TechNova ${idx}` : sig.company_name}
                        </td>
                        <td className="px-6 py-5">
                          <span className="bg-white/10 border border-white/5 px-2.5 py-1 rounded-lg text-xs font-medium text-white/80">{isMock ? 'Hiring' : sig.signal_type || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white text-base">{isMock ? (94 - idx*5) : 'N/A'}</span>
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full ${idx === 0 ? 'bg-amber-400' : 'bg-accent'}`} style={{width: `${isMock ? (94 - idx*5) : 0}%`}}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${idx === 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-muted border-white/10'}`}>
                            {idx === 0 ? 'Critical' : 'Standard'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-white/10 transition-colors">
                            <ChevronRight size={16} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendation Panel */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <h3 className="text-base font-bold mb-6 flex items-center gap-2 font-['Outfit'] relative z-10">
              <Zap className="w-5 h-5 text-amber-400" /> Strategy Engine
            </h3>
            
            {selectedLead !== null ? (
              <div className="space-y-4 flex-1 flex flex-col relative z-10">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 backdrop-blur-md hover:bg-white/10 transition-colors">
                  <p className="text-xs text-muted font-medium uppercase tracking-wider mb-2">Next Best Action</p>
                  <p className="text-sm font-semibold text-white">Contact the CTO within 24 hours.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-1">Channel</p>
                    <p className="text-xs text-white/90 font-semibold flex items-center gap-2"><MessageSquare size={12}/> LinkedIn + Email</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-1">Timeline</p>
                    <p className="text-xs text-amber-400 font-semibold">T-Minus 24h</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                  <p className="text-xs text-muted font-medium uppercase tracking-wider mb-2">AI Reasoning</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Rapid hiring indicates organizational growth and a high likelihood of purchasing enterprise software. Engaging leadership early builds pipeline before competitors.
                  </p>
                </div>

                <div className="mt-auto pt-4">
                  <button 
                    onClick={() => {
                      alert('Automation Workflow Triggered Successfully!');
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow flex items-center justify-center gap-2 group/btn"
                  >
                    <Sparkles size={16} className="text-blue-200 group-hover/btn:animate-pulse" /> Execute Automation Sequence
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted border-2 border-dashed border-white/10 rounded-2xl m-2">
                <Target className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Select a lead from the queue<br/>to generate AI strategy.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
