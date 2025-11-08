import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMyMaintenanceRequestDetail } from '../Services/apiTechnicalStaff'; // Đảm bảo đường dẫn đúng
import { 
    ArrowLeft, User, Phone, Mail, Home, Hash, BarChart, FileText, Calendar, AlertTriangle, 
    ArrowLeftRight, // <-- THÊM ICON NÀY
    ClipboardCheck  // <-- VÀ ICON NÀY (cho nút Kiểm định tại chỗ)
} from 'lucide-react';
import moment from 'moment';

/**
 * Trang Chi tiết Yêu cầu Hỗ trợ (Dành cho Technical Staff)
 */
function MaintenanceRequestDetail() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!ticketId) {
            setError("Không tìm thấy mã Yêu cầu.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        getMyMaintenanceRequestDetail(ticketId)
            .then(response => {
                setTicket(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi tải chi tiết ticket:", err);
                setError(err.response?.data?.message || "Không thể tải chi tiết yêu cầu.");
            })
            .finally(() => setLoading(false));
    }, [ticketId]);

    // --- HÀM MỚI: Xử lý khi nhấn nút ---
    
    // 1. Chuyển đến trang THAY THẾ (Gửi kèm mã đồng hồ)
    const handleGoToReplacement = () => {
        if (!ticket || !ticket.meterCode) return;
        navigate('/technical/replace-meter', { 
            state: { prefillMeterCode: ticket.meterCode } // Gửi state
        });
    };

    // 2. Chuyển đến trang KIỂM ĐỊNH TẠI CHỖ (Gửi kèm mã đồng hồ)
    const handleGoToCalibration = () => {
        if (!ticket || !ticket.meterCode) return;
        navigate('/technical/calibrate-on-site', { 
            state: { prefillMeterCode: ticket.meterCode } // Gửi state
        });
    };
    // --- HẾT HÀM MỚI ---

    if (loading) {
        return (
             <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                 <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">...</svg>
                 <span className="ml-3 text-gray-500 text-lg">Đang tải chi tiết yêu cầu...</span>
             </div>
        );
    }

    if (error) {
        return (
             <div className="p-8 max-w-4xl mx-auto">
                 <Link to="/technical/maintenance-requests" className="inline-flex items-center text-blue-600 hover:underline mb-4">
                     <ArrowLeft size={18} className="mr-1" /> Quay lại
                 </Link>
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

    // Xác định loại yêu cầu
    const isCalibration = ticket.description.includes("kiểm định");
    const isBroken = !isCalibration;

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <button onClick={() => navigate('/technical/maintenance-requests')} className="p-2 rounded-full hover:bg-gray-100 transition duration-150">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Chi Tiết Yêu Cầu Bảo Trì</h1>
                    <p className="text-sm text-gray-600">Mã Ticket: {ticket.feedbackNumber}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CỘT BÊN TRÁI (Thông tin Ticket) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Box Mô tả Yêu cầu */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Nội dung Yêu cầu
                        </h3>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-4 rounded border border-yellow-200 whitespace-pre-wrap">
                            {ticket.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Ngày nhận: {moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}
                        </p>
                    </div>

                    {/* Box Hợp đồng & Đồng hồ */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông tin Hợp đồng & Đồng hồ
                        </h3>
                        {ticket.serviceContractNumber ? (
                            <div className="space-y-3 text-sm">
                                <p className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-500" />
                                    <strong>Số HĐ Dịch vụ:</strong> {ticket.serviceContractNumber}
                                </p>
                                <p className="flex items-center gap-2">
                                    <BarChart size={16} className="text-gray-500" />
                                    <strong>Loại giá:</strong> {ticket.priceTypeName || 'N/A'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Hash size={16} className="text-gray-500" />
                                    <strong>Mã đồng hồ:</strong> {ticket.meterCode || 'N/A'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Hash size={16} className="text-gray-500" />
                                    <strong>Serial đồng hồ:</strong> {ticket.meterSerialNumber || 'N/A'}
                                </p>
                            </div>
                        ) : (
                             <p className="text-sm text-gray-500 italic">(Không tìm thấy hợp đồng dịch vụ đang hoạt động cho khách hàng này)</p>
                        )}
                    </div>
                </div>

                {/* CỘT BÊN PHẢI (Thông tin Khách hàng) */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-3">
                         <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông tin Khách hàng
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                                <User size={20} />
                            </span>
                            <p className="text-base font-medium text-gray-900">{ticket.customerName}</p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                             <p className="flex items-start gap-2">
                                <Home size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                <span>{ticket.customerAddress || '(Chưa có địa chỉ)'}</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-500" />
                                <span>{ticket.customerPhone || '(Chưa có SĐT)'}</span>
                            </p>
                             <p className="flex items-center gap-2">
                                <Mail size={16} className="text-gray-500" />
                                <span>{ticket.customerEmail || '(Chưa có Email)'}</span>
                            </p>
                        </div>
                        <div className="pt-4 border-t">
                             <p className="text-xs text-gray-500">Người được gán (Bạn):</p>
                             <p className="text-sm font-medium text-gray-700">{ticket.assignedToName}</p>
                        </div>


                        {/* --- THÊM PHẦN HÀNH ĐỘNG --- */}
                        <div className="pt-4 border-t space-y-3">
                             <h3 className="text-base font-semibold text-gray-700">
                                Chọn Hành Động
                            </h3>
                            <p className="text-xs text-gray-500">Chọn phương án xử lý cho yêu cầu này. (Mã đồng hồ: {ticket.meterCode || 'N/A'})</p>

                            {/* Nút 1: Thay thế (Luôn hiển thị) */}
                            <button
                                onClick={handleGoToReplacement}
                                disabled={!ticket.meterCode}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ArrowLeftRight size={16} className="mr-2" />
                                1. Thực hiện Thay Thế Đồng Hồ
                            </button>
                            
                            {/* Nút 2: Kiểm định tại chỗ (Chỉ hiển thị nếu là ticket Kiểm định) */}
                            {isCalibration && (
                                <button
                                    onClick={handleGoToCalibration}
                                    disabled={!ticket.meterCode}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ClipboardCheck size={16} className="mr-2" />
                                    2. Thực hiện Kiểm Định Tại Chỗ
                                </button>
                            )}
                        </div>
                        {/* --- HẾT PHẦN HÀNH ĐỘNG --- */}


                    </div>
                </div>

            </div>
        </div>
    );
}

export default MaintenanceRequestDetail;