"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Bell, Search, Zap, ArrowRight, CheckCircle2, AlertCircle, 
  MessageCircle, TrendingUp, Users, Target, Activity,
  ChevronRight, BarChart3, Rocket, Sparkles, Mail
} from 'lucide-react';

const COLORS = ['#0EA5E9', '#A855F7', '#10B981', '#FBBF24', '#EF4444'];

export default function Dashboard() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Copilot State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hi there! 👋 I\'m your friendly AI assistant. How can we grow your business today?' }
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
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response || 'Oops! I couldn\'t find an answer.' }]);
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
    { sector: 'Healthcare', percent: '80%', color: 'bg-accent' },
    { sector: 'AI / Tech', percent: '65%', color: 'bg-purple-500' },
    { sector: 'Finance', percent: '40%', color: 'bg-emerald-500' },
    { sector: 'Retail', percent: '20%', color: 'bg-yellow-400' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/20 selection:text-accent pb-16">
      
      {/* Playful Floating Background Elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-button">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Signal<span className="text-accent">Main</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4 transition-colors group-focus-within:text-accent" />
            <input 
              type="text" 
              placeholder="Search companies & signals..." 
              className="bg-secondary border-none rounded-full pl-11 pr-4 py-2.5 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-slate-700 placeholder:text-muted shadow-inner"
            />
          </div>
          
          <button className="relative text-slate-400 hover:text-accent transition-colors p-2 rounded-full hover:bg-accent/10">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
          </button>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-purple-500 cursor-pointer border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-sm">
            SM
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-10 relative z-10">
        
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Rapid prototyping, <br/>
              <span className="text-slate-500">for modern sales teams.</span>
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl text-lg leading-relaxed">
              Signal-Main has everything you need to bring deals to life and transform how you discover opportunities with your team.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-border text-slate-700 px-6 py-3 rounded-full font-bold shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" /> Export Report
            </button>
            <button className="bg-accent text-white px-6 py-3 rounded-full font-bold shadow-button hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <Rocket className="w-4 h-4" /> Start Campaign
            </button>
          </div>
        </div>

        {/* Top Row: KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-floating transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-accent/10 text-accent rounded-full"><Activity size={20} /></div>
              <p className="text-slate-500 font-semibold text-sm">Total Signals</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-extrabold text-slate-800">{totalSignals || 1248}</h3>
              <p className="text-sm text-emerald-500 font-bold mb-1">+12.5%</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-floating transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full"><AlertCircle size={20} /></div>
              <p className="text-slate-500 font-semibold text-sm">High Priority</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-extrabold text-slate-800">{highPriorityLeads}</h3>
              <p className="text-sm text-amber-500 font-bold mb-1">Active</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-floating transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full"><Target size={20} /></div>
              <p className="text-slate-500 font-semibold text-sm">Avg Score</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-extrabold text-slate-800">{avgLeadScore}</h3>
              <p className="text-sm text-emerald-500 font-bold mb-1">+2.1 pts</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-floating transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full"><Zap size={20} /></div>
              <p className="text-slate-500 font-semibold text-sm">Actions</p>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-extrabold text-slate-800">{recsGenerated}</h3>
              <p className="text-sm text-slate-400 font-bold mb-1">Today</p>
            </div>
          </div>
        </div>
        
        {/* Main Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Intelligence Queue (Takes up 2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Workspace</h3>
                <p className="text-sm text-slate-500 mt-1">Bring all your prospects into one single space and work together.</p>
              </div>
              <button className="text-sm font-bold text-accent hover:bg-accent/10 px-4 py-2 rounded-full transition-colors">
                View All
              </button>
            </div>
            <div className="overflow-x-auto p-4 flex-1">
              <div className="space-y-3">
                {(signals.length > 0 ? signals.slice(0, 5) : [1,2,3,4]).map((sig: any, idx: number) => {
                  const isMock = !sig.company_name;
                  return (
                    <div key={idx} 
                      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${selectedLead === idx ? 'bg-accent/5 border-accent/20 shadow-sm' : 'bg-white border-transparent hover:border-border hover:shadow-sm'}`} 
                      onClick={() => setSelectedLead(idx)}
                    >
                      <div className="flex items-center gap-4 w-1/3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-rose-400' : 'bg-slate-800'}`}>
                          {isMock ? 'T' : sig.company_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{isMock ? `TechNova ${idx}` : sig.company_name}</h4>
                          <p className="text-xs text-slate-500 font-medium">Added 12 mins ago</p>
                        </div>
                      </div>
                      
                      <div className="w-1/4">
                        <span className="bg-secondary text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold">{isMock ? 'Hiring' : sig.signal_type || 'Unknown'}</span>
                      </div>
                      
                      <div className="w-1/4 flex items-center gap-3">
                        <span className="font-extrabold text-slate-800 text-lg">{isMock ? (94 - idx*5) : 'N/A'}</span>
                        <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${idx === 0 ? 'bg-amber-400' : 'bg-accent'} rounded-full`} style={{width: `${isMock ? (94 - idx*5) : 0}%`}}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-slate-400 hover:text-accent hover:border-accent transition-colors shadow-sm">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Copilot Chat */}
          <div className="bg-white rounded-3xl shadow-soft p-6 flex flex-col h-[600px] border border-border/50 relative">
            <div className="absolute top-[-15px] left-[-15px] p-3 bg-purple-500 text-white rounded-full shadow-lg transform -rotate-12">
              <MessageCircle size={24} className="fill-white" />
            </div>

            <div className="flex items-center justify-center mb-6 pt-2">
              <h3 className="text-lg font-bold text-slate-800">Copilot</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-5 pr-2">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shrink-0 mr-3 mt-1 shadow-sm">
                      <Sparkles size={14} />
                    </div>
                  )}
                  <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-accent text-white rounded-br-none' : 'bg-secondary text-slate-700 rounded-bl-none'}`}>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shrink-0 mr-3 mt-1 shadow-sm">
                    <Sparkles size={14} />
                  </div>
                  <div className="px-5 py-4 rounded-2xl bg-secondary rounded-bl-none flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="relative mt-auto">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..." 
                className="w-full bg-secondary border-none rounded-full pl-5 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-slate-700 font-medium placeholder:text-slate-400" 
              />
              <button type="submit" disabled={chatLoading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-white p-2 rounded-full hover:bg-blue-500 transition-colors shadow-button disabled:opacity-50">
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Row: Charts & Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="glass-panel bg-white rounded-3xl p-6 shadow-soft flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Score Distribution</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#1e293b'}} />
                  <Bar dataKey="count" fill="#0EA5E9" radius={[8, 8, 8, 8]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel bg-white rounded-3xl p-6 shadow-soft flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Intent Breakdown</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={intentData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} stroke="none" dataKey="value">
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#1e293b'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-soft flex flex-col relative overflow-hidden border border-border/50">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Strategy Engine</h3>
            
            {selectedLead !== null ? (
              <div className="space-y-5 flex-1 flex flex-col relative z-10">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Next Best Action</p>
                  <div className="bg-secondary rounded-2xl p-4">
                    <p className="text-slate-800 font-bold">Contact the CTO within 24 hours.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Channel</p>
                    <p className="text-slate-800 font-bold text-sm bg-secondary rounded-xl py-2 px-3 inline-block">LinkedIn</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Timeline</p>
                    <p className="text-amber-500 font-bold text-sm bg-amber-500/10 rounded-xl py-2 px-3 inline-block">T-Minus 24h</p>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button 
                    onClick={() => alert('Automation Sequence Initiated!')}
                    className="w-full bg-slate-900 text-white py-4 rounded-full font-bold hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Zap size={18} className="fill-white" /> Execute Sequence
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Select a lead from the Workspace<br/>to generate a strategy.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
