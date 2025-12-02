import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceDetail, cancelInvoice } from '../Services/apiAccountingStaff'; // Import thêm cancelInvoice
import { ArrowLeft, DollarSign, Calendar, FileText, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT CÁC THÀNH PHẦN MỚI
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

/**
 * Trang Chi tiết Hóa đơn Dịch vụ
 */
function InvoiceDetail() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    
    const [invoiceDetail, setInvoiceDetail] = useState(null);
    const [feeDetail, setFeeDetail] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false); // State xử lý hủy
    
    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Hàm fetch data
    const fetchData = () => {
        setLoading(true);
        getInvoiceDetail(invoiceId)
            .then(response => {
                setInvoiceDetail(response.data.invoice);
                setFeeDetail(response.data.fee);
            })
            .catch(err => {
                console.error("Lỗi tải chi tiết:", err);
                toast.error(err.response?.data?.message || "Lỗi tải chi tiết hóa đơn.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!invoiceId) {
            toast.error("Không tìm thấy ID Hóa đơn.");
            return;
        }
        fetchData();
    }, [invoiceId]);

    // --- CÁC HÀM XỬ LÝ HỦY HÓA ĐƠN ---

    // 1. Mở Modal
    const handlePreCancel = () => {
        setShowConfirmModal(true);
    };

    // 2. Gọi API Hủy
    const handleConfirmCancel = async () => {
        setProcessing(true);
        // Đóng modal
        setShowConfirmModal(false);

        try {
            await cancelInvoice(invoiceId);
            
            toast.success("Hủy hóa đơn thành công!", {
                position: "top-center",
                autoClose: 2000
            });

            // Load lại dữ liệu để cập nhật trạng thái
            fetchData();
        } catch (err) {
            console.error("Lỗi hủy hóa đơn:", err);
            toast.error(err.response?.data?.message || "Hủy hóa đơn thất bại.", {
                position: "top-center"
            });
        } finally {
            setProcessing(false);
        }
    };

    // Helper style
    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'PAID': return 'bg-green-100 text-green-800 border border-green-200';
            case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-200 font-bold';
            case 'CANCELLED': return 'bg-gray-100 text-gray-600 border border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // --- HÀM MỚI: Dịch trạng thái sang Tiếng Việt ---
    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'OVERDUE': return 'Quá hạn';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };
    
    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
    
    // Nếu không có dữ liệu sau khi load xong
    if (!invoiceDetail) {
        return (
            <div className="p-8 text-center">
                 <p className="text-gray-500 mb-4">Không tìm thấy dữ liệu hóa đơn.</p>
                 <button onClick={() => navigate('/accounting/invoices')} className="text-blue-600 hover:underline">
                     Quay lại danh sách
                 </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            
            {/* 3. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                     <button onClick={() => navigate('/accounting/invoices')} className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none">
                         <ArrowLeft size={20} className="text-gray-600"/>
                     </button>
                     <div>
                        <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Hóa Đơn</h1>
                        <p className="text-sm text-gray-600">Số HĐ: <span className="font-mono font-bold">{invoiceDetail.invoiceNumber}</span></p>
                    </div>
                </div>

                {/* Nút Hủy (Chỉ hiện khi PENDING) */}
                {invoiceDetail.paymentStatus === 'PENDING' && (
                    <button
                        onClick={handlePreCancel}
                        disabled={processing}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none"
                    >
                        {processing ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        ) : (
                            <XCircle size={18} className="mr-2" />
                        )}
                        {processing ? 'Đang xử lý...' : 'Hủy Hóa Đơn'}
                    </button>
                )}
            </div>

            {/* Box Thông tin Gốc */}
            {feeDetail && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3 text-sm">
                    <h3 className="text-base font-bold text-gray-700 mb-2 uppercase tracking-wide border-b pb-2">Thông tin Gốc (Từ Kỹ thuật)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-gray-600">
                        <p><strong className="text-gray-700">Khách hàng:</strong> {feeDetail.customerName} (Mã: {feeDetail.customerCode})</p>
                        <p><strong className="text-gray-700">Địa chỉ:</strong> {feeDetail.customerAddress}</p>
                        <p><strong className="text-gray-700">Đồng hồ:</strong> <span className="font-mono bg-gray-100 px-1 rounded">{feeDetail.meterCode}</span></p>
                        <p><strong className="text-gray-700">Phí gốc:</strong> {feeDetail.calibrationCost.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                    <p className="bg-gray-50 p-3 rounded italic text-gray-500">
                        "Ghi chú: {feeDetail.notes || 'N/A'}"
                    </p>
                </div>
            )}
            
            {/* Box Hóa đơn Nước (Nếu có) */}
            {!feeDetail && invoiceDetail.meterReadingId && (
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3 text-sm">
                     <h3 className="text-base font-bold text-gray-700 mb-2 uppercase tracking-wide border-b pb-2">Thông tin Sử Dụng Nước</h3>
                     <p className="text-gray-600"><strong>Khách hàng:</strong> {invoiceDetail.customerName}</p>
                     <p className="text-gray-600"><strong>Tổng tiêu thụ:</strong> {invoiceDetail.totalConsumption} m³</p>
                 </div>
            )}

            {/* Box Chi tiết Hóa đơn */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        Thông tin Thanh toán
                    </h3>
                    <span className={`px-3 py-1 inline-flex text-sm font-bold rounded-full ${getStatusClass(invoiceDetail.paymentStatus)}`}>
                        {/* Gọi hàm dịch tiếng Việt */}
                        {getStatusLabel(invoiceDetail.paymentStatus)}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                        <label className="block mb-1 text-xs font-medium text-gray-500 uppercase">Số Hóa Đơn</label>
                        <p className="text-base font-bold text-gray-800">{invoiceDetail.invoiceNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                        <label className="block mb-1 text-xs font-medium text-gray-500 uppercase">Ngày Lập</label>
                        <p className="text-base text-gray-800 flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400"/> 
                            {moment(invoiceDetail.invoiceDate).format('DD/MM/YYYY')}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                        <label className="block mb-1 text-xs font-medium text-gray-500 uppercase">Hạn Thanh Toán</label>
                        <p className={`text-base font-bold flex items-center gap-2 ${moment(invoiceDetail.dueDate).isBefore(moment(), 'day') && invoiceDetail.paymentStatus === 'PENDING' ? 'text-red-600' : 'text-gray-800'}`}>
                             <AlertCircle size={16} className={moment(invoiceDetail.dueDate).isBefore(moment(), 'day') ? "text-red-500" : "text-gray-400"}/>
                             {moment(invoiceDetail.dueDate).format('DD/MM/YYYY')}
                        </p>
                    </div>
                </div>

                {invoiceDetail.paidDate && (
                    <div className="bg-green-50 p-3 rounded border border-green-200 flex items-center gap-2 text-green-800 text-sm font-medium">
                        <CheckCircle size={18} />
                        Đã thanh toán ngày: {moment(invoiceDetail.paidDate).format('DD/MM/YYYY')}
                    </div>
                )}

                {/* Chi tiết tiền */}
                <div className="pt-2 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Thành tiền (chưa VAT):</span>
                        <span className="font-medium">{invoiceDetail.subtotalAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Thuế VAT:</span>
                        <span className="font-medium">{invoiceDetail.vatAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    {invoiceDetail.environmentFeeAmount > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Phí BVMT:</span>
                            <span className="font-medium">{invoiceDetail.environmentFeeAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}
                    {invoiceDetail.latePaymentFee > 0 && (
                        <div className="flex justify-between text-sm text-red-600 bg-red-50 p-2 rounded">
                            <span>Phí nộp chậm:</span>
                            <span className="font-bold">{invoiceDetail.latePaymentFee.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}
                    
                    <div className="border-t border-dashed border-gray-300 my-2"></div>

                    <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-800">TỔNG CỘNG:</span>
                        <span className="text-xl font-extrabold text-blue-700">{invoiceDetail.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>

                    {invoiceDetail.deductedAmount > 0 && (
                         <div className="flex justify-between items-center text-green-600 text-sm">
                            <span className="flex items-center"><DollarSign size={14} className="mr-1"/> Trừ ví tích lũy:</span>
                            <span className="font-bold">- {invoiceDetail.deductedAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                        <span className="text-sm font-bold text-gray-700">THỰC THU:</span>
                        <span className="text-2xl font-black text-red-600">
                            {(invoiceDetail.totalAmount - (invoiceDetail.deductedAmount || 0)).toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>
                </div>
                
                {invoiceDetail.notes && (
                    <div className="text-sm text-gray-500 border-t pt-4">
                        <span className="font-medium text-gray-700">Ghi chú:</span> {invoiceDetail.notes}
                    </div>
                )}
            </div>

            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmCancel}
                title="Xác nhận hủy hóa đơn"
                message={`Bạn có chắc chắn muốn hủy hóa đơn ${invoiceDetail.invoiceNumber} không? Hành động này không thể hoàn tác.`}
                isLoading={processing}
            />

        </div>
    );
}

export default InvoiceDetail;