import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Modal Xác nhận hành động (Thay thế window.confirm)
 * @param {boolean} isOpen - Trạng thái mở modal
 * @param {function} onClose - Hàm đóng modal (Khi chọn Không/Hủy)
 * @param {function} onConfirm - Hàm thực thi hành động (Khi chọn Có)
 * @param {string} title - Tiêu đề (VD: Xác nhận lưu)
 * @param {string} message - Nội dung câu hỏi (VD: Bạn có chắc chắn muốn lưu không?)
 * @param {boolean} isLoading - Trạng thái đang xử lý (để hiện loading trên nút)
 */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
                    <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer (Actions) */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-md text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Không
                    </button>
                    
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Đang xử lý...' : 'Có, xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;