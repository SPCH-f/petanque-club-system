import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import PostCard from '../../components/PostCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { Info, Mail, Globe, Image as ImageIcon, Star, Clock, MapPin, ChevronRight, Pin, X, Phone } from 'lucide-react';
import clubLogo from '../../assets/logo ชมรมเปตอง.png';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const SidebarSection = ({ title, icon: Icon, children, actionLabel, onAction }) => (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-5">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon size={16} className="text-blue-600" />}
        {title}
      </h3>
      {actionLabel && (
        <button onClick={onAction} className="text-[10px] font-bold text-blue-600 hover:underline">
          {actionLabel}
        </button>
      )}
    </div>
    {children}
  </div>
);

const Home = () => {
  const queryClient = useQueryClient();
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);

  const scrollToPost = (postId) => {
    setIsGalleryOpen(false);
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'transition-all', 'duration-500');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4');
        }, 2000);
      }
    }, 300);
  };

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await api.get('/posts');
      return res.data.data;
    }
  });

  const toggleLike = useMutation({
    mutationFn: (postId) => api.post(`/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      queryClient.invalidateQueries(['saved_posts']);
    }
  });

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="skeleton h-10 w-48 mb-6"></div>
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-64 w-full rounded-3xl"></div>)}
    </div>
  );

  const posts = postsData || [];
  const pinnedPosts = posts.filter(p => p.is_pinned == 1);
  const regularPosts = posts.filter(p => p.is_pinned != 1);

  // Logic to check if club is open (15:00 - 22:00)
  const now = new Date();
  const currentHour = now.getHours();
  const isOpen = currentHour >= 15 && currentHour < 22;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-4 space-y-5">
          <SidebarSection title="รายละเอียด" icon={Info}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Star size={18} className="text-slate-400" />
                <span>ยังไม่มีคะแนน (0 รีวิว)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Clock size={18} className="text-slate-400" />
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {isOpen ? 'เปิดให้บริการตอนนี้' : 'ปิดให้บริการในขณะนี้'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <MapPin size={18} className="text-slate-400" />
                <span>สนามเปตอง มหาวิทยาลัยอุบลราชธานี</span>
              </div>
              <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 shadow-inner h-40 relative">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9160.685527933127!2d104.89727798993013!3d15.125699177438978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x311685218cb6fc37%3A0x8babd7791b32bd07!2z4Liq4LiZ4Liy4Lih4LiB4Li14Lis4Liy4LmA4Lib4LiV4Lit4LiHICjguKHguKvguLLguKfguLTguJfguKLguLLguKXguLHguKLguK3guLjguJrguKXguKPguLLguIrguJjguLLguJnguLUp!5e0!3m2!1sth!2sth!4v1778515891281!5m2!1sth!2sth" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="club-map"
                />
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="ข้อมูลติดต่อ" icon={Mail}>
            <div className="space-y-4">
              <a href="mailto:petanque.ubu67@gmail.com" className="flex items-center gap-3 text-sm text-blue-600 font-bold hover:underline">
                <Mail size={18} />
                petanque.ubu67@gmail.com
              </a>
              <a href="https://www.facebook.com/PETANQUEUBU" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-600 font-bold hover:text-blue-600 transition-colors group">
                <svg size={18} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 group-hover:scale-110 transition-transform">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                ชมรมเปตอง มหาวิทยาลัยอุบลราชธานี
              </a>
              <a href="https://www.tiktok.com/@petanqueubu" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-600 font-bold hover:text-pink-600 transition-colors group">
                <svg size={18} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600 group-hover:scale-110 transition-transform">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                  <polyline points="15 9 10 9 10 17"></polyline>
                </svg>
                @petanqueubu (TikTok)
              </a>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                <div className="p-1 bg-green-50 rounded-lg">
                   <Phone size={18} className="text-green-600" />
                </div>
                08X-XXX-XXXX (สอบถามข้อมูล)
              </div>
            </div>
          </SidebarSection>

          <SidebarSection 
            title="รูปภาพ" 
            icon={ImageIcon} 
            actionLabel="ดูรูปภาพทั้งหมด"
            onAction={() => setIsGalleryOpen(true)}
          >
            <div className="grid grid-cols-3 gap-2">
              {posts.filter(p => p.image_url).slice(0, 9).map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => setIsGalleryOpen(true)}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100 group cursor-pointer"
                >
                  <img src={p.image_url} alt="gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
              {posts.filter(p => p.image_url).length === 0 && (
                <div className="col-span-3 py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ไม่มีรูปภาพ
                </div>
              )}
            </div>
          </SidebarSection>
        </div>

        {/* ── Main Content Area ── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Recommended (Pinned) Section */}
          {pinnedPosts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                  <Pin size={16} className="text-slate-800 fill-slate-800" />
                  แนะนำ / ประกาศสำคัญ
                </h3>
              </div>
              <Swiper
                modules={[Pagination, Navigation, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 1.2 },
                  1024: { slidesPerView: 1.5 }
                }}
                pagination={{ clickable: true, dynamicBullets: true }}
                navigation
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                className="pb-12"
              >
                {pinnedPosts.map(post => (
                  <SwiperSlide key={post.id}>
                    <div id={`post-${post.id}`} className="h-full transform transition-transform hover:scale-[1.02] duration-300 rounded-[2.5rem]">
                      <PostCard 
                        post={post} 
                        onLike={(id) => toggleLike.mutate(id)} 
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* Regular Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-[0.2em]">
                ข่าวสารล่าสุด
              </h3>
            </div>

            {regularPosts.map(post => (
              <div key={post.id} id={`post-${post.id}`} className="transition-all duration-500 rounded-[2.5rem]">
                <PostCard post={post} onLike={(id) => toggleLike.mutate(id)} />
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center p-20 bg-white rounded-[2.5rem] border border-dashed border-slate-300 shadow-inner">
                <p className="text-slate-400 font-bold">ไม่มีข่าวสารในขณะนี้</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Photo Gallery Modal ── */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300 p-4 sm:p-10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black text-white">รูปภาพทั้งหมด</h3>
              <p className="text-slate-400 text-sm font-bold">จากข่าวสารชมรมทั้งหมด</p>
            </div>
            <button 
              onClick={() => setIsGalleryOpen(false)}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {posts.filter(p => p.image_url).map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => scrollToPost(p.id)}
                  className="aspect-square rounded-3xl overflow-hidden border-2 border-white/10 hover:border-blue-500 transition-all group relative cursor-pointer"
                >
                  <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="gallery-item" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-[10px] text-white font-bold line-clamp-1">{p.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
