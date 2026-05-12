import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User, Mail, Phone, Hash, Shield, 
  Camera, Edit2, Save, X, Key, Bookmark,
  Heart, MessageSquare
} from 'lucide-react';
import PostCard from '../../components/PostCard';
import SignatureModal from '../../components/SignatureModal';
import { getImageUrl } from '../../utils/image';

const Profile = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'saved'
  const fileInputRef = React.useRef(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      first_name: user?.first_name,
      last_name: user?.last_name,
      phone: user?.phone || '',
      student_id: user?.student_id || '',
      avatar_url: user?.avatar_url || '',
      signature_url: user?.signature_url || ''
    }
  });

  const watchedAvatar = watch('avatar_url');

  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data),
    onSuccess: (res) => {
      const updatedUser = res.data.data;
      setUser(updatedUser);
      reset({
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone || '',
        student_id: updatedUser.student_id || '',
        avatar_url: updatedUser.avatar_url || '',
        signature_url: updatedUser.signature_url || ''
      });
      toast.success('อัปเดตโปรไฟล์เรียบร้อย');
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  React.useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        student_id: user.student_id || '',
        avatar_url: user.avatar_url || '',
        signature_url: user.signature_url || ''
      });
    }
  }, [user, reset]);

  const uploadAvatar = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/upload/avatar', formData);
      return res.data.data.url;
    },
    onSuccess: (url) => {
      setValue('avatar_url', url, { shouldDirty: true });
      toast.success('อัปโหลดรูปภาพสำเร็จ');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'อัปโหลดล้มเหลว')
  });

  const uploadSignature = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('signature', file);
      const res = await api.post('/upload/signature', formData);
      return res.data.data.url;
    },
    onSuccess: (url) => {
      setValue('signature_url', url, { shouldDirty: true });
      toast.success('อัปโหลดลายเซ็นสำเร็จ');
      setIsSignatureModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'อัปโหลดลายเซ็นล้มเหลว')
  });

  const handleSignatureSave = (file) => {
    uploadSignature.mutate(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadAvatar.mutate(file);
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadSignature.mutate(file);
  };

  // Fetch Saved Posts
  const { data: savedPosts, isLoading: loadingSaved } = useQuery({
    queryKey: ['saved_posts'],
    queryFn: async () => {
      const res = await api.get('/posts/saved');
      return res.data.data;
    },
    enabled: activeTab === 'saved'
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (postId) => api.post(`/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['saved_posts']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const onSubmit = (data) => {
    updateProfile.mutate(data);
  };

  const onInvalid = (errors) => {
    const errorFields = Object.keys(errors).map(key => {
      if (key === 'first_name') return 'ชื่อจริง';
      if (key === 'last_name') return 'นามสกุล';
      return key;
    });
    toast.error('กรุณาตรวจสอบข้อมูล: ' + errorFields.join(', '));
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Signature Modal */}
      <SignatureModal 
        isOpen={isSignatureModalOpen} 
        onClose={() => setIsSignatureModalOpen(false)} 
        onSave={handleSignatureSave}
        isSaving={uploadSignature.isPending}
      />

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        <div className="relative pt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-2xl overflow-hidden">
              {watchedAvatar ? (
                <img 
                  src={getImageUrl(watchedAvatar)} 
                  alt="profile" 
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-black">
                  {user.first_name?.charAt(0)}
                </div>
              )}
            </div>
            {isEditing && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all z-10"
              >
                {uploadAvatar.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera size={18} />
                )}
              </button>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left mb-2">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {user.first_name} {user.last_name}
            </h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {user.role}
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                {user.user_type}
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`btn ${isEditing ? 'bg-slate-100 text-slate-600' : 'btn-primary'} mb-2`}
          >
            {isEditing ? <X size={18} /> : <Edit2 size={18} />}
            {isEditing ? 'ยกเลิก' : 'แก้ไขโปรไฟล์'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('info'); setIsEditing(false); }}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2">
            <User size={18} /> ข้อมูลส่วนตัว
          </div>
        </button>
        <button 
          onClick={() => { setActiveTab('saved'); setIsEditing(false); }}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'saved' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2">
            <Bookmark size={18} /> โพสต์ที่บันทึกไว้
          </div>
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">ข้อมูลส่วนตัว</h3>
              </div>

              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                <input type="hidden" {...register('avatar_url')} />
                <input type="hidden" {...register('signature_url')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">ชื่อจริง</label>
                    <input 
                      type="text" 
                      className="form-input bg-slate-50/50" 
                      disabled={!isEditing}
                      {...register('first_name', { required: 'กรุณากรอกชื่อจริง' })}
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">นามสกุล</label>
                    <input 
                      type="text" 
                      className="form-input bg-slate-50/50" 
                      disabled={!isEditing}
                      {...register('last_name', { required: 'กรุณากรอกนามสกุล' })}
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">เบอร์โทรศัพท์</label>
                    <input 
                      type="text" 
                      className="form-input bg-slate-50/50" 
                      disabled={!isEditing}
                      {...register('phone')}
                    />
                  </div>
                  <div>
                    <label className="form-label">รหัสนักศึกษา / รหัสพนักงาน</label>
                    <input 
                      type="text" 
                      className="form-input bg-slate-50/50" 
                      disabled={!isEditing}
                      {...register('student_id')}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-4 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={updateProfile.isPending}
                      className="btn btn-primary px-8 py-2.5 shadow-lg shadow-blue-600/20"
                    >
                      <Save size={18} />
                      {updateProfile.isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            {/* Signature Section for All Users */}
            <div className="card p-8 bg-gradient-to-br from-white to-slate-50 border-blue-100 border shadow-blue-50 shadow-lg animate-in fade-in zoom-in duration-500">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Edit2 size={16} className="text-blue-600" /> ลายเซ็นดิจิทัล
                </h3>
                <div className="relative group aspect-video bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden mb-4 shadow-inner">
                  {watch('signature_url') ? (
                    <img 
                      key={watch('signature_url')}
                      src={getImageUrl(watch('signature_url'))} 
                      alt="signature" 
                      className="max-w-[90%] max-h-[90%] object-contain mix-blend-multiply transition-opacity duration-300" 
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                        <Bookmark size={20} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ยังไม่มีลายเซ็น</p>
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[1px] gap-2 p-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          type="button"
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="bg-white text-slate-900 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit2 size={14} /> เซ็นตอนนี้
                        </button>
                        <button 
                          type="button"
                          onClick={() => document.getElementById('signatureInput').click()}
                          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Camera size={14} /> อัปโหลดรูป
                        </button>
                      </div>
                    </div>
                  )}
                  <input 
                    id="signatureInput"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleSignatureChange}
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed font-bold italic text-center">
                  * ลายเซ็นนี้จะใช้สำหรับเอกสารและการอนุมัติรายการต่างๆ
                </p>
              </div>

            <div className="card p-8">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">ความปลอดภัย</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                    <Mail size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">อีเมล</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">สิทธิ์การใช้งาน</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{user.role}</p>
                  </div>
                </div>
              </div>
              
              <button type="button" className="w-full mt-8 btn btn-secondary text-xs flex justify-center py-2.5">
                <Key size={14} /> เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
          {loadingSaved ? (
            <div className="py-20 text-center text-slate-400">กำลังโหลดโพสต์ที่บันทึกไว้...</div>
          ) : savedPosts?.length > 0 ? (
            savedPosts.map(post => (
              <PostCard key={post.id} post={post} onLike={(id) => toggleLikeMutation.mutate(id)} />
            ))
          ) : (
            <div className="py-24 text-center">
              <Bookmark size={64} className="mx-auto mb-4 text-slate-200" />
              <h4 className="font-bold text-slate-800 mb-1">ยังไม่มีโพสต์ที่บันทึกไว้</h4>
              <p className="text-sm text-slate-400">คุณสามารถกดปุ่มบันทึกที่โพสต์ในหน้าแรก เพื่อเก็บไว้อ่านภายหลังได้ที่นี่</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
