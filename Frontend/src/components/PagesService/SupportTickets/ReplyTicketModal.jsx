import React, { useState } from 'react';
import { submitFeedbackReply } from '../../Services/apiService'; 
import { MessageSquare, Send, X } from 'lucide-react';

// 1. IMPORT TOAST VÀ MODAL
import { toast } from 'react-toastify';
// Không cần import ToastContainer vì trang cha (SupportTicketList) đã có rồi
import ConfirmModal from '../../common/ConfirmModal';

/**
 * Modal để NV Dịch vụ trả lời Góp ý (FEEDBACK).
 */
function ReplyTicketModal({ open, ticket, onClose, onSuccess }) {
    const [responseContent, setResponseContent] = useState('');
    const [loading, setLoading] = useState(false);
    
    // State cho Modal Xác nhận
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // 1. Validate và Mở Modal Xác Nhận
    const handlePreSubmit = () => {
        if (!responseContent.trim()) {
            toast.warn("Vui lòng nhập nội dung trả lời.");
            return;
        }
        setShowConfirmModal(true);
    };

    // 2. Xử lý Gửi thật (Khi bấm "Có")
    const handleConfirmReply = async () => {
        setLoading(true);
        setShowConfirmModal(false); // Đóng modal xác nhận

        try {
            const response = await submitFeedbackReply(ticket.id, responseContent);
            
            // Gọi callback onSuccess của cha (Cha sẽ hiện Toast thành công và đóng Modal này)
            onSuccess(response.data); 
            
            // Reset form
            setResponseContent('');
        } catch (err) {
            console.error("Lỗi khi gửi trả lời:", err);
            toast.error(err.response?.data?.message || "Gửi trả lời thất bại. Vui lòng thử lại.");
            setLoading(false); // Chỉ tắt loading khi lỗi (khi thành công thì modal sẽ đóng)
        }
    };

    // Xử lý đóng Modal chính
    const handleClose = () => {
        if (loading) return;
        setResponseContent('');
        onClose();
    };

    if (!open) return null;

    return (
        // Lớp phủ nền (z-index 50 để nằm dưới ConfirmModal vốn thường là z-50 hoặc cao hơn)
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleClose}>
            {/* Thân Modal */}
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <MessageSquare className="text-blue-600" size={20} />
                        Trả Lời Góp Ý
                    </h3>
                    <button 
                        onClick={handleClose} 
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Nội dung Modal (Có cuộn) */}
                <div className="p-6 space-y-5 overflow-y-auto">
                    
                    {/* Đã bỏ phần hiển thị lỗi cũ */}
                    
                    {/* Thông tin ticket (Chỉ đọc) */}
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <p><strong className="text-gray-600">Mã Ticket:</strong> <span className="font-mono font-bold">{ticket?.feedbackNumber}</span></p>
                            <p><strong className="text-gray-600">Khách hàng:</strong> {ticket?.customerName}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                             <p className="text-xs font-bold text-gray-500 uppercase mb-1">Nội dung góp ý:</p>
                             <p className="italic text-gray-800 whitespace-pre-wrap leading-relaxed">
                                "{ticket?.description}"
                             </p>
                        </div>
                    </div>

                    {/* Ô nhập nội dung trả lời */}
                    <div>
                        <label htmlFor="responseContent" className="block mb-2 text-sm font-medium text-gray-700">
                            Nội dung trả lời <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="responseContent"
                            rows="5"
                            value={responseContent}
                            onChange={(e) => setResponseContent(e.target.value)}
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nhập nội dung phản hồi của bạn..."
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Footer Modal (Nút bấm) */}
                <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handlePreSubmit} // Mở Modal Xác Nhận
                        disabled={loading || !responseContent.trim()}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Send size={16} className="mr-2" />
                        )}
                        {loading ? 'Đang gửi...' : 'Gửi Trả Lời'}
                    </button>
                </div>
            </div>

            {/* 3. RENDER MODAL XÁC NHẬN (Nằm trên Modal chính) */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmReply}
                title="Xác nhận gửi phản hồi"
                message="Bạn có chắc chắn muốn gửi nội dung trả lời này cho khách hàng không? Hành động này sẽ đóng ticket."
                isLoading={loading}
            />
        </div>
    );
}

export default ReplyTicketModal;