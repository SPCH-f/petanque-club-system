import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Calendar, MapPin, Search, PlusCircle, 
  Settings, LogOut, Bell, User as UserIcon, Activity, Menu, X, Users, FileText, CircleDot, History, FileCheck, Lock, Shield
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import clubLogo from '../assets/logo ชมรมเปตอง.png';
import { getImageUrl } from '../utils/image';

const SidebarItem = ({ to, icon: Icon, label, exact = false, isExpanded, locked = false }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) => `sidebar-link flex items-center ${isExpanded ? 'px-4' : 'px-0 justify-center'} py-3 mx-2 my-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/20 shadow-lg text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}
    title={!isExpanded ? label : ''}
  >
    <Icon size={22} className="min-w-[22px]" />
    <span className={`flex items-center justify-between whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0 ml-0'}`}>
      <span>{label}</span>
      {locked && <Lock size={14} className="opacity-40" />}
    </span>
  </NavLink>
);

const MainLayout = () => {
  const { user, logout, adminAsUser, toggleAdminMode } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // For mobile toggling
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // For desktop hover expanding
  const [isHovered, setIsHovered] = useState(false);
  // For notification dropdown
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  // For all notifications modal
  const [isAllNotifModalOpen, setIsAllNotifModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isExpanded = isHovered || isMobileOpen;

  // Fetch Notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
    refetchInterval: 10000, 
    enabled: !!user
  });

  // Mark Read Mutations
  const markRead = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const notifications = notificationsData || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Track the last notification ID to show toast only once
  const [lastNotifId, setLastNotifId] = React.useState(null);

  React.useEffect(() => {
    if (notifications.length > 0) {
      const newest = notifications[0];
      if (lastNotifId && newest.id !== lastNotifId && !newest.is_read) {
        // Show toast for admin requests
        if (user?.role === 'admin' && (newest.type === 'admin_loan_request' || newest.type === 'admin_booking_request' || newest.type === 'admin_new_comment')) {
          toast.success(newest.message, {
            duration: 5000,
            icon: '🔔',
            position: 'top-right'
          });
        }
      }
      setLastNotifId(newest.id);
    }
  }, [notifications, lastNotifId, user]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] relative">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`sidebar fixed top-0 left-0 h-full z-50 transition-all duration-500 ease-in-out flex flex-col shadow-2xl
          ${isExpanded ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
        `}
      >
        <div className={`p-4 mb-2 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} min-h-[80px]`}>
          <div className="flex items-center gap-3 text-white overflow-hidden">
            <div className="w-12 h-12 min-w-[48px] rounded-full bg-white flex items-center justify-center shadow-inner overflow-hidden">
              <img src={clubLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              <h1 className="font-bold text-lg leading-tight tracking-wide">Petanque Club</h1>
              <p className="text-blue-200 text-[10px] font-medium leading-tight">Ubon Ratchathani University</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
          {user?.role === 'admin' && !adminAsUser ? (
            <>
              <div className={`transition-all duration-300 mb-2 mt-4 text-xs font-bold text-blue-300 uppercase tracking-wider ${isExpanded ? 'px-6 opacity-100' : 'px-0 text-center opacity-0 h-0 overflow-hidden'}`}>
                Admin Menu
              </div>
              <SidebarItem to="/admin" icon={Settings} label="Dashboard" exact={true} isExpanded={isExpanded} />
              <SidebarItem to="/admin/fields" icon={MapPin} label="จัดการสนามเปตอง" isExpanded={isExpanded} />
              <SidebarItem to="/admin/balls" icon={CircleDot} label="จัดการคลังอุปกรณ์" isExpanded={isExpanded} />
              <SidebarItem to="/admin/posts" icon={Activity} label="จัดการข่าวสาร" isExpanded={isExpanded} />
              <SidebarItem to="/admin/bookings" icon={Calendar} label="จัดการการจอง" isExpanded={isExpanded} />
              <SidebarItem to="/admin/users" icon={UserIcon} label="จัดการรายชื่อผู้ใช้" isExpanded={isExpanded} />
              <SidebarItem to="/admin/committee" icon={Users} label="จัดการคณะกรรมการ" isExpanded={isExpanded} />
              <SidebarItem to="/admin/documents" icon={FileText} label="จัดการเอกสารคำร้อง" isExpanded={isExpanded} />
              <SidebarItem to="/admin/approvals" icon={FileCheck} label="รายการอนุมัติเอกสาร" isExpanded={isExpanded} />

              <div className={`transition-all duration-300 mb-2 mt-6 text-[10px] font-black text-blue-300/80 uppercase tracking-widest ${isExpanded ? 'px-6 opacity-100' : 'px-0 text-center opacity-0 h-0 overflow-hidden'}`}>
                โหมดใช้งาน
              </div>
              <button 
                onClick={() => {
                  toggleAdminMode(true);
                  navigate('/');
                }}
                className={`sidebar-link flex items-center ${isExpanded ? 'px-4' : 'px-0 justify-center'} py-3 mx-2 my-1 rounded-xl transition-all duration-300 text-blue-200 hover:bg-blue-500/20 hover:text-white w-[calc(100%-1rem)]`}
                title={!isExpanded ? "สลับไปโหมดผู้ใช้ทั่วไป" : ""}
              >
                <UserIcon size={22} className="min-w-[22px]" />
                <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-auto' : 'opacity-0 w-0 ml-0'}`}>
                  สลับเป็นผู้ใช้ทั่วไป
                </span>
              </button>
             </>
          ) : (
            <>
              <div className={`transition-all duration-300 mb-2 mt-4 text-xs font-bold text-blue-300 uppercase tracking-wider ${isExpanded ? 'px-6 opacity-100' : 'px-0 text-center opacity-0 h-0 overflow-hidden'}`}>
                Main Menu
              </div>
              <SidebarItem to="/" icon={Home} label="หน้าแรก (News Feed)" exact={true} isExpanded={isExpanded} />
              <SidebarItem to="/committee" icon={Users} label="ทำเนียบกรรมการ" isExpanded={isExpanded} />

              <div className={`transition-all duration-300 mb-2 mt-6 text-[10px] font-black text-blue-300/60 uppercase tracking-widest ${isExpanded ? 'px-6 opacity-100' : 'px-0 text-center opacity-0 h-0 overflow-hidden'}`}>
                สำหรับสมาชิก
              </div>
              <SidebarItem to="/booking" icon={Calendar} label="จองสนามเปตอง" isExpanded={isExpanded} locked={!user} />
              <SidebarItem to="/balls" icon={Search} label="ยืมลูกเปตอง" isExpanded={isExpanded} locked={!user} />
              <SidebarItem to="/history" icon={Activity} label="ประวัติการใช้งาน" isExpanded={isExpanded} locked={!user} />
              <SidebarItem to="/documents" icon={FileText} label="เอกสารคำร้อง" isExpanded={isExpanded} locked={!user} />

              {user?.role === 'admin' && (
                <>
                  <div className={`transition-all duration-300 mb-2 mt-6 text-[10px] font-black text-purple-400 uppercase tracking-widest ${isExpanded ? 'px-6 opacity-100' : 'px-0 text-center opacity-0 h-0 overflow-hidden'}`}>
                    โหมดใช้งาน
                  </div>
                  <button 
                    onClick={() => {
                      toggleAdminMode(false);
                      navigate('/admin');
                    }}
                    className={`sidebar-link flex items-center ${isExpanded ? 'px-4' : 'px-0 justify-center'} py-3 mx-2 my-1 rounded-xl transition-all duration-300 text-purple-200 hover:bg-purple-500/20 hover:text-white w-[calc(100%-1rem)]`}
                    title={!isExpanded ? "สลับไปโหมดผู้ดูแลระบบ" : ""}
                  >
                    <Shield size={22} className="min-w-[22px]" />
                    <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-auto' : 'opacity-0 w-0 ml-0'}`}>
                      สลับไปหน้าหลังบ้าน
                    </span>
                  </button>
                </>
              )}
            </>
          )}
        </nav>

        <div className="p-4 mt-auto">
          {user ? (
            <button 
              onClick={handleLogout}
              className={`flex items-center ${isExpanded ? 'justify-start px-4' : 'justify-center px-0'} w-full py-3 text-sm text-red-200 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300`}
              title={!isExpanded ? "ออกจากระบบ" : ""}
            >
              <LogOut size={22} className="min-w-[22px]" />
              <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-auto' : 'opacity-0 w-0 ml-0'}`}>
                ออกจากระบบ
              </span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className={`flex items-center ${isExpanded ? 'justify-start px-4' : 'justify-center px-0'} w-full py-3 text-sm text-emerald-300 hover:text-white hover:bg-emerald-500/20 rounded-xl transition-all duration-300 border border-emerald-400/30`}
              title={!isExpanded ? "เข้าสู่ระบบ" : ""}
            >
              <UserIcon size={22} className="min-w-[22px]" />
              <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-auto' : 'opacity-0 w-0 ml-0'}`}>
                เข้าสู่ระบบ / สมัครสมาชิก
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out ml-0 lg:ml-20 w-full min-w-0">
        {/* Navbar */}
        <header className="page-header h-20 px-4 sm:px-6 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex-1 flex items-center">
            {/* Hamburger button for mobile only */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2.5 mr-2 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:block text-slate-500 text-sm font-bold ml-4 tracking-tight">
              {user ? (
                <>สวัสดีคุณ, <span className="text-blue-600">{user.first_name}</span> 👋</>
              ) : (
                <>ยินดีต้อนรับสู่ <span className="text-blue-600">ชมรมเปตอง</span> 👋</>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5">
            {user && (
              <div className="relative">
                <button 
                  className={`relative p-2 rounded-full transition-all ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                      <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => markAllRead.mutate()}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg"
                          >
                            อ่านทั้งหมด
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {notifications.slice(0, 15).map((notif) => (
                              <div 
                                key={notif.id}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                onClick={() => {
                                  if (!notif.is_read) markRead.mutate(notif.id);
                                  if (notif.link) {
                                    navigate(notif.link);
                                    setIsNotifOpen(false);
                                  }
                                }}
                              >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                  notif.type.includes('admin') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {notif.type.includes('booking') ? <Calendar size={18} /> : 
                                   notif.type.includes('comment') ? <PlusCircle size={18} /> : 
                                   <Bell size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-slate-800 mb-0.5 truncate">{notif.title}</p>
                                  <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5">{notif.message}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: th })}
                                  </p>
                                </div>
                                {!notif.is_read && (
                                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 px-6 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bell size={24} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ไม่มีการแจ้งเตือนในขณะนี้</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button 
                          onClick={() => { setIsAllNotifModalOpen(true); setIsNotifOpen(false); }}
                          className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                        >
                          ดูประวัติทั้งหมด
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {user ? (
              <div 
                className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-slate-200 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all"
                onClick={() => navigate('/profile')}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                    {user.first_name} {user.last_name}
                  </p>
                  <div className="flex gap-1 justify-end">
                    <p className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {user.role}
                    </p>
                    <p className="text-[10px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {user.user_type}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={getImageUrl(user.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.first_name?.charAt(0)
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-5 border-l border-slate-200">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-xl text-xs sm:text-sm font-bold transition-all"
                >
                  เข้าสู่ระบบ
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="hidden sm:block px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-200"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* All Notifications Modal */}
      {isAllNotifModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAllNotifModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">ประวัติการแจ้งเตือนทั้งหมด</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">ตรวจสอบความเคลื่อนไหวทั้งหมดในระบบ</p>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllRead.mutate()}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
                <button 
                  onClick={() => setIsAllNotifModalOpen(false)}
                  className="p-3 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {notifications.length > 0 ? (
                <div className="grid gap-2">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-5 rounded-[2rem] transition-all cursor-pointer flex gap-5 items-center group ${!notif.is_read ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'hover:bg-slate-50'}`}
                      onClick={() => {
                        if (!notif.is_read) markRead.mutate(notif.id);
                        if (notif.link) {
                          navigate(notif.link);
                          setIsAllNotifModalOpen(false);
                        }
                      }}
                    >
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110 ${
                        notif.type.includes('admin') ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-blue-600 text-white shadow-blue-200'
                      }`}>
                        {notif.type.includes('booking') ? <Calendar size={24} /> : 
                         notif.type.includes('comment') ? <PlusCircle size={24} /> : 
                         <Bell size={24} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-black text-slate-800 text-sm">{notif.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ml-4">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: th })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse shadow-sm shadow-blue-400" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4">
                    <Bell size={40} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">ไม่มีรายการแจ้งเตือน</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50/30 border-t border-slate-50 text-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">End of notifications</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
