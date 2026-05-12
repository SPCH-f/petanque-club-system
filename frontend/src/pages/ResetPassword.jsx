import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo ชมรมเปตอง.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Token ไม่ถูกต้องหรือหมดอายุ');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        password: data.password
      });
      if (res.data.success) {
        toast.success('เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-12 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-100 mx-4 sm:mx-0 text-center text-red-600">
            <h2 className="text-2xl font-black mb-4">ลิงก์ไม่ถูกต้อง</h2>
            <p className="text-slate-500 mb-8">
              ไม่พบ Token สำหรับการรีเซ็ตรหัสผ่าน หรือลิงก์อาจหมดอายุแล้ว กรุณาลองขอลิงก์ใหม่อีกครั้ง
            </p>
            <Link to="/forgot-password" size="18" className="btn btn-primary">ขอลิงก์รีเซ็ตรหัสผ่านใหม่</Link>
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
          ตั้งรหัสผ่านใหม่
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          กรุณากำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-100 mx-4 sm:mx-0">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="password">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-500 ring-red-100' : 'focus:ring-blue-100'}`}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  {...register('password', { 
                    required: 'กรุณากรอกรหัสผ่านใหม่',
                    minLength: { value: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
                  })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="confirmPassword">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPass ? "text" : "password"}
                  className={`form-input pl-10 ${errors.confirmPassword ? 'border-red-500 ring-red-100' : 'focus:ring-blue-100'}`}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  {...register('confirmPassword', { 
                    required: 'กรุณายืนยันรหัสผ่านใหม่',
                    validate: (val) => {
                      if (watch('password') !== val) {
                        return "รหัสผ่านไม่ตรงกัน";
                      }
                    }
                  })}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={16} /> ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
