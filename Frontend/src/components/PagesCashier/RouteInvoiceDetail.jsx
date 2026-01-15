import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCashierInvoiceDetail, processCashPayment } from '../Services/apiCashierStaff';
import { ArrowLeft, User, Phone, Mail, DollarSign, CheckCircle, FileText, Droplets, Calendar, CreditCard, AlertCircle, Camera, X, Gauge } from 'lucide-react';
import moment from 'moment';
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- STATE MỚI CHO ẢNH BẰNG CHỨNG ---
    const [evidenceFile, setEvidenceFile] = useState(null); // Base64
    const [evidencePreview, setEvidencePreview] = useState(null); // URL Preview
    // -------------------------------------

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

    // --- HÀM XỬ LÝ ẢNH ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setEvidencePreview(previewUrl);

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(',')[1];
                setEvidenceFile(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetEvidence = () => {
        setEvidenceFile(null);
        setEvidencePreview(null);
    };
    // ---------------------

    const handlePreSubmit = () => {
        if (!invoice) return;

        // VALIDATE: Bắt buộc phải có ảnh
        if (!evidenceFile) {
            toast.warn("Vui lòng chụp ảnh biên lai/chữ ký khách hàng làm bằng chứng!", {
                autoClose: 3000
            });
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmPayment = async () => {
        setSubmitting(true);
        setShowConfirmModal(false);

        try {
            // Gửi payload gồm amount và evidenceImage
            const payload = { 
                amountPaid: invoice.totalAmount,
                evidenceImage: evidenceFile // Gửi chuỗi base64
            };

            const receipt = await processCashPayment(invoice.id, payload);
            
            toast.success(`Thanh toán thành công! Biên lai: ${receipt.data.receiptNumber}`, {
                position: "top-center",
                autoClose: 3000
            });

            setInvoice(prev => ({ 
                ...prev, 
                paymentStatus: 'PAID', 
                paidDate: new Date() 
            }));

            // Tự động quay lại sau 2s
            setTimeout(() => {
                navigate(-1);
            }, 2000);

        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            toast.error(err.response?.data?.message || "Thanh toán thất bại.", { position: "top-center" });
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    if (!invoice) {
         return (
             <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center pt-20">
                 <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                 <p className="text-gray-600 mb-6 text-lg">Không tìm thấy dữ liệu hóa đơn.</p>
                 <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                     Quay lại
                 </button>
             </div>
        );
    }

    const isPaid = invoice.paymentStatus === 'PAID';

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-5xl mx-auto">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                     <ArrowLeft size={24} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Thu Tiền Tại Nhà</h1>
                    <p className="text-sm text-gray-600">Khách hàng: <span className="font-bold">{invoice.customerName}</span></p>
                </div>
            </div>

            {/* === GIAO DIỆN CHI TIẾT MỚI === */}
            <div className="bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden animate-in zoom-in duration-300">
                
                {/* Thanh Tiêu đề Hóa đơn */}
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <FileText size={24} className="text-blue-600" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                Hóa Đơn: <span className="font-mono text-blue-700">{invoice.invoiceNumber}</span>
                            </h2>
                            <p className="text-xs text-gray-500">Ngày lập: {moment(invoice.invoiceDate).format('DD/MM/YYYY')}</p>
                        </div>
                    </div>
                    <div>
                        {isPaid ? (
                            <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm border border-green-200">
                                <CheckCircle size={16}/> Đã Thanh Toán
                            </span>
                        ) : (
                            <span className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm border ${invoice.paymentStatus === 'OVERDUE' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                {invoice.paymentStatus === 'OVERDUE' ? 'Quá Hạn' : 'Chờ Thanh Toán'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Cột 1: Thông tin Khách hàng */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                                    <User size={18} /> Thông tin Khách hàng
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-500 text-xs">Họ tên</p>
                                        <p className="font-bold text-gray-900 text-base">{invoice.customerName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-gray-500 text-xs">Mã KH</p>
                                            <p className="font-medium text-gray-900">{invoice.customerCode || '---'}</p>
                                        </div>
                                        <div>
                                             <p className="text-gray-500 text-xs">SĐT</p>
                                             <p className="font-medium text-gray-900">{invoice.customerPhone || '---'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Địa chỉ</p>
                                        <p className="font-medium text-gray-900 break-words">{invoice.customerAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cột 2: Thông tin Nước (Nếu có) */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 h-full">
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                                    <Droplets size={18} className="text-blue-500" /> Chi tiết Sử dụng
                                </h3>

                                {invoice.meterReadingId ? (
                                    <div className="space-y-4">
                                        <div className="bg-white p-2 rounded shadow-sm border border-blue-100 flex justify-between items-center">
                                            <span className="text-gray-600 text-sm flex items-center gap-1">
                                                <Gauge size={14} /> Mã ĐH:
                                            </span>
                                            <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-300">
                                                {invoice.meterCode || 'N/A'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-white p-2 rounded border border-gray-200">
                                                <p className="text-xs text-gray-500">Chỉ số Cũ</p>
                                                <p className="font-mono font-bold text-gray-700">{invoice.oldIndex}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded border border-gray-200">
                                                <p className="text-xs text-gray-500">Chỉ số Mới</p>
                                                <p className="font-mono font-bold text-gray-700">{invoice.newIndex}</p>
                                            </div>
                                        </div>

                                        <div className="bg-blue-100 p-3 rounded text-center border border-blue-200">
                                            <p className="text-xs text-blue-600 uppercase font-semibold">Lượng tiêu thụ</p>
                                            <p className="text-2xl font-extrabold text-blue-800">
                                                {invoice.totalConsumption} <span className="text-sm font-medium">m³</span>
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500 text-sm italic bg-white rounded border border-dashed border-gray-300">
                                        <FileText size={24} className="mb-2 opacity-50"/>
                                        Đây là hóa đơn <br/> phí dịch vụ / lắp đặt.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cột 3: Thanh toán & UPLOAD ẢNH */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 h-full flex flex-col justify-between shadow-sm">
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                        <CreditCard size={18} /> Thanh toán
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Thành tiền:</span>
                                            <span className="font-medium">{invoice.subtotalAmount?.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">VAT:</span>
                                            <span className="font-medium">{invoice.vatAmount?.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phí BVMT:</span>
                                            <span className="font-medium">{invoice.environmentFeeAmount?.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                        {invoice.latePaymentFee > 0 && (
                                            <div className="flex justify-between text-red-600">
                                                <span className="font-medium">Phí trễ hạn:</span>
                                                <span className="font-bold">{invoice.latePaymentFee?.toLocaleString('vi-VN')} đ</span>
                                            </div>
                                        )}
                                        
                                        <div className="border-t border-dashed border-gray-300 my-2 pt-2"></div>
                                        
                                        <div className="flex justify-between">
                                            <span className="font-bold text-gray-800">Hạn thanh toán:</span>
                                            <span className={`font-bold ${moment(invoice.dueDate).isBefore(moment()) && !isPaid ? 'text-red-600' : 'text-green-600'}`}>
                                                {moment(invoice.dueDate).format('DD/MM/YYYY')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center mb-4">
                                        <p className="text-xs text-green-700 uppercase font-semibold">TỔNG CỘNG PHẢI THU</p>
                                        <p className="text-3xl font-extrabold text-green-700">
                                            {invoice.totalAmount?.toLocaleString('vi-VN')} đ
                                        </p>
                                    </div>

                                    {!isPaid && (
                                        <div className="space-y-4">
                                            {/* --- KHU VỰC UPLOAD ẢNH BẰNG CHỨNG --- */}
                                            <div className="border-t pt-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ảnh bằng chứng (Biên lai ký/Tiền mặt) <span className="text-red-500">*</span>
                                                </label>
                                                
                                                {!evidencePreview ? (
                                                    <div className="flex items-center justify-center w-full">
                                                        <label htmlFor="evidence-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <Camera className="w-8 h-8 text-gray-400 mb-1" />
                                                                <p className="text-xs text-gray-500">Chạm để chụp/tải ảnh</p>
                                                            </div>
                                                            <input 
                                                                id="evidence-upload" 
                                                                type="file" 
                                                                accept="image/*" 
                                                                capture="environment" 
                                                                className="hidden" 
                                                                onChange={handleFileChange}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <img src={evidencePreview} alt="Evidence Preview" className="w-full h-32 object-cover rounded-lg border border-gray-300" />
                                                        <button 
                                                            onClick={resetEvidence}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                            title="Xóa ảnh"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {/* ----------------------------------- */}

                                            <button
                                                onClick={handlePreSubmit}
                                                disabled={submitting}
                                                className="w-full py-3 bg-green-600 text-white font-bold rounded-md shadow hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {submitting ? 'Đang xử lý...' : (
                                                    <> <DollarSign size={20} /> Xác Nhận Đã Thu Tiền </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmPayment}
                title="Xác nhận thu tiền"
                message={`Bạn xác nhận đã nhận đủ ${invoice.totalAmount?.toLocaleString('vi-VN')} VNĐ tiền mặt và đã tải ảnh bằng chứng?`}
                isLoading={submitting}
            />
        </div>
    );
}

export default RouteInvoiceDetail;