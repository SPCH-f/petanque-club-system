import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldAlert, ShieldCheck, Search, Check, X, UserX, UserCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin_users', statusFilter, searchTerm],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { 
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchTerm 
        }
      });
      return res.data.data;
    }
  });

  // Update Status Mutation
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/admin/users/${id}/status`, { status }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['admin_users']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Update Role Mutation
  const updateRole = useMutation({
    mutationFn: ({ id, role }) => api.put(`/admin/users/${id}/role`, { role }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['admin_users']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</div>;

  const users = usersData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">จัดการรายชื่อสมาชิก</h2>
          <p className="text-slate-500 text-sm font-medium">ตรวจสอบข้อมูล อนุมัติการสมัคร และระงับสิทธิ์ผู้ใช้</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 p-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ, Username หรือ อีเมล..." 
              className="form-input pl-12 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-input sm:w-56 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">กรองตามสถานะ: ทั้งหมด</option>
            <option value="pending">รอการอนุมัติ (Pending)</option>
            <option value="active">ใช้งานปกติ (Active)</option>
            <option value="suspended">ระงับการใช้งาน (Suspended)</option>
          </select>
        </div>

        {/* Table View (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto -mx-6 sm:mx-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">ชื่อผู้ใช้ / ข้อมูลติดต่อ</th>
                <th className="px-6 py-4">ประเภท</th>
                <th className="px-6 py-4">วันที่สมัคร</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg group-hover:scale-110 transition-transform overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            user.first_name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">@{user.username}</span>
                            <span className="text-[10px] text-slate-400">{user.email}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">📞 {user.phone || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">{user.user_type}</span>
                        {user.student_id && <p className="text-[10px] text-slate-400 font-mono text-xs uppercase tracking-tighter">ID: {user.student_id}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-500 font-medium text-xs">{format(new Date(user.created_at), 'dd MMM yyyy', { locale: th })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-green-100 text-green-700 w-max">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ACTIVE
                          </span>
                        )}
                        {user.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 w-max">
                            <AlertCircle size={12}/> PENDING
                          </span>
                        )}
                        {user.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700 w-max">
                            <UserX size={12}/> SUSPENDED
                          </span>
                        )}
                        
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-600 mt-1 uppercase">
                            <ShieldCheck size={12}/> Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {user.status === 'pending' && (
                          <button 
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-green-200 transition-all font-bold text-xs"
                          >
                            <Check size={14} /> อนุมัติ
                          </button>
                        )}
                        
                        {user.status === 'active' && (
                          <>
                            {user.role === 'user' ? (
                              <button 
                                onClick={() => updateRole.mutate({ id: user.id, role: 'admin' })}
                                className="flex items-center gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
                                title="ตั้งเป็นผู้ดูแล"
                              >
                                <ShieldCheck size={14} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => updateRole.mutate({ id: user.id, role: 'user' })}
                                className="flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-600 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
                                title="ถอดจากผู้ดูแล"
                              >
                                <Shield size={14} />
                              </button>
                            )}
                            <button 
                              onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                              className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
                              title="ระงับการใช้งาน"
                            >
                              <UserX size={14} />
                            </button>
                          </>
                        )}

                        {user.status === 'suspended' && (
                          <button 
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                            className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
                          >
                            <UserCheck size={14} /> ปลดระงับ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                    ไม่พบข้อมูลผู้ใช้ที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card View (Visible on Mobile Only) */}
        <div className="md:hidden space-y-4">
          {users.length > 0 ? (
            users.map(user => (
              <div key={user.id} className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg overflow-hidden shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.first_name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{user.first_name} {user.last_name}</h3>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {user.status === 'active' && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVE</span>}
                    {user.status === 'pending' && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">PENDING</span>}
                    {user.status === 'suspended' && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">SUSPENDED</span>}
                    {user.role === 'admin' && <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest">Admin</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">ประเภท / รหัสนิสิต</p>
                    <p className="font-bold text-slate-700">{user.user_type}</p>
                    {user.student_id && <p className="text-slate-500 font-mono">{user.student_id}</p>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">ข้อมูลติดต่อ</p>
                    <p className="text-slate-700 font-medium truncate">{user.email}</p>
                    <p className="text-slate-700 font-medium">{user.phone || '-'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                   <p className="text-[9px] text-slate-400 font-bold uppercase">สมัครเมื่อ: {format(new Date(user.created_at), 'dd MMM yyyy', { locale: th })}</p>
                   <div className="flex gap-2">
                      {user.status === 'pending' && (
                        <button 
                          onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100"
                        >
                          อนุมัติ
                        </button>
                      )}
                      {user.status === 'active' && (
                        <>
                          <button 
                            onClick={() => updateRole.mutate({ id: user.id, role: user.role === 'admin' ? 'user' : 'admin' })}
                            className={`p-2 rounded-xl transition-all ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}
                          >
                            <ShieldCheck size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                            className="p-2 bg-red-50 text-red-600 rounded-xl"
                          >
                            <UserX size={18} />
                          </button>
                        </>
                      )}
                      {user.status === 'suspended' && (
                        <button 
                          onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          ปลดระงับ
                        </button>
                      )}
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูลผู้ใช้ที่ค้นหา</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
