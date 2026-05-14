import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FileCheck, Clock, CheckCircle, XCircle, 
  Eye, Download, User, Calendar, ExternalLink, RotateCcw
} from 'lucide-react';

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [viewingRequest, setViewingRequest] = useState(null);

  // Fetch Requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin_approvals', filter],
    queryFn: async () => {
      // Handle 'approved' for backward compatibility
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
        
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'pending', label: 'รออนุมัติยืม', icon: Clock, color: 'text-amber-500' },
            { id: 'borrowed', label: 'กำลังยืม', icon: FileCheck, color: 'text-blue-500' },
            { id: 'returning', label: 'รออนุมัติคืน', icon: RotateCcw, color: 'text-orange-500' },
            { id: 'completed', label: 'สำเร็จ', icon: CheckCircle, color: 'text-emerald-500' },
            { id: 'rejected', label: 'ปฏิเสธ', icon: XCircle, color: 'text-red-500' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all whitespace-nowrap ${
                filter === tab.id 
                  ? 'bg-slate-100 text-slate-800 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} className={filter === tab.id ? tab.color : ''} />
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
          {requests.map(req => {
            const isReturnPhase = req.status === 'returning' || req.status === 'completed';
            const currentApprovals = isReturnPhase ? (req.return_approvals || {}) : (req.admin_approvals || {});
            const signedCount = Object.keys(currentApprovals).length;

            return (
              <div 
                key={req.id} 
                className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${
                    req.status === 'completed' || req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                    req.status === 'borrowed' ? 'bg-blue-50 text-blue-600' :
                    req.status === 'returning' ? 'bg-orange-50 text-orange-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {isReturnPhase ? <RotateCcw size={24} /> : <FileCheck size={24} />}
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {new Date(req.created_at).toLocaleDateString('th-TH')}
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-800 mb-1 line-clamp-1">{req.template_name}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                  <User size={14} />
                  <span className="font-bold">{req.user_name}</span>
                </div>

                {/* Progress Indicator */}
                <div className="mt-2 mb-6">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-1">
                    <span>{isReturnPhase ? 'การเซ็นรับคืน' : 'การเซ็นอนุมัติยืม'}</span>
                    <span>{signedCount}/1</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${isReturnPhase ? 'bg-orange-500' : 'bg-blue-600'}`} 
                      style={{ width: `${(signedCount / 1) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewingRequest(req)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black hover:bg-slate-900 transition-all active:scale-95"
                  >
                    <Eye size={16} />
                    ตรวจสอบ
                  </button>
                </div>
              </div>
            );
          })}
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

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Approval Progress Tracker */}
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">
                  {viewingRequest.status === 'returning' || viewingRequest.status === 'completed' ? 'สถานะการเซ็นรับคืน (ต้องการ 1 ท่าน)' : 'สถานะการเซ็นอนุมัติยืม (ต้องการ 1 ท่าน)'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'approver', label: 'Admin 1 (ผู้ตรวจ)' },
                    { id: 'advisor1', label: 'Admin 2 (ที่ปรึกษา 1)' },
                    { id: 'advisor2', label: 'Admin 3 (ที่ปรึกษา 2)' },
                    { id: 'president', label: 'Admin 4 (ประธาน)' }
                  ].map(role => {
                    const isReturnPhase = viewingRequest.status === 'returning' || viewingRequest.status === 'completed';
                    const signed = isReturnPhase ? viewingRequest.return_approvals?.[role.id] : viewingRequest.admin_approvals?.[role.id];
                    return (
                      <div key={role.id} className={`p-3 rounded-2xl border text-center transition-all ${
                        signed ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-200 text-slate-400 opacity-60'
                      }`}>
                        <div className="flex justify-center mb-1">
                          {signed ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div className="text-[9px] font-black uppercase leading-tight">{role.label}</div>
                        {signed && <div className="text-[8px] mt-1 font-bold">ลงชื่อแล้ว</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Return Details if available */}
              {(viewingRequest.status === 'returning' || viewingRequest.status === 'completed') && viewingRequest.return_details && (
                <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-4 px-2">ข้อมูลการส่งคืนพัสดุ</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <div className="text-[9px] font-black text-orange-300 uppercase mb-1">ตำแหน่งตอนส่งคืน</div>
                      <div className="font-bold text-slate-700">{viewingRequest.return_details.position || '-'}</div>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <div className="text-[9px] font-black text-orange-300 uppercase mb-1">วันที่แจ้งคืน</div>
                      <div className="font-bold text-slate-700">{new Date(viewingRequest.return_details.returnedAt).toLocaleString('th-TH')}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  let fields = [];
                  try {
                    fields = typeof viewingRequest.template_fields === 'string' 
                      ? JSON.parse(viewingRequest.template_fields) 
                      : (viewingRequest.template_fields || []);
                  } catch (e) {}

                  // Filter out headings and tech tags
                  const autoTags = ['bd','bm','by','d','m','y','rd','rm','ry','buser','ruser','bad1','bad2','bad3','bad4','rad1','rad2','rad3','rad4','n-user','rn-user','full_name','prefix_display','p-user','rposition','rp-user'];

                  return fields
                    .filter(f => f.type !== 'heading' && !autoTags.includes(f.name))
                    .map((field) => {
                      const key = field.name;
                      const value = viewingRequest.data?.[key];
                      const label = field.label || key;

                      // Skip if no value (unless it's a specific type we want to show)
                      if (value === undefined || value === null || value === "") return null;

                      return (
                        <div key={key} className={`p-5 bg-slate-50 rounded-[2rem] border border-slate-100 ${Array.isArray(value) ? 'md:col-span-2' : ''}`}>
                          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 px-1">{label}</div>
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
                                        <td className="py-2 pr-2">{item.name || item[Object.keys(item)[0]]}</td>
                                        <td className="py-2 pr-2 text-center font-black">{item.amount || item[Object.keys(item)[1]]}</td>
                                        <td className="py-2 text-slate-500">{item.code || item[Object.keys(item)[2]] || '-'}</td>
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
                              <span className="text-sm">{String(value || '-')}</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              {(viewingRequest.status === 'pending' || viewingRequest.status === 'returning') && (
                <>
                  <button 
                    onClick={() => {
                      if(window.confirm('ยืนยันที่จะปฏิเสธคำร้องนี้?')) rejectMutation.mutate(viewingRequest.id)
                    }}
                    className="px-6 py-3 text-red-500 font-black hover:bg-red-50 rounded-2xl transition-all"
                  >
                    ปฏิเสธ
                  </button>
                  <button 
                    onClick={() => approveMutation.mutate(viewingRequest.id)}
                    disabled={approveMutation.isPending}
                    className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Clock size={20} className="animate-spin" />
                        กำลังลงนาม...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        {viewingRequest.status === 'returning' ? 'เซ็นรับคืน' : 'อนุมัติและลงลายเซ็น'}
                      </>
                    )}
                  </button>
                </>
              )}
              {(viewingRequest.status === 'borrowed' || viewingRequest.status === 'completed' || viewingRequest.status === 'approved') && (
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `${api.defaults.baseURL}/documents/requests/${viewingRequest.id}/download`;
                    link.setAttribute('download', `${viewingRequest.template_name}.docx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                  className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-2"
                >
                  <Download size={20} />
                  โหลดเอกสาร ({viewingRequest.status === 'completed' ? 'ใบเสร็จคืน' : 'ใบยืม'})
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
