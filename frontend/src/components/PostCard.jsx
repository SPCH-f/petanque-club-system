import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { Heart, MessageCircle, Pin, Bookmark, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import PostDetailModal from './PostDetailModal';

const PostCard = ({ post, onLike }) => {
  const [showComments, setShowComments] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const queryClient = useQueryClient();

  // Fetch comments for this post if expanded
  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const res = await api.get(`/posts/${post.id}`);
      return res.data.data.comments;
    },
    enabled: showComments
  });

  const addCommentMutation = useMutation({
    mutationFn: (text) => api.post(`/posts/${post.id}/comments`, { content: text, parent_id: replyTo?.id }),
    onSuccess: () => {
      setCommentText('');
      setReplyTo(null);
      queryClient.invalidateQueries(['comments', post.id]);
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['saved_posts']);
      toast.success('แสดงความคิดเห็นเรียบร้อย');
    },
    onError: () => toast.error('เกิดข้อผิดพลาดในการคอมเม้น')
  });

  const toggleSaveMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/save`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['saved_posts']);
      toast.success(res.data.message);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด')
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const isPinned = post.is_pinned == 1 || post.is_pinned === true;

  return (
    <div className={`post-card overflow-hidden transition-all duration-500 ${isPinned ? 'border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-slate-100' : ''}`}>
      {isPinned && (
        <div className="bg-slate-800 text-white px-5 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Pin size={12} className="fill-white" />
            ประกาศสำคัญ / ข่าวแนะนำ
          </div>
          <div className="opacity-50">FEATURED</div>
        </div>
      )}
      <div className={`p-5 ${isPinned ? 'bg-gradient-to-b from-slate-50/50 to-white' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3">
            <img
              src={post.author_avatar || `https://ui-avatars.com/api/?name=${post.author_name}&background=random`}
              alt={post.author_name}
              className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
            />
            <div>
              <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {post.author_name}
                {isPinned && (
                  <span className="text-slate-600 flex items-center text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-slate-200">
                    <Pin size={10} className="mr-1 fill-slate-600" /> ปักหมุด
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: th })}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-bold text-lg mb-2 text-slate-900">{post.title}</h3>
        <div className="text-slate-600 whitespace-pre-line text-sm leading-relaxed mb-4">
          {post.content.length > 250 && !showFullContent ? (
            <>
              {post.content.substring(0, 250)}...
              <button 
                onClick={() => setShowFullContent(true)}
                className="text-blue-600 font-bold hover:underline ml-1 inline-block"
              >
                อ่านเพิ่มเติม
              </button>
            </>
          ) : (
            <>
              {post.content}
              {post.content.length > 250 && (
                <button 
                  onClick={() => setShowFullContent(false)}
                  className="text-blue-600 font-bold hover:underline ml-2 inline-block"
                >
                  ย่อกลับ
                </button>
              )}
            </>
          )}
        </div>

        {post.image_url && (
          <div 
            className="mb-4 -mx-5 border-y border-slate-100 bg-slate-50 cursor-zoom-in group relative"
            onClick={() => setIsPreviewOpen(true)}
          >
            <img src={post.image_url} alt="post" className="w-full h-auto max-h-96 object-contain transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
               <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/30">คลิกเพื่อดูรูปเต็ม</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-all
                ${post.is_liked === 1 ? 'text-[#ed4956] scale-105' : 'text-slate-500 hover:text-[#ed4956]'}`}
            >
              <Heart 
                size={18} 
                className={post.is_liked === 1 ? 'animate-heart-pop' : ''} 
                fill={post.is_liked === 1 ? '#ed4956' : 'none'}
                style={{ color: post.is_liked === 1 ? '#ed4956' : 'currentColor' }}
              />
              <span className={post.is_liked === 1 ? 'font-bold' : ''}>{post.like_count || 0}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors
                ${showComments ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
            >
              <MessageCircle size={18} />
              <span>{post.comment_count || 0}</span>
            </button>
          </div>
          <button
            onClick={() => toggleSaveMutation.mutate()}
            className={`transition-colors ${post.is_saved ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}
          >
            <Bookmark size={18} fill={post.is_saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="bg-slate-50 border-t border-slate-100 p-5 space-y-4">
          {/* Comment List */}
          <div className="space-y-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {loadingComments ? (
              <p className="text-xs text-center text-slate-400">กำลังโหลดความเห็น...</p>
            ) : comments?.length > 0 ? (
              <div className="space-y-6">
                {comments.filter(c => !c.parent_id).map(comment => (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="flex gap-3">
                      <img
                        src={comment.user_avatar || `https://ui-avatars.com/api/?name=${comment.user_name}&background=random`}
                        alt={comment.user_name}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex-1 relative group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-800">{comment.user_name}</span>
                          <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: th })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug">{comment.content}</p>
                        <button 
                          onClick={() => {
                            setReplyTo(comment);
                          }}
                          className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle size={12} />
                          ตอบกลับ
                        </button>
                      </div>
                    </div>

                    {/* Nested Replies */}
                    <div className="ml-10 space-y-3 border-l-2 border-slate-200 pl-4">
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
                            <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-slate-200"></div>
                            <img
                              src={reply.user_avatar || `https://ui-avatars.com/api/?name=${reply.user_name}&background=random`}
                              alt={reply.user_name}
                              className="w-6 h-6 rounded-full flex-shrink-0"
                            />
                            <div className="bg-blue-50/50 p-2.5 rounded-2xl border border-blue-100 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-[11px] text-slate-800">{reply.user_name}</span>
                                {reply.role === 'admin' && <span className="px-1 py-0.5 bg-blue-600 text-white text-[7px] font-black rounded uppercase">Admin</span>}
                                <span className="text-[9px] text-slate-400 ml-auto">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: th })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-snug">
                                {reply.parent_id !== comment.id && repliedToUser && (
                                  <span className="text-blue-600 font-bold mr-1">@{repliedToUser}</span>
                                )}
                                {reply.content}
                              </p>
                               <button 
                                onClick={() => setReplyTo(reply)}
                                className="mt-1 text-[9px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                              >
                                <MessageCircle size={10} />
                                ตอบกลับ
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-slate-400 py-2">ยังไม่มีความคิดเห็น มาเป็นคนแรกที่แสดงความเห็นสิ!</p>
            )}
          </div>

          {/* Comment Input Area */}
          <div className="space-y-2">
            {replyTo && (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-xl animate-in slide-in-from-bottom-2 duration-200">
                <span className="flex items-center gap-2">
                  <MessageCircle size={12} />
                  กำลังตอบกลับคุณ {replyTo.user_name}
                </span>
                <button 
                  onClick={() => setReplyTo(null)}
                  className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder={replyTo ? `ตอบกลับคุณ ${replyTo.user_name}...` : "เขียนความคิดเห็น..."}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                disabled={addCommentMutation.isPending || !commentText.trim()}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all active:scale-95"
              >
                {addCommentMutation.isPending ? '...' : 'ส่ง'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      <PostDetailModal 
        post={post} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        onLike={onLike}
      />
    </div>
  );
};

export default PostCard;
