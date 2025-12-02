import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyInvoiceDetail, createPayOSLink } from '../../Services/apiCustomer';
import { ArrowLeft, CheckCircle, Clock, FileText, User, Home, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT TOAST
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Trang (Read-Only) Chi tiết Hóa đơn (Dành cho Khách hàng)
 */
function InvoiceDetail() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); // Bỏ state error UI cũ
    const [payOSData, setPayOSData] = useState(null);

    // 1. Lấy chi tiết hóa đơn
    useEffect(() => {
        if (!invoiceId) {
            toast.error("Không tìm thấy ID Hóa đơn.");
            setLoading(false);
            return;
        }

        setLoading(true);
        
        getMyInvoiceDetail(invoiceId)
            .then(response => {
                setInvoice(response.data);
            })
            .catch(err => {
                console.error("Lỗi tải hóa đơn:", err);
                toast.error(err.response?.data?.message || "Không thể tải chi tiết hóa đơn.");
            })
            .finally(() => setLoading(false));
    }, [invoiceId]);

    // 2. Tự động tạo QR PayOS nếu chưa thanh toán
    useEffect(() => {
        const allowedStatuses = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'];

        if (invoice && allowedStatuses.includes(invoice.paymentStatus)) {
            createPayOSLink(invoice.id)
                .then(res => setPayOSData(res.data))
                .catch(err => {
                    console.error("Lỗi tạo PayOS link", err);
                    // Không cần toast lỗi này để tránh spam, chỉ cần không hiện QR là được
                });
        }
    }, [invoice]);

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'PAID': return 'bg-green-100 text-green-800 border border-green-200';
            case 'OVERDUE': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'OVERDUE': return 'Quá hạn';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    Đang tải chi tiết hóa đơn...
                </div>
            </div>
        );
    }

    // Nếu không có dữ liệu (do lỗi)
    if (!invoice) {
        return (
            <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center pt-20">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-6">Không tìm thấy dữ liệu hóa đơn.</p>
                <button 
                    onClick={() => navigate('/my-invoices')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Quay lại danh sách
                </button>
                <ToastContainer position="top-center" theme="colored" />
            </div>
        );
    }

    // Xác định loại HĐ
    const isServiceInvoice = !invoice.meterReadingId;
    const isPaid = invoice.paymentStatus === 'PAID';

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
            
            {/* 3. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Nút Quay lại */}
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                 <ArrowLeft size={18} className="mr-1" />
                 Quay lại danh sách
            </button>

            {/* Container chính: Grid 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* CỘT TRÁI: CHI TIẾT HÓA ĐƠN */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200 space-y-6">
                    {/* Header Hóa đơn */}
                    <div className="pb-4 border-b border-gray-200 flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 mb-1">
                                {isServiceInvoice ? "Hóa Đơn Dịch Vụ" : "Hóa Đơn Tiền Nước"}
                            </h1>
                            <p className="text-sm text-gray-500">Số HĐ: <span className="font-mono font-medium">{invoice.invoiceNumber}</span></p>
                        </div>
                        <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusClass(invoice.paymentStatus)}`}>
                            {getStatusText(invoice.paymentStatus)}
                        </span>
                    </div>

                    {/* Thông tin Khách hàng */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                            <User size={16} /> Thông tin Khách hàng
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-100 text-sm space-y-2">
                            <p className="flex justify-between">
                                <span className="text-gray-600">Họ tên:</span>
                                <span className="font-medium text-gray-900">{invoice.customerName}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-600">Địa chỉ:</span>
                                <span className="font-medium text-gray-900 text-right max-w-[60%]">{invoice.customerAddress}</span>
                            </p>
                        </div>
                    </div>

                    {/* Chi tiết Tiêu thụ (Nếu là HĐ Nước) */}
                    {!isServiceInvoice && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <FileText size={16} /> Chi tiết Tiêu thụ
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm bg-blue-50 p-4 rounded-md border border-blue-100">
                                <div>
                                    <p className="text-gray-600 mb-1">Kỳ hóa đơn</p>
                                    <p className="font-medium">{moment(invoice.fromDate).format('DD/MM')} - {moment(invoice.toDate).format('DD/MM/YYYY')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1">Tổng tiêu thụ</p>
                                    <p className="font-bold text-blue-700 text-lg">{invoice.totalConsumption} m³</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chi tiết Thanh toán */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                            <DollarSign size={16} /> Chi tiết Thanh toán
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{isServiceInvoice ? "Phí dịch vụ:" : "Tiền nước (chưa VAT):"}</span>
                                <span className="font-medium">{invoice.subtotalAmount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                            
                            {invoice.environmentFeeAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phí BV Môi trường:</span>
                                    <span className="font-medium">{invoice.environmentFeeAmount.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-gray-600">Thuế VAT:</span>
                                <span className="font-medium">{invoice.vatAmount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                            
                            {invoice.latePaymentFee > 0 && (
                                <div className="flex justify-between text-red-600 bg-red-50 px-2 py-1 rounded">
                                    <span>Phí phạt nộp chậm:</span>
                                    <span className="font-bold">{invoice.latePaymentFee.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            )}

                            <div className="border-t border-dashed border-gray-300 my-2"></div>

                            {/* Tổng cộng */}
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-gray-800">TỔNG CỘNG:</span>
                                <span className="text-lg font-bold text-gray-900">{invoice.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>

                            {/* Trừ ví */}
                            {invoice.deductedAmount > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span>Đã trừ Ví tích lũy:</span>
                                    <span className="font-medium">- {invoice.deductedAmount.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            )}

                            {/* Thực thu */}
                            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg mt-2">
                                <span className="text-sm font-bold text-gray-700">CẦN THANH TOÁN:</span>
                                <span className="text-2xl font-extrabold text-red-600">
                                    {(invoice.totalAmount - (invoice.deductedAmount || 0)).toLocaleString('vi-VN')} VNĐ
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: TRẠNG THÁI THANH TOÁN & QR */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Card Trạng thái */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center">
                        {isPaid ? (
                            <div className="flex flex-col items-center justify-center text-green-600 space-y-2">
                                <CheckCircle size={48} />
                                <h3 className="text-lg font-bold">Đã Thanh Toán</h3>
                                <p className="text-sm text-gray-500">Ngày: {moment(invoice.paidDate).format('DD/MM/YYYY')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-yellow-600 space-y-2">
                                <Clock size={48} />
                                <h3 className="text-lg font-bold text-yellow-700">Chờ Thanh Toán</h3>
                                <p className="text-sm text-gray-500">Hạn chót: <span className="font-medium text-gray-800">{moment(invoice.dueDate).format('DD/MM/YYYY')}</span></p>
                            </div>
                        )}
                    </div>

                    {/* Card QR Code (Chỉ hiện khi chưa thanh toán) */}
                    {!isPaid && payOSData && (
                        <div className="bg-white p-6 rounded-lg shadow border border-blue-200 text-center">
                            <h4 className="font-bold text-gray-800 mb-4">Quét Mã Để Thanh Toán</h4>
                            
                            {/* Ảnh QR VietQR */}
                            <div className="border-2 border-gray-200 rounded-lg p-2 inline-block bg-white">
                                <img
                                    src={`https://img.vietqr.io/image/${payOSData.bin}-${payOSData.accountNumber}-compact.png?amount=${payOSData.amount}&addInfo=${encodeURIComponent(payOSData.description)}&accountName=${encodeURIComponent(payOSData.accountName)}`}
                                    alt="VietQR"
                                    className="w-full max-w-[200px] h-auto"
                                />
                            </div>

                            <p className="text-xs text-gray-500 mt-3">
                                Hỗ trợ bởi <strong>PayOS</strong> & <strong>VietQR</strong>
                            </p>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <a 
                                    href={payOSData.checkoutUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="block w-full py-2.5 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors shadow-sm"
                                >
                                    Thanh toán qua Cổng PayOS
                                </a>
                            </div>
                        </div>
                    )}
                    
                    {/* Note hỗ trợ */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-blue-800">
                        <p className="font-semibold mb-1 flex items-center gap-1"><AlertCircle size={14}/> Cần hỗ trợ?</p>
                        <p>Nếu có thắc mắc về hóa đơn, vui lòng liên hệ hotline <strong>0210 6251998 / 0210 3992369</strong> hoặc tạo yêu cầu hỗ trợ.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default InvoiceDetail;