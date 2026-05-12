import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Save, X, Users,
  ChevronUp, ChevronDown, Eye, EyeOff, Camera
} from 'lucide-react';
import { getImageUrl } from '../../utils/image';

const CATEGORIES = [
  { value: 'advisor', label: 'อาจารย์ที่ปรึกษาชมรม', color: 'bg-slate-600 text-white' },
  { value: 'president', label: 'ประธานชมรม', color: 'bg-yellow-500 text-white' },
  { value: 'vice', label: 'รองประธานชมรม', color: 'bg-blue-600 text-white' },
  { value: 'committee', label: 'กรรมการชมรม', color: 'bg-indigo-500 text-white' },
];

const PREFIXES = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'รศ.', 'ผศ.', 'อ.'];

const getCategoryInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[3];

// ── Member Form Modal ────────────────────────────────────────────────
const MemberFormModal = ({ member, onClose, onSave, isSaving, year }) => {
  const isEdit = !!member?.id;
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      prefix: member?.prefix || 'นาย',
      name: member?.name || '',
      nickname: member?.nickname || '',
      position: member?.position || '',
      position_en: member?.position_en || '',
      category: member?.category || 'committee',
      photo_url: member?.photo_url || '',
      sort_order: member?.sort_order || 0,
      academic_year: member?.academic_year || year || 2569,
    }
  });

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/upload/avatar', formData);
      setValue('photo_url', res.data.data.url, { shouldDirty: true });
      toast.success('อัปโหลดรูปสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.message || 'อัปโหลดรูปล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  const watchedPhoto = watch('photo_url');
  const watchedName = watch('name');

  const onInvalid = (errs) => {
    console.error('Form Validation Errors:', errs);
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วนตามที่กำหนด');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">{isEdit ? 'แก้ไขข้อมูลกรรมการ' : 'เพิ่มกรรมการใหม่'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Committee Member</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave, onInvalid)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className={`w-24 h-24 rounded-2xl ${watchedPhoto ? 'bg-white' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} overflow-hidden flex items-center justify-center shadow-xl`}>
                  {watchedPhoto ? (
                    <img src={getImageUrl(watchedPhoto)} alt="photo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-white text-3xl font-black">{watchedName?.charAt(0) || '?'}</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
              <input type="hidden" {...register('photo_url')} />
              <p className="text-[10px] text-slate-400 font-bold">คลิกไอคอนกล้องเพื่ออัปโหลดรูปภาพ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prefix */}
              <div>
                <label className="form-label">คำนำหน้า</label>
                <select className="form-input" {...register('prefix', { required: 'กรุณาเลือกคำนำหน้า' })}>
                  {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.prefix && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tighter">{errors.prefix.message}</p>}
              </div>

              {/* Academic Year */}
              <div>
                <label className="form-label">ปีการศึกษา</label>
                <input type="number" className="form-input" {...register('academic_year', { required: 'กรุณากรอกปีการศึกษา', valueAsNumber: true })} />
                {errors.academic_year && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tighter">{errors.academic_year.message}</p>}
              </div>

              {/* Name - full width */}
              <div className="sm:col-span-2">
                <label className="form-label">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input type="text" className="form-input" placeholder="เช่น สมชาย ใจดี" {...register('name', { required: 'กรุณากรอกชื่อ' })} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Nickname */}
              <div>
                <label className="form-label">ชื่อเล่น (ฉายา)</label>
                <input type="text" className="form-input" placeholder="เช่น POOM" {...register('nickname')} />
              </div>

              {/* Category */}
              <div>
                <label className="form-label">ประเภท <span className="text-red-500">*</span></label>
                <select className="form-input" {...register('category', { required: 'กรุณาเลือกประเภท' })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase tracking-tighter">{errors.category.message}</p>}
              </div>

              {/* Position TH */}
              <div className="sm:col-span-2">
                <label className="form-label">ตำแหน่ง (ภาษาไทย) <span className="text-red-500">*</span></label>
                <input type="text" className="form-input" placeholder="เช่น ประธานชมรม" {...register('position', { required: 'กรุณากรอกตำแหน่ง' })} />
                {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>}
              </div>

              {/* Position EN */}
              <div className="sm:col-span-2">
                <label className="form-label">ตำแหน่ง (ภาษาอังกฤษ)</label>
                <input type="text" className="form-input" placeholder="e.g. Club President" {...register('position_en')} />
              </div>

              {/* Sort Order */}
              <div>
                <label className="form-label">ลำดับที่แสดง</label>
                <input type="number" className="form-input" min="0" {...register('sort_order', { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              ยกเลิก
            </button>
            <button type="submit" disabled={isSaving} className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-slate-300 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              {isSaving ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มกรรมการ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Admin Page ──────────────────────────────────────────────────
const AdminCommittee = () => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(2569);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Fetch years
  const { data: years = [] } = useQuery({
    queryKey: ['committee_years'],
    queryFn: async () => {
      const res = await api.get('/committee/years');
      return res.data.data;
    }
  });

  // Fetch members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['committee_members', selectedYear],
    queryFn: async () => {
      const res = await api.get(`/committee?year=${selectedYear}`);
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/committee', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['committee_members']);
      queryClient.invalidateQueries(['committee_years']);
      toast.success('เพิ่มกรรมการสำเร็จ');
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/committee/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['committee_members']);
      toast.success('อัปเดตสำเร็จ');
      setModalOpen(false);
      setEditingMember(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/committee/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['committee_members']);
      toast.success('ลบกรรมการสำเร็จ');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.put(`/committee/${id}`, { is_active: is_active ? 0 : 1 }),
    onSuccess: () => queryClient.invalidateQueries(['committee_members']),
    onError: () => toast.error('เกิดข้อผิดพลาด')
  });

  const moveMutation = useMutation({
    mutationFn: (orders) => api.put('/committee/reorder', { orders }),
    onSuccess: () => queryClient.invalidateQueries(['committee_members']),
  });

  const handleSave = (data) => {
    console.log('Submitting Member Data:', data);
    if (editingMember?.id) {
      updateMutation.mutate({ id: editingMember.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (member) => {
    if (window.confirm(`ยืนยันการลบ "${member.name}" ออกจากทำเนียบ?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  const handleMove = (index, direction) => {
    const newList = [...members];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    const orders = newList.map((m, i) => ({ id: m.id, sort_order: i + 1 }));
    moveMutation.mutate(orders);
  };

  const openAdd = () => { setEditingMember(null); setModalOpen(true); };
  const openEdit = (m) => { setEditingMember(m); setModalOpen(true); };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Modal */}
      {modalOpen && (
        <MemberFormModal
          member={editingMember}
          onClose={() => { setModalOpen(false); setEditingMember(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
          year={selectedYear}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users size={28} className="text-blue-600" /> จัดการทำเนียบกรรมการ
          </h2>
          <p className="text-slate-500 text-sm mt-1">เพิ่ม แก้ไข และจัดเรียงรายชื่อคณะกรรมการบริหารชมรม</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="form-input py-2 px-4 text-sm font-bold"
          >
            {[...new Set([...years, selectedYear])].sort((a,b) => b-a).map(y => (
              <option key={y} value={y}>ปี {y}</option>
            ))}
          </select>
          <button type="button" onClick={openAdd} className="btn btn-primary">
            <Plus size={18} /> เพิ่มกรรมการ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CATEGORIES.map(cat => {
          const count = members.filter(m => m.category === cat.value).length;
          return (
            <div key={cat.value} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className="text-2xl font-black text-slate-800">{count}</p>
              <p className="text-xs font-bold text-slate-500 mt-1">{cat.label}</p>
              <div className={`mt-2 h-1 rounded-full ${cat.color.split(' ')[0]}`} />
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-800">รายชื่อกรรมการ ปี {selectedYear}</h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{members.length} คน</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">กำลังโหลด...</div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto mb-3 text-slate-200" />
            <p className="font-bold text-slate-400">ยังไม่มีรายชื่อกรรมการ</p>
            <button type="button" onClick={openAdd} className="mt-4 btn btn-primary text-sm">+ เพิ่มกรรมการแรก</button>
          </div>
        ) : (
          <>
            {/* Desktop View (Visible on Medium+ Screens) */}
            <div className="hidden md:block divide-y divide-slate-50">
              {members.map((member, index) => {
                const catInfo = getCategoryInfo(member.category);
                return (
                  <div key={member.id} className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${!member.is_active ? 'opacity-50' : ''}`}>
                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button type="button" onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30 transition-colors">
                        <ChevronUp size={14} />
                      </button>
                      <span className="text-[10px] text-slate-400 font-black text-center w-6">{index + 1}</span>
                      <button type="button" onClick={() => handleMove(index, 1)} disabled={index === members.length - 1} className="p-1 text-slate-300 hover:text-blue-600 disabled:opacity-30 transition-colors">
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl ${member.photo_url ? 'bg-white' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md`}>
                      {member.photo_url ? (
                        <img src={getImageUrl(member.photo_url)} alt={member.name} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="text-white font-black text-lg">{member.name?.charAt(0)}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${catInfo.color}`}>{catInfo.label}</span>
                        {member.nickname && <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{member.nickname}</span>}
                        {!member.is_active && <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">ซ่อน</span>}
                      </div>
                      <p className="font-black text-slate-800 text-sm mt-0.5 truncate">{member.prefix} {member.name}</p>
                      <p className="text-xs text-blue-600 font-bold truncate">{member.position}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleActiveMutation.mutate({ id: member.id, is_active: member.is_active })}
                        title={member.is_active ? 'ซ่อน' : 'แสดง'}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                      >
                        {member.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button type="button" onClick={() => openEdit(member)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(member)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile View (Visible on Small Screens Only) */}
            <div className="md:hidden divide-y divide-slate-100">
              {members.map((member, index) => {
                const catInfo = getCategoryInfo(member.category);
                return (
                  <div key={member.id} className={`p-5 flex flex-col gap-4 ${!member.is_active ? 'bg-slate-50 opacity-70' : ''}`}>
                    <div className="flex items-center gap-4">
                      {/* Order Controls (Mobile Style) */}
                      <div className="flex flex-col bg-white border border-slate-100 rounded-xl shadow-sm">
                        <button type="button" onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30">
                          <ChevronUp size={18} />
                        </button>
                        <span className="text-xs font-black text-blue-600 text-center py-1 border-y border-slate-50">{index + 1}</span>
                        <button type="button" onClick={() => handleMove(index, 1)} disabled={index === members.length - 1} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30">
                          <ChevronDown size={18} />
                        </button>
                      </div>

                      {/* Photo */}
                      <div className={`w-16 h-16 rounded-2xl ${member.photo_url ? 'bg-white' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} overflow-hidden shadow-lg shrink-0`}>
                         {member.photo_url ? (
                           <img src={getImageUrl(member.photo_url)} alt={member.name} className="w-full h-full object-contain p-1" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">
                             {member.name?.charAt(0)}
                           </div>
                         )}
                      </div>

                      {/* Basic Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${catInfo.color}`}>
                            {catInfo.label}
                          </span>
                          {!member.is_active && <span className="text-[8px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-widest">HIDDEN</span>}
                        </div>
                        <h4 className="font-black text-slate-800 text-sm leading-tight">{member.prefix} {member.name}</h4>
                        <p className="text-[11px] text-blue-600 font-bold mt-0.5">{member.position}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        {member.nickname && <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">"{member.nickname}"</span>}
                        <span className="text-[10px] font-black text-slate-300 px-2 py-1">Sort: {member.sort_order}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: member.id, is_active: member.is_active })}
                          className={`p-2 rounded-xl transition-all ${member.is_active ? 'bg-amber-50 text-amber-500' : 'bg-slate-200 text-slate-500'}`}
                        >
                          {member.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button onClick={() => openEdit(member)} className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(member)} className="p-2 bg-red-50 text-red-500 rounded-xl">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCommittee;
