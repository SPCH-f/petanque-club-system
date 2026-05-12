import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar as CalendarIcon, Clock, Users, MapPin, 
  AlertCircle, CheckCircle2, ChevronRight, Info,
  X, Save, Calendar, Loader2, CircleDot
} from 'lucide-react';
import { format, addHours, startOfHour, isAfter, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const USER_TIME_OPTIONS = [
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

const ADMIN_TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const PetanquePlayerIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="5" r="3" />
    <path d="M7 13l3-2 3 2 4-2" />
    <path d="M10 11v6l-2 4" />
    <path d="M13 11v6l2 4" />
    <circle cx="18" cy="18" r="2" fill="currentColor" />
  </svg>
);

const FieldMap = ({ fields, bookings, onSelectField, selectedFieldId, currentTime }) => {
  const getFieldStatus = (fieldId) => {
    let status = 'available';
    bookings?.forEach(b => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      if (b.field_id === fieldId && currentTime >= start && currentTime < end) {
        const s = b.status?.toLowerCase();
        if (s === 'approved' || s === 'completed') status = 'booked';
        else if (s === 'pending') status = 'pending';
      }
    });
    return status;
  };

  const renderField = (num) => {
    // Fix: Use regex to match exact number to avoid "4" matching "14", "24", etc.
    const field = fields.find(f => {
      const match = f.name.match(/\d+/);
      return match && match[0] === num.toString();
    }) || { id: num, name: `สนามที่ ${num}` };
    const status = getFieldStatus(field.id);
    const isSelected = selectedFieldId === field.id;

    return (
      <button
        key={num}
        onClick={() => onSelectField(field, status !== 'available')}
        className={`relative aspect-[3/4] rounded-sm border transition-all flex flex-col items-center justify-center gap-1 font-black shadow-sm
          ${status === 'booked' 
            ? 'bg-red-500 border-red-600 text-white cursor-not-allowed shadow-inner' 
            : status === 'pending'
              ? 'bg-yellow-400 border-yellow-500 text-slate-800 cursor-not-allowed'
              : 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-400 hover:scale-105 hover:z-10'}
        `}
      >
        <span className="text-[9px] leading-none">{num}</span>
        {(status === 'booked' || status === 'pending') && <PetanquePlayerIcon size={12} className="animate-pulse" />}
      </button>
    );
  };

  const Landmark = ({ label, className = "", icon: Icon }) => (
    <div className={`bg-slate-800 text-white p-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center text-center shadow-lg ${className}`}>
      {Icon && <Icon size={14} className="mb-1" />}
      {label}
    </div>
  );

  const FieldGroup = ({ numbers, label, columns = 10, className = "" }) => (
    <div className={`bg-white/40 p-2 rounded-xl border border-slate-200/40 backdrop-blur-sm shadow-sm ${className}`}>
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 text-center">{label}</p>
      <div className={`grid gap-0.5`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {numbers.map(n => renderField(n))}
      </div>
    </div>
  );

  return (
    <div className="relative overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      <div className="min-w-[1000px] p-8 bg-slate-100 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden min-h-[700px] flex flex-col gap-8 relative">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }}></div>

        <div className="flex-1 grid grid-cols-12 gap-6 relative z-10">
          {/* Left Side Landmarks (Restroom) */}
          <div className="col-span-1 flex flex-col justify-center">
            <Landmark label="ห้องน้ำ" className="h-24 bg-slate-700" icon={X} />
          </div>

          {/* Center Grid Area */}
          <div className="col-span-11 flex flex-col gap-4">
            {/* Row 4: 59-51 & 50-41 */}
            <div className="grid grid-cols-2 gap-10">
              <FieldGroup label="สนามที่ 59 ➔ 51" numbers={Array.from({ length: 9 }, (_, i) => 59 - i)} columns={9} />
              <FieldGroup label="สนามที่ 50 ➔ 41" numbers={Array.from({ length: 10 }, (_, i) => 50 - i)} />
            </div>

            {/* Row 3: 40-31 & 30-22 */}
            <div className="grid grid-cols-2 gap-10">
              <FieldGroup label="สนามที่ 40 ➔ 31" numbers={Array.from({ length: 10 }, (_, i) => 40 - i)} />
              <FieldGroup label="สนามที่ 30 ➔ 22" numbers={Array.from({ length: 9 }, (_, i) => 30 - i)} columns={9} />
            </div>

            {/* Spanning Section: Large Field spans both Row 13-21 and Row 12-1 */}
            <div className="grid grid-cols-12 gap-8 items-start">
               {/* Left side: Large Field */}
               <div className="col-span-4 aspect-square bg-orange-50 rounded-3xl border-2 border-orange-100 shadow-inner flex flex-col items-center justify-center text-center p-4">
                  <h4 className="text-orange-700 font-black text-2xl mb-1">ลานกว้าง</h4>
                  <p className="text-red-500 text-sm font-bold uppercase tracking-tight leading-none">(สนามตะกร้อ)</p>
               </div>

               {/* Right side: Row 13-21 (top) and Row 12-1 (bottom) */}
               <div className="col-span-8 space-y-8">
                 {/* Row 2: 21-13 */}
                 <FieldGroup label="สนามที่ 21 ➔ 13" numbers={Array.from({ length: 9 }, (_, i) => 21 - i)} columns={9} />
                 
                 {/* Row 1: 12-1 */}
                 <div className="space-y-4">
                   <FieldGroup label="สนามที่ 12 ➔ 1" numbers={Array.from({ length: 12 }, (_, i) => 12 - i)} columns={12} />
                   
                   {/* Club Room at the bottom right */}
                   <div className="flex justify-end pr-4">
                     <Landmark label="ห้องชมรม" className="w-32 h-16 bg-blue-900" icon={Users} />
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Map Legend (Final Clean Version) */}
        <div className="flex flex-wrap justify-center gap-8 bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl mx-auto relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-emerald-500 rounded-lg shadow-sm"></div>
            <span className="text-sm font-bold text-slate-700">สนามว่าง (พร้อมจอง)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-yellow-400 rounded-lg shadow-sm flex items-center justify-center">
              <PetanquePlayerIcon size={12} className="text-slate-800" />
            </div>
            <span className="text-sm font-bold text-slate-700">กำลังรออนุมัติ</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-red-500 rounded-lg shadow-sm flex items-center justify-center">
              <PetanquePlayerIcon size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">จอง/อนุมัติแล้ว</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Booking = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const TIME_OPTIONS = isAdmin ? ADMIN_TIME_OPTIONS : USER_TIME_OPTIONS;

  const queryClient = useQueryClient();
  const [selectedField, setSelectedField] = useState(null);
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Set default time to next hour to avoid "past time" error
  const getDefaultTime = () => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const h = nextHour.getHours();
    if (isAdmin) {
      return `${h.toString().padStart(2, '0')}:00`;
    }
    if (h >= 15 && h <= 22) {
      return `${h.toString().padStart(2, '0')}:00`;
    }
    return '15:00';
  };
  
  const [bookingTime, setBookingTime] = useState(getDefaultTime());
  const [showModal, setShowModal] = useState(false);
  const [viewingBooking, setViewingBooking] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Reset form with new defaults when modal opens
  useEffect(() => {
    if (showModal && selectedField) {
      const end = new Date(`${bookingDate}T${bookingTime}`);
      end.setHours(end.getHours() + 1);
      
      let defaultEndTime = format(end, 'HH:mm');
      // If end time is outside options, cap it at the latest option
      if (!TIME_OPTIONS.includes(defaultEndTime)) {
        defaultEndTime = TIME_OPTIONS[TIME_OPTIONS.length - 1];
      }

      reset({
        startTime: bookingTime,
        endTime: TIME_OPTIONS.includes(defaultEndTime) ? defaultEndTime : '22:00',
        player_count: 1,
        notes: ''
      });
    }
  }, [showModal, selectedField, bookingDate, bookingTime, reset]);

  const currentSelectionDateTime = new Date(`${bookingDate}T${bookingTime}`);

  // Fetch all fields
  const { data: fields = [], isLoading: loadingFields } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const res = await api.get('/fields');
      return res.data.data;
    }
  });

  // Fetch all bookings for the selected date to show on map
  const { data: allBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings', bookingDate],
    queryFn: async () => {
      const res = await api.get(`/bookings/calendar?date=${bookingDate}`);
      return res.data.data;
    }
  });

  const getFieldStatus = (fieldId) => {
    const isBooked = allBookings.some(b => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      // Status check: Approved bookings are red. Pending can also be shown if desired.
      return b.field_id === fieldId && 
             ['approved', 'pending'].includes(b.status) &&
             currentSelectionDateTime >= start && currentSelectionDateTime < end;
    });
    return isBooked ? 'booked' : 'available';
  };

  const createBooking = useMutation({
    mutationFn: (data) => api.post('/bookings', data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['bookings']);
      setShowModal(false);
      reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'การจองล้มเหลว')
  });

  const handleSelectField = (field, isAlreadyBooked) => {
    if (isAlreadyBooked) {
      const booking = allBookings.find(b => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        return b.field_id === field.id && 
               ['approved', 'pending'].includes(b.status) &&
               currentSelectionDateTime >= start && currentSelectionDateTime < end;
      });
      
      if (booking) {
        setViewingBooking({
          ...booking,
          field_name: field.name
        });
      } else {
        toast.error('สนามนี้ถูกจองแล้วในช่วงเวลาดังกล่าว');
      }
      return;
    }

    setSelectedField(field);
    setShowModal(true);
  };

  const onSubmit = (data) => {
    const start = new Date(`${bookingDate}T${data.startTime}`);
    const end = new Date(`${bookingDate}T${data.endTime}`);

    if (isAfter(start, end)) {
      toast.error('เวลาเริ่มต้องมาก่อนเวลาสิ้นสุด');
      return;
    }

    if (parseInt(data.player_count) > 6) {
      toast.error('จำนวนผู้เล่นต้องไม่เกิน 6 คน');
      return;
    }

    createBooking.mutate({
      field_id: selectedField.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      player_count: parseInt(data.player_count),
      notes: data.notes
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
              <CalendarIcon size={24} />
            </div>
            ระบบจองสนามเปตอง
          </h2>
          <p className="text-slate-400 font-bold text-sm ml-12">เลือกวันที่และเวลาเพื่อตรวจสอบความว่างของสนาม</p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={12} /> วันที่ใช้งาน
            </label>
            <input 
              type="date" 
              className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none"
              min={format(new Date(), 'yyyy-MM-dd')}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={12} /> เวลาที่ต้องการ
            </label>
            <select 
              className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none w-32 cursor-pointer"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
            >
              {TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map View */}
      <div className="flex flex-col gap-8">
        <div className="w-full">
          {loadingFields || loadingBookings ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-24 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="font-bold">กำลังโหลดแผนผังสนาม...</p>
            </div>
          ) : (
            <FieldMap 
              fields={fields} 
              bookings={allBookings} 
              onSelectField={handleSelectField}
              selectedFieldId={selectedField?.id}
              currentTime={currentSelectionDateTime}
            />
          )}
        </div>

        {/* Rules & Info - Moved to Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-xl">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-bold">ข้อมูลการใช้งาน</h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">1</div>
                <p className="text-sm font-medium leading-snug">คลิกที่สนามสีเขียวในแผนผังเพื่อทำการจอง</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">2</div>
                <p className="text-sm font-medium leading-snug">สนามสีแดงหมายถึงมีการจองแล้วในช่วงเวลานั้น</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">3</div>
                <p className="text-sm font-medium leading-snug">เวลาเปิดให้บริการ 15:00 - 22:00 น.</p>
              </li>
            </ul>
          </div>

          <div className="card p-8 border-slate-100 shadow-lg bg-white flex flex-col justify-center">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-500" /> หมายเหตุสำคัญ
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              กรุณามาถึงสนามก่อนเวลาจอง 10 นาที เพื่อทำการยืนยันตัวตนกับเจ้าหน้าที่หรือแอดมินหน้าสนาม หากไม่มาตามเวลาที่ระบุ ระบบอาจจะตัดสิทธิ์การใช้งานของท่านเพื่อให้สมาชิกท่านอื่นใช้งานแทน
            </p>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black tracking-tight">{selectedField?.name}</h3>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                  รายละเอียดการจองสนาม
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เวลาเริ่ม</label>
                  <select 
                    className="form-input bg-slate-50 cursor-pointer"
                    {...register('startTime', { required: true })}
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เวลาสิ้นสุด</label>
                  <select 
                    className="form-input bg-slate-50 cursor-pointer"
                    {...register('endTime', { required: true })}
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวนผู้เล่น (คน)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    min="1" max="6" 
                    className={`form-input pl-10 bg-slate-50 ${errors.player_count ? 'border-red-500 ring-1 ring-red-100' : ''}`}
                    {...register('player_count', { 
                      required: 'กรุณาระบุจำนวนผู้เล่น', 
                      min: { value: 1, message: 'อย่างน้อย 1 คน' },
                      max: { value: 6, message: 'ไม่เกิน 6 คนต่อสนาม' }
                    })}
                  />
                </div>
                {errors.player_count && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.player_count.message}</p>}
              </div>

              {/* Included Equipment Info */}
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Save size={12} /> อุปกรณ์พื้นฐานที่ได้รับ (ต่อ 1 สนาม)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-50 shadow-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <CircleDot size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">ลูกแก่น</p>
                      <p className="text-[10px] text-orange-500 font-bold">จำนวน 1 ลูก</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-50 shadow-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <div className="w-4 h-4 border-2 border-current rounded-full" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">วงยืน</p>
                      <p className="text-[10px] text-orange-500 font-bold">จำนวน 1 วง</p>
                    </div>
                  </div>
                </div>
              </div>


              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเหตุ</label>
                <textarea 
                  className="form-input bg-slate-50"
                  placeholder="เช่น ทีมชมรมเปตอง"
                  rows={3}
                  {...register('notes')}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={createBooking.isPending}
                  className="btn btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-200"
                >
                  {createBooking.isPending ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : (
                    <>
                      <Save size={18} /> ยืนยันการจองสนาม
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Viewing Booking Info Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <PetanquePlayerIcon size={20} />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">ข้อมูลการจองสนาม</h3>
              </div>
              <button onClick={() => setViewingBooking(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">สถานะ: {viewingBooking.status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}</div>
                <h4 className="text-2xl font-black text-slate-800">{viewingBooking.field_name}</h4>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl text-slate-400 border border-slate-100 shadow-sm">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ผู้จองใช้งาน</p>
                    <p className="font-bold text-slate-700">{viewingBooking.user_name}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl text-slate-400 border border-slate-100 shadow-sm">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เวลาที่จองไว้</p>
                    <p className="font-bold text-slate-700">
                      {format(new Date(viewingBooking.start_time), 'HH:mm')} - {format(new Date(viewingBooking.end_time), 'HH:mm')} น.
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">วันที่ {format(new Date(viewingBooking.start_time), 'dd MMMM yyyy')}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setViewingBooking(null)}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;

