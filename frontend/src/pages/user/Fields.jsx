import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { MapPin, Users, Info, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Fields = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: fieldsData, isLoading } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const res = await api.get('/fields');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center text-blue-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="font-medium">กำลังโหลดข้อมูลสนามเปตอง...</p>
        </div>
      </div>
    );
  }

  const fields = fieldsData || [];
  const filteredFields = fields.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': 
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">เปิดให้บริการ</span>;
      case 'maintenance': 
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 shadow-sm">อยู่ระหว่างซ่อมบำรุง</span>;
      default: 
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 shadow-sm">ปิดให้บริการ</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500 mb-2">สนามเปตองของเรา</h2>
          <p className="text-slate-500 font-medium">ดูข้อมูลและตรวจสอบสถานะของสนามเปตองทั้งหมดในคลับ</p>
        </div>
        
        <div className="w-full md:w-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full md:w-80 pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-700 font-medium placeholder-slate-400"
            placeholder="ค้นหาชื่อสนามที่ต้องการ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFields.map(field => (
          <div key={field.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            {/* Image section placeholder */}
            <div className="h-48 bg-slate-100 relative overflow-hidden">
              {field.image_url ? (
                <img src={field.image_url} alt={field.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 group-hover:scale-105 transition-transform duration-500">
                  <MapPin size={48} className="text-blue-200" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                {getStatusBadge(field.status)}
              </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{field.name}</h3>
              <p className="text-sm text-slate-500 mb-5 flex-1 line-clamp-2 leading-relaxed">
                {field.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับสนามนี้'}
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-6 border border-slate-100">
                <div className="flex items-center text-sm font-medium text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    <MapPin size={16} />
                  </div>
                  <span className="truncate">{field.location_name || 'ไม่ระบุสถานที่'}</span>
                </div>
                <div className="flex items-center text-sm font-medium text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                    <Users size={16} />
                  </div>
                  <span>รองรับได้สูงสุด <span className="font-bold text-emerald-700">{field.max_players}</span> คน/รอบ</span>
                </div>
              </div>

              <div className="mt-auto flex gap-3">
                <button 
                  onClick={() => navigate('/booking', { state: { selectedFieldId: field.id } })}
                  disabled={field.status !== 'active'}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    field.status === 'active' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:shadow-blue-600/20 active:scale-95' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Calendar size={18} />
                  {field.status === 'active' ? 'จองสนามนี้' : 'ไม่เปิดให้จอง'}
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredFields.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Info size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">ไม่พบข้อมูลสนาม</h3>
            <p className="text-slate-500 mt-1">ลองเปลี่ยนคำค้นหาใหม่ หรือติดต่อผู้ดูแลระบบ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fields;
