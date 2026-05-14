import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, Plus, Trash2, Download, Eye, 
  Settings, Save, X, FileUp, Info, GripVertical
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AdminDocuments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      template: null,
      fields: [{ name: '', label: '', type: 'text', required: true, columns: '' }]
    }
  });

  const watchedTemplate = watch('template');

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "fields"
  });

  // Fetch Templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin_templates'],
    queryFn: async () => {
      const res = await api.get('/documents');
      return res.data.data;
    }
  });

  // Create/Update Template Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description || '');
      
      if (formData.template && formData.template.length > 0) {
        data.append('template', formData.template[0]);
      }
      
      data.append('fields', JSON.stringify(formData.fields));

      if (editingTemplate) {
        return api.put(`/documents/${editingTemplate.id}`, data);
      }
      return api.post('/documents', data);
    },
    onSuccess: () => {
      toast.success(editingTemplate ? 'อัปเดตเทมเพลตสำเร็จ' : 'เพิ่มเทมเพลตเอกสารสำเร็จ');
      queryClient.invalidateQueries(['admin_templates']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Delete Template Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('ลบเทมเพลตเรียบร้อย');
      queryClient.invalidateQueries(['admin_templates']);
    },
    onError: (err) => toast.error('ไม่สามารถลบเทมเพลตได้')
  });

  const onSubmit = (data) => {
    // Auto-fill empty names for headings or other fields
    const processedData = {
      ...data,
      fields: data.fields.map((f, i) => ({
        ...f,
        name: f.name || `field_${i}_${Date.now()}`
      }))
    };
    saveMutation.mutate(processedData);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  const onInvalid = (errs) => {
    console.error('Form Validation Errors:', errs);
    let errors = [];
    if (errs.name) errors.push('ชื่อเทมเพลต');
    if (errs.template) errors.push('ไฟล์เทมเพลต');
    if (errs.fields) {
      const fieldErrors = errs.fields.map((f, i) => f ? `ฟิลด์ที่ ${i + 1}` : null).filter(Boolean);
      if (fieldErrors.length > 0) errors.push(`ข้อมูลฟิลด์ (${fieldErrors.join(', ')})`);
    }
    
    toast.error(`กรุณากรอกข้อมูลให้ครบถ้วน: ${errors.join(' / ') || 'ตรวจสอบช่องสีแดง'}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    reset({
      name: '',
      description: '',
      template: null,
      fields: [{ name: '', label: '', type: 'text', required: true, columns: '' }]
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    reset({
      name: template.name,
      description: template.description || '',
      template: null,
      fields: (template.fields || []).map(f => ({
        ...f,
        columns: f.columns || ''
      }))
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">จัดการเทมเพลตเอกสาร</h1>
          <p className="text-slate-500 font-medium">อัปโหลดไฟล์ DOCX และกำหนดฟิลด์สำหรับสร้างเอกสารอัตโนมัติ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus size={20} />
          เพิ่มเทมเพลตใหม่
        </button>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-3xl"></div>)}
        </div>
      ) : templates?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="group bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
              
              <div className="relative">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl w-fit mb-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{template.name}</h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-2">{template.description || 'ไม่มีคำอธิบาย'}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                    {template.fields?.length || 0} ฟิลด์ข้อมูล
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                    DOCX → PDF
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(template)}
                      className="text-slate-400 hover:text-amber-600 transition-colors p-2"
                      title="แก้ไขเทมเพลต"
                    >
                      <Settings size={20} />
                    </button>
                    <button 
                      onClick={() => setViewingTemplate(template)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-2"
                      title="ดูรายละเอียดฟิลด์"
                    >
                      <Eye size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      if(window.confirm('ยืนยันที่จะลบเทมเพลตนี้?')) deleteMutation.mutate(template.id)
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <FileText size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">ยังไม่มีเทมเพลตเอกสาร</h2>
          <p className="text-slate-500 max-w-md mx-auto">เริ่มต้นด้วยการอัปโหลดไฟล์ DOCX ที่มี Placeholder เช่น {"{{full_name}}"}</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl font-bold">
                  {editingTemplate ? <Settings size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    {editingTemplate ? 'แก้ไขเทมเพลตเอกสาร' : 'เพิ่มเทมเพลตเอกสารใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingTemplate ? 'คุณสามารถแก้ไขข้อมูลหรืออัปโหลดไฟล์ใหม่ได้' : 'กรุณาอัปโหลดไฟล์ DOCX และกำหนดชื่อฟิลด์ที่ตรงกับในไฟล์'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">ชื่อเทมเพลต</label>
                    <input 
                      {...register('name', { required: 'กรุณาระบุชื่อเทมเพลต' })}
                      placeholder="เช่น ใบสมัครสมาชิก, หนังสือขอใช้สถานที่"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">คำอธิบาย</label>
                    <textarea 
                      {...register('description')}
                      rows={3}
                      placeholder="ระบุรายละเอียดสั้นๆ"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">
                      ไฟล์เทมเพลต (DOCX) {editingTemplate && <span className="text-indigo-500 font-normal ml-1">(ปล่อยว่างได้ถ้าไม่เปลี่ยนไฟล์)</span>}
                    </label>
                    <div className="relative group">
                      <input 
                        type="file"
                        accept=".docx"
                        {...register('template', { required: editingTemplate ? false : 'กรุณาอัปโหลดไฟล์เทมเพลต' })}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex items-center justify-center gap-3 px-5 py-8 border-2 border-dashed border-slate-200 rounded-3xl group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all text-slate-400 group-hover:text-indigo-600">
                        <FileUp size={32} />
                        <div className="text-left">
                          {watchedTemplate && watchedTemplate.length > 0 ? (
                            <>
                              <p className="font-black text-sm text-indigo-600 truncate max-w-[200px]">{watchedTemplate[0].name}</p>
                              <p className="text-xs text-indigo-400">{(watchedTemplate[0].size / 1024).toFixed(2)} KB</p>
                            </>
                          ) : (
                            <>
                              <p className="font-black text-sm uppercase">Click to upload</p>
                              <p className="text-xs">Only .docx files allowed</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {errors.template && <p className="text-red-500 text-xs mt-1 font-bold">{errors.template.message}</p>}
                  </div>
                </div>

                {/* Field Definition */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-black text-slate-700">กำหนดฟิลด์ข้อมูล</label>
                    <button 
                      type="button"
                      onClick={() => append({ name: '', label: '', type: 'text', required: true, columns: '' })}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-black flex items-center gap-1"
                    >
                      <Plus size={14} /> เพิ่มฟิลด์
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="fields">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {fields.map((field, index) => (
                              <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-4 bg-slate-50 rounded-2xl border ${snapshot.isDragging ? 'border-indigo-400 shadow-xl bg-white ring-2 ring-indigo-50' : 'border-slate-200'} space-y-3 relative group transition-all`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <div {...provided.dragHandleProps} className="text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing p-1">
                                        <GripVertical size={20} />
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={() => remove(index)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                      >
                                        <X size={18} />
                                      </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={watch(`fields.${index}.type`) === 'heading' ? 'hidden' : ''}>
                                        <input 
                                          {...register(`fields.${index}.name`, { 
                                            validate: (val, formValues) => {
                                              if (formValues.fields[index].type === 'heading') return true;
                                              return !!val || 'กรุณาระบุชื่อฟิลด์';
                                            }
                                          })}
                                          placeholder="ชื่อฟิลด์ (ใน {{ }})"
                                          className={`w-full px-3 py-2 bg-white border ${errors.fields?.[index]?.name ? 'border-red-500 ring-1 ring-red-100' : 'border-slate-200'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all`}
                                        />
                                      </div>
                                      <div className={watch(`fields.${index}.type`) === 'heading' ? 'col-span-2' : ''}>
                                        <input 
                                          {...register(`fields.${index}.label`, { required: 'กรุณาระบุหัวข้อ' })}
                                          placeholder={watch(`fields.${index}.type`) === 'heading' ? "พิมพ์ข้อความหัวข้อที่ต้องการแสดงบนหน้าเว็บ" : "หัวข้อที่จะให้ผู้ใช้เห็น"}
                                          className={`w-full px-3 py-2 bg-white border ${errors.fields?.[index]?.label ? 'border-red-500 ring-1 ring-red-100' : 'border-slate-200'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all`}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                      <select 
                                        {...register(`fields.${index}.type`)}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                      >
                                        <option value="text">Text (ข้อความบรรทัดเดียว)</option>
                                        <option value="textarea">Textarea (ข้อความยาว)</option>
                                        <option value="date">Date (วันที่)</option>
                                        <option value="number">Number (ตัวเลข)</option>
                                        <option value="checkbox">Checkbox (เครื่องหมายถูก)</option>
                                        <option value="select">Select (ตัวเลือก Dropdown)</option>
                                        <option value="table">Table (ตารางพัสดุ)</option>
                                        <option value="heading">Heading (หัวข้อส่วน)</option>
                                      </select>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" {...register(`fields.${index}.required`)} className="rounded text-indigo-600" />
                                        <span className="text-xs font-bold text-slate-500">จำเป็น</span>
                                      </label>
                                    </div>
                                    {String(watch(`fields.${index}.type`)) === 'table' && (
                                      <div className="animate-in slide-in-from-top-2 duration-200 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                        <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 ml-1">หัวข้อคอลัมน์ (คั่นด้วยคอมม่า ,)</label>
                                        <input 
                                          {...register(`fields.${index}.columns`)}
                                          placeholder="เช่น name,amount,code"
                                          className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold outline-none placeholder:font-normal"
                                        />
                                        <p className="text-[9px] text-indigo-400 mt-1 ml-1 font-medium">* ชื่อคอลัมน์ต้องตรงกับใน Word (เช่น {"{{name}}"} ต้องใส่ name)</p>
                                      </div>
                                    )}
                                    {String(watch(`fields.${index}.type`)) === 'select' && (
                                      <div className="animate-in slide-in-from-top-2 duration-200 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                        <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5 ml-1">ตัวเลือก (คั่นด้วยคอมม่า ,)</label>
                                        <input 
                                          {...register(`fields.${index}.options`)}
                                          placeholder="เช่น นาย,นาง,นางสาว"
                                          className="w-full px-3 py-2 bg-white border border-amber-100 rounded-xl text-xs font-bold outline-none placeholder:font-normal"
                                        />
                                        <p className="text-[9px] text-amber-500 mt-1 ml-1 font-medium">* ตัวอย่าง: นาย,นาง,นางสาว</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] flex gap-3 leading-relaxed">
                    <Info size={16} className="shrink-0" />
                    <p>
                      <strong>สำคัญ:</strong> ชื่อฟิลด์ต้องตรงกับ Tag ในไฟล์ Word เช่น ถ้าใน Word ใส่ {"{{full_name}}"} ชื่อฟิลด์ต้องเป็น <strong>full_name</strong> (ห้ามมีช่องว่าง)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'กำลังบันทึก...' : (editingTemplate ? 'อัปเดตเทมเพลต' : 'บันทึกเทมเพลต')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Fields Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-slate-800">รายละเอียดฟิลด์: {viewingTemplate.name}</h3>
                <button onClick={() => setViewingTemplate(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {viewingTemplate.fields?.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-xs font-black text-indigo-600 uppercase tracking-wider">{f.name}</div>
                      <div className="font-bold text-slate-700">{f.label}</div>
                    </div>
                    <div className="text-[10px] bg-white px-2 py-1 rounded-md text-slate-400 font-bold border border-slate-100">
                      {f.type.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 text-right">
                <button 
                  onClick={() => setViewingTemplate(null)}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100"
                >
                  ปิด
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;
