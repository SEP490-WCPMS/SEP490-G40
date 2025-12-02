import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCashierInvoiceDetail, processCashPayment } from '../Services/apiCashierStaff';
import { ArrowLeft, User, Home, Phone, Mail, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT CÁC THÀNH PHẦN GIAO DIỆN MỚI
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

/**
 * Trang Chi tiết Hóa đơn (Dành cho Thu ngân Thu tại nhà)
 */
function RouteInvoiceDetail() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // 1. Tải chi tiết Hóa đơn
    useEffect(() => {
        if (!invoiceId) {
            toast.error("Không tìm thấy ID Hóa đơn.");
            setLoading(false);
            return;
        }
        setLoading(true);
        
        getCashierInvoiceDetail(invoiceId)
            .then(response => {
                setInvoice(response.data);
            })
            .catch(err => {
                console.error("Lỗi tải chi tiết:", err);
                toast.error(err.response?.data?.message || "Lỗi tải chi tiết hóa đơn.");
            })
            .finally(() => setLoading(false));
    }, [invoiceId]);

    // --- CÁC HÀM XỬ LÝ MỚI ---

    // 2. Khi bấm nút "Thu tiền" -> Mở Modal
    const handlePreSubmit = () => {
        if (!invoice) return;
        setShowConfirmModal(true);
    };

    // 3. Khi bấm "Có" -> Gọi API Thanh toán
    const handleConfirmPayment = async () => {
        setSubmitting(true);
        setShowConfirmModal(false); // Đóng modal

        try {
            const receipt = await processCashPayment(invoice.id, invoice.totalAmount);
            
            // Thông báo thành công
            toast.success(`Thanh toán thành công! Biên lai: ${receipt.data.receiptNumber}`, {
                position: "top-center",
                autoClose: 5000
            });

            // Cập nhật trạng thái UI ngay lập tức (để hiện dấu tích xanh)
            setInvoice(prev => ({ 
                ...prev, 
                paymentStatus: 'PAID', 
                paidDate: new Date() 
            }));

        } catch (err) {
            console.error("Lỗi khi xác nhận thanh toán:", err);
            toast.error(err.response?.data?.message || "Xác nhận thanh toán thất bại.", {
                position: "top-center"
            });
        } finally {
            setSubmitting(false);
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
    
    // Nếu lỗi không tải được dữ liệu
    if (!invoice) {
         return (
             <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center pt-20">
                 <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                 <p className="text-gray-600 mb-6 text-lg">Không tìm thấy dữ liệu hóa đơn.</p>
                 <Link to="/cashier/my-route" className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                     Quay lại danh sách
                 </Link>
                 <ToastContainer position="top-center" theme="colored" />
             </div>
        );
    }

    const isPaid = invoice.paymentStatus === 'PAID';

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            
            {/* 4. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Hóa Đơn Cần Thu</h1>
                    <p className="text-sm text-gray-600">Số HĐ: <span className="font-mono font-bold">{invoice.invoiceNumber}</span></p>
                </div>
            </div>

            {/* Box Chi tiết */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                
                {/* Đã xóa phần hiển thị thông báo lỗi cũ ở đây */}

                {/* Thông tin Khách hàng */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
                        <User size={20} className="text-blue-600"/>
                        Thông tin Khách hàng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                            <p className="flex items-center gap-3 text-gray-700">
                                <span className="font-medium w-20 text-gray-500">Họ tên:</span> 
                                <span className="font-bold text-gray-900 text-base">{invoice.customerName}</span>
                            </p>
                            <p className="flex items-start gap-3 text-gray-700">
                                <span className="font-medium w-20 text-gray-500 mt-0.5">Địa chỉ:</span> 
                                <span className="flex-1">{invoice.customerAddress}</span>
                            </p>
                        </div>
                        <div className="space-y-3">
                            <p className="flex items-center gap-3 text-gray-700">
                                <Phone size={16} className="text-gray-400" />
                                <span>{invoice.customerPhone || '(Chưa cập nhật SĐT)'}</span>
                            </p>
                            <p className="flex items-center gap-3 text-gray-700">
                                <Mail size={16} className="text-gray-400" />
                                <span>{invoice.customerEmail || '(Chưa cập nhật Email)'}</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Chi phí & Nút hành động */}
                <div className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-lg mt-2">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tổng số tiền phải thu</p>
                            <p className="text-3xl font-extrabold text-red-600 tracking-tight">
                                {invoice.totalAmount.toLocaleString('vi-VN')} <span className="text-xl font-medium text-gray-500">VNĐ</span>
                            </p>
                        </div>
                        
                        {!isPaid ? (
                            <button
                                onClick={handlePreSubmit} // Mở Modal
                                disabled={submitting}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <DollarSign size={20} className="mr-2" />
                                )}
                                {submitting ? 'Đang xử lý...' : 'Xác nhận Đã Thu Tiền Mặt'}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full border border-green-200 shadow-sm">
                                <CheckCircle size={20} className="text-green-600" />
                                <span className="font-bold">Đã thanh toán</span>
                                <span className="text-xs font-normal ml-1">
                                    ({moment(invoice.paidDate).format('HH:mm DD/MM/YYYY')})
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmPayment}
                title="Xác nhận thu tiền"
                message={`Bạn có chắc chắn muốn xác nhận đã thu ${invoice.totalAmount.toLocaleString('vi-VN')} VNĐ tiền mặt cho Hóa đơn ${invoice.invoiceNumber} không?`}
                isLoading={submitting}
            />
        </div>
    );
}

export default RouteInvoiceDetail;