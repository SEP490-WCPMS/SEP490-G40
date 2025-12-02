import React, { useState, useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom'; 
import { submitOnSiteCalibration } from '../../Services/apiTechnicalStaff';
import { ArrowLeft, Check, X, Save } from 'lucide-react';
import moment from 'moment'; 

// 1. IMPORT TOAST VÀ MODAL
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

function OnSiteCalibrationForm() {
    const navigate = useNavigate();
    const location = useLocation(); 

    // State cho form
    const [formData, setFormData] = useState({
        meterCode: '', 
        calibrationDate: moment().format('YYYY-MM-DD'), 
        calibrationStatus: 'PASSED', 
        nextCalibrationDate: moment().add(5, 'years').format('YYYY-MM-DD'), 
        calibrationCertificateNumber: '',
        calibrationCost: '',
        notes: ''
    });

    // State chung
    const [submitting, setSubmitting] = useState(false);
    // const [error, setError] = useState(null); // Bỏ state error hiển thị UI cũ
    // const [success, setSuccess] = useState(null); // Bỏ state success hiển thị UI cũ

    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Tự động điền từ trang trước
    useEffect(() => {
        if (location.state && location.state.prefillMeterCode) {
            const meterCodeFromState = location.state.prefillMeterCode;
            setFormData(prev => ({
                ...prev,
                meterCode: meterCodeFromState
            }));
        }
    }, [location.state]);
    
    // --- HÀM XỬ LÝ NHẬP LIỆU ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setFormData(prev => ({
            ...prev,
            calibrationDate: newDate,
            nextCalibrationDate: moment(newDate).add(5, 'years').format('YYYY-MM-DD')
        }));
    };

    // --- CÁC HÀM XỬ LÝ SUBMIT MỚI ---

    // 1. Validate và Mở Modal
    const handlePreSubmit = (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.meterCode || !formData.calibrationDate || !formData.nextCalibrationDate || !formData.calibrationCost) {
            toast.warn("Vui lòng điền đầy đủ các trường bắt buộc (*).");
            return;
        }

        if (moment(formData.nextCalibrationDate).isSameOrBefore(moment(), 'day')) {
            toast.error("Lỗi: Ngày hẹn kiểm định tiếp theo phải là ngày trong tương lai!");
            return;
        }

        // Mở Modal
        setShowConfirmModal(true);
    };

    // 2. Submit thật (Khi bấm Có)
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false); // Đóng modal

        const calibrationData = {
            ...formData,
            calibrationCost: parseFloat(formData.calibrationCost) || 0,
        };

        try {
            await submitOnSiteCalibration(calibrationData);
            
            toast.success("Ghi nhận kết quả kiểm định tại chỗ thành công!", {
                position: "top-center",
                autoClose: 3000
            });

            // Reset form sau khi thành công
            setFormData({
                meterCode: '',
                calibrationDate: moment().format('YYYY-MM-DD'),
                calibrationStatus: 'PASSED',
                nextCalibrationDate: moment().add(5, 'years').format('YYYY-MM-DD'),
                calibrationCertificateNumber: '',
                calibrationCost: '',
                notes: ''
            });

        } catch (err) {
            console.error("Lỗi khi gửi kết quả kiểm định:", err);
            toast.error(err.response?.data?.message || "Lỗi khi xử lý yêu cầu.", {
                position: "top-center"
            });
        } finally {
            setSubmitting(false);
        }
    };

    // --- JSX ---
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
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition duration-150 focus:outline-none">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Kiểm Định Tại Chỗ</h1>
                    <p className="text-sm text-gray-600">Ghi nhận kết quả kiểm định đồng hồ mà không cần thay thế.</p>
                </div>
            </div>

            {/* Đã bỏ phần hiển thị lỗi/thành công cũ */}

            {/* Form Ghi Nhận Kiểm Định */}
            <form onSubmit={handlePreSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5 border border-gray-200">
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
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Ngày Kiểm Định */}
                <div>
                    <label htmlFor="calibrationDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Kiểm Định <span className="text-red-500">*</span></label>
                    <input
                        type="date" id="calibrationDate" name="calibrationDate"
                        value={formData.calibrationDate}
                        onChange={handleDateChange} 
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                {/* Ngày Hẹn Kiểm Định Lần Sau */}
                <div>
                    <label htmlFor="nextCalibrationDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Hẹn Kiểm Định Tiếp Theo <span className="text-red-500">*</span></label>
                    <input
                        type="date" id="nextCalibrationDate" name="nextCalibrationDate"
                        value={formData.nextCalibrationDate}
                        onChange={handleChange} 
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Trạng thái Kiểm định */}
                <div>
                    <label htmlFor="calibrationStatus" className="block mb-1.5 text-sm font-medium text-gray-700">Kết quả Kiểm định <span className="text-red-500">*</span></label>
                    <select
                        id="calibrationStatus" name="calibrationStatus"
                        value={formData.calibrationStatus} onChange={handleChange}
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="PASSED">Đạt (PASSED)</option>
                        <option value="FAILED">Hỏng (FAILED)</option>                   
                    </select>
                </div>

                {/* Chi phí */}
                <div>
                    <label htmlFor="calibrationCost" className="block mb-1.5 text-sm font-medium text-gray-700">Chi Phí Kiểm Định (VNĐ) <span className="text-red-500">*</span></label>
                    <input
                        type="number" min="0"
                        id="calibrationCost" name="calibrationCost"
                        value={formData.calibrationCost} onChange={handleChange}
                        placeholder="Nhập chi phí để gửi Kế toán"
                        required
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800"
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
                        className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Ghi chú */}
                 <div>
                    <label htmlFor="notes" className="block mb-1.5 text-sm font-medium text-gray-700">Ghi Chú</label>
                    <textarea
                        id="notes" name="notes" rows="3"
                        value={formData.notes} onChange={handleChange}
                        placeholder="Ghi chú thêm về tình trạng đồng hồ..."
                        className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Nút Submit */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit"
                            className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={submitting}>
                         {submitting ? (
                            <>
                                <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white rounded-full border-b-2 border-white"></div>
                                Đang lưu...
                            </>
                         ) : (
                             <>
                                <Save size={18} className="mr-2" />
                                Lưu Kết Quả Kiểm Định
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
                title="Xác nhận lưu kết quả"
                message={`Bạn có chắc chắn muốn lưu kết quả kiểm định cho đồng hồ [${formData.meterCode}] với trạng thái [${formData.calibrationStatus}] không?`}
                isLoading={submitting}
            />

        </div>
    );
}

export default OnSiteCalibrationForm;