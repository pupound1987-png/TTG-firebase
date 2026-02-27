
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Ticket, Status, User, SystemType } from '../types';
import { MONTH_NAMES, SYSTEM_COLORS } from '../constants';
import { firebaseService } from '../services/firebaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw, Database, Laptop, Wrench, Activity, ChevronRight } from 'lucide-react';

const COLORS = [
  '#2563eb', '#d97706', '#7c3aed', '#db2777', '#059669', 
  '#4f46e5', '#0d9488', '#ea580c', '#6366f1', '#8b5cf6',
  '#ec4899', '#10b981', '#f59e0b', '#3b82f6'
];

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const location = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  
  const getInitialSystem = (): SystemType | 'all' => {
    const params = new URLSearchParams(location.search);
    const systemParam = params.get('system');
    
    if (systemParam === 'IT' || systemParam === 'MAINTENANCE') {
      // Check if user has access to this system
      if (user.systemAccess === 'BOTH' || user.systemAccess === systemParam || !user.systemAccess) {
        return systemParam as SystemType;
      }
    }
    
    if (user.systemAccess === 'BOTH' || !user.systemAccess) return 'all';
    return user.systemAccess;
  };

  const [selectedSystem, setSelectedSystem] = useState<SystemType | 'all'>(getInitialSystem);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Update selected system if URL parameter changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const systemParam = params.get('system');
    if (systemParam === 'IT' || systemParam === 'MAINTENANCE') {
      if (user.systemAccess === 'BOTH' || user.systemAccess === systemParam || !user.systemAccess) {
        setSelectedSystem(systemParam as SystemType);
      }
    } else if (!systemParam && (user.systemAccess === 'BOTH' || !user.systemAccess)) {
      setSelectedSystem('all');
    }
  }, [location.search, user.systemAccess]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await firebaseService.getAllTickets();
      setTickets(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredByMonth = month === 'all' ? tickets : tickets.filter(t => String(t.month).trim() == month);
  const filtered = selectedSystem === 'all' ? filteredByMonth : filteredByMonth.filter(t => t.systemType === selectedSystem);
  
  const systemData = [
    { name: 'IT Support', value: filteredByMonth.filter(t => t.systemType === 'IT').length, color: '#2563eb' },
    { name: 'Maintenance', value: filteredByMonth.filter(t => t.systemType === 'MAINTENANCE').length, color: '#d97706' }
  ].filter(d => d.value > 0);

  const deptData = Array.from(new Set(filtered.map(t => t.department))).map(dept => ({
    name: dept || 'Unknown',
    count: filtered.filter(t => t.department === dept).length
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  const categoryData = Array.from(new Set(filtered.map(t => t.type))).map(type => ({
    name: type || 'Other',
    value: filtered.filter(t => t.type === type).length
  })).sort((a, b) => b.value - a.value);

  const stats = {
    total: filtered.length,
    pending: filtered.filter(t => t.status !== Status.CLOSED).length,
    completed: filtered.filter(t => t.status === Status.CLOSED).length,
    completionRate: filtered.length > 0 ? Math.round((filtered.filter(t => t.status === Status.CLOSED).length / filtered.length) * 100) : 0
  };

  const activeColor = selectedSystem === 'MAINTENANCE' ? SYSTEM_COLORS.MAINTENANCE : SYSTEM_COLORS.IT;

  return (
    <div className="space-y-10 relative z-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-tech font-bold text-slate-900 tracking-widest flex items-center gap-3 drop-shadow-sm">
            <Database className={activeColor.text} size={24} /> 
            {selectedSystem === 'IT' ? 'IT_DASHBOARD' : selectedSystem === 'MAINTENANCE' ? 'MAINT_DASHBOARD' : 'ANALYTICS_ENGINE'}
          </h1>
          <p className="text-slate-700 uppercase text-[10px] font-black tracking-[0.3em] mt-1 drop-shadow-sm">
            {selectedSystem === 'all' ? 'Unified System Traffic Monitor' : `Monitoring ${selectedSystem} Protocols`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          {/* System Switcher (Available only to those with BOTH or no specific access restricted) */}
          {(user.systemAccess === 'BOTH' || !user.systemAccess) && (
            <div className="flex p-1 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm">
               <button 
                onClick={() => setSelectedSystem('all')} 
                className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${selectedSystem === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-white/50'}`}
               >ALL</button>
               <button 
                onClick={() => setSelectedSystem('IT')} 
                className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${selectedSystem === 'IT' ? 'bg-blue-700 text-white shadow-md' : 'text-blue-700 hover:bg-white/50'}`}
               >IT</button>
               <button 
                onClick={() => setSelectedSystem('MAINTENANCE')} 
                className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${selectedSystem === 'MAINTENANCE' ? 'bg-amber-700 text-white shadow-md' : 'text-amber-700 hover:bg-white/50'}`}
               >MAINT</button>
            </div>
          )}

          <select className="pl-5 pr-10 py-3.5 glass-card rounded-2xl text-[11px] font-black text-slate-900 outline-none shadow-sm border-white/60 focus:border-blue-500" value={month} onChange={(e) => setMonth(e.target.value)}>
             <option value="all">ALL_PERIODS</option>
             {MONTH_NAMES.map((name, i) => (
               <option key={i + 1} value={(i + 1).toString()}>{name.toUpperCase()}</option>
             ))}
          </select>
          <button onClick={loadData} className="p-3.5 bg-white/70 border border-white/80 rounded-2xl text-blue-700 shadow-sm hover:bg-white active:scale-90 transition-all">
            <RefreshCw size={22} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
        <StatCard title="Requests" value={stats.total} icon={<Activity size={22} />} color="text-slate-700" bgColor="bg-slate-200" />
        <StatCard title="Active_Jobs" value={stats.pending} icon={<Clock size={22} />} color="text-indigo-700" bgColor="bg-indigo-600/15" />
        <StatCard title="Terminated" value={stats.completed} icon={<CheckCircle size={22} />} color="text-emerald-700" bgColor="bg-emerald-600/15" />
        <StatCard title="Efficiency" value={`${stats.completionRate}%`} icon={<TrendingUp size={22} />} color="text-purple-700" bgColor="bg-purple-600/15" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="glass-card p-8 md:p-10 rounded-[2.5rem] min-h-[480px] flex flex-col shadow-xl border-white/50 overflow-hidden">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-10 flex items-center gap-2 drop-shadow-sm flex-none">
            <span className={`w-2 h-2 ${selectedSystem === 'MAINTENANCE' ? 'bg-amber-600' : 'bg-blue-600'} rounded-full animate-pulse shadow-sm`}></span>
            {selectedSystem.toUpperCase()} Distribution by Department
          </h3>
          <div className="w-full flex-grow mt-auto min-h-[320px]">
            {isMounted && !loading && deptData.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis 
                    dataKey="name" 
                    tick={{fontSize: 9, fill: '#334155', fontWeight: '900', fontStyle: 'italic'}} 
                    interval={0} 
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#334155', fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(37, 99, 235, 0.08)'}}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #cbd5e1', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {deptData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {deptData.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertCircle size={40} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No data for selected period</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="glass-card p-8 md:p-10 rounded-[2.5rem] min-h-[480px] flex flex-col shadow-xl border-white/50 overflow-hidden">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-sm flex-none">
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-sm"></span>
            Incident Category Distribution
          </h3>
          <div className="w-full flex-grow mt-auto min-h-[320px]">
            {isMounted && !loading && categoryData.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={75}
                    outerRadius={115}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.9)" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #cbd5e1', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40}
                    formatter={(value) => <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {categoryData.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertCircle size={40} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No category data</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="glass-card p-8 md:p-10 rounded-[2.5rem] min-h-[480px] flex flex-col shadow-xl border-white/50 overflow-hidden">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-sm flex-none">
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse shadow-sm"></span>
            Global Protocol Allocation
          </h3>
          <div className="w-full flex-grow mt-auto min-h-[320px]">
            {isMounted && !loading && systemData.length > 0 && (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={systemData}
                    cx="50%"
                    cy="45%"
                    innerRadius={75}
                    outerRadius={115}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {systemData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.9)" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #cbd5e1', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40}
                    formatter={(value) => <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; bgColor: string }> = ({ title, value, icon, color, bgColor }) => (
  <div className="glass-card p-8 rounded-[2.5rem] flex flex-col items-center text-center group transition-all hover:scale-105 active:scale-95 shadow-lg border-white/60">
    <div className={`p-4 rounded-2xl ${bgColor} ${color} mb-5 group-hover:rotate-12 transition-transform shadow-sm`}>{icon}</div>
    <p className="text-[9.5px] font-black text-slate-700 uppercase tracking-widest mb-2 drop-shadow-sm">{title}</p>
    <h4 className="text-3xl font-tech font-bold text-slate-900 tracking-tighter drop-shadow-sm">{value}</h4>
  </div>
);

export default AdminDashboard;
