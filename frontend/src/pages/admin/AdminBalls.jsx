import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, X, CircleDot, LayoutGrid, Camera, UploadCloud } from 'lucide-react';

const AdminBalls = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [weightFilter, setWeightFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBall, setEditingBall] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch Balls
  const { data: ballsData, isLoading } = useQuery({
    queryKey: ['admin_balls'],
    queryFn: async () => {
      const res = await api.get('/balls');
      return res.data.data;
    }
  });

  const balls = React.useMemo(() => ballsData || [], [ballsData]);

  // Extract unique values for filters
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
    [...new Set(balls.map(b => b.weight))].filter(w => w != null).sort((a, b) => a - b)
  , [balls]);

  // Filtering Logic
  const filteredBalls = React.useMemo(() => {
    return balls.filter(b => {
      const search = searchTerm.toLowerCase();
      const matchSearch = (b.brand || '').toLowerCase().includes(search) || 
                          (b.model || '').toLowerCase().includes(search) || 
                          (b.code || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchBrand = brandFilter === 'all' || b.brand === brandFilter;
      const matchModel = modelFilter === 'all' || b.model === modelFilter;
      const matchWeight = weightFilter === 'all' || String(b.weight) === weightFilter;

      return matchSearch && matchStatus && matchBrand && matchModel && matchWeight;
    });
  }, [balls, searchTerm, statusFilter, brandFilter, modelFilter, weightFilter]);

  // Reset model filter if it's no longer available for the selected brand
  React.useEffect(() => {
    if (modelFilter !== 'all' && !uniqueModels.includes(modelFilter)) {
      setModelFilter('all');
    }
  }, [uniqueModels, modelFilter]);
  
  // Inventory Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/balls', data),
    onSuccess: () => {
      toast.success('เพิ่มลูกเปตองสำเร็จ');
      queryClient.invalidateQueries(['admin_balls']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/balls/${id}`, data),
    onSuccess: () => {
      toast.success('อัปเดตข้อมูลสำเร็จ');
      queryClient.invalidateQueries(['admin_balls']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/balls/${id}`),
    onSuccess: () => {
      toast.success('ลบข้อมูลสำเร็จ');
      queryClient.invalidateQueries(['admin_balls']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const res = await api.post('/upload/ball', formData);
      setValue('image_url', res.data.data.url);
      toast.success('อัปโหลดรูปภาพสำเร็จ');
    } catch (err) {
      toast.error('อัปโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data) => {
    if (data.weight) data.weight = parseInt(data.weight, 10);
    if (data.diameter) data.diameter = parseInt(data.diameter, 10);

    if (editingBall) {
      updateMutation.mutate({ id: editingBall.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openModal = (ball = null) => {
    if (ball) {
      setEditingBall(ball);
      setValue('brand', ball.brand || '');
      setValue('model', ball.model || '');
      setValue('code', ball.code || '');
      setValue('weight', ball.weight || '');
      setValue('diameter', ball.diameter || '');
      setValue('pattern', ball.pattern || '');
      setValue('image_url', ball.image_url || '');
      setValue('status', ball.status);
      setValue('condition_note', ball.condition_note || '');
    } else {
      setEditingBall(null);
      reset({ status: 'available' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBall(null);
    reset();
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบลูกเปตองนี้?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="font-medium text-slate-400">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'available': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-emerald-200">พร้อมใช้งาน</span>;
      case 'borrowed': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-blue-200">ถูกยืม</span>;
      case 'reserved': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-yellow-200">รอดำเนินการ</span>;
      case 'maintenance': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-orange-200">ซ่อมบำรุง</span>;
      case 'unavailable': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-red-200">ไม่พร้อมใช้งาน</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-2xl shadow-lg">
              <CircleDot size={24} />
            </div>
            คลังอุปกรณ์
          </h2>
          <p className="text-slate-500 font-medium">บริหารจัดการและตรวจสอบสถานะลูกเปตองทั้งหมด</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2 shadow-xl shadow-blue-200 rounded-2xl px-6 py-3">
          <Plus size={20} /> เพิ่มลูกเปตองใหม่
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหารหัส, รุ่น หรือ แบรนด์..." 
              className="form-input pl-12 bg-white border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">สถานะ</p>
              <select 
                className="form-input bg-white border-slate-200 rounded-xl font-bold text-slate-700 text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="available">พร้อมใช้งาน</option>
                <option value="borrowed">ถูกยืม</option>
                <option value="reserved">รอดำเนินการ</option>
                <option value="maintenance">ซ่อมบำรุง</option>
                <option value="unavailable">ไม่พร้อมใช้งาน</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">แบรนด์</p>
              <select 
                className="form-input bg-white border-slate-200 rounded-xl font-bold text-slate-700 text-xs"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="all">ทุกแบรนด์</option>
                {uniqueBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">รุ่น</p>
              <select 
                className="form-input bg-white border-slate-200 rounded-xl font-bold text-slate-700 text-xs"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              >
                <option value="all">ทุกรุ่น</option>
                {uniqueModels.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">น้ำหนัก</p>
              <select 
                className="form-input bg-white border-slate-200 rounded-xl font-bold text-slate-700 text-xs"
                value={weightFilter}
                onChange={(e) => setWeightFilter(e.target.value)}
              >
                <option value="all">ทุกน้ำหนัก</option>
                {uniqueWeights.map(weight => <option key={weight} value={String(weight)}>{weight} g</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table View (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-4">แบรนด์ / รุ่น</th>
                <th className="px-6 py-4">รหัสอุปกรณ์</th>
                <th className="px-6 py-4">คุณสมบัติ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-8 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBalls.map(ball => (
                <tr key={ball.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform overflow-hidden border border-slate-100">
                        {ball.image_url ? (
                          <img src={ball.image_url} alt="Ball" className="w-full h-full object-cover" />
                        ) : (
                          <CircleDot size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 leading-tight">{ball.brand}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ball.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-black text-slate-700 shadow-sm">
                      {ball.code}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-[10px] font-black text-slate-400 uppercase">น้ำหนัก</span>
                        <span className="font-bold text-slate-700">{ball.weight}g</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-[10px] font-black text-slate-400 uppercase">ขนาด</span>
                        <span className="font-bold text-slate-700">{ball.diameter}mm</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">{getStatusBadge(ball.status)}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(ball)} 
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(ball.id)} 
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card View (Visible on Mobile Only) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredBalls.map(ball => (
            <div key={ball.id} className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    {ball.image_url ? (
                      <img src={ball.image_url} alt="Ball" className="w-full h-full object-cover" />
                    ) : (
                      <CircleDot size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{ball.brand}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ball.model}</p>
                    <div className="mt-1">
                      <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-700 shadow-sm">
                        {ball.code}
                      </span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(ball.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">น้ำหนัก</p>
                  <p className="text-xs font-bold text-slate-700">{ball.weight} g</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">ขนาด</p>
                  <p className="text-xs font-bold text-slate-700">{ball.diameter} mm</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => openModal(ball)} 
                  className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100 flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> แก้ไขข้อมูล
                </button>
                <button 
                  onClick={() => handleDelete(ball.id)} 
                  className="p-2.5 bg-red-50 text-red-500 rounded-xl border border-red-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ball Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2.5rem]">
              <div>
                <h3 className="font-black text-2xl text-slate-800 tracking-tight">
                  {editingBall ? 'แก้ไขข้อมูล' : 'เพิ่มอุปกรณ์ใหม่'}
                </h3>
                <p className="text-slate-500 text-sm font-medium">ระบุรายละเอียดลูกเปตองให้ครบถ้วน</p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">แบรนด์ *</label>
                  <input type="text" className="form-input rounded-2xl border-slate-200 focus:ring-blue-500" {...register('brand', { required: 'กรุณากรอกแบรนด์' })} placeholder="เช่น LA FRANC" />
                  {errors.brand && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.brand.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">รุ่น *</label>
                  <input type="text" className="form-input rounded-2xl border-slate-200 focus:ring-blue-500" {...register('model', { required: 'กรุณากรอกรุ่น' })} placeholder="เช่น SM" />
                  {errors.model && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.model.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">รหัสลูกเปตอง *</label>
                  <input type="text" className="form-input rounded-2xl border-slate-200 font-mono uppercase focus:ring-blue-500" {...register('code', { required: 'กรุณากรอกรหัส' })} placeholder="เช่น 145HR" />
                  {errors.code && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.code.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">รูปภาพอุปกรณ์</label>
                  <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all group">
                    <div className="relative w-24 h-24 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                      {register('image_url').value || editingBall?.image_url ? (
                        <img 
                          src={register('image_url').value || editingBall?.image_url} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Camera size={32} className="text-slate-300" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold text-slate-600">อัปโหลดรูปภาพลูกเปตองจากเครื่อง</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB แนะนำเป็นรูปจตุรัสเพื่อให้แสดงผลได้สวยที่สุด</p>
                      <div className="pt-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          disabled={isUploading}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-50"
                        >
                          <UploadCloud size={14} />
                          {isUploading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์จากเครื่อง'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <input type="hidden" {...register('image_url')} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">น้ำหนัก (g)</label>
                  <input type="number" className="form-input rounded-2xl border-slate-200 focus:ring-blue-500" {...register('weight')} placeholder="680" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ขนาด (mm)</label>
                  <input type="number" className="form-input rounded-2xl border-slate-200 focus:ring-blue-500" {...register('diameter')} placeholder="72" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ลวดลาย</label>
                  <select className="form-input rounded-2xl border-slate-200 font-bold text-slate-700" {...register('pattern')}>
                    <option value="">เลือกรูปแบบ</option>
                    <option value="ลูกเกลี้ยง">ลูกเกลี้ยง</option>
                    <option value="ลูกลายเดี่ยว">ลูกลายเดี่ยว</option>
                    <option value="ลูกลายคู่">ลูกลายคู่</option>
                    <option value="ลูกลายสาม">ลูกลายสาม</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">สถานะ</label>
                  <select className="form-input rounded-2xl border-slate-200 font-bold text-slate-700" {...register('status')}>
                    <option value="available">พร้อมใช้งาน</option>
                    <option value="borrowed">ถูกยืม</option>
                    <option value="reserved">รอดำเนินการ</option>
                    <option value="maintenance">ซ่อมบำรุง</option>
                    <option value="unavailable">ไม่พร้อมใช้งาน</option>
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-2xl font-bold transition-colors">ยกเลิก</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary px-8 py-3 rounded-2xl shadow-xl shadow-blue-200">
                  บันทึกข้อมูลอุปกรณ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBalls;
