import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCashierInvoiceDetail, processCashPayment } from '../Services/apiCashierStaff';
import { ArrowLeft, User, Home, Phone, Mail, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import moment from 'moment';

/**
 * Trang Chi tiết Hóa đơn (Dành cho Thu ngân Thu tại nhà)
 */
function RouteInvoiceDetail() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 1. Tải chi tiết Hóa đơn
    useEffect(() => {
        if (!invoiceId) {
            setError("Không tìm thấy ID Hóa đơn.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        getCashierInvoiceDetail(invoiceId)
            .then(response => {
                setInvoice(response.data);
            })
            .catch(err => setError(err.response?.data?.message || "Lỗi tải chi tiết hóa đơn."))
            .finally(() => setLoading(false));
    }, [invoiceId]);

    // 2. Hàm Xác nhận Thanh toán
    const handleSubmitPayment = async () => {
        if (!invoice) return;
        
        const confirmMessage = `Xác nhận thu tiền mặt ${invoice.totalAmount.toLocaleString('vi-VN')} VNĐ cho Hóa đơn ${invoice.invoiceNumber}?`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        
        try {
            const receipt = await processCashPayment(invoice.id, invoice.totalAmount);
            setSuccess(`Thanh toán thành công! Đã tạo Biên lai: ${receipt.data.receiptNumber}`);
            // Cập nhật trạng thái ngay trên UI
            setInvoice(prev => ({ ...prev, paymentStatus: 'PAID', paidDate: new Date() }));
        } catch (err) {
            console.error("Lỗi khi xác nhận thanh toán:", err);
            setError(err.response?.data?.message || "Xác nhận thanh toán thất bại.");
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) return <div className="p-8 text-center">Đang tải chi tiết hóa đơn...</div>;
    
    if (error && !invoice) {
         return (
             <div className="p-8 max-w-4xl mx-auto">
                 <Link to="/cashier/my-route" className="inline-flex items-center text-blue-600 hover:underline mb-4">
                     <ArrowLeft size={18} className="mr-1" /> Quay lại
                 </Link>
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
             </div>
        );
    }

    const isPaid = invoice?.paymentStatus === 'PAID';

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate('/cashier/my-route')} className="p-2 rounded-full hover:bg-gray-100">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Hóa Đơn Cần Thu</h1>
                    <p className="text-sm text-gray-600">Số HĐ: {invoice?.invoiceNumber}</p>
                </div>
            </div>

            {/* Box Chi tiết (Chỉ đọc) */}
            {invoice && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                    
                    {/* Thông báo Lỗi/Thành công */}
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 ...">
                            <AlertCircle size={16} className="mr-2" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-100 text-green-700 ...">
                            <CheckCircle size={16} className="mr-2" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Thông tin Khách hàng */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin Khách hàng</h3>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2"><User size={16} className="text-gray-500" /> <strong>{invoice.customerName}</strong></p>
                            <p className="flex items-start gap-2"><Home size={16} className="text-gray-500 mt-0.5" /> <span>{invoice.customerAddress}</span></p>
                            <p className="flex items-center gap-2"><Phone size={16} className="text-gray-500" /> <span>{invoice.customerPhone || '(Chưa có SĐT)'}</span></p>
                            <p className="flex items-center gap-2"><Mail size={16} className="text-gray-500" /> <span>{invoice.customerEmail || '(Chưa có Email)'}</span></p>
                        </div>
                    </div>
                    
                    {/* Chi phí & Nút hành động */}
                    <div className="pt-4 border-t">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng số tiền phải thu:</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {invoice.totalAmount.toLocaleString('vi-VN')} VNĐ
                                </p>
                            </div>
                            
                            {!isPaid && (
                                <button
                                    onClick={handleSubmitPayment}
                                    disabled={submitting}
                                    className={`inline-flex items-center justify-center px-6 py-3 border ... text-white bg-green-600 hover:bg-green-700 ${submitting ? 'opacity-50' : ''}`}
                                >
                                    <DollarSign size={20} className="mr-2" />
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận Đã Thu Tiền Mặt'}
                                </button>
                            )}
                            
                            {isPaid && (
                                 <div className="p-3 bg-green-100 text-green-700 rounded-md flex items-center">
                                    <CheckCircle size={16} className="mr-2" />
                                    <span>Đã thanh toán (Ngày {moment(invoice.paidDate).format('DD/MM/YYYY')})</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RouteInvoiceDetail;