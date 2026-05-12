import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { CircleDot, Clock, ShieldCheck, AlertCircle, X, Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

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
    // Set default borrow time to now, and return time to 2 hours later
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    reset({
      borrowTime: format(now, 'HH:mm'),
      returnTime: format(twoHoursLater, 'HH:mm')
    });
  };

  const closeBorrowModal = () => {
    setSelectedBall(null);
    setBorrowModalOpen(false);
    reset();
  };

  const onBorrowSubmit = (data) => {
    // Construct loan_start and loan_end datetimes
    const now = new Date();
    
    const start = new Date(now);
    const [sH, sM] = data.borrowTime.split(':');
    start.setHours(parseInt(sH), parseInt(sM), 0);

    const end = new Date(now);
    const [eH, eM] = data.returnTime.split(':');
    end.setHours(parseInt(eH), parseInt(eM), 0);
    
    // Logic for next-day return if end < start
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

  // Extract unique brands, models, and weights with memoization to prevent infinite loops
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

  // Reset model filter if it's no longer available for the selected brand
  React.useEffect(() => {
    if (modelFilter !== 'all' && !uniqueModels.includes(modelFilter)) {
      setModelFilter('all');
    }
  }, [uniqueModels, modelFilter]);

  if (loadingBalls || loadingLoans) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center text-blue-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="font-medium">กำลังโหลดข้อมูลอุปกรณ์...</p>
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
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ยืมลูกเปตอง</h2>
          <p className="text-slate-500 text-sm">ค้นหาและยืมอุปกรณ์จากคลังส่วนกลาง</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="sm:col-span-2 lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm transition-all"
              placeholder="ค้นหารหัส, รุ่น หรือ แบรนด์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm appearance-none cursor-pointer transition-all"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="all">ทุกแบรนด์</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CircleDot size={16} className="text-slate-400" />
            </div>
          </div>

          <div className="relative">
            <select
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm appearance-none cursor-pointer transition-all"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            >
              <option value="all">ทุกรุ่น</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CircleDot size={16} className="text-slate-400" />
            </div>
          </div>

          <div className="relative">
            <select
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm appearance-none cursor-pointer transition-all"
              value={weightFilter}
              onChange={(e) => setWeightFilter(e.target.value)}
            >
              <option value="all">ทุกน้ำหนัก</option>
              {uniqueWeights.map(weight => (
                <option key={weight} value={String(weight)}>{weight} g</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CircleDot size={16} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Balls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBalls.map(ball => (
          <div key={ball.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500 flex flex-col group overflow-hidden">
            {/* Ball Image Header */}
            <div className="h-44 bg-slate-100 relative overflow-hidden">
              {ball.image_url ? (
                <img src={ball.image_url} alt={ball.brand} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400">
                  <CircleDot size={48} className="opacity-20" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                {getStatusBadge(ball.status)}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="font-black text-white text-lg leading-tight">{ball.brand}</h3>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">{ball.model}</p>
              </div>
            </div>
            
            <div className="p-5 space-y-4 flex-1 flex flex-col">
              <div className="space-y-2 text-sm text-slate-500 flex-1">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">รหัสอุปกรณ์</span>
                   <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs font-black text-slate-700 border border-slate-200">{ball.code}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">น้ำหนัก</p>
                    <p className="font-bold text-slate-700">{ball.weight ? `${ball.weight} g` : '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">ขนาด</p>
                    <p className="font-bold text-slate-700">{ball.diameter ? `${ball.diameter} mm` : '-'}</p>
                  </div>
                </div>
                <p className="flex items-center gap-2 pt-1"><span className="text-[10px] font-black text-slate-400 uppercase">ลวดลาย:</span> <span className="font-bold text-slate-600">{ball.pattern || '-'}</span></p>
                
                {ball.condition_note && (
                  <div className="text-orange-600 text-[10px] mt-2 bg-orange-50 p-2 rounded-xl flex gap-2 items-start border border-orange-100 font-bold leading-tight">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{ball.condition_note}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => openBorrowModal(ball)}
                disabled={ball.status !== 'available'}
                className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  ball.status === 'available' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {ball.status === 'available' ? 'ทำเรื่องขอยืม' : 'ไม่พร้อมใช้งาน'}
              </button>
            </div>
          </div>
        ))}
        {filteredBalls.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
            <CircleDot size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-lg font-medium text-slate-400">ไม่พบข้อมูลลูกเปตองที่ค้นหา</p>
          </div>
        )}
      </div>

      {/* Borrow Modal */}
      {borrowModalOpen && selectedBall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" />
                ยืนยันการยืมอุปกรณ์
              </h3>
              <button onClick={closeBorrowModal} className="text-blue-400 hover:text-blue-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onBorrowSubmit)} className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">อุปกรณ์ที่ต้องการยืม:</p>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 text-lg leading-tight">{selectedBall.brand} {selectedBall.model}</p>
                    <p className="text-xs text-slate-500 mt-1">รหัส: <span className="font-mono font-bold text-slate-700">{selectedBall.code}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">{selectedBall.weight}g / {selectedBall.diameter}mm</p>
                    <p className="text-[10px] text-slate-400">{selectedBall.pattern}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เวลาที่ยืม *</label>
                  <input 
                    type="time" 
                    className="form-input w-full" 
                    {...register('borrowTime', { required: 'กรุณาระบุเวลาที่ยืม' })} 
                  />
                  {errors.borrowTime && <p className="text-red-500 text-xs mt-1">{errors.borrowTime.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เวลาที่จะคืน *</label>
                  <input 
                    type="time" 
                    className="form-input w-full" 
                    {...register('returnTime', { required: 'กรุณาระบุเวลาคืน' })} 
                  />
                  {errors.returnTime && <p className="text-red-500 text-xs mt-1">{errors.returnTime.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ (ถ้ามี)</label>
                <textarea 
                  className="form-input w-full" 
                  rows="2" 
                  placeholder="เช่น ต้องการใช้ในงานแข่ง..."
                  {...register('notes')} 
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeBorrowModal}
                  className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={borrowMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-md shadow-blue-600/20"
                >
                  {borrowMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันการยืม'}
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
