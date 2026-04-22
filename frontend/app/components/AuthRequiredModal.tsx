'use client';
import { useRouter } from 'next/navigation';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Tính năng tích điểm và sử dụng điểm chỉ dành cho thành viên. 
                        Vui lòng đăng nhập hoặc đăng ký để hưởng ưu đãi đặc biệt này!
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                router.push('/login');
                                onClose();
                            }}
                            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98]"
                        >
                            Đăng nhập / Đăng ký ngay
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                        >
                            Để sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
