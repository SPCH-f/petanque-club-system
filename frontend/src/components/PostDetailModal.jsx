import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { Heart, MessageCircle, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PostDetailModal = ({ post, isOpen, onClose, onLike, isAdmin = false }) => {
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const queryClient = useQueryClient();

  // Fetch comments for this post
  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['comments', post?.id],
    queryFn: async () => {
      const res = await api.get(`/posts/${post.id}`);
      return res.data.data.comments;
    },
    enabled: !!post?.id && isOpen
  });

  const addCommentMutation = useMutation({
    mutationFn: (text) => api.post(`/posts/${post.id}/comments`, { content: text, parent_id: replyTo?.id }),
    onSuccess: () => {
      setCommentText('');
      setReplyTo(null);
      queryClient.invalidateQueries(['comments', post.id]);
      queryClient.invalidateQueries(['posts']);
      toast.success('แสดงความคิดเห็นเรียบร้อย');
    },
    onError: () => toast.error('เกิดข้อผิดพลาดในการคอมเม้น')
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/posts/${post.id}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', post.id]);
      queryClient.invalidateQueries(['posts']);
      toast.success('ลบความคิดเห็นสำเร็จ');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('ยืนยันที่จะลบความคิดเห็นนี้หรือไม่?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  if (!isOpen || !post) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-[2rem] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Pane: Image Showcase */}
        <div className="h-[40vh] md:h-full md:flex-[1.5] bg-slate-900 flex items-center justify-center relative group shrink-0">
          <img 
            src={post.image_url} 
            alt="showcase" 
            className="w-full h-full object-contain"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 md:hidden w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Right Pane: Info & Interaction */}
        <div className="flex-1 min-h-0 flex flex-col bg-white md:w-[450px] md:border-l border-slate-100">
          {/* Modal Header */}
          <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <img
                src={post.author_avatar || `https://ui-avatars.com/api/?name=${post.author_name}&background=random`}
                alt={post.author_name}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-slate-200"
              />
              <div>
                <p className="text-xs md:text-sm font-bold text-slate-800">{post.author_name}</p>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-medium">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: th })}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="hidden md:flex w-10 h-10 hover:bg-slate-100 rounded-full items-center justify-center text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
            {/* Post Body */}
            <div className="space-y-2 md:space-y-3">
              <h3 className="font-black text-lg md:text-xl text-slate-900 leading-tight">{post.title}</h3>
              <p className="text-xs md:text-sm text-slate-600 whitespace-pre-line leading-relaxed">{post.content}</p>
            </div>

            {/* Comment Section */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                ความคิดเห็น ({post.comment_count || 0})
              </h4>
              
              {loadingComments ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : comments?.length > 0 ? (
                <div className="space-y-6 pb-4">
                  {comments.filter(c => !c.parent_id).map(comment => (
                    <div key={comment.id} className="space-y-3">
                      <div className="flex gap-2 md:gap-3">
                        <img
                          src={comment.user_avatar || `https://ui-avatars.com/api/?name=${comment.user_name}&background=random`}
                          alt={comment.user_name}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0"
                        />
                        <div className="bg-slate-50 p-2.5 md:p-3 rounded-2xl border border-slate-100 flex-1 relative group">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-[10px] md:text-[11px] text-slate-800">{comment.user_name}</span>
                            <span className="text-[8px] md:text-[9px] text-slate-400 font-medium">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: th })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug">{comment.content}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button 
                              onClick={() => setReplyTo(comment)}
                              className="text-[8px] md:text-[9px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              ตอบกลับ
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-[8px] md:text-[9px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      <div className="ml-8 md:ml-10 space-y-3 border-l-2 border-slate-100 pl-3 md:pl-4">
                        {comments.filter(r => {
                          const isChild = r.parent_id === comment.id;
                          const isGrandChild = comments.some(parentReply => parentReply.id === r.parent_id && parentReply.parent_id === comment.id);
                          const isGreatGrandChild = comments.some(parentReply => {
                              const parentOfParent = comments.find(p => p.id === parentReply.parent_id);
                              return parentReply.id === r.parent_id && parentOfParent?.parent_id === comment.id;
                          });
                          return isChild || isGrandChild || isGreatGrandChild;
                        }).map(reply => {
                          const repliedToUser = comments.find(c => c.id === reply.parent_id)?.user_name;
                          return (
                            <div key={reply.id} className="flex gap-2 relative group">
                              <div className="absolute -left-3 md:-left-4 top-1/2 w-3 md:w-4 h-0.5 bg-slate-100"></div>
                              <img
                                src={reply.user_avatar || `https://ui-avatars.com/api/?name=${reply.user_name}&background=random`}
                                alt={reply.user_name}
                                className="w-5 h-5 md:w-6 md:h-6 rounded-full flex-shrink-0"
                              />
                              <div className="bg-blue-50/30 p-2 md:p-2.5 rounded-2xl border border-blue-50 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-[9px] md:text-[10px] text-slate-800">{reply.user_name}</span>
                                  <span className="text-[7px] md:text-[8px] text-slate-400 ml-auto">
                                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: th })}
                                  </span>
                                </div>
                                <p className="text-[10px] md:text-[11px] text-slate-600 leading-snug">
                                  {reply.parent_id !== comment.id && repliedToUser && (
                                    <span className="text-blue-600 font-bold mr-1">@{repliedToUser}</span>
                                  )}
                                  {reply.content}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <button 
                                    onClick={() => setReplyTo(reply)}
                                    className="text-[7px] md:text-[8px] font-bold text-blue-600 hover:text-blue-800"
                                  >
                                    ตอบกลับ
                                  </button>
                                  {isAdmin && (
                                    <button 
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="text-[7px] md:text-[8px] font-bold text-red-500 hover:text-red-700"
                                    >
                                       ลบ
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 md:py-10 text-center">
                  <MessageCircle size={28} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">ยังไม่มีความคิดเห็น</p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer Area */}
          <div className="p-4 md:p-5 border-t border-slate-100 bg-white/80 backdrop-blur-md space-y-4 pb-safe">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-6">
                <button 
                  onClick={() => onLike?.(post.id)}
                  className={`flex items-center gap-2 text-xs md:text-sm font-bold transition-all ${post.is_liked ? 'text-red-500 scale-110' : 'text-slate-500'}`}
                >
                  <Heart size={18} md:size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
                  <span>{post.like_count || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500">
                  <MessageCircle size={18} md:size={20} />
                  <span>{post.comment_count || 0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {replyTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-blue-100 text-blue-700 text-[8px] md:text-[9px] font-black rounded-lg">
                  <span className="flex items-center gap-1">
                    กำลังตอบกลับคุณ {replyTo.user_name}
                  </span>
                  <button onClick={() => setReplyTo(null)} className="p-0.5"><X size={10} /></button>
                </div>
              )}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder={replyTo ? "พิมพ์คำตอบ..." : "เขียนความคิดเห็น..."}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 md:px-4 py-2 md:py-2.5 text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={addCommentMutation.isPending || !commentText.trim()}
                  className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-2xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all"
                >
                  {addCommentMutation.isPending ? '...' : 'ส่ง'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostDetailModal;
