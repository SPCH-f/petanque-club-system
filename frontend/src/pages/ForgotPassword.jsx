import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import logo from '../assets/logo ชมรมเปตอง.png';

const ForgotPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(false);
  const [debugUrl, setDebugUrl] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        identifier: data.identifier,
        newEmail: forgotEmail ? data.newEmail : null,
        student_id: forgotEmail ? data.student_id : null,
        phone: forgotEmail ? data.phone : null
      };
      const res = await api.post('/auth/forgot-password', payload);
      if (res.data.success) {
        setSubmitted(true);
        // Only for development: catch the URL if returned by backend
        if (res.data.data?.resetUrl) {
          setDebugUrl(res.data.data.resetUrl);
        }
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาตรวจสอบข้อมูลอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    // ... (keep submitted view)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-12 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-100 mx-4 sm:mx-0 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">ส่งอีเมลเรียบร้อยแล้ว</h2>
            <p className="text-slate-500 mb-8">
              หากอีเมลของคุณอยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบในกล่องขาเข้า (และโฟลเดอร์ Junk/Spam)
            </p>

            {debugUrl && (
              <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl animate-bounce">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">พบลิงก์รีเซ็ต (โหมดทดสอบ):</p>
                <a 
                  href={debugUrl} 
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
                >
                  คลิกที่นี่เพื่อตั้งรหัสผ่านใหม่
                </a>
                <p className="mt-3 text-[10px] text-blue-400">ปุ่มนี้จะแสดงเฉพาะเมื่อระบบอยู่ในโหมดพัฒนาเท่านั้น</p>
              </div>
            )}

            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft size={18} /> กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white overflow-hidden">
          <img src={logo} alt="Petanque Club Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
          ลืมรหัสผ่าน?
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          กรอกอีเมลของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-100 mx-4 sm:mx-0">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="identifier">
                Username {forgotEmail ? '' : 'หรือ Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  className={`form-input pl-10 ${errors.identifier ? 'border-red-500 ring-red-100' : 'focus:ring-blue-100'}`}
                  placeholder={forgotEmail ? "Username ของคุณ" : "เช่น admin หรือ email@example.com"}
                  {...register('identifier', { required: 'กรุณากรอกข้อมูลนี้' })}
                />
              </div>
              {errors.identifier && <p className="mt-1 text-xs text-red-600 font-medium">{errors.identifier.message}</p>}
            </div>

            <div className="flex items-center gap-2 py-2">
              <input 
                type="checkbox" 
                id="forgotEmailToggle"
                checked={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="forgotEmailToggle" className="text-xs font-bold text-slate-600 cursor-pointer">
                ลืมอีเมลที่ลงทะเบียนไว้? (ยืนยันตัวตนด้วยข้อมูลอื่น)
              </label>
            </div>

            {forgotEmail && (
              <div className="space-y-4 pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    เลขประจำตัว (นักศึกษา/บุคลากร)
                  </label>
                  <input
                    type="text"
                    className="form-input bg-slate-50"
                    placeholder="เช่น 64010XXX"
                    {...register('student_id', { required: forgotEmail })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    เบอร์โทรศัพท์ที่ลงทะเบียน
                  </label>
                  <input
                    type="text"
                    className="form-input bg-slate-50"
                    placeholder="เช่น 0812345678"
                    {...register('phone', { required: forgotEmail })}
                  />
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-700 mb-1">
                    อีเมลใหม่ที่ต้องการใช้รับลิงก์
                  </label>
                  <input
                    type="email"
                    className="form-input bg-white border-blue-200"
                    placeholder="new-email@example.com"
                    {...register('newEmail', { 
                      required: forgotEmail,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'รูปแบบอีเมลไม่ถูกต้อง'
                      }
                    })}
                  />
                  <p className="mt-2 text-[10px] text-blue-600 font-medium leading-relaxed">
                    * หากข้อมูลถูกต้อง ระบบจะอัปเดตอีเมลในบัญชีของคุณเป็นอีเมลนี้ และส่งลิงก์รีเซ็ตรหัสผ่านไปให้ทันที
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'ดำเนินการต่อ'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
