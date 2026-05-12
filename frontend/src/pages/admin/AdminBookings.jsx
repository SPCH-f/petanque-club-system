import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Search, CheckCircle, XCircle, Clock, MapPin, User,
  Calendar as CalendarIcon, Package, LayoutGrid, RotateCcw
} from 'lucide-react';

import { useSearchParams } from 'react-router-dom';
import { getImageUrl } from '../../utils/image';

const AdminBookings = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'loans' ? 'loans' : 'bookings';
  const [activeTab, setActiveTab] = useState(initialTab); 
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 1. Bookings Logic
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['admin_bookings'],
    queryFn: async () => {
      const res = await api.get('/admin/bookings');
      return res.data.data;
    }
  });

  const updateBookingStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/bookings/${id}/status`, { status }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'อัปเดตสถานะสำเร็จ');
      queryClient.invalidateQueries(['admin_bookings']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // 2. Loans Logic
  const { data: loansData, isLoading: loadingLoans } = useQuery({
    queryKey: ['admin_loans'],
    queryFn: async () => {
      const res = await api.get('/admin/loans');
      return res.data.data;
    }
  });

  const approveLoan = useMutation({
    mutationFn: (id) => api.put(`/admin/loans/${id}/approve`),
    onSuccess: () => {
      toast.success('อนุมัติการยืมสำเร็จ');
      queryClient.invalidateQueries(['admin_loans']);
    }
  });

  const rejectLoan = useMutation({
    mutationFn: (id) => api.put(`/admin/loans/${id}/reject`),
    onSuccess: () => {
      toast.success('ปฏิเสธการยืมแล้ว');
      queryClient.invalidateQueries(['admin_loans']);
    }
  });

  const approveReturn = useMutation({
    mutationFn: (id) => api.put(`/admin/loans/${id}/approve-return`),
    onSuccess: (res) => {
      toast.success(res.data.message || 'ยืนยันการรับคืนเรียบร้อย');
      queryClient.invalidateQueries(['admin_loans']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  if (loadingBookings || loadingLoans) return <div className="p-8 text-center text-slate-500 font-bold">กำลังโหลดข้อมูล...</div>;

  const bookings = bookingsData || [];
  const loans = loansData || [];

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.field_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLoans = loans.filter(l => {
    const matchesSearch = (l.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.ball_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-yellow-200 flex items-center gap-1 w-max"><Clock size={10} /> รออนุมัติ</span>;
      case 'approved':
      case 'active': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-200 flex items-center gap-1 w-max"><CheckCircle size={10} /> {status === 'active' ? 'กำลังยืม' : 'อนุมัติแล้ว'}</span>;
      case 'returning': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-orange-200 flex items-center gap-1 w-max"><Clock size={10} /> ⏳ รอแอดมินอนุมัติการคืน</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-red-200 flex items-center gap-1 w-max"><XCircle size={10} /> ปฏิเสธ</span>;
      case 'returned': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-blue-200 w-max">คืนแล้ว</span>;
      case 'completed': return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200 w-max">เสร็จสิ้น</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-white rounded-2xl shadow-lg">
              <LayoutGrid size={24} />
            </div>
            ระบบจัดการคลับ
          </h2>
          <p className="text-slate-500 font-medium">จัดการการจองสนามและการยืมอุปกรณ์ในที่เดียว</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('bookings'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'bookings' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CalendarIcon size={18} /> จองสนาม
          </button>
          <button
            onClick={() => { setActiveTab('loans'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'loans' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package size={18} /> ยืม-คืนลูกเปตอง
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={`ค้นหาชื่อผู้ใช้, ${activeTab === 'bookings' ? 'สนาม' : 'ลูกเปตอง/สมาชิก'}...`}
              className="form-input pl-12 bg-white border-slate-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-input md:w-56 bg-white border-slate-200 rounded-xl font-bold text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รออนุมัติ</option>
            {activeTab === 'bookings' ? (
              <>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
              </>
            ) : (
              <>
                <option value="active">กำลังยืม</option>
                <option value="returning">รอรับคืน</option>
                <option value="returned">คืนแล้ว</option>
              </>
            )}
            <option value="rejected">ปฏิเสธ</option>
          </select>
        </div>

        {/* Table View (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-4">ผู้ดำเนินการ</th>
                <th className="px-6 py-4">{activeTab === 'bookings' ? 'สนาม' : 'รายการอุปกรณ์'}</th>
                <th className="px-6 py-4">วัน-เวลา</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-8 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(activeTab === 'bookings' ? filteredBookings : filteredLoans).map(item => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${activeTab === 'bookings' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 leading-tight">{item.user_name || 'ไม่ทราบชื่อ'}</p>
                        <p className="text-[10px] font-bold text-slate-400">{item.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                        {activeTab === 'bookings' ? <MapPin size={14} /> : <Package size={14} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{activeTab === 'bookings' ? item.field_name : item.ball_name}</span>
                        {activeTab === 'bookings' && (
                          <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter flex items-center gap-1">
                            📦 1 แก่น / 1 วง
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <CalendarIcon size={12} className="text-blue-500" />
                        {format(new Date(activeTab === 'bookings' ? item.start_time : item.loan_start), 'dd MMM yyyy', { locale: th })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {activeTab === 'bookings' ? (
                          `${format(new Date(item.start_time), 'HH:mm')} - ${format(new Date(item.end_time), 'HH:mm')} น.`
                        ) : (
                          `คืนภายใน: ${format(new Date(item.loan_end), 'HH:mm')} น.`
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(item.status)}
                    {item.status === 'returned' && (
                      <div className="mt-1 space-y-0.5">
                        {item.return_admin_name && (
                          <div className="text-[9px] font-black text-slate-600 flex items-center gap-1">
                            <User size={10} className="text-blue-500" />
                            {item.return_admin_name}
                          </div>
                        )}
                        {item.return_admin_signature && (
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Signed:</span>
                            <img src={getImageUrl(item.return_admin_signature)} alt="Sig" className="h-4 object-contain mix-blend-multiply opacity-50" />
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => activeTab === 'bookings' ? updateBookingStatus.mutate({ id: item.id, status: 'approved' }) : approveLoan.mutate(item.id)}
                            className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:scale-110 transition-transform"
                            title="อนุมัติ"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => activeTab === 'bookings' ? updateBookingStatus.mutate({ id: item.id, status: 'rejected' }) : rejectLoan.mutate(item.id)}
                            className="p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-200 hover:scale-110 transition-transform"
                            title="ปฏิเสธ"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {activeTab === 'loans' && (item.status === 'active' || item.status === 'returning') && (
                        <button
                          onClick={() => {
                            if(window.confirm('ยืนยันว่าได้รับอุปกรณ์คืนแล้ว และจะลงลายเซ็นรับรอง?')) approveReturn.mutate(item.id);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-emerald-200 hover:scale-105 transition-transform"
                        >
                          <RotateCcw size={14} /> เซ็นรับคืน
                        </button>
                      )}
                      {activeTab === 'bookings' && item.status === 'approved' && (
                        <button
                          onClick={() => updateBookingStatus.mutate({ id: item.id, status: 'completed' })}
                          className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-blue-200 hover:scale-105 transition-transform"
                        >
                          จบการใช้งาน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card View (Visible on Mobile Only) */}
        <div className="md:hidden divide-y divide-slate-100">
          {(activeTab === 'bookings' ? filteredBookings : filteredLoans).map(item => (
            <div key={item.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'bookings' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-none mb-1">{item.user_name || 'ไม่ทราบชื่อ'}</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{activeTab === 'bookings' ? item.field_name : item.ball_name}</p>
                      {activeTab === 'bookings' && (
                        <p className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-max">
                          📦 1 แก่น / 1 วง
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CalendarIcon size={14} className="text-blue-500" />
                    <span className="text-xs font-black">
                      {format(new Date(activeTab === 'bookings' ? item.start_time : item.loan_start), 'dd MMM yyyy', { locale: th })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold">
                      {activeTab === 'bookings' ? (
                        `${format(new Date(item.start_time), 'HH:mm')} - ${format(new Date(item.end_time), 'HH:mm')} น.`
                      ) : (
                        `คืนภายใน: ${format(new Date(item.loan_end), 'HH:mm')} น.`
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => activeTab === 'bookings' ? updateBookingStatus.mutate({ id: item.id, status: 'approved' }) : approveLoan.mutate(item.id)}
                        className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 active:scale-95"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={() => activeTab === 'bookings' ? updateBookingStatus.mutate({ id: item.id, status: 'rejected' }) : rejectLoan.mutate(item.id)}
                        className="p-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-200 active:scale-95"
                      >
                        <XCircle size={20} />
                      </button>
                    </>
                  )}
                  {activeTab === 'loans' && (item.status === 'active' || item.status === 'returning') && (
                    <button
                      onClick={() => {
                        if(window.confirm('ยืนยันว่าได้รับอุปกรณ์คืนแล้ว และจะลงลายเซ็นรับรอง?')) approveReturn.mutate(item.id);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-emerald-200 active:scale-95 flex items-center gap-2"
                    >
                      <RotateCcw size={14} /> เซ็นรับคืน
                    </button>
                  )}
                  {activeTab === 'bookings' && item.status === 'approved' && (
                    <button
                      onClick={() => updateBookingStatus.mutate({ id: item.id, status: 'completed' })}
                      className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-blue-200 active:scale-95"
                    >
                      จบงาน
                    </button>
                  )}
                </div>
              </div>
              {item.status === 'returned' && item.return_admin_signature && (
                <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase">รับคืนโดยแอดมิน</p>
                    <p className="text-[10px] font-bold text-slate-700">{item.return_admin_name}</p>
                  </div>
                  <img src={getImageUrl(item.return_admin_signature)} alt="Sig" className="h-8 object-contain mix-blend-multiply" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(activeTab === 'bookings' ? filteredBookings : filteredLoans).length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4">
              <Search size={40} />
            </div>
            <p className="font-black uppercase tracking-widest text-xs">ไม่พบข้อมูลในขณะนี้</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
