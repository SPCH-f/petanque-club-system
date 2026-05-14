import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, Plus, Edit2, Trash2, X, Image as ImageIcon, 
  Pin, MessageSquare, Eye, MoreVertical, Paperclip, ClipboardList, Heart 
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import PostDetailModal from '../../components/PostDetailModal';

const AdminPosts = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const watchImageUrl = watch('image_url');

  // Fetch Posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['admin_posts'],
    queryFn: async () => {
      const res = await api.get('/posts?limit=100');
      return res.data.data;
    }
  });

  // Fetch Comments for viewing
  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['admin_comments', viewingPost?.id],
    queryFn: async () => {
      const res = await api.get(`/posts/${viewingPost.id}`);
      return res.data.data.comments;
    },
    enabled: !!viewingPost && isViewModalOpen
  });

  // Create
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/posts', data),
    onSuccess: () => {
      toast.success('สร้างข่าวสารใหม่เรียบร้อย');
      queryClient.invalidateQueries(['admin_posts']);
      queryClient.invalidateQueries(['posts']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/posts/${id}`, data),
    onSuccess: () => {
      toast.success('อัปเดตข้อมูลข่าวสารสำเร็จ');
      queryClient.invalidateQueries(['admin_posts']);
      queryClient.invalidateQueries(['posts']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/posts/${id}`),
    onSuccess: () => {
      toast.success('ลบโพสต์เรียบร้อย');
      queryClient.invalidateQueries(['admin_posts']);
      queryClient.invalidateQueries(['posts']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  // Delete Comment
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/posts/${viewingPost.id}/comments/${commentId}`),
    onSuccess: () => {
      toast.success('ลบความคิดเห็นสำเร็จ');
      queryClient.invalidateQueries(['admin_comments', viewingPost.id]);
      queryClient.invalidateQueries(['admin_posts']);
      queryClient.invalidateQueries(['posts']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const onSubmit = (data) => {
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Add Comment (for Admin reply)
  const addCommentMutation = useMutation({
    mutationFn: ({ text, parentId }) => api.post(`/posts/${viewingPost.id}/comments`, { content: text, parent_id: parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin_comments', viewingPost.id]);
      queryClient.invalidateQueries(['admin_posts']);
      setReplyTo(null);
      toast.success('ตอบกลับความคิดเห็นเรียบร้อย');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const openModal = (post = null) => {
    if (post) {
      setEditingPost(post);
      setValue('title', post.title);
      setValue('content', post.content);
      setValue('image_url', post.image_url || '');
      setValue('is_pinned', post.is_pinned == 1);
    } else {
      setEditingPost(null);
      reset({ is_pinned: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
    reset();
  };

  const handleDelete = (id) => {
    if (window.confirm('ยืนยันที่จะลบข่าวสารนี้หรือไม่?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('ยืนยันที่จะลบความคิดเห็นนี้หรือไม่?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleTogglePin = (post) => {
    const newStatus = post.is_pinned == 1 ? 0 : 1;
    updateMutation.mutate({ 
      id: post.id, 
      data: { is_pinned: newStatus } 
    });
    toast.loading(newStatus ? 'กำลังปักหมุด...' : 'กำลังยกเลิกการปักหมุด...', { id: 'pin-loading' });
    setTimeout(() => toast.dismiss('pin-loading'), 1000);
  };

  if (isLoading) return (
    <div className="p-12 text-center text-slate-500">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
       กำลังโหลดข้อมูลข่าวสาร...
    </div>
  );

  const posts = postsData || [];
  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-blue-600" />
            จัดการข่าวสาร (News Feed)
          </h2>
          <p className="text-slate-500 text-sm">ประกาศข้อมูลข่าวสาร กิจกรรม และความเคลื่อนไหวของชมรม</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Plus size={18} /> สร้างประกาศใหม่
        </button>
      </div>

      <div className="card p-5">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาตามหัวข้อ หรือ เนื้อหาข่าว..." 
            className="form-input pl-10 bg-slate-50 border-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">หัวข้อประกาศ</th>
                <th className="px-6 py-4">สถิติ</th>
                <th className="px-6 py-4">วันที่ลง</th>
                <th className="px-6 py-4 rounded-tr-xl text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPosts.map(post => (
                <tr key={post.id} className={`${post.is_pinned ? 'bg-orange-50/50' : 'hover:bg-slate-50/50'} transition-colors`}>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {post.is_pinned ? (
                          <div className="p-1 bg-orange-100 rounded-lg">
                            <Pin size={16} className="text-orange-600 fill-orange-600" />
                          </div>
                        ) : post.image_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0">
                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200 border-dashed shrink-0">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="max-w-md">
                        <div className="font-bold text-slate-800 leading-tight line-clamp-1">{post.title}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1">{post.content}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1" title="ยอดเข้าชม"><Eye size={14} /> {post.view_count}</span>
                      <span className="flex items-center gap-1 text-red-500 font-bold" title="ยอดถูกใจ"><Heart size={14} className="fill-red-500" /> {post.like_count || 0}</span>
                      <span className="flex items-center gap-1" title="คอมเมนต์">
                        <MessageSquare size={14} /> {post.comment_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                    {format(new Date(post.created_at), 'dd MMM yyyy', { locale: th })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => {
                          setViewingPost(post);
                          setIsViewModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="ดูตัวอย่างโพสต์"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleTogglePin(post)}
                        className={`p-2 rounded-lg transition-all ${post.is_pinned ? 'bg-orange-100 text-orange-600 shadow-sm' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`}
                        title={post.is_pinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโพสต์'}
                      >
                        <Pin size={16} className={post.is_pinned ? 'fill-orange-600' : ''} />
                      </button>

                      <button 
                        onClick={() => openModal(post)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                    ไม่พบข้อมูลข่าวสาร
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                {editingPost ? <Edit2 size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
                {editingPost ? 'แก้ไขข้อมูลประกาศ' : 'สร้างประกาศใหม่'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">หัวข้อประกาศ *</label>
                <input 
                  type="text" 
                  className="form-input text-lg font-bold" 
                  {...register('title', { required: 'กรุณากรอกหัวข้อ' })} 
                  placeholder="เช่น 🎉 แจ้งเปิดรับสมัครสมาชิกใหม่ประจำปี..."
                />
                {errors.title && <p className="text-red-500 text-xs mt-1 font-medium">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">เนื้อหาข่าวสาร *</label>
                <textarea 
                  className="form-input min-h-[200px] leading-relaxed" 
                  {...register('content', { required: 'กรุณากรอกเนื้อหา' })} 
                  placeholder="พิมพ์รายละเอียดข่าวสารที่ต้องการสื่อสารกับสมาชิก..."
                ></textarea>
                {errors.content && <p className="text-red-500 text-xs mt-1 font-medium">{errors.content.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ImageIcon size={16} className="text-blue-500" />
                  รูปภาพหน้าปกข่าวสาร
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* URL Input */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ทางเลือก 1: ใส่ URL รูปภาพ</p>
                    <input 
                      type="text" 
                      className="form-input" 
                      {...register('image_url')} 
                      placeholder="https://example.com/image.jpg"
                      onChange={(e) => setValue('image_url', e.target.value)}
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ทางเลือก 2: อัปโหลดจากเครื่อง</p>
                    <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group">
                      <ImageIcon size={18} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600">เลือกไฟล์รูปภาพ...</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setValue('image_url', reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {watchImageUrl && (
                  <div className="relative mt-2 rounded-2xl overflow-hidden border border-slate-100 shadow-inner group">
                    <img src={watchImageUrl} alt="Preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                         type="button"
                         onClick={() => setValue('image_url', '')}
                         className="bg-white text-red-600 p-2 rounded-full shadow-xl hover:scale-110 transition-transform"
                       >
                         <X size={20} />
                       </button>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 italic">แนะนำขนาดรูปภาพ 1200x630px เพื่อความสวยงาม</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    {...register('is_pinned')} 
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800">ปักหมุดข่าวนี้ (Pinned Post)</span>
                    <p className="text-xs text-slate-500">โพสต์ที่ถูกปักหมุดจะแสดงอยู่ด้านบนสุดเสมอ</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-8">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary px-8 py-2.5 shadow-lg shadow-blue-600/20"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและประกาศ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Immersive Post Detail Modal (Shared Component) */}
      <PostDetailModal 
        post={viewingPost}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        isAdmin={true}
        onLike={(postId) => {
          api.post(`/posts/${postId}/like`).then(() => {
            queryClient.invalidateQueries(['admin_posts']);
            queryClient.invalidateQueries(['posts']);
          });
        }}
      />
    </div>
  );
};

export default AdminPosts;
