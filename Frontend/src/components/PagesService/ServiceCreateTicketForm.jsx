import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Đảm bảo import đúng file service của Service Staff
import { createSupportTicketForCustomer, getAllCustomersSimple, getCustomerActiveMeters } from '../Services/apiService'; 
import { ArrowLeft, AlertCircle, CheckCircle, Search } from 'lucide-react';
import moment from 'moment'; // (Giữ lại nếu bạn dùng)

function ServiceCreateTicketForm() {
    // --- State cho dữ liệu ---
    const [allCustomers, setAllCustomers] = useState([]); // Danh sách KH gốc (Full)
    const [filteredCustomers, setFilteredCustomers] = useState([]); // Danh sách KH đã lọc
    const [activeMeters, setActiveMeters] = useState([]); // Danh sách đồng hồ của KH đã chọn
    
    // --- State cho Form ---
    const [customerSearchTerm, setCustomerSearchTerm] = useState(''); // Nội dung ô tìm kiếm
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedMeterId, setSelectedMeterId] = useState(''); // <-- THÊM
    const [description, setDescription] = useState('');
    const [feedbackType, setFeedbackType] = useState('SUPPORT_REQUEST');

    // --- State cho UI ---
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingMeters, setLoadingMeters] = useState(false); // <-- THÊM
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false); // State mới
    const navigate = useNavigate();

    // Lấy TOÀN BỘ danh sách khách hàng khi component mount
    useEffect(() => {
        setLoadingCustomers(true);
        setError(null);
        getAllCustomersSimple()
            .then(res => {
                setAllCustomers(res.data || []);
                // Ban đầu không lọc gì cả
                setFilteredCustomers([]); 
            })
            .catch(err => {
                console.error("Lỗi tải danh sách khách hàng:", err);
                setError("Lỗi tải danh sách khách hàng. Vui lòng thử lại.");
            })
            .finally(() => {
                setLoadingCustomers(false);
            });
    }, []); // Chỉ chạy 1 lần

    // --- HÀM MỚI: Load đồng hồ (meter) khi chọn khách hàng ---
    useEffect(() => {
        // Nếu không có KH nào được chọn, xóa danh sách đồng hồ
        if (!selectedCustomerId) {
            setActiveMeters([]);
            setSelectedMeterId('');
            return;
        }

        setLoadingMeters(true);
        // (Lưu ý: API này giả định BE có hàm lấy đồng hồ theo Customer ID,
        // nếu không, bạn cần tạo API BE mới)
        getCustomerActiveMeters(selectedCustomerId) // <-- Gọi API (cần được tạo trong apiServiceStaff)
            .then(res => {
                setActiveMeters(res.data || []);
            })
            .catch(err => {
                console.error("Lỗi tải danh sách đồng hồ:", err);
                setError("Lỗi tải danh sách đồng hồ của khách hàng này.");
            })
            .finally(() => {
                setLoadingMeters(false);
            });
            
    }, [selectedCustomerId]); // Chạy lại mỗi khi selectedCustomerId thay đổi

    // ---

    // --- SỬA LỖI GÕ CHỮ HOA ---
    const handleCustomerSearch = (e) => {
        const searchTerm = e.target.value; // 1. Lấy giá trị gốc (có chữ hoa)
        setCustomerSearchTerm(searchTerm); // 2. Set state bằng giá trị gốc
        setError(null);
        setSuccess(null); // Xóa thông báo thành công cũ
        setSelectedCustomerId(''); // Reset ID đã chọn khi gõ lại

        if (!searchTerm.trim()) {
            setFilteredCustomers([]); // Ẩn danh sách nếu ô tìm kiếm rỗng
            setIsDropdownVisible(false);
        } else {
            // 3. Chỉ dùng chữ thường ĐỂ LỌC
            const lowerSearchTerm = searchTerm.toLowerCase(); 
            const filtered = allCustomers.filter(customer =>
                customer.customerName.toLowerCase().includes(lowerSearchTerm) ||
                customer.customerCode.toLowerCase().includes(lowerSearchTerm)
            );
            // Giới hạn 10 kết quả để không bị lag
            setFilteredCustomers(filtered.slice(0, 10)); 
            setIsDropdownVisible(true); // 4. Hiển thị dropdown
        }
    };
    // --- HẾT SỬA LỖI GÕ CHỮ HOA ---

    // --- HÀM MỚI: Xử lý khi click chọn 1 KH từ dropdown ---
    const handleCustomerSelect = (customer) => {
        setSelectedCustomerId(customer.id); // Đặt ID
        setCustomerSearchTerm(customer.customerName); // Điền tên vào ô input
        setIsDropdownVisible(false); // Ẩn dropdown
        setFilteredCustomers([]); // Xóa danh sách lọc
    };

    // --- HÀM MỚI: Xử lý các input khác (để xóa thông báo lỗi/thành công) ---
    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
        setError(null);
        setSuccess(null);
    };

    const handleFeedbackTypeChange = (e) => {
        setFeedbackType(e.target.value);
        setError(null);
        setSuccess(null);
    };

    const handleMeterChange = (e) => {
        setSelectedMeterId(e.target.value);
        setError(null); setSuccess(null);
    };

    // Xử lý submit (Đã cập nhật để gửi cả feedbackType)
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Kiểm tra xem ID đã được CHỌN chưa (chứ không phải chỉ được gõ)
        if (!selectedCustomerId || !description.trim() || !feedbackType) { 
            setError("Vui lòng chọn khách hàng (từ danh sách gợi ý), chọn loại yêu cầu và nhập nội dung.");
            setSuccess(null);
            return;
        }
        
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        
        try {
            await createSupportTicketForCustomer(selectedCustomerId, description, feedbackType, selectedMeterId || null);
            setSuccess("Tạo ticket thành công! Ticket đã được chuyển vào hàng chờ (PENDING).");
            // Reset form
            setDescription('');
            setSelectedCustomerId('');
            setFeedbackType('SUPPORT_REQUEST');
            setCustomerSearchTerm('');
            setSelectedMeterId('');
            setFilteredCustomers([]);
        } catch (err) {
            console.error("Lỗi khi tạo ticket:", err);
            setError(err.response?.data?.message || "Tạo ticket thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tạo Yêu Cầu Hỗ Trợ (Hộ Khách Hàng)</h1>
                    <p className="text-sm text-gray-600">Dùng khi khách hàng gọi điện thoại báo hỏng/khiếu nại.</p>
                </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                    Nội dung Yêu cầu
                </h3>
                
                {/* Thông báo Lỗi */}
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        <span>{error}</span>
                    </div>
                )}
                
                {/* Thông báo Thành công */}
                {success && (
                    <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        <span>{success}</span>
                    </div>
                )}

                {/* --- SỬA LẠI PHẦN CHỌN KHÁCH HÀNG (GỘP LẠI) --- */}
                <div className="w-full md:w-1/2">
                    <label htmlFor="customer-search" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Tìm kiếm Khách hàng (theo Tên hoặc Mã KH) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative"> {/* Container cho autocomplete */}
                        <div className="relative"> {/* Container cho input và icon */}
                            <input
                                type="text"
                                id="customer-search"
                                value={customerSearchTerm}
                                onChange={handleCustomerSearch} // Sửa lỗi gõ chữ hoa
                                placeholder={loadingCustomers ? "Đang tải KH..." : "Gõ để tìm kiếm..."}
                                disabled={loadingCustomers || submitting}
                                // Thêm 'capitalize-none' để ghi đè CSS global (nếu có)
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pl-10 text-sm capitalize-none"
                                autoComplete="off"
                                onFocus={() => setIsDropdownVisible(true)} // Hiện khi focus
                                // Thêm timeout để kịp xử lý click chọn (onMouseDown) trước khi blur
                                onBlur={() => setTimeout(() => setIsDropdownVisible(false), 200)}
                            />
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        
                        {/* Dropdown list (Danh sách gợi ý) */}
                        {isDropdownVisible && filteredCustomers.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {filteredCustomers.map(customer => (
                                    <li
                                        key={customer.id}
                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer"
                                        // Dùng onMouseDown thay vì onClick để chạy trước onBlur
                                        onMouseDown={() => handleCustomerSelect(customer)}
                                    >
                                        {customer.customerName} (Mã KH: {customer.customerCode})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Hiển thị tên KH đã chọn (nếu có) */}
                    {selectedCustomerId && !isDropdownVisible && (
                         <p className="text-xs text-green-600 mt-1">Đã chọn: {customerSearchTerm}</p>
                    )}
                </div>
                {/* --- HẾT PHẦN SỬA --- */}

                {/* Ô Chọn Loại Yêu Cầu */}
                <div>
                    <label htmlFor="feedbackType" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Loại yêu cầu <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="feedbackType"
                        name="feedbackType"
                        value={feedbackType}
                        onChange={handleFeedbackTypeChange} // Dùng hàm mới
                        required
                        disabled={submitting}
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white"
                    >
                        <option value="SUPPORT_REQUEST">Yêu cầu Hỗ trợ (Báo hỏng, Khiếu nại)</option>
                        <option value="FEEDBACK">Góp ý / Cải thiện dịch vụ</option>
                    </select>
                </div>

                {/* --- THÊM Ô CHỌN ĐỒNG HỒ --- */}
                {/* Chỉ hiển thị nếu đã chọn KH VÀ là Yêu cầu Hỗ trợ */}
                {selectedCustomerId && feedbackType === 'SUPPORT_REQUEST' && (
                    <div>
                        <label htmlFor="meter" className="block mb-1.5 text-sm font-medium text-gray-700">
                            Đồng hồ liên quan (Nếu có)
                        </label>
                        <select
                            id="meter"
                            value={selectedMeterId}
                            onChange={handleMeterChange}
                            disabled={submitting || loadingMeters}
                            className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white"
                        >
                            <option value="">
                                {loadingMeters ? "Đang tải đồng hồ..." : "-- Không chọn (Báo hỏng chung) --"}
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
                        onChange={handleDescriptionChange} // Dùng hàm mới
                        placeholder="Ghi lại nội dung yêu cầu của khách hàng..."
                        required
                        disabled={submitting}
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    />
                </div>
                
                {/* Nút Submit */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={submitting || loadingCustomers}
                        className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none ${submitting || loadingCustomers ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Đang tạo...' : 'Tạo Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ServiceCreateTicketForm;

