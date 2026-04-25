'use client';

import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, ShieldCheck, MapPin, Calendar } from 'lucide-react';

export default function ShipperProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Profile */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm border-b border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-200 mb-4 border-4 border-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-black text-gray-900">{user?.name}</h1>
          <div className="mt-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
            <ShieldCheck size={12} /> Shipper Đối Tác
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Thông tin cá nhân</h2>
          
          <div className="bg-white rounded-3xl p-5 space-y-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <Mail size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                <p className="text-sm font-bold text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <Phone size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Số điện thoại</p>
                <p className="text-sm font-bold text-gray-900">{user?.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <Calendar size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Ngày gia nhập</p>
                <p className="text-sm font-bold text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '---'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Hỗ trợ & Bảo mật</h2>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <span className="text-sm font-bold text-gray-700">Đổi mật khẩu</span>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 font-bold tracking-tighter">
                {'>'}
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <span className="text-sm font-bold text-gray-700">Điều khoản shipper</span>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 font-bold tracking-tighter">
                {'>'}
              </div>
            </button>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Phiên bản 1.0.4 - Sneaker Store Delivery</p>
        </div>
      </div>
    </div>
  );
}
