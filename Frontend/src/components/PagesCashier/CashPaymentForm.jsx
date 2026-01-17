import React, { useState } from 'react';
import { searchInvoices, processCashPayment } from '../Services/apiCashierStaff';
import { Search, DollarSign, User, FileText, Droplets, Calendar, Phone, Mail, Gauge, Eye, CreditCard, Loader2, Camera, X } from 'lucide-react';
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

    // --- STATE MỚI CHO ẢNH BẰNG CHỨNG ---
    const [evidenceFile, setEvidenceFile] = useState(null); // Base64 string gửi về BE
    const [evidencePreview, setEvidencePreview] = useState(null); // URL để hiển thị preview
    // -------------------------------------

    // 1. Hàm Tìm kiếm
    const handleSearch = async () => {
        if (!keyword.trim()) {
            toast.warn('Vui lòng nhập từ khóa (Tên KH, SĐT, Số HĐ).');
            return;
        }
        setLoadingSearch(true);
        setSearchResults([]);
        setSelectedInvoice(null);
        resetEvidence(); // Reset ảnh khi tìm mới

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
        resetEvidence(); // Reset ảnh khi chọn hóa đơn mới
        // Cuộn xuống chi tiết
        setTimeout(() => {
            const element = document.getElementById('invoice-detail-section');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleCancelSelection = () => {
        setSelectedInvoice(null);
        resetEvidence();
    };

    // --- HÀM XỬ LÝ ẢNH ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Tạo Preview URL
            const previewUrl = URL.createObjectURL(file);
            setEvidencePreview(previewUrl);

            // Convert sang Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                // Lấy phần base64 sau dấu phẩy (data:image/jpeg;base64,.....)
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

    // 3. Mở Modal (Kiểm tra ảnh trước)
    const handlePreSubmit = () => {
        if (!selectedInvoice) return;

        // VALIDATE: Bắt buộc phải có ảnh bằng chứng
        if (!evidenceFile) {
            toast.warn("Vui lòng chụp ảnh biên lai ký nhận hoặc bằng chứng giao dịch trước khi xác nhận!", {
                autoClose: 3000
            });
            // Focus vào input file nếu cần (hoặc chỉ cần scroll tới đó)
            return;
        }

        setShowConfirmModal(true);
    };

    // 4. Thanh toán
    const handleConfirmPayment = async () => {
        setLoadingSubmit(true);
        setShowConfirmModal(false);
        try {
            // Gửi cả amount và evidenceImage
            const payload = { 
                amountPaid: selectedInvoice.totalAmount,
                evidenceImage: evidenceFile // Gửi chuỗi base64
            };

            const receipt = await processCashPayment(selectedInvoice.id, payload);
            
            toast.success(`Thanh toán thành công! Mã biên lai: ${receipt.data.receiptNumber}`, {
                position: "top-center",
                autoClose: 5000
            });
            
            // Reset toàn bộ
            setSelectedInvoice(null);
            setSearchResults([]);
            setKeyword('');
            resetEvidence();

        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            toast.error(err.response?.data?.message || "Thanh toán thất bại.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    // Hàm helper chuyển đổi trạng thái
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

            {/* --- HEADER --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="text-green-600" /> Thu Tiền Mặt
                </h1>
                <p className="text-sm text-gray-600 mt-1">Tra cứu nợ theo Tên khách hàng, SĐT hoặc Số hóa đơn.</p>
            </div>

            {/* --- BOX TÌM KIẾM --- */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow border border-gray-200">
                <div className="flex flex-col md:flex-row gap-3">
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
                        className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
                    >
                        {loadingSearch ? <Loader2 size={18} className="animate-spin" /> : 'Tìm kiếm'}
                    </button>
                </div>
            </div>

            {/* --- DANH SÁCH KẾT QUẢ TÌM KIẾM --- */}
            {searchResults.length > 0 && !selectedInvoice && (
                <div className="bg-transparent md:bg-white md:rounded-lg md:shadow md:border md:border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="hidden md:block p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-700">Kết quả tìm kiếm ({searchResults.length})</h3>
                    </div>

                    {/* 1. MOBILE VIEW */}
                    <div className="block md:hidden space-y-4">
                        {searchResults.map((inv) => {
                             const statusInfo = getStatusBadge(inv.paymentStatus);
                             return (
                                <div key={inv.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                                    <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Số hóa đơn</span>
                                            <span className="font-bold text-blue-600 font-mono">{inv.invoiceNumber}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusInfo.className}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="font-bold text-gray-800 text-base">{inv.customerName}</div>
                                        <div className="text-gray-500 flex items-center gap-1"><Phone size={14} /> {inv.customerPhone || '---'}</div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-100">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Tổng tiền</span>
                                            <span className="font-extrabold text-gray-800 text-lg">{inv.totalAmount?.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                        <button onClick={() => handleSelectInvoice(inv)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 active:scale-95 transition-all">
                                            Thu Tiền
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 2. DESKTOP VIEW */}
                    <div className="hidden md:block overflow-x-auto">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(inv.dueDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{inv.totalAmount?.toLocaleString('vi-VN')} đ</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleSelectInvoice(inv)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out">
                                                <Eye size={14} className="mr-1.5" /> Xem
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
                    <div className="bg-blue-50 px-4 md:px-6 py-4 border-b border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="text-blue-600" />
                                Chi Tiết HĐ: <span className="font-mono text-blue-700">{selectedInvoice.invoiceNumber}</span>
                            </h2>
                            {(() => {
                                const statusInfo = getStatusBadge(selectedInvoice.paymentStatus);
                                return (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">Trạng thái:</span>
                                        <span className={`font-bold px-2 py-0.5 rounded text-xs border ${statusInfo.className}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                        <button onClick={handleCancelSelection} className="w-full md:w-auto inline-flex justify-center items-center px-3 py-2 border border-gray-300 bg-white text-xs font-medium rounded-md shadow-sm text-gray-700 hover:bg-gray-50">
                            Chọn hóa đơn khác
                        </button>
                    </div>

                    <div className="p-4 md:p-6">
                        {/* Grid responsive: 1 cột mobile -> 3 cột desktop */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Cột 1: Thông tin Khách hàng */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <User size={18} /> Khách hàng
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs">Họ tên</p>
                                            <p className="font-bold text-gray-900 text-base">{selectedInvoice.customerName}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-gray-500 text-xs">Mã KH</p>
                                                <p className="font-medium text-gray-900">{selectedInvoice.customerCode || '---'}</p>
                                            </div>
                                            <div>
                                                 <p className="text-gray-500 text-xs">SĐT</p>
                                                 <p className="font-medium text-gray-900">{selectedInvoice.customerPhone || '---'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Địa chỉ</p>
                                            <p className="font-medium text-gray-900 break-words">{selectedInvoice.customerAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cột 2: Thông tin Nước (Nếu có) */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 h-full">
                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <Droplets size={18} className="text-blue-500" /> Sử dụng
                                    </h3>

                                    {selectedInvoice.meterReadingId ? (
                                        <div className="space-y-4">
                                            <div className="bg-white p-2 rounded shadow-sm border border-blue-100 flex justify-between items-center">
                                                <span className="text-gray-600 text-sm flex items-center gap-1">
                                                    <Gauge size={14} /> Mã ĐH:
                                                </span>
                                                <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-300">
                                                    {selectedInvoice.meterCode || 'N/A'}
                                                </span>
                                            </div>

                                            <div className="bg-blue-100 p-3 rounded text-center border border-blue-200">
                                                <p className="text-xs text-blue-600 uppercase font-semibold">Lượng tiêu thụ</p>
                                                <p className="text-2xl font-extrabold text-blue-800">
                                                    {selectedInvoice.totalConsumption} <span className="text-sm font-medium">m³</span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500 text-sm italic bg-white rounded border border-dashed border-gray-300">
                                            <FileText size={24} className="mb-2 opacity-50" />
                                            Hóa đơn dịch vụ <br/> (Không có chỉ số nước)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cột 3: Chi tiết Tiền & UPLOAD ẢNH */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 h-full flex flex-col justify-between shadow-sm">
                                    <div>
                                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                            <CreditCard size={18} /> Thanh toán
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Thành tiền:</span>
                                                <span className="font-medium">{selectedInvoice.subtotalAmount?.toLocaleString('vi-VN')} đ</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">VAT:</span>
                                                <span className="font-medium">{selectedInvoice.vatAmount?.toLocaleString('vi-VN')} đ</span>
                                            </div>
                                            {selectedInvoice.latePaymentFee > 0 && (
                                                <div className="flex justify-between text-red-600">
                                                    <span className="font-medium">Phí trễ hạn:</span>
                                                    <span className="font-bold">{selectedInvoice.latePaymentFee?.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-4">
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                                            <p className="text-xs text-green-700 uppercase font-semibold">TỔNG CỘNG</p>
                                            <p className="text-3xl font-extrabold text-green-700">
                                                {selectedInvoice.totalAmount?.toLocaleString('vi-VN')} đ
                                            </p>
                                        </div>

                                        {/* --- KHU VỰC UPLOAD ẢNH BẰNG CHỨNG --- */}
                                        <div className="border-t pt-4">
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
                                                            capture="environment" // Hỗ trợ mở camera sau trên mobile
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
                                            disabled={loadingSubmit}
                                            className="w-full py-3 bg-green-600 text-white font-bold rounded-md shadow hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-lg"
                                        >
                                            {loadingSubmit ? 'Đang xử lý...' : (
                                                <> <DollarSign size={20} /> XÁC NHẬN THU </>
                                            )}
                                        </button>
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
                message={`Bạn xác nhận đã nhận đủ ${selectedInvoice?.totalAmount?.toLocaleString('vi-VN')} VNĐ và đã tải lên bằng chứng thanh toán?`}
                isLoading={loadingSubmit}
            />
        </div>
    );
}

export default CashPaymentForm;