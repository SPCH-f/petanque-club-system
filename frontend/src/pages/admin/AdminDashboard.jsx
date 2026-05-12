import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  Users, Calendar, Package, AlertCircle, 
  TrendingUp, BarChart3, PieChart as PieChartIcon, 
  Clock, Phone, ArrowUpRight, CheckCircle2, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, 
  PieChart, Pie
} from 'recharts';

const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 shadow-sm`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[10px] font-black ${trend > 0 ? 'text-green-600' : 'text-slate-400'}`}>
          {trend > 0 && <ArrowUpRight size={12} />} {trend}%
        </span>
      )}
    </div>
    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value || 0}</h3>
    <p className="text-sm font-bold text-slate-400 mt-1">{title}</p>
    {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1 opacity-70">
      <CheckCircle2 size={10} className="text-green-500" /> {subtitle}
    </p>}
  </div>
);

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard/stats');
      return res.data.data;
    }
  });

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">แดชบอร์ดสรุปผล</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">ภาพรวมการใช้งานและสถานะล่าสุดของชมรมเปตอง</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="สมาชิกทั้งหมด" 
          value={stats?.totals?.users} 
          icon={Users} 
          color="bg-blue-500" 
          subtitle={`${stats?.pending?.users || 0} บัญชีรอการอนุมัติ`}
        />
        <StatCard 
          title="การจองรออนุมัติ" 
          value={stats?.pending?.bookings} 
          icon={Calendar} 
          color="bg-purple-500" 
          subtitle="รายการที่ต้องตรวจสอบ"
        />
        <StatCard 
          title="ลูกเปตอง (ชุด)" 
          value={stats?.totals?.balls} 
          icon={Package} 
          color="bg-pink-500" 
          subtitle={`${stats?.pending?.loans || 0} รายการขอยืมค้างอยู่`}
        />
        <StatCard 
          title="สนามเปตอง" 
          value={stats?.totals?.fields} 
          icon={TrendingUp} 
          color="bg-amber-500" 
          subtitle="สถานะพร้อมใช้งาน"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Trends Area Chart */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" /> สถิติการจอง (30 วันล่าสุด)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.booking_trends || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(str) => {
                    if (!str) return '';
                    const date = new Date(str);
                    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field Popularity Bar Chart */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-purple-600" /> ความนิยมการใช้สนาม
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.field_popularity || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="field_name" 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Bar dataKey="booking_count" radius={[10, 10, 10, 10]} barSize={40}>
                  {(stats?.field_popularity || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overdue / Active Loans */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-amber-600" /> รายการยืมลูกที่ยังไม่คืน
            </h3>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              แสดง {stats?.active_loans?.length || 0} รายการล่าสุด
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="pb-4">ผู้ยืม</th>
                  <th className="pb-4">อุปกรณ์</th>
                  <th className="pb-4">สถานะ</th>
                  <th className="pb-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(stats?.active_loans || []).map(loan => (
                  <tr key={loan.id} className="group">
                    <td className="py-4">
                      <p className="font-bold text-slate-800 text-sm">{loan.first_name} {loan.last_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Phone size={10} /> {loan.phone}
                      </p>
                    </td>
                    <td className="py-4">
                      <p className="text-xs font-bold text-slate-600">{loan.ball_name}</p>
                    </td>
                    <td className="py-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        loan.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                       <a href={`tel:${loan.phone}`} className="p-2 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all inline-block">
                          <Phone size={14} />
                       </a>
                    </td>
                  </tr>
                ))}
                {(!stats?.active_loans || stats?.active_loans?.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 text-sm font-medium">ไม่มีรายการค้างคืน</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Breakdown Pie Chart */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="font-black text-slate-800 flex items-center gap-2 mb-8 self-start">
            <PieChartIcon size={20} className="text-pink-600" /> สัดส่วนสมาชิก
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.user_breakdown || []}
                  dataKey="count"
                  nameKey="user_type"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {(stats?.user_breakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
            {(stats?.user_breakdown || []).map((entry, index) => (
              <div key={entry.user_type} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{entry.user_type}</span>
                <span className="text-[10px] font-black text-slate-800 ml-auto">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
