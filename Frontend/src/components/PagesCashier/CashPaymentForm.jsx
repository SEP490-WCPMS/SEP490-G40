import React, { useState } from 'react';
import { searchInvoices, processCashPayment } from '../Services/apiCashierStaff';
import { Search, DollarSign, Receipt, User, FileText, ArrowRight, Droplets, Calendar, Phone, CreditCard, Mail, Gauge, Eye } from 'lucide-react';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

function CashPaymentForm() {
    const [keyword, setKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // 1. Hàm Tìm kiếm
    const handleSearch = async () => {
        if (!keyword.trim()) {
            toast.warn('Vui lòng nhập từ khóa (Tên KH, SĐT, Số HĐ).');
            return;
        }
        setLoadingSearch(true);
        setSearchResults([]);
        setSelectedInvoice(null);

        try {
            const response = await searchInvoices(keyword.trim());
            const data = response.data || [];
            setSearchResults(data);

            if (data.length === 0) {
                toast.info("Không tìm thấy hóa đơn chưa thanh toán nào khớp với từ khóa.");
            } else {
                toast.success(`Tìm thấy ${data.length} hóa đơn.`);
            }
        } catch (err) {
            console.error("Lỗi tìm kiếm:", err);
            toast.error("Lỗi khi tìm kiếm hóa đơn.");
        } finally {
            setLoadingSearch(false);
        }
    };

    // 2. Chọn hóa đơn
    const handleSelectInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        // Cuộn xuống chi tiết
        setTimeout(() => {
            const element = document.getElementById('invoice-detail-section');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleCancelSelection = () => {
        setSelectedInvoice(null);
    };

    // 3. Mở Modal
    const handlePreSubmit = () => {
        if (!selectedInvoice) return;
        setShowConfirmModal(true);
    };

    // 4. Thanh toán
    const handleConfirmPayment = async () => {
        setLoadingSubmit(true);
        setShowConfirmModal(false);
        try {
            // Backend yêu cầu Body là { amountPaid: ... }
            const receipt = await processCashPayment(selectedInvoice.id, { amountPaid: selectedInvoice.totalAmount });

            toast.success(`Thanh toán thành công! Mã biên lai: ${receipt.data.receiptNumber}`, {
                position: "top-center",
                autoClose: 5000
            });

            setSelectedInvoice(null);
            setSearchResults([]);
            setKeyword('');
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            toast.error(err.response?.data?.message || "Thanh toán thất bại.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    // Hàm helper chuyển đổi trạng thái sang tiếng Việt và class màu sắc
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return { label: 'Chờ thanh toán', className: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
            case 'OVERDUE':
                return { label: 'Quá hạn', className: 'text-red-700 bg-red-100 border-red-200' };
            case 'PAID':
                return { label: 'Đã thanh toán', className: 'text-green-700 bg-green-100 border-green-200' };
            default:
                return { label: status, className: 'text-gray-700 bg-gray-100 border-gray-200' };
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="text-green-600" /> Thu Tiền Mặt
                </h1>
                <p className="text-sm text-gray-600 mt-1">Tra cứu nợ theo Tên khách hàng, SĐT hoặc Số hóa đơn.</p>
            </div>

            {/* Box Tìm kiếm */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Nhập Tên KH, SĐT, hoặc Mã HĐ..."
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 pl-3 pr-10 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loadingSearch}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                        {loadingSearch ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </div>
            </div>

            {/* DANH SÁCH KẾT QUẢ TÌM KIẾM */}
            {searchResults.length > 0 && !selectedInvoice && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Kết quả tìm kiếm ({searchResults.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Hóa Đơn</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn TT</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng Tiền</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {searchResults.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{inv.customerName}</div>
                                            <div className="text-xs text-gray-500">{inv.customerPhone || '---'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {moment(inv.dueDate).format('DD/MM/YYYY')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                                            {inv.totalAmount?.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleSelectInvoice(inv)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* === FORM XÁC NHẬN THANH TOÁN === */}
            {selectedInvoice && (
                <div id="invoice-detail-section" className="bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden animate-in zoom-in duration-300">

                    {/* Header Hóa đơn */}
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center flex-wrap gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="text-blue-600" />
                                Chi Tiết Hóa Đơn: <span className="font-mono text-blue-700">{selectedInvoice.invoiceNumber}</span>
                            </h2>
                            {/* Lấy thông tin hiển thị từ hàm helper */}
                            {(() => {
                                const statusInfo = getStatusBadge(selectedInvoice.paymentStatus);
                                return (
                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                        Trạng thái:
                                        <span className={`font-bold px-2 py-0.5 rounded text-xs border ${statusInfo.className}`}>
                                            {statusInfo.label}
                                        </span>
                                    </p>
                                );
                            })()}
                        </div>
                        <button onClick={handleCancelSelection} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out">
                            Chọn hóa đơn khác
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Cột 1: Thông tin Khách hàng */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <User size={18} /> Thông tin Khách hàng
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs">Tên khách hàng</p>
                                            <p className="font-bold text-gray-900 text-base">{selectedInvoice.customerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Mã Khách hàng</p>
                                            <p className="font-medium text-gray-900">{selectedInvoice.customerCode || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Số điện thoại</p>
                                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                                <Phone size={12} /> {selectedInvoice.customerPhone || 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Email</p>
                                            <p className="font-medium text-gray-900 flex items-center gap-1">
                                                <Mail size={12} /> {selectedInvoice.customerEmail || 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Địa chỉ</p>
                                            <p className="font-medium text-gray-900">{selectedInvoice.customerAddress}</p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200">
                                            <p className="text-gray-500 text-xs">Hợp Đồng Lắp Đặt (ID)</p>
                                            <p className="font-bold text-blue-600">#{selectedInvoice.contractId || '---'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cột 2: Thông tin Nước/Dịch vụ (Dựa vào meterReadingId) */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 h-full">
                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <Droplets size={18} className="text-blue-500" /> Chi tiết Sử dụng
                                    </h3>

                                    {selectedInvoice.meterReadingId ? (
                                        <div className="space-y-4">
                                            {/* --- THÊM PHẦN MÃ ĐỒNG HỒ TẠI ĐÂY --- */}
                                            <div className="bg-white p-2 rounded shadow-sm border border-blue-100 flex justify-between items-center">
                                                <span className="text-gray-600 text-sm flex items-center gap-1">
                                                    <Gauge size={14} /> Mã đồng hồ:
                                                </span>
                                                <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-300">
                                                    {selectedInvoice.meterCode || 'N/A'}
                                                </span>
                                            </div>
                                            {/* ------------------------------------ */}

                                            <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-blue-100">
                                                <span className="text-gray-600 text-sm flex items-center gap-1">
                                                    <Calendar size={14} /> Kỳ ghi:
                                                </span>
                                                <div className="text-right">
                                                    <span className="block font-bold text-blue-800 text-xs">
                                                        {selectedInvoice.fromDate ? moment(selectedInvoice.fromDate).format('DD/MM') : '...'} -
                                                        {selectedInvoice.toDate ? moment(selectedInvoice.toDate).format('DD/MM') : '...'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-center">
                                                <div className="bg-white p-2 rounded border border-gray-200">
                                                    <p className="text-xs text-gray-500">Chỉ số Cũ</p>
                                                    <p className="font-mono font-bold text-gray-700">{selectedInvoice.oldIndex}</p>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-gray-200">
                                                    <p className="text-xs text-gray-500">Chỉ số Mới</p>
                                                    <p className="font-mono font-bold text-gray-700">{selectedInvoice.newIndex}</p>
                                                </div>
                                            </div>

                                            <div className="bg-blue-100 p-3 rounded text-center border border-blue-200">
                                                <p className="text-xs text-blue-600 uppercase font-semibold">Lượng tiêu thụ</p>
                                                <p className="text-2xl font-extrabold text-blue-800">
                                                    {selectedInvoice.totalConsumption} <span className="text-sm font-medium">m³</span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500 text-sm italic bg-white rounded border border-dashed border-gray-300">
                                            <FileText size={24} className="mb-2 opacity-50" />
                                            Đây là hóa đơn <br /> phí dịch vụ kiểm định / lắp đặt.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cột 3: Chi tiết Tiền */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 h-full flex flex-col justify-between shadow-sm">
                                    <div>
                                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                            <CreditCard size={18} /> Chi tiết Thanh toán
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Thành tiền (Chưa thuế):</span>
                                                <span className="font-medium">
                                                    {selectedInvoice.subtotalAmount?.toLocaleString('vi-VN')} đ
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Thuế GTGT (VAT):</span>
                                                <span className="font-medium">
                                                    {selectedInvoice.vatAmount?.toLocaleString('vi-VN')} đ
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Phí BVMT:</span>
                                                <span className="font-medium">
                                                    {selectedInvoice.environmentFeeAmount?.toLocaleString('vi-VN')} đ
                                                </span>
                                            </div>
                                            {selectedInvoice.latePaymentFee > 0 && (
                                                <div className="flex justify-between text-red-600">
                                                    <span className="font-medium">Phí trễ hạn:</span>
                                                    <span className="font-bold">
                                                        {selectedInvoice.latePaymentFee?.toLocaleString('vi-VN')} đ
                                                    </span>
                                                </div>
                                            )}

                                            <div className="border-t border-dashed border-gray-300 my-2 pt-2"></div>

                                            <div className="flex justify-between">
                                                <span className="font-bold text-gray-800">Hạn thanh toán:</span>
                                                <span className={`font-bold ${moment(selectedInvoice.dueDate).isBefore(moment()) ? 'text-red-600' : 'text-green-600'}`}>
                                                    {moment(selectedInvoice.dueDate).format('DD/MM/YYYY')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center mb-4">
                                            <p className="text-xs text-green-700 uppercase font-semibold">TỔNG CỘNG PHẢI THU</p>
                                            <p className="text-3xl font-extrabold text-green-700">
                                                {selectedInvoice.totalAmount?.toLocaleString('vi-VN')} đ
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleCancelSelection}
                                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                onClick={handlePreSubmit}
                                                disabled={loadingSubmit}
                                                className="flex-[2] py-2.5 bg-green-600 text-white font-bold rounded-md shadow hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                            >
                                                {loadingSubmit ? 'Đang xử lý...' : (
                                                    <> <DollarSign size={18} /> Xác Nhận Thu </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xác nhận */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmPayment}
                title="Xác nhận thu tiền mặt"
                message={`Bạn xác nhận đã nhận đủ ${selectedInvoice?.totalAmount?.toLocaleString('vi-VN')} VNĐ từ khách hàng ${selectedInvoice?.customerName}?`}
                isLoading={loadingSubmit}
            />
        </div>
    );
}

export default CashPaymentForm;