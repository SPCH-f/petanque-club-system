import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token && refresh) {
      // 1. บันทึก Token ลงในเครื่อง
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refresh);
      
      // 2. โหลดข้อมูล User ปัจจุบัน แล้ว Redirect
      fetchUser().then(() => {
        navigate('/');
      });
    } else {
      // ถ้าไม่มี Token กลับมา ให้กลับไปหน้า Login
      navigate('/login');
    }
  }, [searchParams, navigate, fetchUser]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">กำลังยืนยันตัวตนกับ Google...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
