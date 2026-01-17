import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceDetail, cancelInvoice, downloadInvoicePdf } from '../Services/apiAccountingStaff'; 
import { ArrowLeft, DollarSign, Calendar, FileText, AlertCircle, XCircle, CheckCircle, Download, CreditCard, User, Droplets, Gauge } from 'lucide-react';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

/**
 * Trang Chi tiết Hóa đơn Dịch vụ (Dành cho Kế toán)
 */
function InvoiceDetail() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();

    const [invoiceDetail, setInvoiceDetail] = useState(null);
    const [feeDetail, setFeeDetail] = useState(null);

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    
    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // State Zoom Ảnh
    const [isZoomed, setIsZoomed] = useState(false);

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

    // --- CÁC HÀM XỬ LÝ ---
    const handlePreCancel = () => setShowConfirmModal(true);

    const handleConfirmCancel = async () => {
        setProcessing(true);
        setShowConfirmModal(false);
        try {
            await cancelInvoice(invoiceId);
            toast.success("Hủy hóa đơn thành công!", { position: "top-center", autoClose: 2000 });
            fetchData();
        } catch (err) {
            console.error("Lỗi hủy hóa đơn:", err);
            toast.error(err.response?.data?.message || "Hủy hóa đơn thất bại.", { position: "top-center" });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'PAID': return 'bg-green-100 text-green-800 border border-green-200';
            case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-200 font-bold';
            case 'CANCELLED': return 'bg-gray-100 text-gray-600 border border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'OVERDUE': return 'Quá hạn';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const res = await downloadInvoicePdf(invoiceId);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const safeInvoiceNumber = invoiceDetail?.invoiceNumber || invoiceId;
            const a = document.createElement('a');
            a.href = url;
            a.download = `HoaDon_${safeInvoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể tải file PDF hóa đơn.', { position: 'top-center' });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

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
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-5xl mx-auto">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/accounting/invoices')} className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Hóa Đơn</h1>
                        <p className="text-sm text-gray-600">Số HĐ: <span className="font-mono font-bold">{invoiceDetail.invoiceNumber}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadPdf} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-colors focus:outline-none">
                        <Download size={18} className="mr-2" /> Tải PDF
                    </button>
                    {invoiceDetail.paymentStatus === 'PENDING' && (
                        <button onClick={handlePreCancel} disabled={processing} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none">
                            {processing ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> : <XCircle size={18} className="mr-2" />}
                            {processing ? 'Đang xử lý...' : 'Hủy Hóa Đơn'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CỘT TRÁI (2/3): THÔNG TIN CHÍNH */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Box Thông tin chung */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" /> Thông tin Hóa đơn
                            </h3>
                            <span className={`px-3 py-1 inline-flex text-sm font-bold rounded-full ${getStatusClass(invoiceDetail.paymentStatus)}`}>
                                {getStatusLabel(invoiceDetail.paymentStatus)}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Ngày Lập</p>
                                <p className="font-medium text-gray-900">{moment(invoiceDetail.invoiceDate).format('DD/MM/YYYY')}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Hạn Thanh Toán</p>
                                <p className={`font-medium ${moment(invoiceDetail.dueDate).isBefore(moment(), 'day') && invoiceDetail.paymentStatus === 'PENDING' ? 'text-red-600' : 'text-gray-900'}`}>
                                    {moment(invoiceDetail.dueDate).format('DD/MM/YYYY')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Ngày Thanh Toán</p>
                                <p className="font-medium text-green-700">{invoiceDetail.paidDate ? moment(invoiceDetail.paidDate).format('DD/MM/YYYY') : '---'}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Box Khách hàng */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                            <User size={18} className="text-gray-500" /> Thông tin Khách hàng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <p><strong className="text-gray-700">Họ tên:</strong> {invoiceDetail.customerName}</p>
                                <p><strong className="text-gray-700">Mã KH:</strong> {invoiceDetail.customerCode}</p>
                            </div>
                            <div>
                                <p><strong className="text-gray-700">SĐT:</strong> {invoiceDetail.customerPhone || '---'}</p>
                                <p><strong className="text-gray-700">Email:</strong> {invoiceDetail.customerEmail || '---'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p><strong className="text-gray-700">Địa chỉ:</strong> {invoiceDetail.customerAddress}</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Box Thông tin Nước (Nếu có) */}
                    {!feeDetail && invoiceDetail.meterReadingId && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                                <Droplets size={18} className="text-blue-500" /> Chỉ số Nước
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-center">
                                <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-xs text-gray-500">Mã ĐH</p>
                                    <p className="font-mono font-bold">{invoiceDetail.meterCode}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-xs text-gray-500">Chỉ số Cũ</p>
                                    <p className="font-mono font-bold">{invoiceDetail.oldIndex}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-xs text-gray-500">Chỉ số Mới</p>
                                    <p className="font-mono font-bold">{invoiceDetail.newIndex}</p>
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold">Tiêu thụ</p>
                                    <p className="font-extrabold text-blue-700 text-lg">{invoiceDetail.totalConsumption} m³</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Box Thông tin Gốc (Nếu là HĐ Dịch vụ) */}
                    {feeDetail && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                                <Gauge size={18} className="text-purple-500" /> Thông tin Gốc (Kỹ thuật)
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Đồng hồ:</strong> {feeDetail.meterCode}</p>
                                <p><strong>Phí gốc:</strong> {feeDetail.calibrationCost.toLocaleString('vi-VN')} VNĐ</p>
                                <p className="italic bg-gray-50 p-2 rounded mt-2">"Ghi chú: {feeDetail.notes || 'N/A'}"</p>
                            </div>
                        </div>
                    )}

                    {/* 5. === ẢNH BẰNG CHỨNG (MỚI THÊM) === */}
                    {invoiceDetail.paymentStatus === 'PAID' && invoiceDetail.evidenceImageBase64 && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
                            <h3 className="text-base font-bold text-green-700 mb-4 flex items-center gap-2 border-b border-green-100 pb-2">
                                <CheckCircle size={18} /> Bằng chứng thanh toán (Tiền mặt)
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="w-full sm:w-48 shrink-0 group relative cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                                    <img 
                                        src={`data:image/jpeg;base64,${invoiceDetail.evidenceImageBase64}`} 
                                        alt="Evidence" 
                                        className="w-full h-32 object-cover rounded border border-gray-300 shadow-sm group-hover:opacity-90 transition"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition rounded text-white text-xs font-bold">Xem lớn</div>
                                </div>
                                <div className="flex-1 text-sm space-y-2 text-gray-600">
                                    <p><strong>Mã biên lai:</strong> <span className="font-mono text-gray-800">{invoiceDetail.receiptNumber || '---'}</span></p>
                                    <p><strong>Hình thức:</strong> Tiền mặt (Cash)</p>
                                    <p><strong>Người thu:</strong> {invoiceDetail.cashierName || 'Thu ngân'}</p>
                                    <p className="text-xs text-gray-500 italic mt-2">* Ảnh chụp biên lai có chữ ký khách hàng hoặc tiền mặt tại hiện trường.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI (1/3): TỔNG TIỀN */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-4">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                            <CreditCard size={18} /> Chi tiết Thanh toán
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Thành tiền:</span>
                                <span className="font-medium">{invoiceDetail.subtotalAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">VAT:</span>
                                <span className="font-medium">{invoiceDetail.vatAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phí BVMT:</span>
                                <span className="font-medium">{invoiceDetail.environmentFeeAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                            {invoiceDetail.latePaymentFee > 0 && (
                                <div className="flex justify-between text-red-600 bg-red-50 p-1 rounded">
                                    <span className="font-medium">Phí trễ hạn:</span>
                                    <span className="font-bold">{invoiceDetail.latePaymentFee.toLocaleString('vi-VN')} đ</span>
                                </div>
                            )}
                            
                            <div className="border-t border-dashed border-gray-300 my-2 pt-2"></div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-gray-800">TỔNG CỘNG:</span>
                                <span className="text-xl font-extrabold text-blue-700">{invoiceDetail.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>

                            {invoiceDetail.deductedAmount > 0 && (
                                <div className="flex justify-between items-center text-green-600 text-sm">
                                    <span>Trừ ví tích lũy:</span>
                                    <span className="font-bold">- {invoiceDetail.deductedAmount.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg mt-2">
                                <span className="text-sm font-bold text-gray-700">THỰC THU:</span>
                                <span className="text-2xl font-black text-red-600">
                                    {(invoiceDetail.totalAmount - (invoiceDetail.deductedAmount || 0)).toLocaleString('vi-VN')} VNĐ
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL ZOOM ẢNH */}
            {isZoomed && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setIsZoomed(false)}>
                    <img src={`data:image/jpeg;base64,${invoiceDetail.evidenceImageBase64}`} alt="Zoomed Evidence" className="max-w-full max-h-full rounded shadow-2xl" />
                    <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
                        <XCircle size={32} />
                    </button>
                </div>
            )}

            {/* MODAL XÁC NHẬN HỦY */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmCancel}
                title="Xác nhận hủy hóa đơn"
                message={`Bạn có chắc chắn muốn hủy hóa đơn ${invoiceDetail.invoiceNumber} không?`}
                isLoading={processing}
            />
        </div>
    );
}

export default InvoiceDetail;