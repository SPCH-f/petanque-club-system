import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { CircleDot, Clock, ShieldCheck, AlertCircle, X, Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const TIME_OPTIONS = [
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

const Balls = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [weightFilter, setWeightFilter] = useState('all');
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedBall, setSelectedBall] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch all balls
  const { data: ballsData, isLoading: loadingBalls } = useQuery({
    queryKey: ['balls'],
    queryFn: async () => {
      const res = await api.get('/balls');
      return res.data.data;
    }
  });

  // Fetch my loans
  const { data: myLoansData, isLoading: loadingLoans } = useQuery({
    queryKey: ['my_loans'],
    queryFn: async () => {
      const res = await api.get('/balls/loans/mine');
      return res.data.data;
    }
  });

  const borrowMutation = useMutation({
    mutationFn: (data) => api.post('/balls/loans', data),
    onSuccess: (res) => {
      toast.success(res.data.message || 'ส่งคำขอยืมสำเร็จ กรุณารอแอดมินอนุมัติ');
      queryClient.invalidateQueries(['balls']);
      queryClient.invalidateQueries(['my_loans']);
      closeBorrowModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการยืม')
  });

  const returnMutation = useMutation({
    mutationFn: (loanId) => api.put(`/balls/loans/${loanId}/return`),
    onSuccess: () => {
      toast.success('คืนอุปกรณ์เรียบร้อยแล้ว');
      queryClient.invalidateQueries(['balls']);
      queryClient.invalidateQueries(['my_loans']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการคืน')
  });

  const openBorrowModal = (ball) => {
    setSelectedBall(ball);
    setBorrowModalOpen(true);
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    reset({
      borrowTime: TIME_OPTIONS.includes(format(now, 'HH:mm')) ? format(now, 'HH:mm') : '15:00',
      returnTime: TIME_OPTIONS.includes(format(twoHoursLater, 'HH:mm')) ? format(twoHoursLater, 'HH:mm') : '22:00',
      notes: ''
    });
  };

  const closeBorrowModal = () => {
    setSelectedBall(null);
    setBorrowModalOpen(false);
    reset();
  };

  const onBorrowSubmit = (data) => {
    const now = new Date();
    const start = new Date(now);
    const [sH, sM] = data.borrowTime.split(':');
    start.setHours(parseInt(sH), parseInt(sM), 0);

    const end = new Date(now);
    const [eH, eM] = data.returnTime.split(':');
    end.setHours(parseInt(eH), parseInt(eM), 0);
    
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    borrowMutation.mutate({
      ball_id: selectedBall.id,
      loan_start: start.toISOString(),
      loan_end: end.toISOString(),
      notes: data.notes
    });
  };

  const handleReturn = (loanId) => {
    if (window.confirm('ยืนยันการส่งคืนอุปกรณ์นี้?')) {
      returnMutation.mutate(loanId);
    }
  };

  const balls = React.useMemo(() => ballsData || [], [ballsData]);
  
  const uniqueBrands = React.useMemo(() => 
    [...new Set(balls.map(b => b.brand))].filter(Boolean).sort()
  , [balls]);

  const uniqueModels = React.useMemo(() => 
    [...new Set(
      balls
        .filter(b => brandFilter === 'all' || b.brand === brandFilter)
        .map(b => b.model)
    )].filter(Boolean).sort()
  , [balls, brandFilter]);

  const uniqueWeights = React.useMemo(() => 
    [...new Set(balls.map(b => b.weight))].filter(w => w !== null && w !== undefined).sort((a, b) => a - b)
  , [balls]);

  const filteredBalls = React.useMemo(() => {
    return balls.filter(b => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (b.brand?.toLowerCase() || '').includes(search) || 
                            (b.model?.toLowerCase() || '').includes(search) || 
                            (b.code?.toLowerCase() || '').includes(search) ||
                            String(b.weight || '').includes(search);
      const matchesBrand = brandFilter === 'all' || b.brand === brandFilter;
      const matchesModel = modelFilter === 'all' || b.model === modelFilter;
      const matchesWeight = weightFilter === 'all' || String(b.weight) === weightFilter;
      
      return matchesSearch && matchesBrand && matchesModel && matchesWeight;
    });
  }, [balls, searchTerm, brandFilter, modelFilter, weightFilter]);

  React.useEffect(() => {
    if (modelFilter !== 'all' && !uniqueModels.includes(modelFilter)) {
      setModelFilter('all');
    }
  }, [uniqueModels, modelFilter]);

  if (loadingBalls || loadingLoans) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
           <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
              <div className="h-4 w-64 bg-slate-50 rounded-lg animate-pulse"></div>
           </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-3xl h-96 shadow-sm border border-slate-100 animate-pulse overflow-hidden">
               <div className="h-44 bg-slate-100"></div>
               <div className="p-5 space-y-4">
                  <div className="h-6 w-3/4 bg-slate-100 rounded-lg"></div>
                  <div className="h-4 w-1/2 bg-slate-50 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="h-10 bg-slate-50 rounded-xl"></div>
                     <div className="h-10 bg-slate-50 rounded-xl"></div>
                  </div>
                  <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const myLoans = myLoansData || [];
  const activeLoans = myLoans.filter(l => l.status === 'active' || l.status === 'pending' || l.status === 'returning');

  const getStatusBadge = (status) => {
    switch(status) {
      case 'available': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">พร้อมยืม</span>;
      case 'borrowed': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">ถูกยืมไปแล้ว</span>;
      case 'reserved': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">รออนุมัติยืม</span>;
      case 'returning': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-orange-200">⏳ รอแอดมินอนุมัติการคืน</span>;
      case 'overdue': return <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-700">เกินกำหนด</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">ไม่พร้อมใช้งาน</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Active Loans Section */}
      {activeLoans.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <History className="text-blue-600" />
            อุปกรณ์ที่คุณกำลังยืมอยู่
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLoans.map(loan => (
              <div key={loan.id} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10"></div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                           <CircleDot size={18} />
                         </div>
                         <h3 className="font-black text-lg text-slate-800 leading-tight">
                           {loan.brand} {loan.model}
                         </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                         <div className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-black text-slate-600">
                           CODE: {loan.code}
                         </div>
                         <div className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-black text-slate-400">
                           {loan.weight}g / {loan.diameter}mm
                         </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                        ยืมเมื่อ: {format(new Date(loan.loan_start), 'd MMM yy (HH:mm น.)', { locale: th })}
                      </p>
                    </div>
                    {getStatusBadge(loan.status)}
                  </div>
                
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-red-600 font-medium">
                    <Clock size={16} /> กำหนดคืน: {format(new Date(loan.loan_end), 'HH:mm น.')}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleReturn(loan.id)}
                  disabled={returnMutation.isPending || loan.status === 'pending' || loan.status === 'returning'}
                  className={`mt-auto w-full py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest shadow-lg ${
                    loan.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-600 border border-yellow-200 cursor-not-allowed'
                      : loan.status === 'returning'
                        ? 'bg-orange-50 text-orange-600 border border-orange-200 cursor-not-allowed animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 hover:-translate-y-0.5'
                  }`}
                >
                  {loan.status === 'pending' 
                    ? 'รอแอดมินอนุมัติยืม' 
                    : loan.status === 'returning' 
                      ? 'รอแอดมินยืนยันการคืน' 
                      : (returnMutation.isPending ? 'กำลังดำเนินการ...' : 'แจ้งคืนอุปกรณ์')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header & Search */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">ยืมลูกเปตอง</h2>
          <p className="text-slate-400 text-sm font-medium">ค้นหาและเลือกยืมอุปกรณ์คุณภาพสูงจากคลังส่วนกลางของชมรม</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="sm:col-span-2 lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold transition-all shadow-inner"
              placeholder="ค้นหารหัส, รุ่น หรือ แบรนด์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold appearance-none cursor-pointer transition-all shadow-inner"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="all">ทุกแบรนด์</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <CircleDot size={18} className="text-slate-300" />
            </div>
          </div>

          <div className="relative">
            <select
              className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold appearance-none cursor-pointer transition-all shadow-inner"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            >
              <option value="all">ทุกรุ่น</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <CircleDot size={18} className="text-slate-300" />
            </div>
          </div>

          <div className="relative">
            <select
              className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold appearance-none cursor-pointer transition-all shadow-inner"
              value={weightFilter}
              onChange={(e) => setWeightFilter(e.target.value)}
            >
              <option value="all">ทุกน้ำหนัก</option>
              {uniqueWeights.map(weight => (
                <option key={weight} value={String(weight)}>{weight} g</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <CircleDot size={18} className="text-slate-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Balls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredBalls.map(ball => (
          <div key={ball.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 border border-slate-100 transition-all duration-500 flex flex-col group overflow-hidden relative">
            <div className="h-48 bg-slate-50 relative overflow-hidden">
              {ball.image_url ? (
                <img src={ball.image_url} alt={ball.brand} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-300">
                  <CircleDot size={64} className="opacity-10 group-hover:rotate-45 transition-transform duration-700" />
                </div>
              )}
              <div className="absolute top-4 right-4 z-10">
                {getStatusBadge(ball.status)}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <div className="p-6 space-y-5 flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-xl text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{ball.brand}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">{ball.model}</p>
                  </div>
                  <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-500 border border-slate-200">#{ball.code}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-white transition-colors duration-500">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">น้ำหนัก</p>
                    <p className="font-black text-slate-700 text-sm">{ball.weight ? `${ball.weight} g` : '-'}</p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-white transition-colors duration-500">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ขนาด</p>
                    <p className="font-black text-slate-700 text-sm">{ball.diameter ? `${ball.diameter} mm` : '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="text-[10px] font-black text-slate-300 uppercase">ลวดลาย:</span>
                  <span>{ball.pattern || 'เรียบ'}</span>
                </div>
                
                {ball.condition_note && (
                  <div className="text-orange-600 text-[10px] bg-orange-50/50 p-3 rounded-2xl flex gap-2 items-start border border-orange-100 font-bold leading-relaxed">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{ball.condition_note}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => openBorrowModal(ball)}
                disabled={ball.status !== 'available'}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 ${
                  ball.status === 'available' 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-100 hover:-translate-y-1' 
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                }`}
              >
                {ball.status === 'available' ? 'เริ่มขั้นตอนการยืม' : 'ไม่พร้อมให้บริการ'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBalls.length === 0 && (
        <div className="col-span-full text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <CircleDot size={64} className="mx-auto mb-6 text-slate-100 animate-pulse" />
          <p className="text-xl font-black text-slate-400">ไม่พบข้อมูลลูกเปตองที่ค้นหา</p>
          <p className="text-sm text-slate-300 font-bold mt-2">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
        </div>
      )}

      {/* Borrow Modal */}
      {borrowModalOpen && selectedBall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                  <ShieldCheck size={28} className="text-blue-600" />
                  ยืมอุปกรณ์
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">ยืนยันข้อมูลการยืมของคุณ</p>
              </div>
              <button onClick={closeBorrowModal} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onBorrowSubmit)} className="p-8 space-y-6">
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                <p className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-3">อุปกรณ์ที่เลือก</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-black text-slate-800 text-xl leading-tight">{selectedBall.brand} {selectedBall.model}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">CODE: <span className="text-slate-800">{selectedBall.code}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-800 font-black">{selectedBall.weight}g / {selectedBall.diameter}mm</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{selectedBall.pattern}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1">เวลาที่ยืม</label>
                  <select 
                    className="form-input w-full bg-slate-50 border-none font-bold py-3 rounded-2xl shadow-inner appearance-none" 
                    {...register('borrowTime', { required: 'กรุณาระบุเวลาที่ยืม' })}
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time} น.</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1">เวลาคืน</label>
                  <select 
                    className="form-input w-full bg-slate-50 border-none font-bold py-3 rounded-2xl shadow-inner appearance-none" 
                    {...register('returnTime', { required: 'กรุณาระบุเวลาคืน' })}
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time} น.</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1">หมายเหตุ</label>
                <textarea 
                  className="form-input w-full bg-slate-50 border-none font-bold py-4 rounded-2xl shadow-inner leading-relaxed" 
                  rows="3" 
                  placeholder="เช่น ใช้ในการฝึกซ้อมท่าตี..."
                  {...register('notes')} 
                ></textarea>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={closeBorrowModal}
                  className="flex-1 py-4 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={borrowMutation.isPending}
                  className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-2"
                >
                  {borrowMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      กำลังบันทึก...
                    </>
                  ) : 'ยืนยันการยืมอุปกรณ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Balls;
