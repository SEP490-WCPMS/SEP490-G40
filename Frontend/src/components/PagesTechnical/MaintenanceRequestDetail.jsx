import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyMaintenanceRequestDetail } from '../Services/apiTechnicalStaff'; 
import { 
    ArrowLeft, User, Phone, Mail, Home, Hash, BarChart, FileText, 
    ArrowLeftRight, ClipboardCheck, AlertCircle
} from 'lucide-react';
import moment from 'moment';

// 1. IMPORT TOASTIFY
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Trang Chi tiết Yêu cầu Hỗ trợ (Dành cho Technical Staff)
 */
function MaintenanceRequestDetail() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); // Không dùng state error hiển thị UI nữa

    useEffect(() => {
        if (!ticketId) {
            toast.error("Không tìm thấy mã Yêu cầu.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        
        getMyMaintenanceRequestDetail(ticketId)
            .then(response => {
                setTicket(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi tải chi tiết ticket:", err);
                // Thay setError bằng Toast
                toast.error(err.response?.data?.message || "Không thể tải chi tiết yêu cầu.");
            })
            .finally(() => setLoading(false));
    }, [ticketId]);

    // --- HÀM XỬ LÝ NÚT BẤM ---
    
    const handleGoToReplacement = () => {
        if (!ticket || !ticket.meterCode) return;
        navigate('/technical/replace-meter', { 
            state: { prefillMeterCode: ticket.meterCode } 
        });
    };

    const handleGoToCalibration = () => {
        if (!ticket || !ticket.meterCode) return;
        navigate('/technical/calibrate-on-site', { 
            state: { prefillMeterCode: ticket.meterCode } 
        });
    };

    // --- RENDER ---

    if (loading) {
        return (
             <div className="flex justify-center items-center h-screen bg-gray-50">
                 <div className="text-gray-500 flex items-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                     Đang tải chi tiết yêu cầu...
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
                    onClick={() => navigate('/technical/maintenance-requests')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Quay lại danh sách
                </button>
                <ToastContainer position="top-center" theme="colored" />
            </div>
        );
    }

    // Xác định loại yêu cầu để hiển thị nút phù hợp
    const isCalibration = ticket.description.toLowerCase().includes("kiểm định");

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            
            {/* 2. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition duration-150">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Chi Tiết Yêu Cầu Bảo Trì</h1>
                    <p className="text-sm text-gray-600">Mã Ticket: <span className="font-mono font-medium">{ticket.feedbackNumber}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CỘT BÊN TRÁI (Thông tin Ticket) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Box Mô tả Yêu cầu */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Nội dung Yêu cầu
                        </h3>
                        <div className="text-sm text-gray-800 bg-yellow-50 p-4 rounded border border-yellow-200 whitespace-pre-wrap leading-relaxed">
                            {ticket.description}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-right italic">
                            Ngày nhận: {moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}
                        </p>
                    </div>

                    {/* Box Hợp đồng & Đồng hồ */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông tin Hợp đồng & Đồng hồ
                        </h3>
                        {ticket.serviceContractNumber ? (
                            <div className="space-y-3 text-sm">
                                <p className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400" />
                                    <span className="text-gray-600 w-32">Số HĐ Dịch vụ:</span> 
                                    <span className="font-medium">{ticket.serviceContractNumber}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <BarChart size={16} className="text-gray-400" />
                                    <span className="text-gray-600 w-32">Loại giá:</span>
                                    <span className="font-medium">{ticket.priceTypeName || 'N/A'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Hash size={16} className="text-gray-400" />
                                    <span className="text-gray-600 w-32">Mã đồng hồ:</span>
                                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{ticket.meterCode || 'N/A'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Hash size={16} className="text-gray-400" />
                                    <span className="text-gray-600 w-32">Serial đồng hồ:</span>
                                    <span className="font-mono">{ticket.meterSerialNumber || 'N/A'}</span>
                                </p>
                            </div>
                        ) : (
                             <div className="p-4 bg-gray-50 rounded text-center text-sm text-gray-500 italic">
                                Không tìm thấy hợp đồng dịch vụ đang hoạt động cho khách hàng này.
                             </div>
                        )}
                    </div>
                </div>

                {/* CỘT BÊN PHẢI (Thông tin Khách hàng & Hành động) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Thông tin Khách hàng */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                         <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-600"/>
                            Thông tin Khách hàng
                        </h3>
                        
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 text-xl font-bold mb-2">
                                {ticket.customerName.charAt(0)}
                            </div>
                            <p className="text-base font-bold text-gray-900">{ticket.customerName}</p>
                        </div>

                        <div className="space-y-3 text-sm border-t pt-4">
                             <div className="flex gap-3">
                                <Home size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{ticket.customerAddress || '(Chưa có địa chỉ)'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-400" />
                                <span className="text-gray-700">{ticket.customerPhone || '(Chưa có SĐT)'}</span>
                            </div>
                             <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-400" />
                                <span className="text-gray-700">{ticket.customerEmail || '(Chưa có Email)'}</span>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t mt-4">
                             <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Người được gán (Bạn):</p>
                             <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded border border-gray-100 text-center">
                                {ticket.assignedToName}
                             </p>
                        </div>
                    </div>

                    {/* HÀNH ĐỘNG */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-base font-bold text-gray-800 mb-3">Chọn Hành Động</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Chọn phương án xử lý dựa trên mã đồng hồ: <span className="font-mono font-bold text-gray-700">{ticket.meterCode || 'N/A'}</span>
                        </p>

                        <div className="space-y-3">
                            {/* Nút 1: Thay thế (Luôn hiển thị) */}
                            <button
                                onClick={handleGoToReplacement}
                                disabled={!ticket.meterCode}
                                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowLeftRight size={18} className="mr-2 text-blue-600" />
                                Thực hiện Thay Thế
                            </button>
                            
                            {/* Nút 2: Kiểm định tại chỗ (Chỉ hiển thị nếu là ticket Kiểm định) */}
                            {isCalibration && (
                                <button
                                    onClick={handleGoToCalibration}
                                    disabled={!ticket.meterCode}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ClipboardCheck size={18} className="mr-2" />
                                    Kiểm Định Tại Chỗ
                                </button>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default MaintenanceRequestDetail;