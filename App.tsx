
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, Status } from './types';
import LoginForm from './components/LoginForm';
import UserPage from './components/UserPage';
import AdminDashboard from './components/AdminDashboard';
import TicketList from './components/TicketList';
import CloseTicketPage from './components/CloseTicketPage';
import { Wrench, LayoutDashboard, ListTodo, LogOut, PlusCircle, LogIn, User as UserIcon, Settings, CheckSquare, BarChart3, Menu, X, Shield, Activity, Construction } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tci_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('tci_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tci_user');
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col text-slate-900">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12 relative z-10">
          <Routes>
            <Route path="/login" element={!user ? <LoginForm onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/" element={<UserPage user={user} />} />
            <Route path="/close-job" element={<CloseTicketPage user={user} />} />
            <Route path="/admin" element={user ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/tickets" element={user ? <TicketList user={user} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="bg-white/40 backdrop-blur-md border-t border-white/50 py-6 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.5em] font-mono drop-shadow-sm">
          TCITRENDGROUP
        </footer>
      </div>
    </HashRouter>
  );
};

const Navbar: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setIsOpen(false); }, [location]);
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  return (
    <>
      <nav className="glass-nav sticky top-0 z-[100] h-[72px] flex items-center">
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <button onClick={() => setIsOpen(true)} className="lg:hidden p-2.5 bg-white/60 rounded-xl border border-white text-blue-600 shadow-sm">
            <Menu size={22} />
          </button>

          <Link to="/" className="flex items-center gap-1 group">
            <div className="flex items-baseline font-tech font-bold text-slate-900 drop-shadow-sm tracking-tighter">
              <span className="text-3xl md:text-5xl italic leading-none">T</span>
              <div className="p-0.5 mx-0.5 bg-pink-500/10 backdrop-blur-sm rounded-full border border-pink-500/20 shadow-inner">
                <Settings size={8} className="text-pink-500 gear-animate" />
              </div>
              <span className="text-3xl md:text-5xl italic leading-none">T</span>
              <div className="p-0.5 mx-0.5 bg-pink-400/10 backdrop-blur-sm rounded-full border border-pink-400/20 shadow-inner">
                <Settings size={8} className="text-pink-400 gear-animate-rev" />
              </div>
              <span className="text-3xl md:text-5xl lowercase italic leading-none">g</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <NavLink to="/" icon={<PlusCircle size={17} />} label="Request / แจ้งซ่อม" />
            <NavLink to="/close-job" icon={<CheckSquare size={17} />} label="Close Job / ปิดงาน" />
            {user && (
              <>
                <NavLink to="/tickets" icon={<ListTodo size={17} />} label="Service Logs / ประวัติ" />
                {(user.systemAccess === 'BOTH' || user.systemAccess === 'IT' || !user.systemAccess) && (
                  <NavLink to="/admin?system=IT" icon={<BarChart3 size={17} />} label="IT Analytics" />
                )}
                {(user.systemAccess === 'BOTH' || user.systemAccess === 'MAINTENANCE' || !user.systemAccess) && (
                  <NavLink to="/admin?system=MAINTENANCE" icon={<BarChart3 size={17} />} label="MAIT Analytics" />
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{user.fullName}</p>
                  <p className={`text-[8px] ${user.systemAccess === 'MAINTENANCE' ? 'text-amber-700' : 'text-blue-700'} font-mono font-bold tracking-tighter`}>ID: {user.username}</p>
                </div>
                <button onClick={onLogout} className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/30">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black border border-blue-500 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20">
                Login / เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Side Drawer */}
      <div className={`fixed inset-0 z-[200] lg:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsOpen(false)} />
        <div className={`absolute top-0 left-0 h-full w-[300px] bg-white/95 backdrop-blur-2xl border-r border-white/40 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-blue-600" />
              <span className="font-tech font-bold text-slate-900 text-xs tracking-widest uppercase">System Menu</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-600 hover:text-slate-900"><X size={20} /></button>
          </div>

          <div className="flex-grow p-4 space-y-2 overflow-y-auto">
            {user && (
              <div className={`p-4 mb-4 ${user.systemAccess === 'MAINTENANCE' ? 'bg-amber-600/5 border-amber-500/20' : 'bg-blue-600/5 border-blue-500/20'} border rounded-2xl`}>
                 <p className={`text-[9px] font-black ${user.systemAccess === 'MAINTENANCE' ? 'text-amber-700' : 'text-blue-700'} uppercase tracking-widest mb-1`}>Operator</p>
                 <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                 <p className="text-[8px] text-slate-600 font-mono font-bold mt-1">ROLE: {user.role}</p>
              </div>
            )}
            <MobileNavLink to="/" icon={<PlusCircle size={18} />} label="Request Service" active={location.pathname === '/'} />
            <MobileNavLink to="/close-job" icon={<CheckSquare size={18} />} label="Close Service Job" active={location.pathname === '/close-job'} />
            {user && (
              <>
                <div className="pt-4 pb-2 px-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Management</p>
                </div>
                <MobileNavLink to="/tickets" icon={<ListTodo size={18} />} label="Service Logs" active={location.pathname === '/tickets'} />
                {(user.systemAccess === 'BOTH' || user.systemAccess === 'IT' || !user.systemAccess) && (
                  <MobileNavLink to="/admin?system=IT" icon={<BarChart3 size={18} />} label="IT Analytics" active={location.pathname === '/admin' && new URLSearchParams(location.search).get('system') === 'IT'} />
                )}
                {(user.systemAccess === 'BOTH' || user.systemAccess === 'MAINTENANCE' || !user.systemAccess) && (
                  <MobileNavLink to="/admin?system=MAINTENANCE" icon={<BarChart3 size={18} />} label="MAIT Analytics" active={location.pathname === '/admin' && new URLSearchParams(location.search).get('system') === 'MAINTENANCE'} />
                )}
              </>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 text-center">
            {user ? (
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 text-red-600 border border-red-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
                <LogOut size={16} /> Disconnect
              </button>
            ) : (
              <Link to="/login" className="w-full flex items-center justify-center gap-3 p-4 bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                <LogIn size={16} /> Secure Access
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <Link to={to} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all drop-shadow-sm">
    {icon} <span>{label}</span>
  </Link>
);

const MobileNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active?: boolean }> = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${active ? 'bg-blue-700 border-blue-500 text-white shadow-lg' : 'bg-white/60 border-white text-slate-700 hover:bg-white'}`}>
    <span className={active ? 'text-white' : 'text-blue-600'}>{icon}</span>
    <span className="font-tech text-[10px] font-bold tracking-widest uppercase">{label}</span>
  </Link>
);

export default App;
