import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContractDetails, submitSurveyReport } from '../../Services/apiTechnicalStaff';
import { ArrowLeft, Save, AlertCircle, FileText } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT TOAST VÀ MODAL
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

function SurveyForm() {
    const { contractId } = useParams();
    const navigate = useNavigate();

    const [contractDetails, setContractDetails] = useState(null);
    const [formData, setFormData] = useState({
        surveyDate: moment().format('YYYY-MM-DD'),
        technicalDesign: '',
        estimatedCost: ''
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // const [error, setError] = useState(null); // Không dùng state error hiển thị UI nữa

    // State cho Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Load thông tin cơ bản
    useEffect(() => {
        if (!contractId) {
            toast.error("Không tìm thấy ID hợp đồng.");
            setLoading(false);
            return;
        }

        setLoading(true);

        getContractDetails(contractId)
            .then(response => {
                setContractDetails(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi lấy chi tiết hợp đồng:", err);
                // Thay setError bằng Toast
                toast.error(err.response?.data?.message || "Không thể tải chi tiết hợp đồng.");
            })
            .finally(() => setLoading(false));
    }, [contractId]);

    // Hàm xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- CÁC HÀM XỬ LÝ NỘP BÁO CÁO ---

    // 1. Kiểm tra và mở Modal
    const handlePreSubmit = (e) => {
        e.preventDefault(); // Ngăn submit mặc định

        // --- VALIDATE DỮ LIỆU ---

        // 1. Check điền đầy đủ
        if (!formData.technicalDesign || !formData.estimatedCost || !formData.surveyDate) {
            toast.warn("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
            return;
        }

        // 2. Validate Ngày Khảo Sát (Không được chọn quá khứ)
        // startOf('day') để đưa về 00:00:00, giúp so sánh chính xác ngày hiện tại
        const selectedDate = moment(formData.surveyDate).startOf('day');
        const today = moment().startOf('day');

        if (selectedDate.isBefore(today)) {
            toast.error("Ngày khảo sát không được nhỏ hơn ngày hiện tại.");
            return;
        }

        // 3. Validate Chi Phí Dự Kiến (Phải là số nguyên dương)
        const cost = Number(formData.estimatedCost);

        // Kiểm tra NaN (không phải số), <= 0, hoặc không phải số nguyên (thập phân)
        if (isNaN(cost) || cost <= 0) {
            toast.error("Chi phí dự kiến phải lớn hơn 0.");
            return;
        }

        if (!Number.isInteger(cost)) {
            toast.error("Chi phí dự kiến phải là số nguyên (không được lẻ xu).");
            return;
        }

        // --- HẾT VALIDATE ---

        // Mở Modal
        setShowConfirmModal(true);
    };

    // 2. Nộp thật (Khi bấm Có)
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false); // Đóng modal

        try {
            await submitSurveyReport(contractId, formData);

            // Thông báo thành công
            toast.success("Nộp báo cáo khảo sát thành công!", {
                position: "top-center",
                autoClose: 2000
            });

            // Quay lại trang danh sách sau 2s
            setTimeout(() => {
                navigate('/technical/survey');
            }, 2000);

        } catch (err) {
            console.error("Lỗi khi nộp báo cáo:", err);
            toast.error(err.response?.data?.message || "Nộp báo cáo thất bại. Vui lòng thử lại.", {
                position: "top-center"
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Hàm xử lý riêng cho ô nhập tiền
    const handleCostChange = (e) => {
        // 1. Lấy giá trị từ input
        const inputValue = e.target.value;

        // 2. Xóa tất cả ký tự KHÔNG phải là số (xóa dấu phẩy, chữ, ký tự lạ...)
        // Điều này đảm bảo dữ liệu luôn là số nguyên dương như bạn muốn
        const rawValue = inputValue.replace(/[^0-9]/g, '');

        // 3. Cập nhật vào state (lưu số nguyên gốc, ví dụ: "1000000")
        setFormData(prev => ({ ...prev, estimatedCost: rawValue }));
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-100px)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-500 text-lg">Đang tải chi tiết hợp đồng...</span>
            </div>
        );
    }

    // Nếu load thất bại, không hiện form mà hiện thông báo
    if (!contractDetails) {
        return (
            <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center pt-20">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-6">Không tìm thấy dữ liệu hợp đồng.</p>
                <button
                    onClick={() => navigate('/technical/survey')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Quay lại danh sách
                </button>
                <ToastContainer position="top-center" theme="colored" />
            </div>
        );
    }

    // --- Render Component ---
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
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out focus:outline-none"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Báo Cáo Khảo Sát & Báo Giá</h1>
                    <p className="text-sm text-gray-600">Điền thông tin khảo sát và chi phí dự kiến cho hợp đồng.</p>
                </div>
            </div>

            {/* Box thông tin Hợp đồng (Read-only) */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Thông tin Yêu Cầu (HĐ: {contractDetails.contractNumber})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Khách hàng</span>
                        <span className="font-medium text-gray-900">{contractDetails.customerName || 'N/A'}</span>
                    </div>
                    {/* SĐT Liên Hệ - THÊM MỚI Ở ĐÂY */}
                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">SĐT Liên Hệ</span>
                        <span className="font-medium text-blue-600 font-mono">
                            {contractDetails.customerPhone || 'Chưa cập nhật'}
                        </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Ngày yêu cầu</span>
                        <span className="font-medium text-gray-900">{contractDetails.applicationDate ? moment(contractDetails.applicationDate).format('DD/MM/YYYY') : 'N/A'}</span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Địa chỉ lắp đặt</span>
                        <span className="font-medium text-gray-900">{contractDetails.customerAddress || 'N/A'}</span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Loại giá</span>
                        <span className="font-medium text-gray-900">{contractDetails.priceTypeName || 'N/A'}</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Tuyến đọc</span>
                        <span className="font-medium text-gray-900">{contractDetails.routeName || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Form nhập liệu báo cáo */}
            <form onSubmit={handlePreSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                    Nội dung Báo Cáo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ngày Khảo Sát */}
                    <div>
                        <label htmlFor="surveyDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Khảo Sát <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="surveyDate"
                            name="surveyDate"
                            value={formData.surveyDate}
                            onChange={handleChange}
                            required
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Chi Phí Dự Kiến */}
                    <div>
                        <label htmlFor="estimatedCost" className="block mb-1.5 text-sm font-medium text-gray-700">Chi Phí Dự Kiến (VNĐ) <span className="text-red-500">*</span></label>
                        <input
                            type="text"                  // <-- ĐỔI TỪ NUMBER SANG TEXT
                            id="estimatedCost"
                            name="estimatedCost"
                            // Format số khi hiển thị: 1000000 => 1,000,000
                            value={formData.estimatedCost ? Number(formData.estimatedCost).toLocaleString('en-US') : ''}
                            onChange={handleCostChange}  // <-- DÙNG HÀM XỬ LÝ RIÊNG
                            placeholder="Nhập tổng chi phí dự kiến"
                            required
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800"
                        />
                    </div>
                </div>

                {/* Thiết Kế Kỹ Thuật */}
                <div>
                    <label htmlFor="technicalDesign" className="block mb-1.5 text-sm font-medium text-gray-700">Thiết Kế Kỹ Thuật Chi Tiết <span className="text-red-500">*</span></label>
                    <textarea
                        id="technicalDesign"
                        name="technicalDesign"
                        rows="6"
                        value={formData.technicalDesign}
                        onChange={handleChange}
                        placeholder="Mô tả chi tiết kỹ thuật lắp đặt, vật tư cần thiết, vị trí đề xuất, hiện trạng cơ sở hạ tầng..."
                        required
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Nút Submit */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit"
                        className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={submitting}>
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang nộp...
                            </>
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                Nộp Báo Cáo
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
                title="Xác nhận nộp báo cáo"
                message={`Bạn có chắc chắn muốn nộp báo cáo khảo sát này với chi phí dự kiến là ${Number(formData.estimatedCost).toLocaleString('vi-VN')} VNĐ không?`}
                isLoading={submitting}
            />

        </div>
    );
}

export default SurveyForm;