
import React, { useState, useRef } from 'react';
import { Ticket, User, Department, RequestType, Priority, SystemType } from '../types';
import { DEPARTMENTS, IT_REQUEST_TYPES, MT_REQUEST_TYPES, PRIORITIES, SYSTEM_COLORS, REQUEST_TYPE_LABELS } from '../constants';
import { firebaseService } from '../services/firebaseService';
import { ClipboardCheck, Camera, Send, Loader2, X, Image as ImageIcon, Settings, AlertTriangle, Zap, Laptop, Wrench } from 'lucide-react';

const UserPage: React.FC<{ user: User | null }> = ({ user }) => {
  const [formData, setFormData] = useState({
    systemType: 'IT' as SystemType,
    requesterName: user?.fullName || '',
    department: '' as Department,
    type: '' as RequestType,
    priority: 'Low' as Priority,
    detail: '',
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestTypes = formData.systemType === 'IT' ? IT_REQUEST_TYPES : MT_REQUEST_TYPES;
  const activeColor = SYSTEM_COLORS[formData.systemType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800; // Max dimension for base64 storage
          
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, imageUrl: compressed });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department || !formData.type) {
      alert('โปรดกรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await firebaseService.createTicket({ ...formData });
      setSuccess(true);
      setFormData({ 
        systemType: formData.systemType,
        requesterName: user?.fullName || '', 
        department: '' as Department, 
        type: '' as RequestType, 
        priority: 'Low', 
        detail: '', 
        imageUrl: '' 
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setSuccess(false), 5000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'การส่งข้อมูลขัดข้อง โปรดลองอีกครั้ง');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-12 flex items-baseline justify-center font-tech font-bold text-slate-900 tracking-tighter drop-shadow-sm">
        <span className="text-7xl md:text-9xl italic leading-none">T</span>
        <div className="p-1.5 mx-1 bg-pink-500/10 backdrop-blur-sm rounded-full border border-pink-500/20 shadow-inner">
          <Settings size={14} className="text-pink-500 gear-animate" />
        </div>
        <span className="text-7xl md:text-9xl italic leading-none">T</span>
        <div className="p-1.5 mx-1 bg-pink-400/10 backdrop-blur-sm rounded-full border border-pink-400/20 shadow-inner">
          <Settings size={14} className="text-pink-400 gear-animate-rev" />
        </div>
        <span className="text-7xl md:text-9xl lowercase italic leading-none">g</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => setFormData({...formData, systemType: 'IT', type: '' as RequestType})}
          className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 glass-card ${formData.systemType === 'IT' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50' : 'opacity-60 grayscale'}`}
        >
          <div className={`p-4 rounded-full ${formData.systemType === 'IT' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
            <Laptop size={28} />
          </div>
          <span className="font-tech font-bold text-xs tracking-widest uppercase">IT Support / ไอที</span>
        </button>
        <button 
          onClick={() => setFormData({...formData, systemType: 'MAINTENANCE', type: '' as RequestType})}
          className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 glass-card ${formData.systemType === 'MAINTENANCE' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50' : 'opacity-60 grayscale'}`}
        >
          <div className={`p-4 rounded-full ${formData.systemType === 'MAINTENANCE' ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>
            <Wrench size={28} />
          </div>
          <span className="font-tech font-bold text-xs tracking-widest uppercase">Maintenance / ช่างทั่วไป</span>
        </button>
      </div>

      {success && (
        <div className="mb-8 p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-800 shadow-sm animate-pulse">
          <ClipboardCheck className="text-emerald-600" />
          <span className="font-black uppercase tracking-tight text-[11px] drop-shadow-sm">Transmission Complete / ส่งข้อมูลแจ้งซ่อมเรียบร้อย</span>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-600/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-800 shadow-sm">
          <AlertTriangle className="text-red-600" />
          <div className="flex flex-col">
            <span className="font-black uppercase tracking-tight text-[11px] drop-shadow-sm">Transmission Failed / ส่งข้อมูลไม่สำเร็จ</span>
            <span className="text-[10px] font-bold opacity-80">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-200 rounded-full transition-colors"><X size={14} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 bg-${activeColor.primary}`}></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest ml-1 drop-shadow-sm`}>Operator Name / ชื่อผู้แจ้งซ่อม</label>
            <input type="text" required value={formData.requesterName} onChange={(e) => setFormData({...formData, requesterName: e.target.value})} className="w-full px-5 py-4 bg-white/70 border border-white/60 rounded-2xl outline-none focus:border-blue-500 text-slate-900 font-bold text-sm shadow-inner transition-all" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest ml-1 drop-shadow-sm`}>Division / แผนก</label>
            <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value as Department})} className="w-full px-5 py-4 bg-white/70 border border-white/60 rounded-2xl outline-none focus:border-blue-500 text-slate-900 font-bold text-sm shadow-inner transition-all">
              <option value="">Select Division / เลือกแผนก</option>
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest ml-1 drop-shadow-sm`}>Priority Level / ระดับความสำคัญ</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(PRIORITIES) as Priority[]).map(p => {
              const config = PRIORITIES[p];
              const isSelected = formData.priority === p;
              return (
                <button 
                  key={p} 
                  type="button" 
                  onClick={() => setFormData({...formData, priority: p})} 
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                    isSelected 
                    ? `border-white/50 scale-[1.05] shadow-xl text-white font-black ${p === 'High' ? 'bg-red-600' : p === 'Medium' ? 'bg-amber-600' : 'bg-slate-600'}` 
                    : 'bg-white/50 border-white/40 text-slate-600 opacity-80 hover:opacity-100 hover:bg-white/70'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest">{config.label}</span>
                  <span className={`text-[8px] mt-1 font-black opacity-90 ${isSelected ? 'text-white' : 'text-slate-500'}`}>{config.subLabel}</span>
                  {isSelected && <Zap size={10} className="mt-2 text-white animate-bounce" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest ml-1 drop-shadow-sm`}>Incident Category / หมวดหมู่ปัญหา</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {requestTypes.map(type => (
              <button key={type} type="button" onClick={() => setFormData({...formData, type})} className={`py-4 px-4 rounded-xl border text-[9px] font-black transition-all shadow-sm ${formData.type === type ? `bg-${activeColor.primary} border-${activeColor.primary} text-white shadow-lg` : 'bg-white/50 border-white/40 text-slate-600 hover:border-blue-400 hover:text-blue-700'}`}>
                {REQUEST_TYPE_LABELS[type].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest ml-1 drop-shadow-sm`}>Transmission Logs / รายละเอียดการแจ้งซ่อม</label>
          <textarea required rows={4} value={formData.detail} onChange={(e) => setFormData({...formData, detail: e.target.value})} className="w-full px-5 py-4 bg-white/70 border border-white/60 rounded-2xl outline-none focus:border-blue-500 text-slate-900 font-bold text-sm shadow-inner" placeholder="Describe the system issue / อธิบายปัญหาที่พบ..." />
        </div>

        <div className="space-y-2 relative z-10">
          <label className={`text-[10px] font-black ${activeColor.text} uppercase tracking-widest ml-1 drop-shadow-sm`}>Visual Evidence / รูปภาพประกอบ</label>
          <div className="mt-2">
            {!formData.imageUrl ? (
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-white/60 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer bg-white/40 hover:bg-white/60 transition-all group shadow-inner">
                <Camera size={26} className={`${activeColor.text} mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] text-slate-800 font-black uppercase tracking-widest drop-shadow-sm">Deploy Camera or Upload / ถ่ายรูปหรืออัปโหลด</span>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              </div>
            ) : (
              <div className="relative w-full h-64 rounded-[2.5rem] overflow-hidden border border-white/60 bg-white/80 p-2 shadow-2xl">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                <button type="button" onClick={removeImage} className="absolute top-4 right-4 p-2.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 active:scale-95 transition-all"><X size={18} /></button>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={submitting} className={`w-full py-5 bg-gradient-to-r from-${formData.systemType === 'IT' ? 'blue-700' : 'amber-700'} to-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 group`}>
          {submitting ? (
            <div className="flex items-center justify-center gap-3"><Loader2 className="animate-spin" size={18} /><span className="tracking-[0.2em] font-tech text-xs uppercase">Uploading / กำลังส่ง...</span></div>
          ) : (
            <div className="flex items-center justify-center gap-3"><span className="tracking-[0.2em] font-tech text-xs uppercase drop-shadow-sm">Broadcast Request / ยืนยันแจ้งซ่อม</span><Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></div>
          )}
        </button>
      </form>
    </div>
  );
};

export default UserPage;
