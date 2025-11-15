import React, { useState } from 'react';
import { findUnpaidInvoice, processCashPayment } from '../Services/apiCashierStaff';
import { Search, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import moment from 'moment';

/**
 * Trang Thu tiền mặt
 */
function CashPaymentForm() {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [foundInvoice, setFoundInvoice] = useState(null); // Lưu trữ Hóa đơn tìm thấy
    
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 1. Hàm Tìm kiếm Hóa đơn
    const handleSearch = async () => {
        if (!invoiceNumber.trim()) {
            setError('Vui lòng nhập Số Hóa đơn.');
            return;
        }
        setLoadingSearch(true);
        setError(null);
        setSuccess(null);
        setFoundInvoice(null);
        
        try {
            const response = await findUnpaidInvoice(invoiceNumber.trim());
            setFoundInvoice(response.data); // Lưu Hóa đơn
        } catch (err) {
            console.error("Lỗi khi tìm hóa đơn:", err);
            setError(err.response?.data?.message || "Không tìm thấy hóa đơn hoặc hóa đơn đã được thanh toán.");
        } finally {
            setLoadingSearch(false);
        }
    };

    // 2. Hàm Xác nhận Thanh toán
    const handleSubmitPayment = async () => {
        if (!foundInvoice) {
            setError("Lỗi: Không có hóa đơn nào được chọn.");
            return;
        }
        
        // Xác nhận lại
        const confirmMessage = `Xác nhận thu tiền mặt:
Khách hàng: ${foundInvoice.customerName}
Số tiền: ${foundInvoice.totalAmount.toLocaleString('vi-VN')} VNĐ
Hóa đơn: ${foundInvoice.invoiceNumber}`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        setLoadingSubmit(true);
        setError(null);
        setSuccess(null);
        
        try {
            const receipt = await processCashPayment(foundInvoice.id, foundInvoice.totalAmount);
            setSuccess(`Thanh toán thành công! Đã tạo Biên lai: ${receipt.data.receiptNumber}`);
            // Reset form
            setFoundInvoice(null);
            setInvoiceNumber('');
        } catch (err) {
            console.error("Lỗi khi xác nhận thanh toán:", err);
            setError(err.response?.data?.message || "Xác nhận thanh toán thất bại.");
        } finally {
            setLoadingSubmit(false);
        }
    };
    
    // 3. Hàm Hủy (để tìm HĐ khác)
    const handleCancel = () => {
        setFoundInvoice(null);
        setError(null);
        setSuccess(null);
        setInvoiceNumber('');
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Thu Tiền Mặt (Tại quầy/Tại nhà)</h1>
                <p className="text-sm text-gray-600">Tìm kiếm hóa đơn chưa thanh toán để ghi nhận biên lai.</p>
            </div>
            
            {/* Box Tìm kiếm */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Tìm Hóa đơn (Pending/Overdue)</h3>
                
                {/* Ẩn ô tìm kiếm nếu đã tìm thấy HĐ */}
                {!foundInvoice && (
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
                        <div className="flex-1">
                            <label htmlFor="invoiceNumber" className="block mb-1.5 text-sm font-medium text-gray-700">Nhập Số Hóa đơn *</label>
                            <input
                                type="text"
                                id="invoiceNumber"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="Ví dụ: HD-123 hoặc DV-456"
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={loadingSearch}
                            className="mt-2 sm:mt-0 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                        >
                            {loadingSearch ? 'Đang tìm...' : <Search size={16} className="mr-2" />}
                            Tìm
                        </button>
                    </div>
                )}
                
                {/* Thông báo Lỗi/Thành công (chung) */}
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        <span>{success}</span>
                    </div>
                )}
            </div>

            {/* Box Xác nhận Thanh toán (Chỉ hiện khi tìm thấy) */}
            {foundInvoice && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5 animate-pulse-fast"> {/* Thêm animation */}
                    <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                        Xác nhận Thanh toán
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-500">Khách hàng</p>
                            <p className="text-base font-semibold text-gray-800">{foundInvoice.customerName}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Số Hóa đơn</p>
                            <p className="text-base font-semibold text-gray-800">{foundInvoice.invoiceNumber}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Địa chỉ</p>
                            <p className="text-sm text-gray-600">{foundInvoice.customerAddress}</p>
                        </div>
                         <div>
                            <p className="font-medium text-gray-500">Hạn thanh toán</p>
                            <p className="text-sm text-gray-600">{moment(foundInvoice.dueDate).format('DD/MM/YYYY')}</p>
                        </div>
                    </div>
                    
                    {/* Tổng tiền */}
                    <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-gray-600">Tổng số tiền phải thu:</p>
                        <p className="text-3xl font-bold text-red-600">
                            {foundInvoice.totalAmount.toLocaleString('vi-VN')} VNĐ
                        </p>
                    </div>
                    
                    {/* Nút Hành động */}
                    <div className="pt-4 border-t flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleSubmitPayment}
                            disabled={loadingSubmit}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                        >
                            <DollarSign size={18} className="mr-2" />
                            {loadingSubmit ? 'Đang xử lý...' : 'Xác nhận Đã Thu Tiền Mặt'}
                        </button>
                         <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loadingSubmit}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Hủy (Tìm HĐ khác)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper cho animation
const styles = `
@keyframes pulse-fast {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}
.animate-pulse-fast {
  animation: pulse-fast 1s ease-in-out;
}
`;
// Thêm style vào head (nếu chưa có)
if (!document.getElementById('cash-payment-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "cash-payment-styles";
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

export default CashPaymentForm;