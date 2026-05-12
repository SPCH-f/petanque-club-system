import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, ArrowRight } from 'lucide-react';
import clubLogo from '../assets/logo ชมรมเปตอง.png';

const RoleSelect = () => {
  const { user, toggleAdminMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSelect = (asUser) => {
    toggleAdminMode(asUser);
    if (asUser) {
      navigate('/');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border-4 border-white overflow-hidden mb-6">
          <img src={clubLogo} alt="Logo" className="w-full h-full object-contain p-2" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          เลือกโหมดการใช้งาน
        </h2>
        <p className="mt-3 text-sm font-bold text-slate-500 uppercase tracking-wider">
          บัญชีของคุณเป็นระดับผู้ดูแลระบบ (Admin)
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-6">
          <button 
            onClick={() => handleSelect(false)}
            className="flex flex-col items-center p-8 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-200 transition-all group"
          >
            <div className="w-20 h-20 rounded-[1.5rem] bg-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Shield size={40} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">เข้าสู่หลังบ้าน</h3>
            <p className="text-xs font-bold text-slate-500 text-center mb-8 leading-relaxed">
              จัดการข้อมูล คลังอุปกรณ์ อนุมัติเอกสาร และตั้งค่าระบบ
            </p>
            <div className="mt-auto flex items-center text-purple-600 font-black text-xs uppercase tracking-widest bg-purple-50 px-4 py-2 rounded-xl">
              หน้าผู้ดูแลระบบ <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button 
            onClick={() => handleSelect(true)}
            className="flex flex-col items-center p-8 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-200 transition-all group"
          >
            <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
              <User size={40} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">เข้าสู่หน้าผู้ใช้งาน</h3>
            <p className="text-xs font-bold text-slate-500 text-center mb-8 leading-relaxed">
              ดูข่าวสาร จองสนาม ยืมอุปกรณ์ ในมุมมองของสมาชิกทั่วไป
            </p>
            <div className="mt-auto flex items-center text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl">
              หน้าผู้ใช้ทั่วไป <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
