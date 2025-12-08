import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSupportTicketForCustomer, getAllCustomersSimple, getCustomerActiveMeters } from '../../Services/apiService';
import { ArrowLeft, Search } from 'lucide-react';

// 1. IMPORT TOAST VÀ MODAL
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

function ServiceCreateTicketForm() {
    // --- State cho dữ liệu ---
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [activeMeters, setActiveMeters] = useState([]);

    // --- State cho Form ---
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedMeterId, setSelectedMeterId] = useState('');
    const [description, setDescription] = useState('');
    const [feedbackType, setFeedbackType] = useState('SUPPORT_REQUEST');

    // --- State cho UI ---
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingMeters, setLoadingMeters] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // const [error, setError] = useState(null); // Bỏ state error hiển thị UI cũ
    // const [success, setSuccess] = useState(null); // Bỏ state success hiển thị UI cũ
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const navigate = useNavigate();

    // Lấy danh sách khách hàng
    useEffect(() => {
        setLoadingCustomers(true);
        getAllCustomersSimple()
            .then(res => {
                setAllCustomers(res.data || []);
                setFilteredCustomers([]);
            })
            .catch(err => {
                console.error("Lỗi tải danh sách khách hàng:", err);
                toast.error("Lỗi tải danh sách khách hàng. Vui lòng thử lại.");
            })
            .finally(() => {
                setLoadingCustomers(false);
            });
    }, []);

    // Load đồng hồ khi chọn khách hàng
    useEffect(() => {
        if (!selectedCustomerId) {
            setActiveMeters([]);
            setSelectedMeterId('');
            return;
        }

        setLoadingMeters(true);
        getCustomerActiveMeters(selectedCustomerId)
            .then(res => {
                setActiveMeters(res.data || []);
            })
            .catch(err => {
                console.error("Lỗi tải danh sách đồng hồ:", err);
                toast.error("Lỗi tải danh sách đồng hồ của khách hàng này.");
            })
            .finally(() => {
                setLoadingMeters(false);
            });

    }, [selectedCustomerId]);

    // --- HÀM XỬ LÝ TÌM KIẾM KHÁCH HÀNG ---
    const handleCustomerSearch = (e) => {
        const searchTerm = e.target.value;
        setCustomerSearchTerm(searchTerm);
        setSelectedCustomerId('');

        if (!searchTerm.trim()) {
            setFilteredCustomers([]);
            setIsDropdownVisible(false);
        } else {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const filtered = allCustomers.filter(customer =>
                customer.customerName.toLowerCase().includes(lowerSearchTerm) ||
                customer.customerCode.toLowerCase().includes(lowerSearchTerm)
            );
            setFilteredCustomers(filtered.slice(0, 10));
            setIsDropdownVisible(true);
        }
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomerId(customer.id);
        setCustomerSearchTerm(customer.customerName);
        setIsDropdownVisible(false);
        setFilteredCustomers([]);
    };

    // --- HÀM XỬ LÝ INPUT ---
    const handleDescriptionChange = (e) => setDescription(e.target.value);
    const handleFeedbackTypeChange = (e) => setFeedbackType(e.target.value);
    const handleMeterChange = (e) => setSelectedMeterId(e.target.value);

    // --- CÁC HÀM XỬ LÝ SUBMIT MỚI ---

    // 1. Validate và Mở Modal
    const handlePreSubmit = (e) => {
        e.preventDefault();

        // Validate
        if (!selectedCustomerId || !description.trim() || !feedbackType) {
            toast.warn("Vui lòng chọn khách hàng, loại yêu cầu và nhập nội dung.");
            return;
        }

        // 2. THÊM MỚI: Validate bắt buộc chọn đồng hồ nếu là Yêu cầu hỗ trợ
        if (feedbackType === 'SUPPORT_REQUEST' && !selectedMeterId) {
            toast.warn("Vui lòng chọn đồng hồ cần hỗ trợ.");
            return;
        }

        // Mở Modal
        setShowConfirmModal(true);
    };

    // 2. Submit thật (Khi bấm Có)
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false); // Đóng modal

        try {
            await createSupportTicketForCustomer(selectedCustomerId, description, feedbackType, selectedMeterId || null);

            toast.success("Tạo ticket thành công!", {
                position: "top-center",
                autoClose: 2000
            });

            // Reset form
            setDescription('');
            setSelectedCustomerId('');
            setFeedbackType('SUPPORT_REQUEST');
            setCustomerSearchTerm('');
            setSelectedMeterId('');
            setFilteredCustomers([]);

            // (Tùy chọn) Chuyển về danh sách ticket
            // setTimeout(() => navigate('/service/tickets'), 2000);

        } catch (err) {
            console.error("Lỗi khi tạo ticket:", err);
            let errorMessage = "Tạo ticket thất bại. Vui lòng thử lại.";

            if (err.response) {
                if (err.response.status === 409) {
                    errorMessage = "Yêu cầu này đã tồn tại (đang xử lý).";
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }

            toast.error(errorMessage, { position: "top-center" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">

            {/* 3. TOAST CONTAINER */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tạo Yêu Cầu Hỗ Trợ (Hộ Khách Hàng)</h1>
                    <p className="text-sm text-gray-600">Dùng khi khách hàng gọi điện thoại báo hỏng/khiếu nại.</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePreSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                    Nội dung Yêu cầu
                </h3>

                {/* Đã bỏ phần hiển thị lỗi/thành công cũ */}

                {/* Chọn Khách Hàng */}
                <div className="w-full md:w-1/2">
                    <label htmlFor="customer-search" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Tìm kiếm Khách hàng (theo Tên hoặc Mã KH) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="relative">
                            <input
                                type="text"
                                id="customer-search"
                                value={customerSearchTerm}
                                onChange={handleCustomerSearch}
                                placeholder={loadingCustomers ? "Đang tải KH..." : "Gõ để tìm kiếm..."}
                                disabled={loadingCustomers || submitting}
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pl-10 text-sm capitalize-none focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="off"
                                onFocus={() => setIsDropdownVisible(true)}
                                onBlur={() => setTimeout(() => setIsDropdownVisible(false), 200)}
                            />
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* Dropdown list */}
                        {isDropdownVisible && filteredCustomers.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {filteredCustomers.map(customer => (
                                    <li
                                        key={customer.id}
                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer transition-colors"
                                        onMouseDown={() => handleCustomerSelect(customer)}
                                    >
                                        {customer.customerName} (Mã KH: {customer.customerCode})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Hiển thị tên KH đã chọn */}
                    {selectedCustomerId && !isDropdownVisible && (
                        <p className="text-xs text-green-600 mt-1 font-medium">Đã chọn: {customerSearchTerm}</p>
                    )}
                </div>

                {/* Loại Yêu Cầu */}
                <div>
                    <label htmlFor="feedbackType" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Loại yêu cầu <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="feedbackType"
                        name="feedbackType"
                        value={feedbackType}
                        onChange={handleFeedbackTypeChange}
                        required
                        disabled={submitting}
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="SUPPORT_REQUEST">Yêu cầu Hỗ trợ (Báo hỏng)</option>
                        <option value="FEEDBACK">Góp ý / Cải thiện dịch vụ</option>
                    </select>
                </div>

                {/* Chọn Đồng Hồ */}
                {selectedCustomerId && feedbackType === 'SUPPORT_REQUEST' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label htmlFor="meter" className="block mb-1.5 text-sm font-medium text-gray-700">
                            {/* THÊM MỚI: Dấu sao đỏ */}
                            Đồng hồ liên quan <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="meter"
                            value={selectedMeterId}
                            onChange={handleMeterChange}
                            disabled={submitting || loadingMeters}
                            className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {/* SỬA LẠI: Option mặc định không cho chọn (disabled) nếu chưa chọn */}
                            <option value="">
                                {loadingMeters ? "Đang tải đồng hồ..." : "-- Vui lòng chọn đồng hồ --"}
                            </option>

                            {activeMeters.length > 0 ? (
                                activeMeters.map((meter) => (
                                    <option key={meter.meterId} value={meter.meterId}>
                                        Mã: {meter.meterCode} (Địa chỉ: {meter.address})
                                    </option>
                                ))
                            ) : (
                                !loadingMeters && <option value="" disabled>Khách hàng này không có đồng hồ nào đang hoạt động</option>
                            )}
                        </select>
                    </div>
                )}

                {/* Nội dung */}
                <div>
                    <label htmlFor="description" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Nội dung chi tiết <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        rows="5"
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Ghi lại nội dung yêu cầu của khách hàng..."
                        required
                        disabled={submitting}
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                    />
                </div>

                {/* Nút Submit */}
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting || loadingCustomers}
                        className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform active:scale-95 ${submitting || loadingCustomers ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Đang tạo...' : 'Tạo Ticket'}
                    </button>
                </div>
            </form>

            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận tạo ticket"
                message={`Bạn có chắc chắn muốn tạo yêu cầu hỗ trợ này cho khách hàng [${customerSearchTerm}] không?`}
                isLoading={submitting}
            />

        </div>
    );
}

export default ServiceCreateTicketForm;