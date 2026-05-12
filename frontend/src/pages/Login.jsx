import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, User, Lock, AlertCircle } from 'lucide-react';
import logo from '../assets/logo ชมรมเปตอง.png';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      if (res.data.success) {
        login({
          accessToken: res.data.data.accessToken,
          refreshToken: res.data.data.refreshToken,
          user: res.data.data.user
        });
        toast.success(res.data.message);
        if (res.data.data.user.role === 'admin') {
          navigate('/role-select');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white overflow-hidden">
          <img src={logo} alt="Petanque Club Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
          เข้าสู่ระบบ
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          ยินดีต้อนรับสู่ระบบจัดการชมรมเปตอง
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-100 mx-4 sm:mx-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="account">
                Username หรือ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="account"
                  type="text"
                  className={`form-input pl-10 ${errors.account ? 'border-red-500 ring-red-100' : 'focus:ring-blue-100'}`}
                  placeholder="เช่น admin หรือ admin@example.com"
                  {...register('account', { required: 'กรุณากรอก Username หรือ Email' })}
                />
              </div>
              {errors.account && <p className="mt-1 text-xs text-red-600 font-medium">{errors.account.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  className={`form-input pl-10 ${errors.password ? 'border-red-500 ring-red-100' : 'focus:ring-blue-100'}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'กรุณากรอกรหัสผ่าน' })}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mr-2" />
                จดจำการใช้งาน
              </label>
              <Link to="/forgot-password" size="18" className="font-bold text-blue-600 hover:text-blue-700">
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              ยังไม่มีบัญชีสมาชิกใช่หรือไม่?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
                ลงทะเบียนที่นี่
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            กลับสู่หน้าหลัก (Public View)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
