import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupportTicketDetail, getInstallationDetail } from '../../Services/apiCustomer'; // Đảm bảo đường dẫn đúng
import { ArrowLeft, User, MessageSquare } from 'lucide-react';
import moment from 'moment';

/**
 * Trang "Cách A": Khách hàng xem chi tiết Yêu cầu Hỗ trợ.
 */
function SupportTicketDetail() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- SỬA LỖI TẠI ĐÂY ---
    // Khai báo state cho ảnh và text
    const [installationImage, setInstallationImage] = useState(null);
    const [responseText, setResponseText] = useState(null); // Dùng const [var, setVar]
    // --- HẾT PHẦN SỬA ---

    useEffect(() => {
        if (!ticketId) {
            setError("Không tìm thấy mã Yêu cầu.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        setInstallationImage(null);
        setResponseText(null);
        
        getSupportTicketDetail(ticketId)
            .then(response => {
                setTicket(response.data);
                const rawResponse = response.data.response || "";
                
                // Tách chuỗi phản hồi
                if (rawResponse.includes("---INSTALLATION_ID---")) {
                    const parts = rawResponse.split("---INSTALLATION_ID---");
                    // --- SỬA LỖI TẠI ĐÂY ---
                    // Dùng hàm setResponseText() để cập nhật
                    setResponseText(parts[0]); // Phần chữ
                    // ---
                    
                    const installId = parseInt(parts[1]); // Lấy ID Lắp đặt
                    if (installId) {
                        // Gọi API thứ 2 để lấy ảnh
                        getInstallationDetail(installId)
                            .then(imgRes => {
                                setInstallationImage(imgRes.data.installationImageBase64);
                            })
                            .catch(imgErr => console.error("Lỗi tải ảnh lắp đặt:", imgErr));
                    }
                } else {
                    // Nếu không có ID ảnh (ví dụ: trả lời FEEDBACK)
                    setResponseText(rawResponse);
                }
            })
            .catch(err => {
                console.error("Lỗi khi tải chi tiết ticket:", err);
                setError(err.response?.data?.message || "Không thể tải chi tiết yêu cầu.");
            })
            .finally(() => setLoading(false));
    }, [ticketId]);

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ xử lý';
            case 'IN_PROGRESS': return 'Đang xử lý';
            case 'RESOLVED': return 'Đã giải quyết';
            default: return status;
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Đang tải...</div>;
    }

    if (error) {
        return (
             <div className="p-8 max-w-4xl mx-auto">
                 <button onClick={() => navigate(-1)} className="inline-flex items-center text-blue-600 hover:underline mb-4">
                     <ArrowLeft size={18} className="mr-1" /> Quay lại
                 </button>
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
             </div>
        );
    }
    
    if (!ticket) {
        return <div className="p-8 text-center">Không tìm thấy yêu cầu.</div>;
    }

    // --- LOGIC TÁCH CHUỖI PHẢN HỒI ---
    // let responseText = ticket.response || null;
    // let responseImageBase64 = null;
    
    if (responseText && responseText.includes("---IMAGE_SEPARATOR---")) {
        const parts = responseText.split("---IMAGE_SEPARATOR---");
        responseText = parts[0]; // Phần chữ
        responseImageBase64 = parts[1]; // Phần ảnh Base64
    }

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            {/* Nút Quay lại */}
            <button onClick={() => navigate('/my-support-tickets')} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                 <ArrowLeft size={18} className="mr-1" />
                 Quay lại danh sách
            </button>

            {/* Box Chi tiết Ticket */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                {/* Header của Ticket */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Mã Yêu Cầu: {ticket.feedbackNumber}</h1>
                        <p className="text-sm text-gray-500">
                            Ngày gửi: {moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}
                        </p>
                    </div>
                    <span className={`mt-2 sm:mt-0 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                    </span>
                </div>
                
                {/* Nội dung Yêu cầu (Của bạn) */}
                <div className="py-5">
                    <h2 className="text-base font-semibold text-gray-700 mb-2">Nội dung yêu cầu của bạn:</h2>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded border whitespace-pre-wrap">
                        {ticket.description}
                    </p>
                </div>

                {/* Phản hồi của nhân viên (ĐÃ SỬA LẠI HOÀN TOÀN) */}
                {ticket.status !== 'PENDING' && (
                    <div className="py-5 border-t border-gray-200">
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Phản hồi từ Bộ phận Dịch vụ:</h2>
                        
                        {/* NV Xử lý */}
                        {ticket.assignedToName && (
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-600">
                                    <User size={16} />
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{ticket.assignedToName}</p>
                                    <p className="text-xs text-gray-500">
                                        {ticket.status === 'IN_PROGRESS' ? 'Nhân viên đang xử lý' : 'Nhân viên đã giải quyết'}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Nội dung phản hồi (Phần Text) */}
                        {responseText ? (
                            <p className="text-sm text-gray-800 bg-blue-50 p-4 rounded border border-blue-200 whitespace-pre-wrap">
                                {responseText}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 italic">
                                {ticket.status === 'IN_PROGRESS' 
                                    ? '(Nhân viên đang xử lý, chưa có phản hồi chính thức)' 
                                    : '(Chưa có phản hồi chính thức)'}
                            </p>
                        )}

                        {/* Ảnh đính kèm (Phần Ảnh) */}
                        {installationImage && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh đính kèm (lắp đặt mới):</h4>
                                <img 
                                    src={`data:image/jpeg;base64,${installationImage}`} 
                                    alt="Ảnh lắp đặt/thay thế"
                                    className="max-w-full md:max-w-md rounded border border-gray-300 shadow-sm"
                                />
                            </div>
                        )}
                        
                        {/* Ngày giải quyết */}
                        {ticket.resolvedDate && (
                             <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                                 Đã giải quyết vào: {moment(ticket.resolvedDate).format('HH:mm DD/MM/YYYY')}
                             </p>
                        )}
                    </div>
                )}
                {/* --- HẾT PHẦN SỬA --- */}
            </div>
        </div>
    );
}

export default SupportTicketDetail;