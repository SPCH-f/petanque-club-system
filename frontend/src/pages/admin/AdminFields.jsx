import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, Edit2, Trash2, Users, Search, X } from 'lucide-react';

const AdminFields = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Helper to determine zone from field name (e.g., "สนามที่ 5" -> Zone 1)
  const getFieldZone = (fieldName) => {
    if (!fieldName) return 3;
    const match = fieldName.match(/\d+/);
    if (!match) return 3;
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 12) return 1;
    if (num >= 13 && num <= 21) return 2;
    return 3;
  };

  // Fetch Fields
  const { data: fieldsData, isLoading } = useQuery({
    queryKey: ['admin_fields'],
    queryFn: async () => {
      const res = await api.get('/fields');
      return res.data.data;
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/fields', data),
    onSuccess: () => {
      toast.success('เพิ่มสนามสำเร็จ');
      queryClient.invalidateQueries(['admin_fields']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/fields/${id}`, data),
    onSuccess: () => {
      toast.success('อัปเดตสนามสำเร็จ');
      queryClient.invalidateQueries(['admin_fields']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/fields/${id}`),
    onSuccess: () => {
      toast.success('ลบสนามสำเร็จ');
      queryClient.invalidateQueries(['admin_fields']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const onSubmit = (data) => {
    // Convert strings to numbers if needed
    data.max_players = parseInt(data.max_players, 10);
    if (data.location_lat) data.location_lat = parseFloat(data.location_lat);
    if (data.location_lng) data.location_lng = parseFloat(data.location_lng);

    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openModal = (field = null) => {
    if (field) {
      setEditingField(field);
      setValue('name', field.name);
      setValue('description', field.description || '');
      setValue('location_name', field.location_name || '');
      setValue('max_players', field.max_players);
      setValue('status', field.status);
    } else {
      setEditingField(null);
      reset({ status: 'active', max_players: 6 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingField(null);
    reset();
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบสนามนี้? ข้อมูลการจองที่เกี่ยวข้องอาจได้รับผลกระทบ')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">กำลังโหลดข้อมูลสนาม...</div>;

  const fields = fieldsData || [];
  const filteredFields = fields
    .filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesZone = zoneFilter === 'all' || String(getFieldZone(f.name)) === zoneFilter;
      return matchesSearch && matchesZone;
    })
    .sort((a, b) => {
      const aNum = parseInt(a.name.match(/\d+/)?.[0] || 0, 10);
      const bNum = parseInt(b.name.match(/\d+/)?.[0] || 0, 10);
      return aNum - bNum;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">จัดการสนามเปตอง</h2>
          <p className="text-slate-500 text-sm">เพิ่ม แก้ไข หรือลบข้อมูลสนามในระบบ</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> เพิ่มสนามใหม่
        </button>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อสนาม..."
              className="form-input pl-10 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">กรองตามโซน:</span>
            <select
              className="form-input w-40 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl font-bold text-slate-700"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="1">โซน 1 (สนาม 1-12)</option>
              <option value="2">โซน 2 (สนาม 13-21)</option>
              <option value="3">โซน 3 (สนาม 22-59)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFields.map(field => (
            <div key={field.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{field.name}</h3>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    โซน {getFieldZone(field.name)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${field.status === 'active' ? 'bg-green-100 text-green-700' :
                    field.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                  }`}>
                  {field.status === 'active' ? 'เปิดใช้งาน' : field.status === 'maintenance' ? 'ซ่อมบำรุง' : 'ปิดใช้งาน'}
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-4 flex-1 line-clamp-2">{field.description || '-'}</p>

              <div className="space-y-2 mb-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" />
                  <span>{field.location_name || 'ไม่ระบุสถานที่'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  <span>รับได้สูงสุด {field.max_players} คน/รอบ</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => openModal(field)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="แก้ไข"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(field.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="ลบ"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {filteredFields.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-500 border border-dashed rounded-xl">
              ไม่พบข้อมูลสนาม
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingField ? 'แก้ไขข้อมูลสนาม' : 'เพิ่มสนามเปตองใหม่'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อสนาม *</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('name', { required: 'กรุณากรอกชื่อสนาม' })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียด (ตัวเลือก)</label>
                <textarea
                  className="form-input min-h-[80px]"
                  {...register('description')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">สถานที่ตั้ง</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('location_name')}
                  placeholder="เช่น ข้างตึก A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนคนสูงสุด *</label>
                  <input
                    type="number"
                    className="form-input"
                    {...register('max_players', { required: true, min: 1 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label>
                  <select className="form-input" {...register('status')}>
                    <option value="active">เปิดใช้งาน</option>
                    <option value="maintenance">ซ่อมบำรุง</option>
                    <option value="inactive">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary px-6"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFields;
