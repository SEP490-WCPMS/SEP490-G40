import React, { useState, useEffect } from 'react'; // <-- Thêm useEffect
import { useNavigate, useLocation } from 'react-router-dom'; // <-- Thêm useLocation
import { getMeterInfoByCode, submitMeterReplacement } from '../../Services/apiTechnicalStaff';
import { ArrowLeft, Search, UploadCloud } from 'lucide-react';
import moment from 'moment'; // Import moment

function MeterReplacementForm() {
    const navigate = useNavigate();
    const location = useLocation(); // <-- Lấy location để nhận state

    // State cho bước 1: Tìm kiếm
    const [oldMeterCode, setOldMeterCode] = useState('');
    const [loadingFetch, setLoadingFetch] = useState(false);
    
    // State cho bước 2: Hiển thị thông tin cũ
    const [foundMeterInfo, setFoundMeterInfo] = useState(null); // { customerName, contractNumber, lastReading, meterInstallationId }

    // State cho bước 3: Form nhập liệu
    const [formData, setFormData] = useState({
        oldMeterFinalReading: '',
        newMeterCode: '',
        newMeterInitialReading: '',
        installationImageBase64: null,
        replacementReason: 'BROKEN', // Mặc định là 'Hỏng'
        calibrationCost: '',
        notes: ''
    });
    const [imagePreview, setImagePreview] = useState(null);

    // State chung
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // --- HÀM XỬ LÝ BƯỚC 1: TÌM ĐỒNG HỒ CŨ ---
    const handleSearchMeter = async () => {
        if (!oldMeterCode) {
            setError('Vui lòng nhập Mã đồng hồ cũ.');
            return;
        }
        setLoadingFetch(true);
        setError(null);
        setFoundMeterInfo(null); // Reset thông tin cũ
        try {
            // Gọi API (getMeterInfoByCode)
            const response = await getMeterInfoByCode(oldMeterCode);
            setFoundMeterInfo(response.data);
            // Tự động điền chỉ số cũ vào form
            setFormData(prev => ({ ...prev, oldMeterFinalReading: response.data.lastReading || '' }));
        } catch (err) {
            console.error("Lỗi khi tìm đồng hồ:", err);
            setError(err.response?.data?.message || "Không tìm thấy đồng hồ hoặc đồng hồ chưa được lắp đặt.");
        } finally {
            setLoadingFetch(false);
        }
    };


    // --- THÊM HOOK MỚI: Tự động điền và tìm kiếm ---
    useEffect(() => {
        // Kiểm tra xem có state "prefillMeterCode" được gửi từ trang trước không
        if (location.state && location.state.prefillMeterCode) {
            const meterCodeFromState = location.state.prefillMeterCode;
            
            // 1. Tự động điền mã vào ô input
            setOldMeterCode(meterCodeFromState);
            
            // 2. Tự động chạy hàm tìm kiếm
            // (Chúng ta cần đảm bảo hàm handleSearchMeter có thể chạy với mã mới nhất)
            // (Giải pháp đơn giản là gọi trực tiếp API)
            
            setLoadingFetch(true);
            setError(null);
            setFoundMeterInfo(null);
            getMeterInfoByCode(meterCodeFromState)
                .then(response => {
                    setFoundMeterInfo(response.data);
                    setFormData(prev => ({ ...prev, oldMeterFinalReading: response.data.lastReading || '' }));
                })
                .catch(err => {
                    setError(err.response?.data?.message || "Không tìm thấy đồng hồ.");
                })
                .finally(() => {
                    setLoadingFetch(false);
                });
        }
    }, [location.state]); // Chạy lại khi location.state thay đổi
    // --- HẾT PHẦN THÊM ---
    

    // --- HÀM XỬ LÝ BƯỚC 3: NHẬP LIỆU FORM ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setFormData(prev => ({ ...prev, installationImageBase64: null }));
            setImagePreview(null);
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        // Chuyển ảnh sang Base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(",")[1];
            setFormData(prev => ({ ...prev, installationImageBase64: base64String }));
        };
        reader.readAsDataURL(file);
    };

    // --- HÀM XỬ LÝ BƯỚC CUỐI: SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.oldMeterFinalReading || !formData.newMeterCode || !formData.newMeterInitialReading || !formData.installationImageBase64) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc (*).");
            return;
        }
        if (formData.replacementReason === 'CALIBRATION' && !formData.calibrationCost) {
             setError("Vui lòng nhập Chi phí kiểm định.");
            return;
        }
        // So sánh số
        if (parseFloat(formData.oldMeterFinalReading) < parseFloat(foundMeterInfo.lastReading)) {
            setError("Chỉ số cuối của đồng hồ cũ không thể nhỏ hơn chỉ số đã ghi nhận trước đó (" + foundMeterInfo.lastReading + ").");
            return;
        }

        setSubmitting(true);
        setError(null);

        // Tạo DTO gửi đi
        const replacementData = {
            oldMeterCode: oldMeterCode,
            oldMeterFinalReading: formData.oldMeterFinalReading,
            newMeterCode: formData.newMeterCode,
            newMeterInitialReading: formData.newMeterInitialReading,
            installationImageBase64: formData.installationImageBase64,
            replacementReason: formData.replacementReason,
            calibrationCost: formData.replacementReason === 'CALIBRATION' ? formData.calibrationCost : null,
            notes: formData.notes
        };

        try {
            // Gọi API (submitMeterReplacement)
            await submitMeterReplacement(replacementData);
            alert("Thay thế đồng hồ thành công!");
            navigate('/technical'); // Về dashboard hoặc trang danh sách
        } catch (err) {
            console.error("Lỗi khi gửi yêu cầu thay thế:", err);
            setError(err.response?.data?.message || "Lỗi khi xử lý yêu cầu thay thế.");
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
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Thay Thế Đồng Hồ (Hỏng / Kiểm Định)</h1>
                    <p className="text-sm text-gray-600">Ghi nhận chốt sổ đồng hồ cũ và lắp đặt đồng hồ mới.</p>
                </div>
            </div>

            {/* Hiển thị lỗi chung */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                     <p className="font-bold">Đã xảy ra lỗi</p>
                     <p>{error}</p>
                </div>
            )}

            {/* --- BƯỚC 1: TÌM ĐỒNG HỒ CŨ --- */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                 <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                    Bước 1: Tìm Đồng Hồ Cũ
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
                    <div className="flex-1">
                        <label htmlFor="oldMeterCode" className="block mb-1.5 text-sm font-medium text-gray-700">Nhập Mã Đồng Hồ Cũ (meter_code) *</label>
                        <input
                            type="text"
                            id="oldMeterCode"
                            value={oldMeterCode}
                            onChange={(e) => setOldMeterCode(e.target.value)}
                            placeholder="Quét mã vạch hoặc nhập mã đồng hồ..."
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="button" // Thêm type="button"
                        onClick={handleSearchMeter}
                        disabled={loadingFetch}
                        className="mt-2 sm:mt-0 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    >
                        {loadingFetch ? (
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <Search size={16} className="mr-2" />
                        )}
                        Tìm
                    </button>
                </div>
            </div>

            {/* --- BƯỚC 2 & 3: HIỂN THỊ THÔNG TIN VÀ FORM THAY THẾ --- */}
            {/* Chỉ hiển thị khi đã tìm thấy thông tin */}
            {foundMeterInfo && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Box Thông tin Hợp đồng (Read-only) */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông tin Hợp đồng & Đồng hồ cũ
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                            <p><strong>Khách hàng:</strong> {foundMeterInfo.customerName || 'N/A'}</p>
                            <p><strong>Số HĐ Dịch vụ:</strong> {foundMeterInfo.contractNumber || 'N/A'}</p>
                            <p className="md:col-span-2"><strong>Địa chỉ:</strong> {foundMeterInfo.customerAddress || 'N/A'}</p>
                            <p><strong>Chỉ số đã ghi nhận:</strong> <span className="font-bold text-blue-600">{foundMeterInfo.lastReading ?? '0'} m³</span></p>
                        </div>
                    </div>

                    {/* Box Form Nhập Liệu Thay Thế */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                         <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                            Bước 2: Nhập Thông Tin Thay Thế
                        </h3>

                        {/* Thông tin đồng hồ CŨ */}
                        <div>
                            <label htmlFor="oldMeterFinalReading" className="block mb-1.5 text-sm font-medium text-gray-700">Chỉ số CUỐI (Đồng hồ CŨ) <span className="text-red-500">*</span></label>
                            <input
                                type="number" step="0.01" min={foundMeterInfo.lastReading || 0}
                                id="oldMeterFinalReading" name="oldMeterFinalReading"
                                value={formData.oldMeterFinalReading} onChange={handleChange}
                                placeholder={`Phải >= ${foundMeterInfo.lastReading || 0}`}
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                            />
                        </div>
                        
                        <hr className="my-4 border-t border-gray-200" />

                        {/* Thông tin đồng hồ MỚI */}
                        <div>
                            <label htmlFor="newMeterCode" className="block mb-1.5 text-sm font-medium text-gray-700">Mã Đồng Hồ MỚI (meter_code) <span className="text-red-500">*</span></label>
                            <input
                                type="text" id="newMeterCode" name="newMeterCode"
                                value={formData.newMeterCode} onChange={handleChange}
                                placeholder="Nhập mã vạch/serial đồng hồ mới"
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="newMeterInitialReading" className="block mb-1.5 text-sm font-medium text-gray-700">Chỉ số ĐẦU (Đồng hồ MỚI) <span className="text-red-500">*</span></label>
                            <input
                                type="number" step="0.01" min="0"
                                id="newMeterInitialReading" name="newMeterInitialReading"
                                value={formData.newMeterInitialReading} onChange={handleChange}
                                placeholder="Ví dụ: 0"
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                            />
                        </div>
                        
                        {/* Lý do thay thế */}
                        <div>
                            <label htmlFor="replacementReason" className="block mb-1.5 text-sm font-medium text-gray-700">Lý do thay thế <span className="text-red-500">*</span></label>
                            <select
                                id="replacementReason" name="replacementReason"
                                value={formData.replacementReason} onChange={handleChange}
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white"
                            >
                                <option value="BROKEN">Do Bị Hỏng</option>
                                <option value="CALIBRATION">Do Đến Hạn Kiểm Định (5 năm)</option>
                            </select>
                        </div>
                        
                        {/* Chi phí (Chỉ hiện khi là Kiểm Định) */}
                        {formData.replacementReason === 'CALIBRATION' && (
                             <div>
                                {/* --- SỬA LỖI Ở ĐÂY --- */}
                                <label htmlFor="calibrationCost" className="block mb-1.5 text-sm font-medium text-gray-700">Chi Phí Kiểm Định (VNĐ) <span className="text-red-500">*</span></label>
                                {/* --- HẾT PHẦN SỬA --- */}
                                <input
                                    type="number" min="0"
                                    id="calibrationCost" name="calibrationCost"
                                    value={formData.calibrationCost} onChange={handleChange}
                                    placeholder="Nhập chi phí kiểm định"
                                    required={formData.replacementReason === 'CALIBRATION'}
                                    className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                                />
                             </div>
                        )}

                        {/* Upload Ảnh */}
                        <div>
                            <label htmlFor="installationImage" className="block mb-1.5 text-sm font-medium text-gray-700">Ảnh Chụp Đồng Hồ MỚI <span className="text-red-500">*</span></label>
                            <input
                                type="file" id="installationImage" name="installationImage"
                                accept="image/*" onChange={handleFileChange} required
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        {imagePreview && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">Ảnh xem trước:</p>
                                <img src={imagePreview} alt="Xem trước" className="max-w-xs md:max-w-sm rounded border border-gray-300 shadow-sm" />
                            </div>
                        )}

                        {/* Ghi chú */}
                         <div>
                            <label htmlFor="notes" className="block mb-1.5 text-sm font-medium text-gray-700">Ghi Chú Chung</label>
                            <textarea
                                id="notes" name="notes" rows="3"
                                value={formData.notes} onChange={handleChange}
                                placeholder="Ghi chú thêm nếu cần..."
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
                                        Đang xử lý...
                                    </>
                                 ) : 'Xác Nhận Thay Thế'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}

export default MeterReplacementForm;

