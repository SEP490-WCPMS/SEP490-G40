import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupportTicketDetail, getInstallationDetail } from '../../Services/apiCustomer'; 
import { ArrowLeft, User, MessageSquare, AlertCircle } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT TOAST
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Trang "Cách A": Khách hàng xem chi tiết Yêu cầu Hỗ trợ.
 */
function SupportTicketDetail() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); // Bỏ state error hiển thị UI cũ

    // State cho ảnh và text phản hồi
    const [installationImage, setInstallationImage] = useState(null);
    const [responseText, setResponseText] = useState(null); 

    useEffect(() => {
        if (!ticketId) {
            toast.error("Không tìm thấy mã Yêu cầu.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setInstallationImage(null);
        setResponseText(null);
        
        getSupportTicketDetail(ticketId)
            .then(response => {
                const loadedTicket = response.data;
                setTicket(response.data);
                const rawResponse = loadedTicket.response || "";
                
                // Tách chuỗi phản hồi
                if (rawResponse.includes("---INSTALLATION_ID---")) {
                    const parts = rawResponse.split("---INSTALLATION_ID---");
                    
                    setResponseText(parts[0]); // Phần chữ
                    
                    const installId = parseInt(parts[1]);
                    if (installId) {
                        // Gọi API thứ 2 để lấy ảnh
                        getInstallationDetail(installId)
                            .then(imgRes => {
                                setInstallationImage(imgRes.data.installationImageBase64);
                            })
                            .catch(imgErr => {
                                console.error("Lỗi tải ảnh lắp đặt:", imgErr);
                                // Không cần toast lỗi ảnh, chỉ log là được
                            });
                    }
                } else {
                    // Nếu không có ID ảnh
                    setResponseText(rawResponse); 
                }
            })
            .catch(err => {
                console.error("Lỗi tải chi tiết:", err);
                // Thay khung đỏ bằng Toast
                toast.error(err.response?.data?.message || "Lỗi tải chi tiết yêu cầu. Vui lòng thử lại.");
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
        return (
             <div className="flex justify-center items-center h-screen bg-gray-50">
                 <div className="text-gray-500 flex items-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                     Đang tải chi tiết...
                 </div>
             </div>
        );
    }

    // Nếu không có dữ liệu (do lỗi)
    if (!ticket) {
        return (
            <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center pt-20">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-6">Không tìm thấy dữ liệu yêu cầu.</p>
                <button 
                    onClick={() => navigate('/my-support-tickets')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Quay lại danh sách
                </button>
                {/* Toast container cho trường hợp này */}
                <ToastContainer position="top-center" theme="colored" />
            </div>
        );
    }

    // Logic tách chuỗi phản hồi cũ (để tương thích ngược nếu cần, dù đã xử lý ở trên)
    // let displayResponseText = responseText;
    // if (displayResponseText && displayResponseText.includes("---IMAGE_SEPARATOR---")) {
    //    const parts = displayResponseText.split("---IMAGE_SEPARATOR---");
    //    displayResponseText = parts[0];
    // }

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            
            {/* 2. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Nút Quay lại */}
            <button onClick={() => navigate('/my-support-tickets')} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                 <ArrowLeft size={18} className="mr-1" />
                 Quay lại danh sách
            </button>

            {/* Box Chi tiết Ticket */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                {/* Header của Ticket */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 mb-1">Mã Yêu Cầu: {ticket.feedbackNumber}</h1>
                        <p className="text-sm text-gray-500">
                            Ngày gửi: {moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}
                        </p>
                    </div>
                    <span className={`mt-2 sm:mt-0 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                    </span>
                </div>

                {/* --- HIỂN THỊ ĐỒNG HỒ NƯỚC (NẾU CÓ) --- */}
                {ticket.meterCode && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md inline-block">
                        <p className="text-sm text-blue-800 flex items-center">                         
                            <strong>Đồng hồ báo hỏng:</strong> 
                            <span className="ml-2 font-mono font-bold text-blue-900 text-base">{ticket.meterCode}</span>
                        </p>
                    </div>
                )}
                {/* --------------------------------------- */}
                
                {/* Nội dung Yêu cầu (Của bạn) */}
                <div className="py-5">
                    <h2 className="text-base font-semibold text-gray-700 mb-2">Nội dung yêu cầu của bạn:</h2>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap leading-relaxed">
                        {ticket.description}
                    </p>
                </div>

                {/* Phản hồi của nhân viên */}
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
                            <div className="text-sm text-gray-800 bg-blue-50 p-4 rounded border border-blue-200 whitespace-pre-wrap leading-relaxed">
                                {responseText}
                            </div>
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
                             <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-dashed border-gray-300 text-right">
                                 Đã giải quyết vào: {moment(ticket.resolvedDate).format('HH:mm DD/MM/YYYY')}
                             </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupportTicketDetail;