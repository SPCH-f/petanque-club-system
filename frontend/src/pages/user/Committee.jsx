import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules';
import api from '../../services/api';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/navigation';
import clubLogo from '../../assets/logo ชมรมเปตอง.png';
import petanquePattern from '../../assets/รูปลูกเปตอง.jpg';
import { getImageUrl } from '../../utils/image';

// ── สไตล์ตามประเภทกรรมการ ──────────────────────────────────────────────
const CATEGORY_STYLES = {
  advisor: {
    color: 'from-slate-600 to-slate-800',
    badge: 'bg-slate-700 text-white',
    label: 'อาจารย์ที่ปรึกษา'
  },
  president: {
    color: 'from-blue-700 to-indigo-900',
    badge: 'bg-yellow-500 text-white',
    label: 'ประธานชมรม'
  },
  vice: {
    color: 'from-blue-600 to-blue-800',
    badge: 'bg-blue-600 text-white',
    label: 'รองประธานชมรม'
  },
  committee: {
    color: 'from-indigo-500 to-indigo-700',
    badge: 'bg-indigo-500 text-white',
    label: 'กรรมการบริหาร'
  },
};

const getStyle = (cat) => CATEGORY_STYLES[cat] || CATEGORY_STYLES.committee;

const translatePosition = (posEn, fallback) => {
  if (!posEn) return fallback;
  const lower = posEn.toLowerCase();
  if (lower.includes('vice president i')) return 'รองประธานชมรมคนที่ 1';
  if (lower.includes('vice president ii')) return 'รองประธานชมรมคนที่ 2';
  if (lower.includes('club president')) return 'ประธานชมรม';
  if (lower.includes('vice president')) return 'รองประธานชมรม';
  if (lower.includes('secretary')) return 'เลขานุการชมรม';
  if (lower.includes('treasurer')) return 'เหรัญญิกชมรม';
  if (lower.includes('public relations')) return 'ประชาสัมพันธ์ชมรม';
  if (lower.includes('registrar')) return 'นายทะเบียนชมรม';
  if (lower.includes('welfare')) return 'สวัสดิการชมรม';
  if (lower.includes('equipment')) return 'พัสดุและอุปกรณ์ชมรม';
  if (lower.includes('technical')) return 'ฝ่ายเทคนิคชมรม';
  if (lower.includes('committee member')) return 'กรรมการชมรม';
  if (lower.includes('faculty advisor')) return 'อาจารย์ที่ปรึกษาชมรม';
  if (lower.includes('activities')) return 'ฝ่ายกิจกรรมและวางแผนชมรม';
  if (lower.includes('sports')) return 'ฝ่ายกีฬาชมรม';
  if (lower.includes('publicity')) return 'ฝ่ายประชาสัมพันธ์ชมรม';
  if (lower.includes('maintenance')) return 'ฝ่ายบำรุงรักษาชมรม';
  if (lower.includes('finance')) return 'ฝ่ายการเงินชมรม';
  return posEn;
};

// ── Member Card Component ─────────────────────────────────────────────
const MemberCard = ({ member, isCenter }) => {
  const style = getStyle(member.category);
  
  return (
    <div className={`relative h-full flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isCenter ? 'scale-105' : 'scale-95 opacity-80'} bg-white border border-slate-100 group`}>
      {/* Photo Section */}
      <div className="relative flex-1 bg-white overflow-hidden flex items-center justify-center p-4">
        {/* Subtle background decoration */}
        <div className={`absolute top-10 right-10 w-32 h-32 rounded-full bg-gradient-to-br ${style.color} opacity-5 blur-3xl`} />
        
        {member.photo_url ? (
          <img 
            src={getImageUrl(member.photo_url)} 
            alt={member.name} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain relative z-10 transition-all duration-700 group-hover:scale-110 opacity-0"
            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
            style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))' }}
          />
        ) : (
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${style.color} flex items-center justify-center text-white text-5xl font-black shadow-inner`}>
            {member.name?.charAt(0)}
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span className={`text-[10px] font-black px-3 py-1 rounded-lg shadow-sm ${style.badge}`}>
            {translatePosition(member.position_en, style.label)}
          </span>
        </div>
      </div>

      {/* Info Section (Clean bar at bottom) */}
      <div className="bg-slate-50/80 backdrop-blur-sm p-5 text-center border-t border-slate-100 relative z-20">
        <div className="space-y-1">
          <h3 className="text-[13px] font-black text-blue-800 leading-tight tracking-tight">
            {member.prefix}{member.name}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold">
            {member.position}
          </p>
          {member.nickname && (
            <p className="text-[9px] text-slate-400 font-medium italic mt-1">
              "{member.nickname}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────
const Committee = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedYear, setSelectedYear] = useState(2569);

  // Fetch data from API
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['committee', selectedYear],
    queryFn: async () => {
      const res = await api.get(`/committee?year=${selectedYear}`);
      return res.data.data;
    }
  });

  const activeMembers = (members || []).filter(m => m.is_active === 1);

  const displayMembers = activeMembers.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'advisor') return m.category === 'advisor';
    if (activeTab === 'committee') return m.category !== 'advisor';
    return true;
  });

  const advisorsCount = activeMembers.filter(m => m.category === 'advisor').length;
  const committeeCount = activeMembers.filter(m => m.category !== 'advisor').length;

  if (isLoading) return <div className="flex h-screen items-center justify-center p-8 text-slate-400 font-bold animate-pulse">กำลังโหลดข้อมูลทำเนียบ...</div>;

  return (
    <div className="min-h-screen space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl overflow-hidden mb-8 shadow-2xl">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={petanquePattern} 
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-bottom scale-125 translate-y-[10%] opacity-0 mix-blend-multiply transition-opacity duration-1000" 
            onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-70')}
            alt="pattern" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-blue-900/60" />
        </div>

        <div className="relative px-8 py-12 text-center text-white">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] p-3 mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" />
            <img src={clubLogo} alt="Club Logo" className="w-full h-full object-contain relative z-10" />
          </div>

          <div className="mb-2">
            <span className="inline-block bg-yellow-400/20 text-yellow-300 text-[10px] font-black px-4 py-1.5 rounded-full border border-yellow-400/30 mb-4">
              ประจำปีการศึกษา {selectedYear}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-3">
            ทำเนียบกรรมการ
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-200 mb-6">
            บริหารชมรมเปตอง
          </h2>

          <p className="text-blue-300 text-sm font-medium max-w-xl mx-auto leading-relaxed">
            คณะกรรมการบริหารชมรมเปตอง มหาวิทยาลัยอุบลราชธานี<br />
            ผู้ทำหน้าที่บริหารจัดการกิจกรรมและดูแลสมาชิกชมรม
          </p>

          <div className="flex justify-center gap-8 mt-8">
            {[
              { label: 'อาจารย์ที่ปรึกษา', value: advisorsCount },
              { label: 'คณะกรรมการ', value: committeeCount },
              { label: 'รวมทั้งสิ้น', value: activeMembers.length },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Filter ── */}
      <div className="flex justify-center gap-3 mb-8">
        {[
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'advisor', label: 'อาจารย์ที่ปรึกษา' },
          { key: 'committee', label: 'คณะกรรมการนิสิต' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); setActiveIndex(0); }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab.key
              ? 'bg-blue-700 text-white shadow-lg shadow-blue-200'
              : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Swiper Coverflow ── */}
      <div className="relative py-8">
        {displayMembers.length > 0 ? (
          <Swiper
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            slidesPerView="auto"
            coverflowEffect={{
              rotate: 40,
              stretch: 0,
              depth: 150,
              modifier: 1.5,
              slideShadows: true,
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={true}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            className="committee-swiper pb-14"
            style={{ paddingTop: '1rem', paddingBottom: '4rem' }}
          >
            {displayMembers.map((member, index) => (
              <SwiperSlide key={member.id} style={{ width: '320px', height: '480px' }}>
                <MemberCard member={member} isCenter={index === activeIndex} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="py-20 text-center text-slate-400 font-bold">ไม่พบข้อมูลกรรมการในหมวดหมู่นี้</div>
        )}
      </div>

      {/* ── Active Member Detail ── */}
      {displayMembers[activeIndex] && (
        <div className="max-w-lg mx-auto mt-2 mb-8 animate-in fade-in duration-500">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${getStyle(displayMembers[activeIndex].category).color}`} />
            <div className="p-6 flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getStyle(displayMembers[activeIndex].category).color} flex items-center justify-center text-white text-2xl font-black shadow-lg flex-shrink-0 overflow-hidden`}>
                {displayMembers[activeIndex].photo_url ? (
                  <img 
                    src={getImageUrl(displayMembers[activeIndex].photo_url)} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-0 transition-opacity duration-300" 
                    onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                    alt="active-member"
                  />
                ) : displayMembers[activeIndex].name?.charAt(0)}
              </div>
              <div className="flex-1">
                {displayMembers[activeIndex].nickname && (
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">
                    {displayMembers[activeIndex].nickname}
                  </span>
                )}
                <h3 className="text-base font-black text-slate-800 mt-1">
                  {displayMembers[activeIndex].prefix} {displayMembers[activeIndex].name}
                </h3>
                <p className="text-sm font-bold text-blue-700">{displayMembers[activeIndex].position}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {translatePosition(displayMembers[activeIndex].position_en, getStyle(displayMembers[activeIndex].category).label)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full List Grid ── */}
      <div className="mt-8">
        <h3 className="text-center text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
          รายชื่อกรรมการทั้งหมด
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {activeMembers.map(member => {
            const style = getStyle(member.category);
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className={`h-40 ${member.photo_url ? 'bg-white' : 'bg-gradient-to-br ' + style.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                  {member.photo_url ? (
                    <img 
                      src={getImageUrl(member.photo_url)} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-2 opacity-0 transition-opacity duration-500" 
                      onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                      alt="member-thumb"
                    />
                  ) : (
                    <span className="text-white text-3xl font-black relative z-10">{member.name?.charAt(0)}</span>
                  )}
                  {member.nickname && (
                    <span className="absolute top-2 right-2 text-[8px] font-black text-slate-400 bg-white/80 px-2 py-0.5 rounded-full uppercase tracking-wider">{member.nickname}</span>
                  )}
                </div>
                <div className="p-3 text-center">
                  <p className="text-[9px] text-slate-400 font-bold leading-none mb-0.5">{member.prefix}</p>
                  <p className="text-[11px] font-black text-slate-800 leading-tight">{member.name}</p>
                  <p className="text-[9px] text-blue-600 font-bold mt-1.5 leading-tight">{member.position}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-12 text-center pb-8">
        <div className="inline-flex items-center gap-3 text-[10px] font-bold text-slate-300 uppercase tracking-[0.25em]">
          <img src={clubLogo} alt="Logo" className="w-6 h-6 object-contain opacity-50" />
          <span>ชมรมเปตอง มหาวิทยาลัยอุบลราชธานี · ประจำปีการศึกษา {selectedYear}</span>
          <img src={clubLogo} alt="Logo" className="w-6 h-6 object-contain opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default Committee;
