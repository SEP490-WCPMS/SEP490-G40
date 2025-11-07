import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSupportTicket, getCustomerActiveMeters } from '../../Services/apiCustomer'; // Đảm bảo đường dẫn đúng

/**
 * Trang "Cách A": Cho phép Khách hàng tự gửi Yêu cầu Hỗ trợ (Báo hỏng).
 */
function CustomerSupportForm() {
    // --- THÊM STATE MỚI ---
    const [feedbackType, setFeedbackType] = useState('SUPPORT_REQUEST'); // Mặc định là 'Báo hỏng'
    // ---
    const [description, setDescription] = useState('');
    // --- CẬP NHẬT STATE CHO ĐỒNG HỒ ---
    const [meterId, setMeterId] = useState(''); // Lưu ID đồng hồ đã chọn
    const [meters, setMeters] = useState([]); // Lưu danh sách đồng hồ từ API
    const [loadingMeters, setLoadingMeters] = useState(false);
    // ---
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    // --- Lấy danh sách đồng hồ khi trang load ---
    useEffect(() => {
        setLoadingMeters(true);
        getCustomerActiveMeters()
            .then(res => {
                setMeters(res.data || []);
            })
            .catch(err => {
                console.error("Không thể tải danh sách đồng hồ:", err);
                // Không báo lỗi nghiêm trọng, chỉ là không load được dropdown
            })
            .finally(() => {
                setLoadingMeters(false);
            });
    }, []); // Chạy 1 lần khi mount

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            setError("Vui lòng nhập nội dung yêu cầu.");
            return;
        }
        
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        
        try {
            // Gọi API "Cách A"
            await submitSupportTicket(description, feedbackType, meterId );
            setSuccess("Gửi yêu cầu hỗ trợ thành công! Nhân viên dịch vụ sẽ sớm liên hệ với bạn.");
            setDescription(''); // Xóa form
            setFeedbackType('SUPPORT_REQUEST'); // Reset lại giá trị mặc định
            setMeterId('');
            // Tùy chọn: Chuyển hướng sau vài giây
            // setTimeout(() => navigate('/my-requests'), 2000);
        } catch (err) {
            console.error("Lỗi khi gửi yêu cầu:", err);
            setError(err.response?.data?.message || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        // Sử dụng style Tailwind giống các trang khác
        <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-600">
                <h1 className="text-2xl font-bold text-gray-800">Gửi Yêu Cầu Hỗ Trợ</h1>
                <p className="text-sm text-gray-600">Báo cáo sự cố (đồng hồ hỏng, vỡ ống...) hoặc khiếu nại.</p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                
                {/* Thông báo Lỗi */}
                {error && (
                    <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
                        <p className="font-bold">Đã xảy ra lỗi</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {/* Thông báo Thành công */}
                {success && (
                    <div className="p-4 bg-green-100 text-green-700 border border-green-300 rounded-md">
                        <p className="font-bold">Thành công</p>
                        <p>{success}</p>
                    </div>
                )}

                {/* --- THÊM Ô CHỌN LOẠI YÊU CẦU --- */}
                <div>
                    <label htmlFor="feedbackType" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Loại yêu cầu <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="feedbackType"
                        name="feedbackType" // Thêm name
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        required
                        disabled={submitting}
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="SUPPORT_REQUEST">Yêu cầu Hỗ trợ (Báo hỏng, Khiếu nại)</option>
                        <option value="FEEDBACK">Góp ý / Cải thiện dịch vụ</option>
                    </select>
                </div>
                {/* --- HẾT PHẦN THÊM --- */}

                {/* --- THÊM Ô CHỌN ĐỒNG HỒ --- */}
                {/* Chỉ hiển thị nếu là Yêu cầu Hỗ trợ VÀ đã tải xong danh sách */}
                {feedbackType === 'SUPPORT_REQUEST' && (
                    <div>
                        <label htmlFor="meter" className="block mb-1.5 text-sm font-medium text-gray-700">
                            Đồng hồ liên quan (Nếu có)
                        </label>
                        <select
                            id="meter"
                            value={meterId}
                            onChange={(e) => setMeterId(e.target.value)}
                            disabled={submitting || loadingMeters}
                            className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">
                                {loadingMeters ? "Đang tải danh sách đồng hồ..." : "-- Không chọn (Báo hỏng chung) --"}
                            </option>
                            {/* Lặp qua danh sách đồng hồ (Bảng 12) */}
                            {meters.map((meter) => (
                                <option key={meter.meterId} value={meter.meterId}>
                                    Mã: {meter.meterCode} (Địa chỉ: {meter.address})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Chọn đúng đồng hồ nếu bạn báo hỏng đồng hồ cụ thể.</p>
                    </div>
                )}
                {/* --- HẾT PHẦN THÊM --- */}

                {/* Ô nhập nội dung */}
                <div>
                    <label htmlFor="description" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Nội dung yêu cầu <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        rows="6"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Vui lòng mô tả chi tiết sự cố bạn gặp phải (ví dụ: Đồng hồ nước tại địa chỉ... không quay, đồng hồ bị vỡ kính...)"
                        required
                        disabled={submitting}
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Nhân viên dịch vụ sẽ xem xét và liên hệ lại với bạn.</p>
                </div>
                
                {/* Nút Gửi */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">...</svg>
                                Đang gửi...
                            </>
                        ) : 'Gửi Yêu Cầu'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CustomerSupportForm;