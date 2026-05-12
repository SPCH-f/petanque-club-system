import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FileCheck, Clock, CheckCircle, XCircle, 
  Eye, Download, User, Calendar, ExternalLink
} from 'lucide-react';

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [viewingRequest, setViewingRequest] = useState(null);

  // Fetch Requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin_approvals', filter],
    queryFn: async () => {
      const res = await api.get(`/documents/requests?status=${filter}`);
      return res.data.data;
    }
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/documents/requests/${id}/approve`),
    onSuccess: () => {
      toast.success('อนุมัติและลงลายเซ็นเรียบร้อย');
      queryClient.invalidateQueries(['admin_approvals']);
      setViewingRequest(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id) => api.post(`/documents/requests/${id}/reject`),
    onSuccess: () => {
      toast.success('ปฏิเสธคำร้องเรียบร้อย');
      queryClient.invalidateQueries(['admin_approvals']);
      setViewingRequest(null);
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">รายการอนุมัติเอกสาร</h1>
          <p className="text-slate-500 font-medium">ตรวจสอบและลงลายเซ็นดิจิทัลสำหรับคำร้องขอใช้บริการ</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {[
            { id: 'pending', label: 'รออนุมัติ', icon: Clock, color: 'text-amber-500' },
            { id: 'approved', label: 'อนุมัติแล้ว', icon: CheckCircle, color: 'text-emerald-500' },
            { id: 'rejected', label: 'ปฏิเสธแล้ว', icon: XCircle, color: 'text-red-500' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                filter === tab.id 
                  ? 'bg-slate-100 text-slate-800 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} className={filter === tab.id ? tab.color : ''} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-[2.5rem]"></div>)}
        </div>
      ) : requests?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <div 
              key={req.id} 
              className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${
                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                  req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <FileCheck size={24} />
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  {new Date(req.created_at).toLocaleDateString('th-TH')}
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-800 mb-1">{req.template_name}</h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                <User size={14} />
                <span className="font-bold">{req.user_name}</span>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setViewingRequest(req)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black hover:bg-slate-900 transition-all active:scale-95"
                >
                  <Eye size={16} />
                  ตรวจสอบ
                </button>
                {req.status === 'approved' && (
                  <button className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100">
                    <Download size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] py-20 text-center border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">ไม่มีรายการ{
            filter === 'pending' ? 'รออนุมัติ' : 
            filter === 'approved' ? 'ที่อนุมัติแล้ว' : 'ที่ถูกปฏิเสธ'
          }</h2>
          <p className="text-slate-500">เมื่อมีสมาชิกส่งคำร้องเข้ามา จะปรากฏในหน้านี้</p>
        </div>
      )}

      {/* Detail Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">รายละเอียดคำร้อง</h3>
                <p className="text-sm text-slate-500">ส่งโดย {viewingRequest.user_name} เมื่อ {new Date(viewingRequest.created_at).toLocaleString('th-TH')}</p>
              </div>
              <button 
                onClick={() => setViewingRequest(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(viewingRequest.data || {}).map(([key, value]) => (
                  <div key={key} className={`p-5 bg-slate-50 rounded-[2rem] border border-slate-100 ${Array.isArray(value) ? 'md:col-span-2' : ''}`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{key}</div>
                    <div className="font-bold text-slate-700">
                      {Array.isArray(value) ? (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200">
                                <th className="py-2 pr-2">#</th>
                                <th className="py-2 pr-2">รายการ</th>
                                <th className="py-2 pr-2 text-center">จำนวน</th>
                                <th className="py-2">รหัส</th>
                              </tr>
                            </thead>
                            <tbody>
                              {value.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100 last:border-0">
                                  <td className="py-2 pr-2 text-slate-400">{idx + 1}</td>
                                  <td className="py-2 pr-2">{item.name}</td>
                                  <td className="py-2 pr-2 text-center font-black">{item.amount}</td>
                                  <td className="py-2 text-slate-500">{item.code || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : typeof value === 'boolean' ? (
                        <span className={`px-3 py-1 rounded-full text-[10px] ${value ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          {value ? 'เลือกแล้ว' : 'ไม่ได้เลือก'}
                        </span>
                      ) : (
                        <span className="text-sm">{String(value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              {viewingRequest.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      if(window.confirm('ยืนยันที่จะปฏิเสธคำร้องนี้?')) rejectMutation.mutate(viewingRequest.id)
                    }}
                    className="px-6 py-3 text-red-500 font-black hover:bg-red-50 rounded-2xl transition-all"
                  >
                    ปฏิเสธคำร้อง
                  </button>
                  <button 
                    onClick={() => approveMutation.mutate(viewingRequest.id)}
                    disabled={approveMutation.isPending}
                    className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Clock size={20} className="animate-spin" />
                        กำลังประมวลผล...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        อนุมัติและลงลายเซ็น
                      </>
                    )}
                  </button>
                </>
              )}
              {viewingRequest.status === 'approved' && (
                <button className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-2">
                  <Download size={20} />
                  ดาวน์โหลดเอกสาร (ลงนามแล้ว)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
