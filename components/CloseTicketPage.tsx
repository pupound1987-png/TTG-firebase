
import React, { useState, useEffect } from 'react';
import { Ticket, User, Status } from '../types';
import { firebaseService } from '../services/firebaseService';
import { CheckCircle2, Search, UserCheck, MessageSquareText, ShieldCheck, AlertCircle, Settings, ArrowRight, Hash, Frown, Meh, Smile, Heart } from 'lucide-react';

const CloseTicketPage: React.FC<{ user: User | null }> = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [closingId, setClosingId] = useState<string | null>(null);
  
  const [reviews, setReviews] = useState<{[key: string]: {rating: string, feedback: string}}>({});

  const findMyTickets = async () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) { 
      setError('Identify yourself / โปรดระบุชื่อหรือไอดี'); 
      return; 
    }
    
    setLoading(true); 
    setError('');
    
    try {
      const allTickets = await firebaseService.getAllTickets();
      
      const userTickets = allTickets.filter(t => {
        const normalizedName = String(t.requesterName || '').toLowerCase().trim();
        const normalizedId = String(t.ticketId || '').toLowerCase().trim();
        
        return normalizedName.includes(query) || normalizedId.includes(query);
      });

      if (userTickets.length === 0) {
        setError('No record found / ไม่พบข้อมูล');
        setTickets([]);
        setLoading(false);
        return;
      }

      const myPending = userTickets.filter(t => t.status === Status.WAITING_CONFIRMATION);

      if (myPending.length === 0) {
        const currentStatus = userTickets[0].status;
        setError(`Found your record, but current status is: ${currentStatus} / พบข้อมูลแล้ว แต่สถานะปัจจุบันคือ ${currentStatus}`);
        setTickets([]);
      } else {
        setTickets(myPending);
        
        const initialReviews = { ...reviews };
        myPending.forEach(t => {
          if (!initialReviews[t.ticketId]) {
            initialReviews[t.ticketId] = { rating: 'Good', feedback: '' };
          }
        });
        setReviews(initialReviews);
      }
    } catch (err) { 
      setError('Database Failure / การเชื่อมต่อล้มเหลว'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleConfirmClose = async (ticketId: string) => {
    const review = reviews[ticketId] || { rating: 'Good', feedback: '' };
    const originalTicket = tickets.find(t => t.ticketId === ticketId);
    
    setClosingId(ticketId);
    try {
      const currentUser: User = user || { username: 'Guest', role: 'USER', fullName: searchQuery.trim() };
      
      await firebaseService.updateTicket(ticketId, { 
        status: Status.CLOSED,
        rating: review.rating,
        feedback: review.feedback,
        requesterName: originalTicket?.requesterName, 
        fixDetail: originalTicket?.fixDetail,
        technician: originalTicket?.technician
      }, currentUser);
      
      setTickets(prev => prev.filter(t => t.ticketId !== ticketId));
      alert('Job Successfully Terminated / ปิดงานสำเร็จเรียบร้อย');
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setClosingId(null); 
    }
  };

  const updateReview = (ticketId: string, field: 'rating' | 'feedback', value: string) => {
    setReviews(prev => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        [field]: value
      }
    }));
  };

  const RATING_OPTIONS = [
    { value: 'Poor', labelTh: 'แย่', labelEn: 'Poor', icon: <Frown size={20} />, color: 'text-red-700', activeBg: 'bg-red-700 border-red-500 shadow-red-900/20' },
    { value: 'Fair', labelTh: 'ปานกลาง', labelEn: 'Fair', icon: <Meh size={20} />, color: 'text-amber-700', activeBg: 'bg-amber-700 border-amber-500 shadow-amber-900/20' },
    { value: 'Good', labelTh: 'ดี', labelEn: 'Good', icon: <Smile size={20} />, color: 'text-blue-700', activeBg: 'bg-blue-800 border-blue-600 shadow-blue-900/20' },
    { value: 'Excellent', labelTh: 'ดีมาก', labelEn: 'Excellent', icon: <Heart size={20} />, color: 'text-emerald-700', activeBg: 'bg-emerald-800 border-emerald-600 shadow-emerald-900/20' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-10 px-2 md:px-0 relative z-10">
      <div className="text-center space-y-4 mb-14">
        <div className="animate-shield drop-shadow-lg">
          <ShieldCheck size={64} className="text-emerald-600 mx-auto" />
        </div>
        <h1 className="text-2xl md:text-4xl font-tech font-bold text-slate-900 tracking-widest uppercase mt-5 drop-shadow-sm">JOB_CONFIRMATION / ยืนยันการปิดงาน</h1>
        <p className="text-slate-700 uppercase text-[10px] font-black tracking-[0.4em] drop-shadow-sm">Final service verification protocol / โปรโตคอลตรวจสอบงานบริการขั้นสุดท้าย</p>
      </div>

      <div className="glass-card p-8 md:p-10 rounded-[2.5rem] shadow-2xl border-white/50">
        <div className="flex flex-col md:flex-row gap-5 items-end">
          <div className="flex-grow space-y-3 w-full">
            <label className="text-[11px] font-black text-blue-800 uppercase tracking-widest ml-1 drop-shadow-sm">
              Identity Verification / ยืนยันตัวตน (ชื่อหรือรหัสแจ้งซ่อม)
            </label>
            <div className="relative shadow-sm">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-700" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && findMyTickets()}
                placeholder="Name or TCI-XXXXXX..." 
                className="w-full pl-14 pr-6 py-5 bg-white/70 border border-white/60 rounded-2xl outline-none focus:border-blue-500 text-sm text-slate-900 font-black font-mono shadow-inner transition-all" 
              />
            </div>
          </div>
          <button 
            onClick={findMyTickets} 
            disabled={loading} 
            className="w-full md:w-auto px-10 py-5 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/30"
          >
            {loading ? <Settings className="animate-spin" size={18} /> : <ArrowRight size={18} />} 
            Scan Records / ค้นหาข้อมูล
          </button>
        </div>
        {error && (
          <div className="mt-5 p-5 bg-amber-600/10 border border-amber-500/30 rounded-2xl text-amber-800 text-[11px] font-black shadow-sm">
            <AlertCircle size={16} className="inline mr-2" /> [LOG]: {error}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {tickets.map(ticket => (
          <div key={ticket.ticketId} className="glass-card p-8 md:p-10 rounded-[3rem] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 shadow-2xl border-white/60">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] text-blue-800 font-black uppercase tracking-widest drop-shadow-sm">Job ID Reference / รหัสอ้างอิง</span>
                <h3 className="text-2xl font-tech font-bold text-slate-900 mt-2 drop-shadow-sm">#{ticket.ticketId}</h3>
              </div>
              <p className="text-[10px] text-slate-700 font-black font-mono text-right opacity-90">INIT / วันที่แจ้ง: {ticket.startDate}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
               <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-200 text-sm shadow-sm">
                 <p className="text-blue-800 font-black uppercase tracking-widest text-[10px] mb-3 drop-shadow-sm">Original Request / ข้อมูลแจ้งซ่อมเดิม</p>
                 <p className="text-slate-800 font-bold italic leading-relaxed">"{ticket.detail}"</p>
               </div>
               <div className="p-6 bg-emerald-600/5 rounded-3xl border border-emerald-200 text-sm shadow-sm">
                 <p className="text-emerald-800 font-black uppercase tracking-widest text-[10px] mb-3 drop-shadow-sm">Technician Report / รายงานจากช่าง ({ticket.technician})</p>
                 <p className="text-emerald-950 font-black italic leading-relaxed">"{ticket.fixDetail}"</p>
               </div>
            </div>

            <div className="space-y-5 pt-8 border-t border-slate-200">
              <label className="text-[11px] font-black text-blue-800 uppercase tracking-widest block ml-1 drop-shadow-sm">
                Satisfaction Metrics / เกณฑ์ความพึงพอใจการบริการ
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {RATING_OPTIONS.map(opt => {
                  const isActive = reviews[ticket.ticketId]?.rating === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => updateReview(ticket.ticketId, 'rating', opt.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all gap-3 shadow-sm ${
                        isActive 
                        ? `${opt.activeBg} text-white font-black shadow-xl scale-[1.05]` 
                        : `bg-white/60 border-white/80 text-slate-600 hover:bg-white hover:border-blue-300`
                      }`}
                    >
                      <span className={isActive ? 'text-white' : opt.color}>{opt.icon}</span>
                      <p className="text-[10px] font-black uppercase tracking-tighter">{opt.labelEn} / {opt.labelTh}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-blue-800 uppercase tracking-widest block ml-1 drop-shadow-sm">
                Additional Feedback / ข้อเสนอแนะเพิ่มเติม
              </label>
              <textarea
                value={reviews[ticket.ticketId]?.feedback || ''}
                onChange={(e) => updateReview(ticket.ticketId, 'feedback', e.target.value)}
                rows={3}
                placeholder="Additional feedback (Optional)... / ข้อเสนอแนะเพิ่มเติม (ถ้ามี)..."
                className="w-full px-5 py-4 bg-white/70 border border-white/80 rounded-2xl outline-none focus:border-blue-500 text-sm text-slate-900 font-bold placeholder-slate-400 shadow-inner"
              />
            </div>
            
            <button 
              onClick={() => handleConfirmClose(ticket.ticketId)} 
              disabled={closingId === ticket.ticketId} 
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-500/30 transition-all active:scale-95 uppercase tracking-widest text-[11px] mt-4 flex items-center justify-center gap-3"
            >
              {closingId === ticket.ticketId ? (
                <Settings className="animate-spin" size={20} />
              ) : (
                <><CheckCircle2 size={20} /> Finalize and Archive / ยืนยันและบันทึกข้อมูล</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CloseTicketPage;
