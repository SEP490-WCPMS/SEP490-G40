import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvoiceDetail } from '../Services/apiAccountingStaff';
import { ArrowLeft, User, Home, Hash, DollarSign, Calendar, FileText, AlertCircle, Save, Info } from 'lucide-react';
import moment from 'moment';

/**
 * Trang (Read-Only) Chi tiết Hóa đơn Dịch vụ (Req 1)
 */
function InvoiceDetail() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    
    const [invoiceDetail, setInvoiceDetail] = useState(null); // DTO Hóa đơn
    const [feeDetail, setFeeDetail] = useState(null); // DTO Phí gốc
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!invoiceId) {
            setError("Không tìm thấy ID Hóa đơn.");
            setLoading(false);
            return;
        }
        
        getInvoiceDetail(invoiceId)
            .then(response => {
                setInvoiceDetail(response.data.invoice); // Lấy Hóa đơn
                setFeeDetail(response.data.fee); // Lấy Phí gốc
            })
            .catch(err => setError(err.response?.data?.message || "Lỗi tải chi tiết hóa đơn."))
            .finally(() => setLoading(false));
    }, [invoiceId]);

    // Helper
    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'OVERDUE': return 'bg-orange-100 text-orange-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    if (loading) return <div className="p-8 text-center">Đang tải chi tiết hóa đơn...</div>;
    
    if (error) {
         return (
             <div className="p-8 max-w-4xl mx-auto">
                 <Link to="/accounting/invoices" className="inline-flex items-center text-blue-600 hover:underline mb-4">
                     <ArrowLeft size={18} className="mr-1" /> Quay lại
                 </Link>
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
             </div>
        );
    }
    
    if (!invoiceDetail) {
        return <div className="p-8 text-center">Không tìm thấy dữ liệu hóa đơn.</div>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate('/accounting/invoices')} className="p-2 rounded-full hover:bg-gray-100">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Hóa Đơn Dịch Vụ</h1>
                    <p className="text-sm text-gray-600">Số HĐ: {invoiceDetail.invoiceNumber}</p>
                </div>
            </div>

            {/* Box Thông tin Gốc (Từ Kỹ thuật) - Read-only */}
            {feeDetail && ( // Chỉ hiển thị nếu có phí gốc (là HĐ Dịch vụ)
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin Phí Gốc (Từ Kỹ thuật)</h3>
                    <p className="text-sm"><strong>Khách hàng:</strong> {feeDetail.customerName} (Mã KH: {feeDetail.customerCode})</p>
                    <p className="text-sm"><strong>Địa chỉ:</strong> {feeDetail.customerAddress}</p>
                    <p className="text-sm"><strong>Đồng hồ:</strong> {feeDetail.meterCode}</p>
                    <p className="text-sm"><strong>Phí kiểm định (gốc):</strong> {feeDetail.calibrationCost.toLocaleString('vi-VN')} VNĐ</p>
                    <p className="text-sm"><strong>Ghi chú Kỹ thuật:</strong> {feeDetail.notes || 'N/A'}</p>
                </div>
            )}
            
            {/* Nếu không có feeDetail (ví dụ: HĐ tiền nước) */}
            {!feeDetail && invoiceDetail.meterReadingId && (
                 <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-3">
                     <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin Hóa Đơn Nước</h3>
                     <p><strong>Khách hàng:</strong> {invoiceDetail.customerName}</p>
                     <p><strong>Tổng tiêu thụ:</strong> {invoiceDetail.totalConsumption} m³</p>
                 </div>
            )}

            {/* Form Chi tiết Hóa đơn (Read-only) */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-5">
                    <h3 className="text-lg font-semibold text-gray-700">
                        Thông tin Hóa đơn
                    </h3>
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusClass(invoiceDetail.paymentStatus)}`}>
                        {invoiceDetail.paymentStatus}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Số Hóa Đơn */}
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-500">Số Hóa Đơn</label>
                        <p className="text-sm text-gray-800 font-medium p-2">{invoiceDetail.invoiceNumber}</p>
                    </div>
                    {/* Ngày Lập Hóa Đơn */}
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-500">Ngày Lập HĐ</label>
                        <p className="text-sm text-gray-800 p-2">{moment(invoiceDetail.invoiceDate).format('DD/MM/YYYY')}</p>
                    </div>
                    {/* Hạn Thanh Toán */}
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-500">Hạn Thanh Toán</label>
                        <p className="text-sm text-gray-800 p-2">{moment(invoiceDetail.dueDate).format('DD/MM/YYYY')}</p>
                    </div>
                    {/* Ngày Thanh Toán */}
                    {invoiceDetail.paidDate && (
                         <div>
                            <label className="block mb-1.5 text-sm font-medium text-gray-500">Ngày Thanh Toán</label>
                            <p className="text-sm text-green-600 font-medium p-2">{moment(invoiceDetail.paidDate).format('DD/MM/YYYY')}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    {/* Tiền (chưa VAT) */}
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-500">Tiền dịch vụ</label>
                        <p className="text-sm text-gray-800 font-medium p-2">{invoiceDetail.subtotalAmount.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                    {/* VAT */}
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-500">Tiền VAT</label>
                        <p className="text-sm text-gray-800 font-medium p-2">{invoiceDetail.vatAmount.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                    {/* Tổng cộng */}
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-500">Tổng Tiền</label>
                        <p className="text-lg text-red-600 font-bold p-2">{invoiceDetail.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                </div>
                
                {/* Ghi chú Kế toán */}
                {invoiceDetail.notes && (
                    <div className="pt-4 border-t">
                        <label className="block mb-1.5 text-sm font-medium text-gray-500">Ghi chú (Hóa đơn)</label>
                        <p className="text-sm text-gray-800 p-2">{invoiceDetail.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvoiceDetail;