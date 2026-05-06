"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { authAPI, getFileUrl } from "../../services/api";
import toast from "react-hot-toast";
import { Camera, Loader2, Star, Award, Shield, Wallet } from "lucide-react";

type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
};

export default function ProfilePage() {
  const { user, token, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "other",
        dob: user.dob || "",
      });
      setAvatarPreview(getFileUrl(user.avatar));
    }
  }, [user, reset]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Dung lượng ảnh tối đa 1MB");
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Định dạng file không hợp lệ (chỉ JPEG, PNG)");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!token) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.phone) formData.append("phone", data.phone);
      if (data.gender) formData.append("gender", data.gender);
      if (data.dob) formData.append("dob", data.dob);
      
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      const response = await authAPI.updateProfile(formData, token);

      if (response.success) {
        toast.success("Cập nhật hồ sơ thành công!");
        if (login) {
           login(response.data, token);
        }
      } else {
        if (response.errors) {
          const firstError = Object.values(response.errors)[0] as string[];
          toast.error(firstError[0] || "Dữ liệu không hợp lệ");
        } else {
          toast.error(response.message || "Cập nhật thất bại");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="border-b border-gray-100 pb-5 mb-8">
        <h1 className="text-xl font-semibold text-gray-800">Hồ sơ của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Left Column - Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <label className="md:text-right text-gray-500 text-sm">Tên đăng nhập</label>
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={user?.email?.split('@')[0]}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <label className="md:text-right text-gray-500 text-sm">Tên hiển thị</label>
              <div className="md:col-span-3">
                <input
                  {...register("name", { required: "Vui lòng nhập tên" })}
                  type="text"
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <label className="md:text-right text-gray-500 text-sm">Email</label>
              <div className="md:col-span-3">
                <input
                  {...register("email")}
                  type="email"
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <label className="md:text-right text-gray-500 text-sm">Số điện thoại</label>
              <div className="md:col-span-3">
                <input
                  {...register("phone")}
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <label className="md:text-right text-gray-500 text-sm">Giới tính</label>
              <div className="md:col-span-3 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register("gender")} type="radio" value="male" className="accent-orange-500" />
                  <span className="text-sm">Nam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register("gender")} type="radio" value="female" className="accent-orange-500" />
                  <span className="text-sm">Nữ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register("gender")} type="radio" value="other" className="accent-orange-500" />
                  <span className="text-sm">Khác</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <label className="md:text-right text-gray-500 text-sm">Ngày sinh</label>
              <div className="md:col-span-3">
                <input
                  {...register("dob")}
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              <div></div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-sm shadow-sm transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Lưu"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column - Avatar */}
        <div className="md:w-1/3 flex flex-col items-center md:border-l border-gray-100 px-8">
          <div className="w-32 h-32 rounded-full bg-gray-50 border border-gray-100 overflow-hidden mb-4 relative group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <Camera size={40} />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="border border-gray-300 px-4 py-2 text-sm rounded shadow-sm hover:bg-gray-50 transition-colors mb-4"
          >
            Chọn ảnh
          </button>
          <div className="text-xs text-gray-400 space-y-1 text-center">
            <p>Dung lượng file tối đa 1 MB</p>
            <p>Định dạng: .JPEG, .PNG</p>
          </div>

          {/* Membership Rank Section */}
          {user?.rank && (
            <div className="mt-8 w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-2">
                <Shield size={16} className="text-indigo-500" />
                <span className="text-sm font-bold text-gray-700">Hạng thành viên</span>
              </div>
              
              <div className="flex flex-col items-center py-2">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 shadow-inner"
                  style={{ backgroundColor: user.rank.color + '22' }}
                >
                  {user.rank.icon}
                </div>
                <p className="text-lg font-black" style={{ color: user.rank.color }}>
                  {user.rank.name}
                </p>
                
                <div className="mt-4 w-full space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Điểm hiện tại</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      {user.points?.toLocaleString('vi-VN')} điểm
                    </span>
                  </div>
                  
                  {/* Progress bar logic could be added here if we had next rank info */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, ((user.points ?? 0) / 500) * 100)}%`,
                        backgroundColor: user.rank.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
