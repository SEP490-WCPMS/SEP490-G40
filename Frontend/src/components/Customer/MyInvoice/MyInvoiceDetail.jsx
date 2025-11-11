import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMyInvoiceDetail } from '../../Services/apiCustomer';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import moment from 'moment';
// Import component QR (đã code ở bước trước)
import InvoiceQRCode from '../QRCode/InvoiceQRCode'; // <-- ĐẢM BẢO ĐÚNG ĐƯỜNG DẪN

/**
 * Trang (Read-Only) Chi tiết Hóa đơn (Dành cho Khách hàng)
 * (Hiển thị mã QR nếu PENDING)
 */
function InvoiceDetail() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!invoiceId) {
            setError("Không tìm thấy ID Hóa đơn.");
            setLoading(false);
            return;
        }
        
        getMyInvoiceDetail(invoiceId)
            .then(response => {
                setInvoice(response.data);
            })
            .catch(err => setError(err.response?.data?.message || "Lỗi tải chi tiết hóa đơn."))
            .finally(() => setLoading(false));
    }, [invoiceId]);

    if (loading) return <div className="p-8 text-center">Đang tải chi tiết hóa đơn...</div>;
    
    if (error) {
         return (
             <div className="p-8 max-w-4xl mx-auto">
                 {/* Sửa lại Nút Quay lại (dùng Link) */}
                 <Link to="/my-invoices" className="inline-flex items-center text-blue-600 hover:underline mb-4">
                     <ArrowLeft size={18} className="mr-1" /> Quay lại
                 </Link>
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
             </div>
        );
    }
    
    if (!invoice) return <div className="p-8 text-center">Không tìm thấy dữ liệu hóa đơn.</div>;

    // Xác định loại HĐ
    const isServiceInvoice = !invoice.meterReadingId;
    const isPaid = invoice.paymentStatus === 'PAID';

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            {/* Nút Quay lại (Sửa lại: dùng navigate(-1) để quay lại đúng trang trước đó) */}
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                 <ArrowLeft size={18} className="mr-1" />
                 Quay lại danh sách
            </button>

            {/* --- Container chính: Hóa đơn và QR --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CỘT TRÁI: CHI TIẾT HÓA ĐƠN */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                    {/* Header Hóa đơn */}
                    <div className="pb-4 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-800 mb-1">
                            {isServiceInvoice ? "Hóa Đơn Dịch Vụ" : "Hóa Đơn Tiền Nước"}
                        </h1>
                        <p className="text-sm text-gray-500">Số HĐ: {invoice.invoiceNumber}</p>
                    </div>

                    {/* Trạng thái */}
                    {isPaid ? (
                        <div className="p-4 bg-green-100 text-green-700 border border-green-300 rounded-md flex items-center">
                            <CheckCircle size={18} className="mr-2" />
                            <span className="font-medium">Đã thanh toán (Ngày {moment(invoice.paidDate).format('DD/MM/YYYY')})</span>
                        </div>
                    ) : (
                        <div className="p-4 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-md flex items-center">
                            <Clock size={18} className="mr-2" />
                            <span className="font-medium">Chờ thanh toán (Hạn chót: {moment(invoice.dueDate).format('DD/MM/YYYY')})</span>
                        </div>
                    )}
                    
                    {/* Thông tin Khách hàng */}
                    <div className="pt-4 border-t">
                        <h3 className="text-base font-semibold text-gray-700 mb-2">Thông tin Khách hàng</h3>
                        <p className="text-sm"><strong>{invoice.customerName}</strong></p>
                        <p className="text-sm text-gray-600">{invoice.customerAddress}</p>
                    </div>

                    {/* Chi tiết Tiêu thụ (Nếu là HĐ Nước) */}
                    {!isServiceInvoice && (
                        <div className="pt-4 border-t">
                             <h3 className="text-base font-semibold text-gray-700 mb-2">Chi tiết Tiêu thụ</h3>
                             <p className="text-sm">Kỳ: {moment(invoice.fromDate).format('DD/MM')} - {moment(invoice.toDate).format('DD/MM/YYYY')}</p>
                             <p className="text-sm">Tiêu thụ: <strong className="text-lg">{invoice.totalConsumption} m³</strong></p>
                        </div>
                    )}

                    {/* Chi tiết Thanh toán */}
                    <div className="pt-4 border-t space-y-2">
                        <h3 className="text-base font-semibold text-gray-700 mb-2">Chi tiết Thanh toán</h3>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{isServiceInvoice ? "Phí dịch vụ:" : "Tiền nước (chưa VAT):"}</span>
                            <span>{invoice.subtotalAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Phí Môi trường:</span>
                            <span>{invoice.environmentFeeAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">VAT (Thuế):</span>
                            <span>{invoice.vatAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        {/* (Thêm các phí khác nếu có) */}
                        <hr className="my-1" />
                        <div className="flex justify-between text-lg font-bold text-red-600">
                            <span>TỔNG CỘNG:</span>
                            <span>{invoice.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: MÃ QR (Chỉ hiện nếu chưa trả) */}
                {!isPaid && (
                    <div className="lg:col-span-1">
                        {/* Import và render component QR Code */}
                        <InvoiceQRCode invoice={invoice} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvoiceDetail;