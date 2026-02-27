
import React, { useState, useEffect } from 'react';
import { Ticket, User, Status, SystemType } from '../types';
import { STATUS_LABELS, PRIORITIES, MONTH_NAMES, SYSTEM_COLORS, REQUEST_TYPE_LABELS } from '../constants';
import { firebaseService } from '../services/firebaseService';
import { Play, CheckCircle2, Clock, Trash2, MessageSquareText, Search, User as UserIcon, Calendar, Settings, ExternalLink, RefreshCw, Loader2, Filter, FileSpreadsheet, ChevronDown, ChevronUp, Info, LayoutList, AlertTriangle, Frown, Meh, Smile, Heart, MessageSquareQuote, Laptop, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const TicketList: React.FC<{ user: User }> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>((new Date().getMonth() + 1).toString());
  // Default system filter based on user access
  const [systemFilter, setSystemFilter] = useState<string>(() => {
    if (user.systemAccess === 'BOTH' || !user.systemAccess) return 'all';
    return user.systemAccess;
  });
  const [fixDetailInput, setFixDetailInput] = useState<{ [key: string]: string }>({});
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  const loadTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await firebaseService.getAllTickets();
      if (data) {
        setTickets(data);
        const autoExpand = new Set<string>();
        data.forEach(t => { if (t.status !== Status.CLOSED) autoExpand.add(t.ticketId); });
        setExpandedTickets(autoExpand);
      }
    } catch (err: any) { 
      console.error("Load failed:", err);
      if (!silent) alert("ไม่สามารถโหลดข้อมูลได้: " + (err.message || "Unknown error"));
    } finally { 
      if (!silent) setLoading(false); 
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => loadTickets(true), 45000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (ticketId: string) => {
    const newSet = new Set(expandedTickets);
    if (newSet.has(ticketId)) newSet.delete(ticketId);
    else newSet.add(ticketId);
    setExpandedTickets(newSet);
  };

  const getRatingComponent = (rating?: string) => {
    const r = rating?.trim();
    if (r === 'Poor') return { icon: <Frown size={14} />, label: 'Poor / แย่', color: 'text-red-700', bgColor: 'bg-red-600/10 border-red-500/30' };
    if (r === 'Fair') return { icon: <Meh size={14} />, label: 'Fair / ปานกลาง', color: 'text-amber-700', bgColor: 'bg-amber-600/10 border-amber-500/30' };
    if (r === 'Good') return { icon: <Smile size={14} />, label: 'Good / ดี', color: 'text-blue-700', bgColor: 'bg-blue-600/10 border-blue-500/30' };
    if (r === 'Excellent') return { icon: <Heart size={14} />, label: 'Excellent / ดีมาก', color: 'text-emerald-700', bgColor: 'bg-emerald-600/10 border-emerald-500/30' };
    return null;
  };

  const exportLogs = () => {
    const headers = ['Ticket ID', 'System', 'Status', 'Priority', 'Dept', 'Type', 'Requester', 'Specialist', 'Start', 'End', 'Issue', 'Fix Log', 'Rating', 'Feedback'];
    const dataRows = filtered.map(t => [
      t.ticketId, 
      t.systemType,
      t.status, 
      t.priority, 
      t.department, 
      t.type, 
      t.requesterName, 
      t.technician || '-', 
      t.startDate, 
      t.closeDate || '-', 
      t.detail, 
      t.fixDetail, 
      t.rating || '-', 
      t.feedback || '-'
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Logs");
    const fileName = `report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleAccept = async (ticket: Ticket) => {
    setActionLoading(ticket.ticketId);
    try {
      const techName = user.fullName || user.username || 'Technician';
      await firebaseService.updateTicket(ticket.ticketId, { status: Status.IN_PROGRESS, technician: techName }, user);
      await loadTickets(true);
    } catch (e: any) { alert(e.message); } finally { setActionLoading(null); }
  };

  const handleWaitConfirm = async (ticket: Ticket) => {
    const fixDetail = fixDetailInput[ticket.ticketId];
    if (!fixDetail) return alert('โปรดกรอกรายละเอียดการซ่อม');
    
    setActionLoading(ticket.ticketId);
    try {
      await firebaseService.updateTicket(ticket.ticketId, { 
        status: Status.WAITING_CONFIRMATION, 
        fixDetail,
        technician: ticket.technician || user.fullName 
      }, user);
      await loadTickets(true);
    } catch (e: any) { alert(e.message); } finally { setActionLoading(null); }
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('Confirm deletion? / ยืนยันการลบข้อมูลถาวร?')) return;
    
    setActionLoading(ticketId);
    try {
      console.log("Attempting to delete ticket:", ticketId);
      await firebaseService.deleteTicket(ticketId);
      
      // Optimistic update
      setTickets(prev => prev.filter(t => t.ticketId !== ticketId));
      
      alert('Delete successful / ลบข้อมูลเรียบร้อยแล้ว');
      await loadTickets(true);
    } catch (e: any) {
      console.error("Delete error:", e);
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = tickets.filter(t => {
    const matchesMonth = monthFilter === 'all' || String(t.month).trim() == monthFilter;
    const matchesSystem = systemFilter === 'all' || t.systemType === systemFilter;
    const matchesSearch = t.requesterName.toLowerCase().includes(search.toLowerCase()) || 
                         t.ticketId.toLowerCase().includes(search.toLowerCase()) || 
                         (t.department && t.department.toLowerCase().includes(search.toLowerCase()));
    return matchesMonth && matchesSystem && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-2 md:px-0">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-tech font-bold text-slate-900 tracking-widest flex items-center gap-3 drop-shadow-sm">
              CORE_CENTRAL / ศูนย์ควบคุม
              <button onClick={() => loadTickets()} className={`p-2 rounded-xl bg-white/60 border border-white/80 text-blue-600 shadow-sm ${loading ? 'animate-spin' : ''}`}><RefreshCw size={16} /></button>
            </h1>
            <p className="text-slate-700 uppercase text-[10px] font-black tracking-[0.3em] mt-1 drop-shadow-sm">System Traffic Monitor / ติดตามการแจ้งงาน</p>
          </div>
          <button onClick={exportLogs} className="flex items-center gap-2 bg-emerald-700/10 hover:bg-emerald-700 text-emerald-800 hover:text-white px-5 py-3 rounded-2xl text-[10px] font-black border border-emerald-500/30 uppercase tracking-widest transition-all shadow-sm">
            <FileSpreadsheet size={14} /> Export / ส่งออก
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-grow shadow-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" />
            <input type="text" placeholder="Filter UID, Name, Dept / ค้นหา..." className="w-full pl-12 pr-4 py-4 bg-white/60 border border-white/80 rounded-2xl outline-none focus:border-blue-500 text-xs text-slate-900 font-bold placeholder-slate-500" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-4">
            <select className="px-4 py-4 bg-white/60 border border-white/80 rounded-2xl text-[10px] font-black text-slate-900 outline-none focus:border-blue-500 min-w-[140px] shadow-sm" value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)}>
               <option value="all">ALL_SYSTEMS</option>
               <option value="IT">IT_PROTOCOL</option>
               <option value="MAINTENANCE">MAINT_PROTOCOL</option>
            </select>
            <select className="px-4 py-4 bg-white/60 border border-white/80 rounded-2xl text-[10px] font-black text-slate-900 outline-none focus:border-blue-500 min-w-[140px] shadow-sm" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
               <option value="all">ALL_PERIODS</option>
               {MONTH_NAMES.map((name, i) => (
                 <option key={i + 1} value={(i + 1).toString()} className="bg-white">{name.toUpperCase()}</option>
               ))}
            </select>
          </div>
        </div>
      </div>

      {loading && tickets.length === 0 ? (
        <div className="flex flex-col items-center py-24 space-y-4"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="text-blue-700 font-tech tracking-widest text-[11px] font-black animate-pulse drop-shadow-sm">SYNCING_DATA_CORE...</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ticket => {
            const isExpanded = expandedTickets.has(ticket.ticketId);
            const isActing = actionLoading === ticket.ticketId;
            const priorityConfig = PRIORITIES[ticket.priority] || PRIORITIES['Low'];
            const activeColor = SYSTEM_COLORS[ticket.systemType];

            return (
              <div key={ticket.ticketId} className={`glass-card rounded-2xl md:rounded-[2.5rem] border transition-all duration-300 overflow-hidden flex flex-col shadow-lg ${isExpanded ? `border-${activeColor.primary}/40 shadow-${activeColor.primary}/10` : 'border-white/60 hover:border-slate-300'} ${ticket.systemType === 'IT' ? 'bg-blue-50/30' : 'bg-amber-50/30'}`}>
                <div className={`p-4 md:p-6 cursor-pointer select-none flex items-center justify-between ${isExpanded ? `bg-${activeColor.primary}/10` : ''}`} onClick={() => toggleExpand(ticket.ticketId)}>
                  <div className="flex items-center gap-4 overflow-hidden flex-grow">
                    <div className="flex flex-col gap-1.5 min-w-[105px]">
                      <span className={`px-3 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest text-center shadow-sm ${STATUS_LABELS[ticket.status].color}`}>{STATUS_LABELS[ticket.status].label}</span>
                      <div className="flex items-center gap-1">
                        {ticket.systemType === 'IT' ? <Laptop size={10} className="text-blue-600" /> : <Wrench size={10} className="text-amber-600" />}
                        <span className={`text-[8px] font-black ${activeColor.text}`}>{ticket.systemType}</span>
                      </div>
                    </div>
                    <div className="truncate">
                      <h3 className="text-xs md:text-sm font-tech font-bold text-slate-900 uppercase truncate drop-shadow-sm">
                        {REQUEST_TYPE_LABELS[ticket.type]}: {ticket.detail}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[9.5px] text-slate-700 font-black tracking-widest uppercase opacity-90">ID: {ticket.ticketId} | {ticket.requesterName}</p>
                        <span className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase shadow-sm ${priorityConfig.bgColor} ${priorityConfig.color} border border-white/40`}>{priorityConfig.label.split('/')[1]}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl transition-all shadow-sm ${isExpanded ? `bg-${activeColor.primary} text-white` : 'bg-white/80 text-slate-600'}`}>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </div>

                <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="px-4 md:px-8 pb-10 pt-2 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-8 border-t border-slate-200">
                      <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-3">
                          <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest drop-shadow-sm`}>Payload_Summary / รายละเอียดการแจ้ง</label>
                          <div className="p-6 bg-white/70 rounded-[2rem] border border-white/60 text-slate-900 text-sm font-bold whitespace-pre-wrap leading-relaxed shadow-inner drop-shadow-sm">{ticket.detail}</div>
                        </div>
                        {ticket.imageUrl && (
                          <div className="space-y-3">
                            <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest drop-shadow-sm`}>Visual_Evidence / รูปภาพประกอบ</label>
                            <div className="p-3 bg-white/50 rounded-[2rem] border border-white shadow-xl">
                               <img src={ticket.imageUrl} alt="Evidence" className="w-full max-h-[400px] object-contain rounded-2xl" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-5 space-y-8">
                        <div className="p-8 bg-white/60 rounded-[2rem] border border-white/60 space-y-6 text-[10px] shadow-sm">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest drop-shadow-sm">Protocol_Metadata / ข้อมูลระบบ</label>
                          <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-700 font-bold">System_Domain / ฝ่ายช่าง</span><span className={`font-black uppercase ${activeColor.text}`}>{ticket.systemType}</span></div>
                            <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-700 font-bold">Priority / ความด่วน</span><span className={`${priorityConfig.color} font-black uppercase drop-shadow-sm`}>{priorityConfig.label}</span></div>
                            <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-700 font-bold">Initialized / วันที่แจ้ง</span><span className="text-slate-900 font-black font-mono">{ticket.startDate}</span></div>
                            <div className="flex justify-between border-b border-slate-200 pb-3"><span className="text-slate-700 font-bold">Agent / เจ้าหน้าที่</span><span className="text-slate-900 font-black uppercase">{ticket.technician || 'AWAITING...'}</span></div>
                          </div>
                        </div>

                        {ticket.fixDetail && (
                          <div className="p-8 bg-emerald-600/5 rounded-[2rem] border border-emerald-500/30 space-y-3 shadow-lg">
                            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm"><MessageSquareText size={12} /> Resolution_Log / บันทึกการซ่อม</label>
                            <p className="text-xs text-emerald-900 font-bold italic leading-relaxed">"{ticket.fixDetail}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200">
                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                          {ticket.status === Status.NEW && (user.role !== 'USER') && (user.systemAccess === 'BOTH' || user.systemAccess === ticket.systemType || !user.systemAccess) && (
                            <button onClick={(e) => { e.stopPropagation(); handleAccept(ticket); }} disabled={isActing} className={`flex items-center gap-2 bg-${activeColor.primary} hover:opacity-90 text-white px-10 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all`}>
                              {isActing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                              Initialize Protocol / เริ่มงาน
                            </button>
                          )}
                          {ticket.status === Status.IN_PROGRESS && (user.role !== 'USER') && (user.systemAccess === 'BOTH' || user.systemAccess === ticket.systemType || !user.systemAccess) && (
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                              <input type="text" placeholder="Resolution logs / บันทึกผลการซ่อม..." className="px-6 py-4.5 bg-white/80 border border-white/60 rounded-2xl text-[11px] text-slate-900 font-bold outline-none focus:border-blue-500 min-w-[300px] shadow-inner" value={fixDetailInput[ticket.ticketId] || ''} onChange={(e) => setFixDetailInput({...fixDetailInput, [ticket.ticketId]: e.target.value})} onClick={(e) => e.stopPropagation()} />
                              <button onClick={(e) => { e.stopPropagation(); handleWaitConfirm(ticket); }} disabled={isActing} className="flex items-center justify-center gap-2 bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-10 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all">
                                {isActing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                Commit Resolution / บันทึกงาน
                              </button>
                            </div>
                          )}
                          {ticket.status === Status.CLOSED && (
                            <div className="flex items-center gap-3 text-emerald-800 font-black text-[10px] uppercase tracking-[0.2em] bg-emerald-600/10 px-8 py-4 rounded-2xl border border-emerald-500/40 shadow-sm">
                              <CheckCircle2 size={16} /> ARCHIVE_SUCCESS / งานเสร็จสมบูรณ์
                            </div>
                          )}
                        </div>
                        {(user.role === 'ADMIN' || user.role === 'TECHNICIAN') && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">System_Delete / ลบรายการ</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(ticket.ticketId); }} 
                              disabled={isActing}
                              title="Delete Ticket"
                              className="p-4 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-2xl transition-all active:scale-90 disabled:opacity-30 shadow-sm border border-red-100"
                            >
                              {isActing ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            </button>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketList;
