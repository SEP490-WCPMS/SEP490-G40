import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMyInvoiceDetail, createPayOSLink } from '../../Services/apiCustomer';
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
    const [payOSData, setPayOSData] = useState(null);

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


    // --- useEffect: Tự động tạo QR PayOS ---
    useEffect(() => {
        // SỬA LẠI ĐIỀU KIỆN TẠI ĐÂY:
        // Cho phép tạo link nếu trạng thái LÀ: PENDING hoặc OVERDUE hoặc PARTIALLY_PAID
        const allowedStatuses = ['PENDING', 'OVERDUE'];

        if (invoice && allowedStatuses.includes(invoice.paymentStatus)) {
            createPayOSLink(invoice.id)
                .then(res => setPayOSData(res.data))
                .catch(err => console.error("Lỗi tạo PayOS link", err));
        }
    }, [invoice]);


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
                        {/* --- THÊM ĐOẠN NÀY ĐỂ HIỆN PHÍ PHẠT 35K --- */}
                        {invoice.latePaymentFee > 0 && (
                            <div className="flex justify-between text-sm text-red-600 font-semibold bg-red-50 p-1 rounded">
                                <span>Phí phạt nộp chậm:</span>
                                <span>{invoice.latePaymentFee.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        )}
                        {/* ------------------------------------------- */}
                        {/* (Thêm các phí khác nếu có) */}
                        <hr className="my-1" />

                        {/* 1. Hiển thị Tổng giá trị gốc của Hợp đồng */}
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                            <span>TỔNG GIÁ TRỊ HĐ:</span>
                            <span>{invoice.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>

                        {/* 2. Nếu có trừ ví thì hiện dòng màu xanh */}
                        {invoice.deductedAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Đã trừ từ Ví tích lũy:</span>
                                <span>- {invoice.deductedAmount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        )}

                        {/* 3. Hiển thị số tiền THỰC TẾ cần quét mã (Màu đỏ to) */}
                        <div className="flex justify-between text-xl font-bold text-red-600 mt-2 pt-2 border-t border-dashed">
                            <span>CẦN THANH TOÁN:</span>
                            <span>
                                {/* Lấy Tổng - Đã Trừ. Nếu null thì coi như 0 */}
                                {(invoice.totalAmount - (invoice.deductedAmount || 0)).toLocaleString('vi-VN')} VNĐ
                            </span>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: PAYOS QR */}
                {!isPaid && (
                    <div className="lg:col-span-1">
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <h4 className="font-bold text-lg mb-4">Thanh toán Online</h4>

                            {payOSData ? (
                                <>
                                    {/* --- SỬA ĐOẠN NÀY: Tự tạo link ảnh VietQR từ dữ liệu PayOS --- */}
                                    {/* Lý do: Ảnh Base64 trả về có thể bị lỗi hoặc quá dài, dùng link này nhẹ và ổn định hơn */}
                                    <img
                                        src={`https://img.vietqr.io/image/${payOSData.bin}-${payOSData.accountNumber}-compact.png?amount=${payOSData.amount}&addInfo=${encodeURIComponent(payOSData.description)}&accountName=${encodeURIComponent(payOSData.accountName)}`}
                                        alt="PayOS QR"
                                        className="w-full max-w-[250px] mx-auto border rounded"
                                    />
                                    {/* ------------------------------------------------------------- */}
                                    <p className="text-sm mt-2 text-gray-600">Quét mã bằng App Ngân hàng</p>

                                    {/* --- THÊM ĐOẠN LƯU Ý NÀY VÀO ĐÂY --- */}
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-left text-sm text-gray-800 shadow-sm">
                                        <p className="leading-relaxed">
                                            <span className="font-bold text-yellow-700">⚠️ Lưu ý quan trọng:</span>
                                            <br />
                                            Vui lòng nhập chính xác:
                                        </p>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            <li>
                                                Số tiền: <strong className="text-red-600 text-base">{payOSData.amount.toLocaleString('vi-VN')}</strong>
                                            </li>
                                            <li>
                                                Nội dung: <strong className="text-blue-700 bg-blue-50 px-1 rounded border border-blue-100 break-all select-all">
                                                    {payOSData.description}
                                                </strong>
                                            </li>
                                        </ul>
                                    </div>
                                    {/* ------------------------------------- */}

                                    <div className="my-4 border-t pt-4">
                                        <p className="text-sm mb-2">Hoặc bấm vào nút bên dưới:</p>
                                        <a
                                            href={payOSData.checkoutUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block w-full py-3 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 transition"
                                        >
                                            Thanh toán qua PayOS
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <p>Đang tạo mã thanh toán...</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvoiceDetail;