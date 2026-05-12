import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText, Download, Loader2, Search,
  ChevronRight, ArrowLeft, Send, AlertCircle, Eye,
  Plus, Trash2, Clock, CheckCircle, XCircle
} from 'lucide-react';

const TableInput = ({ name, register, errors, columnDef }) => {
  const [rows, setRows] = useState([{ id: Date.now() }]);

  const columns = React.useMemo(() => {
    // Safety check for columnDef
    const safeDef = (typeof columnDef === 'string') ? columnDef : '';

    if (!safeDef) return [
      { key: 'name', label: 'รายการ', colSpan: 'col-span-5' },
      { key: 'amount', label: 'จำนวน', colSpan: 'col-span-2' },
      { key: 'code', label: 'รหัสพัสดุ', colSpan: 'col-span-3' }
    ];

    try {
      return safeDef.split(',').map(c => {
        const parts = c.trim().split(':');
        const key = String(parts[0] || 'field');
        const label = String(parts[1] || key);
        return { key, label, colSpan: 'flex-1' };
      });
    } catch (e) {
      console.error('Error parsing columnDef:', e);
      return [{ key: 'error', label: 'Error Header', colSpan: 'flex-1' }];
    }
  }, [columnDef]);

  const addRow = () => setRows([...rows, { id: Date.now() }]);
  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-4 bg-slate-50 p-4 sm:p-6 rounded-[2rem] border border-slate-100 overflow-hidden">
      <div className={`hidden sm:flex items-center gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest`}>
        <div className="w-8 text-center shrink-0">#</div>
        {columns.map((col, i) => (
          <div key={i} className={col.colSpan}>{col.label}</div>
        ))}
        <div className="w-10 shrink-0"></div>
      </div>

      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div key={row.id} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center animate-in slide-in-from-left-2 duration-300 bg-white sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-slate-200">
            <div className="flex items-center justify-between sm:justify-center border-b sm:border-0 border-slate-50 pb-2 sm:pb-0 mb-2 sm:mb-0 w-full sm:w-8 shrink-0">
              <span className="sm:hidden text-[10px] font-black text-indigo-400 uppercase">ลำดับที่ {idx + 1}</span>
              <div className="hidden sm:block font-black text-slate-400">{idx + 1}</div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="sm:hidden p-1.5 text-red-400 hover:text-red-600 bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {columns.map((col, i) => (
              <div key={i} className={`${col.colSpan} space-y-1`}>
                <label className="sm:hidden text-[10px] font-black text-slate-400 uppercase">{col.label}</label>
                <input
                  {...register(`${name}.${idx}.${col.key}`)}
                  placeholder={col.label}
                  className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>
            ))}

            <div className="hidden sm:flex w-10 shrink-0 justify-center">
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <input type="hidden" {...register(`${name}.${idx}.#`)} value={idx + 1} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 rounded-2xl transition-all font-black text-xs"
      >
        <Plus size={18} />
        เพิ่มรายการใหม่
      </button>
    </div>
  );
};

const Documents = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'requests'
  const [viewingRequest, setViewingRequest] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch Templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['user_templates'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return res.data.data;
    }
  });

  // Fetch My Requests
  const { data: myRequests, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['my_requests'],
    queryFn: async () => {
      const res = await api.get('/documents/my-requests');
      return res.data.data;
    },
    enabled: activeTab === 'requests'
  });

  // Generate/Request Mutation
  const documentMutation = useMutation({
    mutationFn: async ({ data, action }) => {
      if (action === 'request') {
        return api.post('/documents/request-approval', {
          templateId: selectedTemplate.id,
          data
        });
      }

      const endpoint = action === 'preview' ? '/documents/preview' : '/documents/generate';
      const response = await api.post(endpoint, {
        templateId: selectedTemplate.id,
        data
      }, { responseType: 'blob' });

      return { blob: response.data, action };
    },
    onSuccess: (res, { action }) => {
      if (action === 'request') {
        toast.success('ส่งคำร้องขออนุมัติเรียบร้อยแล้ว');
        setSelectedTemplate(null);
        setActiveTab('requests');
        reset();
        refetchRequests();
        return;
      }
      const { blob } = res;
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

      if (action === 'preview') {
        setPreviewUrl(url);
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTemplate.name}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('ดาวน์โหลดเรียบร้อย');
    }
  });

  const onSubmit = (data, action) => documentMutation.mutate({ data, action });

  const handleDownload = async (requestId, fileName) => {
    try {
      const response = await api.get(`/documents/requests/${requestId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName || 'document'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('ดาวน์โหลดเรียบร้อย');
    } catch (err) {
      toast.error('ไม่สามารถดาวน์โหลดไฟล์ได้');
    }
  };

  const filteredTemplates = templates?.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedTemplate) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-0 animate-in slide-in-from-right duration-500 pb-20">
        <button
          onClick={() => setSelectedTemplate(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black mb-6 sm:mb-8 transition-colors group text-sm sm:text-base"
        >
          <ArrowLeft size={20} /> กลับไปหน้ารายการ
        </button>

        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 p-6 sm:p-10 text-white relative">
            <h2 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2 leading-tight">{selectedTemplate.name}</h2>
            <p className="text-xs sm:text-sm text-indigo-100 opacity-90">{selectedTemplate.description || 'กรุณากรอกข้อมูลเพื่อสร้างเอกสาร'}</p>
          </div>

          <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {selectedTemplate.fields.map((field, index) => {
                if (field.type === 'table') {
                  return <div key={index} className="md:col-span-2 space-y-3">
                    <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider">{field.label}</label>
                    <TableInput
                      name={field.name}
                      register={register}
                      errors={errors}
                      columnDef={field.columns}
                    />
                  </div>
                }
                return (
                  <div key={index} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs sm:text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea {...register(field.name)} rows={4} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm" />
                    ) : field.type === 'checkbox' ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input type="checkbox" {...register(field.name)} className="w-6 h-6 rounded text-indigo-600" />
                        <span className="font-bold text-slate-600">เลือกรายการนี้</span>
                      </div>
                    ) : (
                      <input type={field.type} {...register(field.name)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 transition-all" />
                    )}
                  </div>
                )
              })}
            </form>

            <div className="pt-8 border-t flex justify-end gap-4">
              <button onClick={() => setSelectedTemplate(null)} className="px-8 py-4 font-black text-slate-400">ยกเลิก</button>
              <button
                type="button"
                onClick={handleSubmit(data => onSubmit(data, 'request'))}
                disabled={documentMutation.isPending}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-100"
              >
                {documentMutation.isPending && documentMutation.variables?.action === 'request' ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                ส่งคำร้องขออนุมัติ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">เอกสารคำร้อง</h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium">เลือกเทมเพลตและกรอกข้อมูลเพื่อส่งคำร้องขออนุมัติ</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] sm:rounded-[2rem] w-fit">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 sm:px-10 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.6rem] text-xs sm:text-sm font-black transition-all ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            สร้างเอกสาร
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 sm:px-10 py-2 sm:py-3 rounded-[1.2rem] sm:rounded-[1.6rem] text-xs sm:text-sm font-black transition-all ${activeTab === 'requests' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            สถานะคำร้อง
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="space-y-8">
          {/* Search */}
          <div className="relative group max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="ค้นหาเทมเพลต..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-48 sm:h-64 bg-slate-100 animate-pulse rounded-[2.5rem]"></div>)}
            </div>
          ) : filteredTemplates?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="group bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all text-left flex flex-col relative overflow-hidden active:scale-95"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>

                  <div className="relative z-10">
                    <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                      <FileText size={28} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">{template.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6 line-clamp-2">{template.description || 'ไม่มีคำอธิบาย'}</p>
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mt-auto">
                      เลือกเทมเพลต <ChevronRight size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] sm:rounded-[4rem] py-20 sm:py-32 text-center border border-slate-50 shadow-sm">
              <Search size={48} className="mx-auto text-slate-200 mb-6" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">ไม่พบเทมเพลต</h2>
              <p className="text-slate-500">ลองใช้คำค้นหาอื่นดูครับ</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {myRequests?.length > 0 ? (
            myRequests.map(req => (
              <div key={req.id} className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className={`p-3 sm:p-4 rounded-2xl ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    <FileText size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight">{req.template_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString('th-TH')}</span>
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] font-black uppercase ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : req.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {req.status === 'approved' ? 'อนุมัติแล้ว' : req.status === 'rejected' ? 'ปฏิเสธ' : 'รอแอดมินเซ็น'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => setViewingRequest(req)}
                    className="flex-1 sm:flex-none p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border sm:border-0 border-slate-100"
                  >
                    <Eye size={20} className="mx-auto" />
                  </button>
                  {req.status === 'approved' && (
                    <button
                      onClick={() => handleDownload(req.id, req.template_name)}
                      className="flex-[2] sm:flex-none px-4 sm:px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                    >
                      <Download size={16} /> โหลดไฟล์
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[4rem] py-32 text-center border border-slate-100">
              <Clock size={48} className="mx-auto text-slate-200 mb-6" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">ไม่มีประวัติคำร้อง</h2>
              <p className="text-slate-500">คุณยังไม่ได้ส่งคำร้องขออนุมัติใดๆ</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">รายละเอียดคำร้อง</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{viewingRequest.template_name}</p>
              </div>
              <button onClick={() => setViewingRequest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <XCircle size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(viewingRequest.data || {}).map(([key, value]) => (
                  <div key={key} className={`p-5 bg-slate-50 rounded-[2rem] border border-slate-100 ${Array.isArray(value) ? 'md:col-span-2' : ''}`}>
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 px-1">{key}</div>
                    <div className="font-bold text-slate-700">
                      {Array.isArray(value) ? (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-left text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-tighter">
                                {value.length > 0 && Object.keys(value[0]).filter(k => k !== 'id' && k !== 'no' && k !== '#').map(k => (
                                  <th key={k} className="py-2 pr-2">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {value.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100 last:border-0">
                                  {Object.entries(item).filter(([k]) => k !== 'id' && k !== 'no' && k !== '#').map(([k, v], i) => (
                                    <td key={i} className="py-2 pr-2">
                                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                    </td>
                                  ))}
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
                        <span className="text-sm">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end gap-4">
              <button
                onClick={() => handleDownload(viewingRequest.id, viewingRequest.template_name)}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
              >
                <Download size={20} />
                {viewingRequest.status === 'approved' ? 'ดาวน์โหลด (เซ็นแล้ว)' : 'ดาวน์โหลดร่าง (ดูตัวอย่าง)'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full h-full max-w-5xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800">ตัวอย่างเอกสาร (PDF)</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">ตรวจสอบความถูกต้องก่อนส่งคำร้อง</p>
              </div>
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-red-500 shadow-sm"
              >
                <XCircle size={32} />
              </button>
            </div>

            <div className="flex-1 bg-slate-200 relative">
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="Document Preview"
              />
            </div>

            <div className="p-6 border-t flex justify-center bg-slate-50">
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95"
              >
                ปิดหน้าต่างตัวอย่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
