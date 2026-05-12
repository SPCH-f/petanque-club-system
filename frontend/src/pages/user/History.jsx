import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Clock, MapPin, CircleDot, CheckCircle2, XCircle, AlertCircle, History as HistoryIcon, User } from 'lucide-react';
import { getImageUrl } from '../../utils/image';

const History = () => {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'loans'

  // Fetch My Bookings
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['my_bookings_history'],
    queryFn: async () => {
      const res = await api.get('/bookings');
      return res.data.data;
    }
  });

  // Fetch My Loans
  const { data: loansData, isLoading: loadingLoans } = useQuery({
    queryKey: ['my_loans_history'],
    queryFn: async () => {
      const res = await api.get('/balls/loans/mine');
      return res.data.data;
    }
  });

  const getBookingStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">รออนุมัติ</span>;
      case 'approved': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">อนุมัติแล้ว</span>;
      case 'completed': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">เสร็จสิ้น</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">ถูกปฏิเสธ</span>;
      case 'cancelled': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">ยกเลิกแล้ว</span>;
      case 'no-show': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">ไม่มาตามนัด</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getLoanStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">กำลังยืม</span>;
      case 'returned': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">คืนแล้ว</span>;
      case 'overdue': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">เลยกำหนด</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loadingBookings || loadingLoans) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center text-blue-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="font-medium">กำลังโหลดข้อมูลประวัติของคุณ...</p>
        </div>
      </div>
    );
  }

  const bookings = bookingsData || [];
  const loans = loansData || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <HistoryIcon size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">ประวัติการใช้งาน</h2>
            <p className="text-slate-500 font-medium mt-1">ดูรายการจองสนามและประวัติการยืมอุปกรณ์ของคุณทั้งหมด</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-full max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'bookings' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Calendar size={18} />
          ประวัติการจองสนาม
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'loans' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <CircleDot size={18} />
          ประวัติการยืมลูกเปตอง
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        
        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="divide-y divide-slate-100">
            {bookings.length > 0 ? (
              bookings.map(booking => (
                <div key={booking.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 bg-blue-50 rounded-2xl border border-blue-100 shrink-0">
                    <span className="text-sm font-bold text-blue-500 uppercase">{format(new Date(booking.start_time), 'MMM', { locale: th })}</span>
                    <span className="text-3xl font-black text-blue-700 leading-none my-1">{format(new Date(booking.start_time), 'dd')}</span>
                    <span className="text-xs font-medium text-blue-500">{format(new Date(booking.start_time), 'yyyy')}</span>
                  </div>
                  
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {booking.field_name || 'ไม่ระบุชื่อสนาม'}
                      </h3>
                      <div className="md:hidden">{getBookingStatusBadge(booking.status)}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <span>{format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm น.')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <span>จำนวนผู้เล่น {booking.player_count} คน</span>
                      </div>
                      <div className="flex items-center gap-2 md:hidden">
                        <Calendar size={16} className="text-slate-400" />
                        <span>{format(new Date(booking.start_time), 'dd MMM yyyy', { locale: th })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end justify-center min-w-[120px]">
                    {getBookingStatusBadge(booking.status)}
                    <span className="text-xs text-slate-400 mt-2 font-medium">ทำรายการเมื่อ {format(new Date(booking.created_at), 'dd MMM yy')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Calendar size={64} className="mb-4 text-slate-200" />
                <h3 className="text-lg font-bold text-slate-600">คุณยังไม่มีประวัติการจองสนาม</h3>
                <p className="mt-1">เริ่มทำการจองสนามครั้งแรกได้ที่เมนู "จองสนาม"</p>
              </div>
            )}
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="divide-y divide-slate-100">
            {loans.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {loans.map(loan => (
                  <div key={loan.id} className="p-5 sm:p-6 hover:bg-blue-50/30 transition-colors flex flex-col md:flex-row gap-5 items-start md:items-center">
                    <div className="flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl shrink-0 shadow-sm">
                      <CircleDot size={28} className="text-slate-400" />
                    </div>
                    
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-black text-slate-800 leading-tight">
                            {loan.brand} {loan.model}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter border border-slate-200">
                              CODE: {loan.code}
                            </span>
                            {loan.weight && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded uppercase tracking-tighter">
                                {loan.weight}g
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="md:hidden shrink-0">{getLoanStatusBadge(loan.status)}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2.5 bg-white/50 p-2 rounded-xl border border-slate-100">
                          <HistoryIcon size={14} className="text-blue-500" />
                          <span><span className="font-black text-slate-400 uppercase text-[9px] mr-1">ยืมเมื่อ:</span> {format(new Date(loan.loan_start), 'dd MMM yy (HH:mm)', { locale: th })}</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/50 p-2 rounded-xl border border-slate-100">
                          {loan.status === 'returned' ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={14} className="text-orange-400" />
                          )}
                          <span>
                            <span className="font-black text-slate-400 uppercase text-[9px] mr-1">{loan.status === 'returned' ? 'คืนเมื่อ:' : 'กำหนดคืน:'}</span>
                            {loan.status === 'returned' && loan.returned_at
                              ? format(new Date(loan.returned_at), 'dd MMM yy (HH:mm)', { locale: th }) 
                              : format(new Date(loan.loan_end), 'dd MMM yy (HH:mm)', { locale: th })
                            }
                          </span>
                        </div>
                      </div>
                      
                      {loan.status === 'returned' && loan.return_admin_name && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between animate-in fade-in duration-500">
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase">รับคืนโดยแอดมิน</p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <User size={8} />
                              </div>
                              <p className="text-[10px] font-bold text-slate-700">{loan.return_admin_name}</p>
                            </div>
                          </div>
                          {loan.return_admin_signature && (
                            <div className="flex flex-col items-end">
                              <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Admin Signature</p>
                              <img src={getImageUrl(loan.return_admin_signature)} alt="Sig" className="h-8 object-contain mix-blend-multiply opacity-70 hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="hidden md:flex flex-col items-end justify-center min-w-[120px]">
                      {getLoanStatusBadge(loan.status)}
                      <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">ID: {loan.id.split('-')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <CircleDot size={64} className="mb-4 text-slate-200" />
                <h3 className="text-lg font-bold text-slate-600">คุณยังไม่มีประวัติการยืมอุปกรณ์</h3>
                <p className="mt-1">สามารถยืมลูกเปตองได้ที่เมนู "ยืมลูกเปตอง"</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default History;
