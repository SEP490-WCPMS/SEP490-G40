import React, { useState } from 'react';
import { findUnpaidInvoice, processCashPayment } from '../Services/apiCashierStaff'; // Đảm bảo đường dẫn đúng
import { Search, DollarSign, AlertCircle, CheckCircle, Receipt } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT CÁC THÀNH PHẦN GIAO DIỆN MỚI
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

/**
 * Trang Thu tiền mặt
 */
function CashPaymentForm() {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [foundInvoice, setFoundInvoice] = useState(null); // Lưu trữ Hóa đơn tìm thấy
    
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    
    // State cho Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // 1. Hàm Tìm kiếm Hóa đơn
    const handleSearch = async () => {
        if (!invoiceNumber.trim()) {
            toast.warn('Vui lòng nhập Số Hóa đơn.');
            return;
        }
        setLoadingSearch(true);
        setFoundInvoice(null);
        
        try {
            const response = await findUnpaidInvoice(invoiceNumber.trim());
            setFoundInvoice(response.data); // Lưu Hóa đơn
            toast.success("Đã tìm thấy hóa đơn!");
        } catch (err) {
            console.error("Lỗi khi tìm hóa đơn:", err);
            // Dùng Toast thay vì hiện text đỏ
            toast.error(err.response?.data?.message || "Không tìm thấy hóa đơn hoặc hóa đơn đã được thanh toán.");
        } finally {
            setLoadingSearch(false);
        }
    };

    // 2. Hàm mở Modal Xác nhận
    const handlePreSubmit = () => {
        if (!foundInvoice) {
            toast.error("Lỗi: Không có hóa đơn nào được chọn.");
            return;
        }
        setShowConfirmModal(true);
    };

    // 3. Hàm xử lý Thanh toán thật (Khi bấm Có trong Modal)
    const handleConfirmPayment = async () => {
        setLoadingSubmit(true);
        setShowConfirmModal(false); // Đóng modal
        
        try {
            const receipt = await processCashPayment(foundInvoice.id, foundInvoice.totalAmount);
            
            // Thông báo thành công kèm mã biên lai
            toast.success(`Thanh toán thành công! Mã biên lai: ${receipt.data.receiptNumber}`, {
                position: "top-center",
                autoClose: 5000 // Để lâu hơn chút để kịp đọc mã
            });

            // Reset form
            setFoundInvoice(null);
            setInvoiceNumber('');

        } catch (err) {
            console.error("Lỗi khi xác nhận thanh toán:", err);
            toast.error(err.response?.data?.message || "Xác nhận thanh toán thất bại.", {
                position: "top-center"
            });
        } finally {
            setLoadingSubmit(false);
        }
    };
    
    // 4. Hàm Hủy (để tìm HĐ khác)
    const handleCancel = () => {
        setFoundInvoice(null);
        setInvoiceNumber('');
        toast.info("Đã hủy chọn hóa đơn.");
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            
            {/* 2. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="text-green-600" /> Thu Tiền Mặt (Tại quầy/Tại nhà)
                </h1>
                <p className="text-sm text-gray-600 mt-1">Tìm kiếm hóa đơn chưa thanh toán để ghi nhận biên lai.</p>
            </div>
            
            {/* Box Tìm kiếm */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Tìm Hóa đơn (Pending/Overdue)</h3>
                
                {/* Ẩn ô tìm kiếm nếu đã tìm thấy HĐ */}
                {!foundInvoice && (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="flex-1">
                            <label htmlFor="invoiceNumber" className="block mb-1.5 text-sm font-medium text-gray-700">Nhập Số Hóa đơn <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="invoiceNumber"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Ví dụ: HD-123 hoặc DV-456"
                                    className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2.5 pl-3 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Search size={16} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={loadingSearch}
                            className="mt-2 sm:mt-0 inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        >
                            {loadingSearch ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                                <Search size={16} className="mr-2" />
                            )}
                            Tìm kiếm
                        </button>
                    </div>
                )}
                
                {/* Đã bỏ các div thông báo lỗi cũ */}
            </div>

            {/* Box Xác nhận Thanh toán (Chỉ hiện khi tìm thấy) */}
            {foundInvoice && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-blue-100 space-y-5 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-start border-b border-gray-200 pb-3 mb-5">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Receipt size={20} className="text-blue-600" />
                            Thông Tin Thanh Toán
                        </h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded border border-yellow-200">
                            CHƯA THANH TOÁN
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md">
                        <div>
                            <p className="font-medium text-gray-500 mb-1">Khách hàng</p>
                            <p className="text-base font-bold text-gray-900">{foundInvoice.customerName}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500 mb-1">Số Hóa đơn</p>
                            <p className="text-base font-bold text-gray-900 font-mono">{foundInvoice.invoiceNumber}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="font-medium text-gray-500 mb-1">Địa chỉ</p>
                            <p className="text-gray-700">{foundInvoice.customerAddress}</p>
                        </div>
                         <div>
                            <p className="font-medium text-gray-500 mb-1">Hạn thanh toán</p>
                            <p className={`text-base font-medium ${moment(foundInvoice.dueDate).isBefore(moment()) ? 'text-red-600' : 'text-gray-800'}`}>
                                {moment(foundInvoice.dueDate).format('DD/MM/YYYY')}
                                {moment(foundInvoice.dueDate).isBefore(moment()) && ' (Quá hạn)'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Tổng tiền */}
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-green-200 rounded-lg bg-green-50">
                        <p className="text-sm font-medium text-green-800 uppercase tracking-wider">Tổng số tiền phải thu</p>
                        <p className="text-4xl font-extrabold text-green-700 mt-1">
                            {foundInvoice.totalAmount.toLocaleString('vi-VN')} <span className="text-xl font-medium text-green-600">VNĐ</span>
                        </p>
                    </div>
                    
                    {/* Nút Hành động */}
                    <div className="pt-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-3">
                         <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loadingSubmit}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                        >
                            Hủy (Tìm HĐ khác)
                        </button>
                        <button
                            type="button"
                            onClick={handlePreSubmit} // Mở Modal
                            disabled={loadingSubmit}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95"
                        >
                            {loadingSubmit ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            ) : (
                                <DollarSign size={18} className="mr-2" />
                            )}
                            {loadingSubmit ? 'Đang xử lý...' : 'Xác nhận Đã Thu Tiền'}
                        </button>
                    </div>
                </div>
            )}

            {/* 3. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmPayment}
                title="Xác nhận thu tiền mặt"
                message={`Bạn có chắc chắn muốn xác nhận đã thu ${foundInvoice?.totalAmount.toLocaleString('vi-VN')} VNĐ tiền mặt từ khách hàng ${foundInvoice?.customerName} cho hóa đơn ${foundInvoice?.invoiceNumber} không?`}
                isLoading={loadingSubmit}
            />

        </div>
    );
}

export default CashPaymentForm;