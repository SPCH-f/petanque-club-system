import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
  const { logout, user, fetchUser } = useAuth();
  const navigate = useNavigate();

  // Polling check every 5 seconds
  React.useEffect(() => {
    if (user && user.role !== 'pending') {
      navigate('/');
      return;
    }

    const interval = setInterval(() => {
      fetchUser();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, fetchUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-blue-600">
            <Clock size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">บัญชีรอการอนุมัติ</h2>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          สวัสดีครับ <strong>{user?.name}</strong><br/>
          บัญชีของคุณกำลังอยู่ในระหว่างการตรวจสอบ<br/>
          โดยผู้ดูแลระบบ (Admin) กรุณารอสักครู่นะครับ
        </p>

        <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-8">
          เมื่อได้รับการอนุมัติแล้ว คุณจะสามารถเข้าใช้งานระบบจองสนามและยืมอุปกรณ์ได้ทันที
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
        >
          <LogOut size={18} />
          <span>ออกจากระบบไปก่อน</span>
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
