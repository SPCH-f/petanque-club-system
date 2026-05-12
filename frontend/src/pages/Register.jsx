import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, User, Mail, Lock, Phone, CreditCard, ChevronLeft } from 'lucide-react';

const Register = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      user_type: 'นักศึกษา'
    }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        toast.success(res.data.message, { duration: 5000 });
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'การลงทะเบียนล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6 group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
        <div className="bg-white py-10 px-6 shadow-2xl rounded-[2.5rem] border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          
          <div className="relative">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">ลงทะเบียนสมาชิก</h2>
            <p className="mt-2 text-slate-500 font-medium">เข้าร่วมเป็นส่วนหนึ่งของชมรมเปตองกับเรา</p>

            <form className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6" onSubmit={handleSubmit(onSubmit)}>
              
              {/* Account Info Section */}
              <div className="sm:col-span-2">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">ข้อมูลบัญชีผู้ใช้</h3>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Username *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className={`form-input pl-10 ${errors.username ? 'border-red-500' : ''}`}
                    placeholder="เช่น somchai_123"
                    {...register('username', { 
                      required: 'กรุณากรอก Username',
                      minLength: { value: 4, message: 'ต้องมีอย่างน้อย 4 ตัวอักษร' }
                    })}
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-red-600 font-medium">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    className={`form-input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="example@mail.com"
                    {...register('email', { required: 'กรุณากรอกอีเมล' })}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">รหัสผ่าน *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    className={`form-input pl-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                    {...register('password', { 
                      required: 'กรุณากรอกรหัสผ่าน',
                      minLength: { value: 6, message: 'ต้องมีอย่างน้อย 6 ตัวอักษร' }
                    })}
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ยืนยันรหัสผ่าน *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    className={`form-input pl-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                    {...register('confirm_password', { 
                      required: 'กรุณายืนยันรหัสผ่าน',
                      validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                    })}
                  />
                </div>
                {errors.confirm_password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirm_password.message}</p>}
              </div>

              {/* Personal Info Section */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-50">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">ข้อมูลส่วนตัว</h3>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อจริง *</label>
                <input
                  type="text"
                  className={`form-input ${errors.first_name ? 'border-red-500' : ''}`}
                  placeholder="เช่น สมชาย"
                  {...register('first_name', { required: 'กรุณากรอกชื่อจริง' })}
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.first_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">นามสกุล *</label>
                <input
                  type="text"
                  className={`form-input ${errors.last_name ? 'border-red-500' : ''}`}
                  placeholder="เช่น สายเปตอง"
                  {...register('last_name', { required: 'กรุณากรอกนามสกุล' })}
                />
                {errors.last_name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.last_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ประเภทผู้ใช้ *</label>
                <select
                  className="form-input bg-white"
                  {...register('user_type', { required: 'กรุณาเลือกประเภทผู้ใช้' })}
                >
                  <option value="นักศึกษา">นักศึกษา</option>
                  <option value="บุคลากร">บุคลากร</option>
                  <option value="บุคคลภายนอก">บุคคลภายนอก</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">รหัสนักศึกษา/บุคลากร (ถ้ามี)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="เช่น 6401234567"
                    {...register('student_id')}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className={`form-input pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="เช่น 0812345678"
                    {...register('phone', { required: 'กรุณากรอกเบอร์โทรศัพท์' })}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>}
              </div>

              <div className="sm:col-span-2 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'สร้างบัญชีสมาชิก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
