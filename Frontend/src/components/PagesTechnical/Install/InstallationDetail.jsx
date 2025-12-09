import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContractDetails, markInstallationAsCompleted } from '../../Services/apiTechnicalStaff';
import { ArrowLeft, Save, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';

// 1. IMPORT TOAST VÀ MODAL
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

function InstallationDetail() {
    const { contractId } = useParams();
    const navigate = useNavigate();

    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // const [error, setError] = useState(null); // Bỏ state error UI cũ

    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Dữ liệu cho biên bản lắp đặt
    const [installData, setInstallData] = useState({
        meterCode: '',
        initialReading: '',
        notes: '',
        installationImageBase64: null
    });

    const [imagePreview, setImagePreview] = useState(null);

    // Load chi tiết hợp đồng
    useEffect(() => {
        if (!contractId) {
            toast.error("Không tìm thấy ID hợp đồng.");
            setLoading(false);
            return;
        }

        setLoading(true);

        getContractDetails(contractId)
            .then(response => {
                setContract(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi lấy chi tiết hợp đồng:", err);
                // Thay setError bằng Toast
                toast.error(err.response?.data?.message || "Không thể tải chi tiết hợp đồng.");
            })
            .finally(() => setLoading(false));
    }, [contractId]);

    // Hàm xử lý khi người dùng nhập text/số
    const handleChange = (e) => {
        const { name, value } = e.target;
        // 1. Xử lý riêng cho Chỉ Số Ban Đầu (Chỉ nhận số nguyên)
        if (name === 'initialReading') {
            // Sử dụng Regex thay thế tất cả ký tự KHÔNG phải số bằng rỗng
            // Ví dụ: gõ "123a" -> thành "123"
            const numericValue = value.replace(/\D/g, '');

            setInstallData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        // 2. Các trường khác (như Ghi chú) xử lý bình thường
        setInstallData(prev => ({ ...prev, [name]: value }));
    };

    // Hàm xử lý khi chọn ảnh
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setInstallData(prev => ({ ...prev, installationImageBase64: null }));
            setImagePreview(null);
            return;
        }

        // Xem trước
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        // Chuyển Base64
        const reader = new FileReader();
        reader.onloadend = () => {
            // Lấy phần base64 sau dấu phẩy
            const base64String = reader.result.split(",")[1];
            setInstallData(prev => ({ ...prev, installationImageBase64: base64String }));
        };
        reader.readAsDataURL(file);
    };

    // --- CÁC HÀM XỬ LÝ SUBMIT MỚI ---

    // 1. Validate và Mở Modal
    const handlePreSubmit = () => {
        // --- VALIDATE DỮ LIỆU ---

        // 1. Check rỗng
        if (!installData.meterCode || installData.initialReading === '') {
            toast.warn("Vui lòng điền đầy đủ Mã Đồng Hồ và Chỉ Số Ban Đầu.");
            return;
        }

        // 2. Validate Mã Đồng Hồ (Phải là số nguyên dương)
        // Regex /^\d+$/ đảm bảo chuỗi chỉ chứa số 0-9
        // if (!/^\d+$/.test(installData.meterCode)) {
        //     toast.error("Mã đồng hồ chỉ được phép chứa các ký tự số.");
        //     return;
        // }

        // 3. Validate Chỉ Số Ban Đầu (Số nguyên >= 0)
        const reading = Number(installData.initialReading);
        if (isNaN(reading) || reading < 0 || !Number.isInteger(reading)) {
            toast.error("Chỉ số ban đầu phải là số nguyên lớn hơn hoặc bằng 0.");
            return;
        }

        // 4. Check ảnh
        if (!installData.installationImageBase64) {
            toast.warn("Vui lòng chụp và đính kèm ảnh đồng hồ đã lắp đặt.");
            return;
        }

        // --- HẾT VALIDATE ---

        // Mở Modal
        setShowConfirmModal(true);
    };

    // 2. Submit thật (Khi bấm Có)
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false); // Đóng modal

        try {
            await markInstallationAsCompleted(contractId, installData);

            toast.success("Xác nhận hoàn thành lắp đặt thành công!", {
                position: "top-center",
                autoClose: 2000
            });

            // Quay lại danh sách sau 2s
            setTimeout(() => {
                navigate('/technical/install');
            }, 2000);

        } catch (err) {
            console.error("Lỗi khi xác nhận:", err);
            toast.error(err.response?.data?.message || "Lỗi khi xác nhận. Vui lòng nhập chính xác thông tin. Mã Đồng Hồ phải là Đồng Hồ còn trong kho", {
                position: "top-center"
            });
        } finally {
            setSubmitting(false);
        }
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

    // Nếu không có dữ liệu
    if (!contract) {
        return (
            <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center pt-20">
                <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-6">Không tìm thấy dữ liệu hợp đồng.</p>
                <button
                    onClick={() => navigate('/technical/install')}
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
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Chi Tiết Lắp Đặt</h1>
                    <p className="text-sm text-gray-600">Xem thông tin và nộp biên bản lắp đặt.</p>
                </div>
            </div>

            {/* Thông tin Hợp đồng & Khách hàng */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Thông tin Hợp Đồng & Khách Hàng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-700">
                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Mã HĐ</span>
                        <span className="font-medium text-gray-900">{contract.contractNumber}</span>
                    </div>

                    {/* SĐT Liên Hệ - THÊM MỚI Ở ĐÂY */}
                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">SĐT Liên Hệ</span>
                        <span className="font-medium text-blue-600 font-mono">
                            {contract.customerPhone || 'Chưa cập nhật'}
                        </span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Trạng thái</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${contract.contractStatus === 'SIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {contract.contractStatus === 'SIGNED' ? 'Chờ Lắp Đặt' : contract.contractStatus}
                        </span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Khách hàng</span>
                        <span className="font-medium text-gray-900">{contract.customerName}</span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Ngày yêu cầu</span>
                        <span className="font-medium text-gray-900">{contract.applicationDate}</span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Địa chỉ lắp đặt</span>
                        <span className="font-medium text-gray-900">{contract.customerAddress}</span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Loại giá</span>
                        <span className="font-medium text-gray-900">{contract.priceTypeName || 'N/A'}</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Tuyến đọc</span>
                        <span className="font-medium text-gray-900">{contract.routeName || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Thông Tin Kỹ Thuật (Từ Báo Giá) */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">Thông Tin Kỹ Thuật (Từ Khảo Sát)</h3>
                <p className="text-sm mb-3 text-gray-700">
                    <strong>Chi Phí Dự Kiến:</strong> <span className="text-orange-600 font-bold">{contract.estimatedCost?.toLocaleString('vi-VN') || '-'} VNĐ</span>
                </p>
                <div>
                    <p className="text-sm mb-1 font-medium text-gray-700">Thiết Kế Kỹ Thuật:</p>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm whitespace-pre-wrap text-gray-800">
                        {contract.technicalDesign || "(Không có mô tả)"}
                    </div>
                </div>
            </div>

            {/* Form Biên bản Lắp đặt */}
            {contract.contractStatus === 'SIGNED' ? (
                <form className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                        <Save size={20} className="text-green-600" />
                        Biên Bản Lắp Đặt (Bắt buộc)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mã Đồng Hồ */}
                        <div>
                            <label htmlFor="meterCode" className="block mb-1.5 text-sm font-medium text-gray-700">Mã Đồng Hồ (meter_code) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="meterCode"
                                name="meterCode"
                                value={installData.meterCode}
                                onChange={handleChange}
                                placeholder="Nhập mã vạch/serial trên đồng hồ"
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Chỉ Số Ban Đầu */}
                        <div>
                            <label htmlFor="initialReading" className="block mb-1.5 text-sm font-medium text-gray-700">
                                Chỉ Số Ban Đầu (m³) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text" // Dùng text kết hợp regex để ép kiểu số nguyên tuyệt đối
                                id="initialReading"
                                name="initialReading"
                                value={installData.initialReading}
                                onChange={handleChange}
                                placeholder="Nhập chỉ số (vd: 0)"
                                // Chặn ký tự lạ (dấu chấm, phẩy, e, dấu trừ...)
                                onKeyDown={(e) => {
                                    if (["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                                        return;
                                    }
                                    if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-bold"
                            />
                        </div>
                    </div>

                    {/* Upload Ảnh */}
                    <div>
                        <label htmlFor="installationImage" className="block mb-1.5 text-sm font-medium text-gray-700 flex items-center gap-2">
                            <ImageIcon size={16} /> Ảnh Chụp Đồng Hồ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            id="installationImage"
                            name="installationImage"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {/* Ảnh xem trước */}
                        {imagePreview && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Xem trước:</p>
                                <img src={imagePreview} alt="Xem trước" className="max-w-xs h-auto rounded border border-gray-300 shadow-sm" />
                            </div>
                        )}
                    </div>

                    {/* Ghi Chú */}
                    <div>
                        <label htmlFor="notes" className="block mb-1.5 text-sm font-medium text-gray-700">Ghi Chú Lắp Đặt</label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            value={installData.notes}
                            onChange={handleChange}
                            placeholder="Ghi chú thêm nếu cần..."
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Nút Submit */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="button" // Đổi thành button để không submit form
                            onClick={handlePreSubmit} // Mở Modal
                            disabled={submitting}
                            className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white rounded-full border-b-2 border-white"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Save size={20} className="mr-2" />
                                    Xác Nhận Hoàn Thành
                                </>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                // Hiển thị thông báo nếu trạng thái không hợp lệ
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                    <p className="text-sm text-yellow-800 italic">
                        Hợp đồng này đang ở trạng thái <strong>{contract.contractStatus}</strong> và không thể thực hiện lắp đặt.
                    </p>
                </div>
            )}

            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận hoàn thành"
                message={`Bạn có chắc chắn muốn xác nhận hoàn thành lắp đặt đồng hồ mã [${installData.meterCode}] với chỉ số ban đầu là ${installData.initialReading} không?`}
                isLoading={submitting}
            />

        </div>
    );
}

export default InstallationDetail;