import React, { useState, useEffect } from 'react'; // <-- Thêm useEffect
import { useNavigate, useLocation } from 'react-router-dom'; // <-- Thêm useLocation
import { submitOnSiteCalibration } from '../../Services/apiTechnicalStaff';
import { ArrowLeft, Check, X } from 'lucide-react';
import moment from 'moment'; // Cần import moment

function OnSiteCalibrationForm() {
    const navigate = useNavigate();
    const location = useLocation(); // <-- Lấy location

    // State cho form
    const [formData, setFormData] = useState({
        meterCode: '', // Mã đồng hồ
        calibrationDate: moment().format('YYYY-MM-DD'), // Mặc định hôm nay
        calibrationStatus: 'PASSED', // Mặc định là 'PASSED'
        nextCalibrationDate: moment().add(5, 'years').format('YYYY-MM-DD'), // Tự động 5 năm sau
        calibrationCertificateNumber: '',
        calibrationCost: '',
        notes: ''
    });

    // State chung
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);


    // --- THÊM HOOK MỚI: Tự động điền ---
    useEffect(() => {
        // Kiểm tra xem có state "prefillMeterCode" được gửi từ trang trước không
        if (location.state && location.state.prefillMeterCode) {
            const meterCodeFromState = location.state.prefillMeterCode;
            
            // 1. Tự động điền mã vào ô input
            setFormData(prev => ({
                ...prev,
                meterCode: meterCodeFromState
            }));
        }
    }, [location.state]); // Chạy lại khi location.state thay đổi
    // --- HẾT PHẦN THÊM ---
    

    // --- HÀM XỬ LÝ NHẬP LIỆU ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Hàm đặc biệt để xử lý thay đổi ngày kiểm định
    // Tự động cập nhật ngày kiểm định tiếp theo
    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setFormData(prev => ({
            ...prev,
            calibrationDate: newDate,
            // Tự động tính 5 năm sau
            nextCalibrationDate: moment(newDate).add(5, 'years').format('YYYY-MM-DD')
        }));
    };

    // --- HÀM XỬ LÝ SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.meterCode || !formData.calibrationDate || !formData.nextCalibrationDate || !formData.calibrationCost) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc (*).");
            setSuccess(null);
            return;
        }

        // --- 2. THÊM VALIDATION LOGIC NGÀY THÁNG (MỚI) ---
        // Kiểm tra: Ngày hẹn tiếp theo phải SAU ngày hiện tại
        if (moment(formData.nextCalibrationDate).isSameOrBefore(moment(), 'day')) {
             setError("Lỗi: Ngày hẹn kiểm định tiếp theo phải là ngày trong tương lai!");
             setSuccess(null);
             return; // Dừng lại ngay, không gửi API
        }
        // ------------------------------------------------

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        // Tạo DTO gửi đi
        const calibrationData = {
            ...formData,
            // Đảm bảo chi phí là số
            calibrationCost: parseFloat(formData.calibrationCost) || 0,
        };

        try {
            // Gọi API (submitOnSiteCalibration)
            await submitOnSiteCalibration(calibrationData);
            setSuccess("Ghi nhận kết quả kiểm định tại chỗ thành công!");
            // Reset form
            setFormData({
                meterCode: '',
                calibrationDate: moment().format('YYYY-MM-DD'),
                calibrationStatus: 'PASSED',
                nextCalibrationDate: moment().add(5, 'years').format('YYYY-MM-DD'),
                calibrationCertificateNumber: '',
                calibrationCost: '',
                notes: ''
            });
            // (Không điều hướng, để NV Kỹ thuật có thể nhập tiếp cái khác)
            // navigate('/technical/dashboard'); 
        } catch (err) {
            console.error("Lỗi khi gửi kết quả kiểm định:", err);
            setError(err.response?.data?.message || "Lỗi khi xử lý yêu cầu.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- JSX ---
    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition duration-150">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Kiểm Định Tại Chỗ</h1>
                    <p className="text-sm text-gray-600">Ghi nhận kết quả kiểm định đồng hồ mà không cần thay thế.</p>
                </div>
            </div>

            {/* Hiển thị lỗi chung */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                     <p className="font-bold">Đã xảy ra lỗi</p>
                     <p>{error}</p>
                </div>
            )}
            
            {/* Hiển thị thành công */}
            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                     <p className="font-bold">Thành công</p>
                     <p>{success}</p>
                </div>
            )}

            {/* Form Ghi Nhận Kiểm Định */}
            <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                    Thông tin Kiểm định
                </h3>

                {/* Mã Đồng Hồ */}
                <div>
                    <label htmlFor="meterCode" className="block mb-1.5 text-sm font-medium text-gray-700">Mã Đồng Hồ (meter_code) <span className="text-red-500">*</span></label>
                    <input
                        type="text" id="meterCode" name="meterCode"
                        value={formData.meterCode} onChange={handleChange}
                        placeholder="Nhập mã đồng hồ vừa kiểm định"
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    />
                </div>

                {/* Ngày Kiểm Định */}
                <div>
                    <label htmlFor="calibrationDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Kiểm Định <span className="text-red-500">*</span></label>
                    <input
                        type="date" id="calibrationDate" name="calibrationDate"
                        value={formData.calibrationDate}
                        onChange={handleDateChange} // Dùng hàm xử lý riêng
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    />
                </div>
                
                {/* Ngày Hẹn Kiểm Định Lần Sau */}
                <div>
                    {/* --- SỬA LỖI 1 TẠI ĐÂY (</DATEDD> -> </label>) --- */}
                    <label htmlFor="nextCalibrationDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Hẹn Kiểm Định Tiếp Theo <span className="text-red-500">*</span></label>
                    <input
                        type="date" id="nextCalibrationDate" name="nextCalibrationDate"
                        value={formData.nextCalibrationDate}
                        onChange={handleChange} // Cho phép sửa nếu cần
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50" // Thêm bg-gray-50
                    />
                </div>

                {/* Trạng thái Kiểm định */}
                <div>
                    <label htmlFor="calibrationStatus" className="block mb-1.5 text-sm font-medium text-gray-700">Kết quả Kiểm định <span className="text-red-500">*</span></label>
                    <select
                        id="calibrationStatus" name="calibrationStatus"
                        value={formData.calibrationStatus} onChange={handleChange}
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white"
                    >
                        <option value="PASSED">Đạt (PASSED)</option>
                        <option value="FAILED">Hỏng (FAILED)</option>
                        <option value="PENDING">Chờ kết quả (PENDING)</option>
                    </select>
                </div>

                {/* Chi phí (Bắt buộc theo nghiệp vụ) */}
                <div>
                    {/* --- SỬA LỖI 2 TẠI ĐÂY (</Ghi> -> </label>) --- */}
                    <label htmlFor="calibrationCost" className="block mb-1.5 text-sm font-medium text-gray-700">Chi Phí Kiểm Định (VNĐ) <span className="text-red-500">*</span></label>
                    <input
                        type="number" min="0"
                        id="calibrationCost" name="calibrationCost"
                        value={formData.calibrationCost} onChange={handleChange}
                        placeholder="Nhập chi phí để gửi Kế toán"
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    />
                </div>

                {/* Số Chứng chỉ (Tùy chọn) */}
                <div>
                    <label htmlFor="calibrationCertificateNumber" className="block mb-1.5 text-sm font-medium text-gray-700">Số Chứng Chỉ (Nếu có)</label>
                    <input
                        type="text"
                        id="calibrationCertificateNumber" name="calibrationCertificateNumber"
                        value={formData.calibrationCertificateNumber} onChange={handleChange}
                        placeholder="Nhập số chứng chỉ kiểm định"
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    />
                </div>

                {/* Ghi chú */}
                 <div>
                    <label htmlFor="notes" className="block mb-1.5 text-sm font-medium text-gray-700">Ghi Chú</label>
                    <textarea
                        id="notes" name="notes" rows="3"
                        value={formData.notes} onChange={handleChange}
                        placeholder="Ghi chú thêm về tình trạng đồng hồ..."
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                    />
                </div>

                {/* Nút Submit */}
                <div className="pt-4">
                    <button type="submit"
                            className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={submitting}>
                         {submitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang lưu...
                            </>
                         ) : 'Lưu Kết Quả Kiểm Định'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default OnSiteCalibrationForm;

