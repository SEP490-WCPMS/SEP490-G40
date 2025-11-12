import React, { useState } from 'react';
import { submitFeedbackReply } from '../Services/apiService'; // Đảm bảo đường dẫn đúng
import { AlertCircle, MessageSquare } from 'lucide-react';

/**
 * Modal để NV Dịch vụ trả lời Góp ý (FEEDBACK).
 */
function ReplyTicketModal({ open, ticket, onClose, onSuccess }) {
    const [responseContent, setResponseContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 2. Xử lý khi nhấn nút "Gửi Trả Lời"
    const handleSubmitReply = async () => {
        if (!responseContent.trim()) {
            setError("Vui lòng nhập nội dung trả lời.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Gọi API (từ Bước 6)
            const response = await submitFeedbackReply(ticket.id, responseContent);
            onSuccess(response.data); // Gửi ticket đã cập nhật (status: RESOLVED)
        } catch (err) {
            console.error("Lỗi khi gửi trả lời:", err);
            setError(err.response?.data?.message || "Gửi trả lời thất bại.");
        } finally {
            setLoading(false);
        }
    };

    // 3. Xử lý đóng Modal
    const handleClose = () => {
        if (loading) return;
        setResponseContent('');
        setError(null);
        onClose();
    };

    if (!open) return null;

    return (
        // Lớp phủ nền
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/[.35]" onClick={handleClose}>
            {/* Thân Modal (ngăn click xuyên thấu) */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Trả Lời Góp Ý</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                {/* Nội dung Modal */}
                <div className="p-6 space-y-4">
                    {/* Hiển thị lỗi */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm flex items-center" role="alert">
                            <AlertCircle size={16} className="mr-2" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {/* Thông tin ticket (Chỉ đọc) */}
                    <div className="text-sm space-y-2">
                        <p><strong>Mã Ticket:</strong> {ticket?.feedbackNumber}</p>
                        <p><strong>Khách hàng:</strong> {ticket?.customerName}</p>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
                             <p className="font-medium text-gray-600 mb-1">Nội dung góp ý:</p>
                             <p className="italic text-gray-800 whitespace-pre-wrap">{ticket?.description}</p>
                        </div>
                    </div>

                    {/* Ô nhập nội dung trả lời */}
                    <div>
                        <label htmlFor="responseContent" className="block mb-1.5 text-sm font-medium text-gray-700">
                            Nội dung trả lời <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="responseContent"
                            rows="4"
                            value={responseContent}
                            onChange={(e) => setResponseContent(e.target.value)}
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nhập nội dung phản hồi của bạn..."
                        />
                    </div>
                </div>

                {/* Footer Modal (Nút bấm) */}
                <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t rounded-b-lg">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmitReply}
                        disabled={loading || !responseContent.trim()}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi Trả Lời & Hoàn Tất'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReplyTicketModal;