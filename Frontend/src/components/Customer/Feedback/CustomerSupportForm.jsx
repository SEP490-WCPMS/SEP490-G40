import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSupportTicket, getCustomerActiveMeters } from '../../Services/apiCustomer';
import { ArrowLeft, AlertCircle, CheckCircle, Send } from 'lucide-react';

// 1. IMPORT TOAST VÀ MODAL
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

/**
 * Trang "Cách A": Cho phép Khách hàng tự gửi Yêu cầu Hỗ trợ (Báo hỏng).
 */
function CustomerSupportForm() {
    const [feedbackType, setFeedbackType] = useState('SUPPORT_REQUEST');
    const [description, setDescription] = useState('');
    const [meterId, setMeterId] = useState('');
    const [meters, setMeters] = useState([]);

    const [loadingMeters, setLoadingMeters] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const navigate = useNavigate();

    // Lấy danh sách đồng hồ khi trang load
    useEffect(() => {
        setLoadingMeters(true);
        getCustomerActiveMeters()
            .then(res => {
                setMeters(res.data || []);
            })
            .catch(err => {
                console.error("Không thể tải danh sách đồng hồ:", err);
                toast.error("Lỗi tải danh sách đồng hồ của bạn.");
            })
            .finally(() => {
                setLoadingMeters(false);
            });
    }, []);

    // --- CÁC HÀM XỬ LÝ SUBMIT MỚI ---

    // 1. Validate và Mở Modal
    const handlePreSubmit = (e) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.warn("Vui lòng nhập nội dung yêu cầu.");
            return;
        }

        // THÊM MỚI: Validate bắt buộc chọn đồng hồ nếu là Yêu cầu hỗ trợ
        if (feedbackType === 'SUPPORT_REQUEST' && !meterId) {
            toast.warn("Vui lòng chọn đồng hồ bạn muốn báo hỏng.");
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
            await submitSupportTicket(description, feedbackType, meterId);

            toast.success("Gửi yêu cầu thành công! Chúng tôi sẽ sớm liên hệ với bạn.", {
                position: "top-center",
                autoClose: 3000
            });

            // Reset form
            setDescription('');
            setFeedbackType('SUPPORT_REQUEST');
            setMeterId('');

            // (Tùy chọn) Chuyển hướng về danh sách yêu cầu
            // setTimeout(() => navigate('/my-support-tickets'), 3000);

        } catch (err) {
            console.error("Lỗi khi gửi yêu cầu:", err);
            let errorMessage = "Gửi yêu cầu thất bại. Vui lòng thử lại.";

            if (err.response) {
                if (err.response.status === 409) {
                    errorMessage = err.response.data.message || "Yêu cầu này đã tồn tại.";
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
        <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">

            {/* 3. TOAST CONTAINER */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-600">
                <h1 className="text-2xl font-bold text-gray-800">Gửi Yêu Cầu Hỗ Trợ</h1>
                <p className="text-sm text-gray-600">Báo cáo sự cố (đồng hồ hỏng, vỡ ống...) hoặc khiếu nại.</p>
            </div>

            {/* Form */}
            <form onSubmit={handlePreSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5 border border-gray-200">

                {/* Đã bỏ phần hiển thị lỗi/thành công cũ */}

                {/* Loại Yêu Cầu */}
                <div>
                    <label htmlFor="feedbackType" className="block mb-1.5 text-sm font-medium text-gray-700">
                        Loại yêu cầu <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="feedbackType"
                        name="feedbackType"
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        required
                        disabled={submitting}
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="SUPPORT_REQUEST">Yêu cầu Hỗ trợ (Báo hỏng)</option>
                        <option value="FEEDBACK">Góp ý / Cải thiện dịch vụ</option>
                    </select>
                </div>

                {/* Chọn Đồng Hồ */}
                {/* Chỉ hiển thị nếu là Yêu cầu Hỗ trợ */}
                {feedbackType === 'SUPPORT_REQUEST' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label htmlFor="meter" className="block mb-1.5 text-sm font-medium text-gray-700">
                            {/* THÊM MỚI: Dấu sao đỏ */}
                            Đồng hồ liên quan <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="meter"
                            value={meterId}
                            onChange={(e) => setMeterId(e.target.value)}
                            disabled={submitting || loadingMeters}
                            className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {/* SỬA LẠI: Option mặc định */}
                            <option value="">
                                {loadingMeters ? "Đang tải danh sách đồng hồ..." : "-- Chọn đồng hồ cần báo hỏng --"}
                            </option>

                            {meters && meters.length > 0 ? (
                                meters.map((meter) => (
                                    <option key={meter.meterId} value={meter.meterId}>
                                        Mã: {meter.meterCode} (Địa chỉ: {meter.address})
                                    </option>
                                ))
                            ) : (
                                !loadingMeters && (
                                    <option value="" disabled>
                                        Bạn không có đồng hồ nào đang hoạt động
                                    </option>
                                )
                            )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1 italic">Vui lòng chọn chính xác mã đồng hồ bị sự cố.</p>
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
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Vui lòng mô tả chi tiết sự cố bạn gặp phải..."
                        required
                        disabled={submitting}
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500">Nhân viên dịch vụ sẽ xem xét và phản hồi sớm nhất có thể.</p>
                </div>

                {/* Nút Gửi */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`inline-flex items-center justify-center px-8 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang gửi...
                            </>
                        ) : (
                            <>
                                <Send size={16} className="mr-2" />
                                Gửi Yêu Cầu
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận gửi yêu cầu"
                message="Bạn có chắc chắn muốn gửi yêu cầu hỗ trợ này không?"
                isLoading={submitting}
            />

        </div>
    );
}

export default CustomerSupportForm;