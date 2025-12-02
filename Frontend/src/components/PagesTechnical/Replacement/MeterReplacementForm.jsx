import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMeterInfoByCode, submitMeterReplacement } from '../../Services/apiTechnicalStaff';
import { ArrowLeft, Search, Save, AlertCircle } from 'lucide-react';
import moment from 'moment'; 

// 1. IMPORT TOAST VÀ MODAL
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

function MeterReplacementForm() {
    const navigate = useNavigate();
    const location = useLocation();

    // State cho bước 1: Tìm kiếm
    const [oldMeterCode, setOldMeterCode] = useState('');
    const [loadingFetch, setLoadingFetch] = useState(false);
    
    // State cho bước 2: Hiển thị thông tin cũ
    const [foundMeterInfo, setFoundMeterInfo] = useState(null); 

    // State cho bước 3: Form nhập liệu
    const [formData, setFormData] = useState({
        oldMeterFinalReading: '',
        newMeterCode: '',
        newMeterInitialReading: '',
        installationImageBase64: null,
        replacementReason: 'BROKEN', 
        calibrationCost: '',
        notes: ''
    });
    const [imagePreview, setImagePreview] = useState(null);

    // State chung
    const [submitting, setSubmitting] = useState(false);
    // const [error, setError] = useState(null); // Bỏ state error hiển thị UI cũ

    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- HÀM XỬ LÝ BƯỚC 1: TÌM ĐỒNG HỒ CŨ ---
    const handleSearchMeter = async () => {
        if (!oldMeterCode) {
            toast.warn('Vui lòng nhập Mã đồng hồ cũ.');
            return;
        }
        setLoadingFetch(true);
        setFoundMeterInfo(null); 
        
        try {
            const response = await getMeterInfoByCode(oldMeterCode);
            setFoundMeterInfo(response.data);
            // Tự động điền chỉ số cũ
            setFormData(prev => ({ ...prev, oldMeterFinalReading: response.data.lastReading || '' }));
            
            toast.success("Đã tìm thấy thông tin đồng hồ!");
        } catch (err) {
            console.error("Lỗi khi tìm đồng hồ:", err);
            toast.error(err.response?.data?.message || "Không tìm thấy đồng hồ hoặc đồng hồ chưa được lắp đặt.");
        } finally {
            setLoadingFetch(false);
        }
    };

    // --- Tự động điền từ trang chi tiết ---
    useEffect(() => {
        if (location.state && location.state.prefillMeterCode) {
            const meterCodeFromState = location.state.prefillMeterCode;
            setOldMeterCode(meterCodeFromState);
            
            setLoadingFetch(true);
            setFoundMeterInfo(null);
            
            getMeterInfoByCode(meterCodeFromState)
                .then(response => {
                    setFoundMeterInfo(response.data);
                    setFormData(prev => ({ ...prev, oldMeterFinalReading: response.data.lastReading || '' }));
                })
                .catch(err => {
                     toast.error(err.response?.data?.message || "Không tìm thấy thông tin đồng hồ này.");
                })
                .finally(() => {
                    setLoadingFetch(false);
                });
        }
    }, [location.state]);
    

    // --- HÀM XỬ LÝ NHẬP LIỆU FORM ---
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
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(",")[1];
            setFormData(prev => ({ ...prev, installationImageBase64: base64String }));
        };
        reader.readAsDataURL(file);
    };

    // --- CÁC HÀM XỬ LÝ SUBMIT ---

    // 1. Validate và mở Modal
    const handlePreSubmit = (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.oldMeterFinalReading || !formData.newMeterCode || !formData.newMeterInitialReading || !formData.installationImageBase64) {
            toast.warn("Vui lòng điền đầy đủ các trường bắt buộc (*).");
            return;
        }
        if (formData.replacementReason === 'CALIBRATION' && !formData.calibrationCost) {
             toast.warn("Vui lòng nhập Chi phí kiểm định.");
            return;
        }
        // So sánh số
        if (foundMeterInfo && parseFloat(formData.oldMeterFinalReading) < parseFloat(foundMeterInfo.lastReading)) {
            toast.error(`Chỉ số cuối (${formData.oldMeterFinalReading}) không thể nhỏ hơn chỉ số cũ (${foundMeterInfo.lastReading}).`);
            return;
        }

        // Mở Modal
        setShowConfirmModal(true);
    };

    // 2. Submit thật (Khi bấm Có)
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false); // Đóng modal

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
            await submitMeterReplacement(replacementData);
            
            toast.success("Thay thế đồng hồ thành công!", {
                position: "top-center",
                autoClose: 2000
            });
            
            // Chuyển hướng sau 2s
            setTimeout(() => {
                navigate('/technical'); 
            }, 2000);

        } catch (err) {
            console.error("Lỗi khi gửi yêu cầu thay thế:", err);
            toast.error(err.response?.data?.message || "Lỗi khi xử lý yêu cầu thay thế.", {
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
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Thay Thế Đồng Hồ (Hỏng / Kiểm Định)</h1>
                    <p className="text-sm text-gray-600">Ghi nhận chốt sổ đồng hồ cũ và lắp đặt đồng hồ mới.</p>
                </div>
            </div>

            {/* Đã bỏ phần hiển thị lỗi cũ */}

            {/* --- BƯỚC 1: TÌM ĐỒNG HỒ CŨ --- */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4 border border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                    Bước 1: Tìm Đồng Hồ Cũ
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
                    <div className="flex-1">
                        <label htmlFor="oldMeterCode" className="block mb-1.5 text-sm font-medium text-gray-700">Nhập Mã Đồng Hồ Cũ (meter_code) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                id="oldMeterCode"
                                value={oldMeterCode}
                                onChange={(e) => setOldMeterCode(e.target.value)}
                                placeholder="Quét mã vạch hoặc nhập mã đồng hồ..."
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <button
                        type="button" 
                        onClick={handleSearchMeter}
                        disabled={loadingFetch}
                        className="mt-2 sm:mt-0 inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-70"
                    >
                        {loadingFetch ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Search size={16} className="mr-2" />
                        )}
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* --- BƯỚC 2 & 3: HIỂN THỊ THÔNG TIN VÀ FORM THAY THẾ --- */}
            {/* Chỉ hiển thị khi đã tìm thấy thông tin */}
            {foundMeterInfo && (
                <form onSubmit={handlePreSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Box Thông tin Hợp đồng (Read-only) */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông tin Hợp đồng & Đồng hồ cũ
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                            <p><strong>Khách hàng:</strong> {foundMeterInfo.customerName || 'N/A'}</p>
                            <p><strong>Số HĐ Dịch vụ:</strong> {foundMeterInfo.contractNumber || 'N/A'}</p>
                            <p className="md:col-span-2"><strong>Địa chỉ:</strong> {foundMeterInfo.customerAddress || 'N/A'}</p>
                            <p><strong>Chỉ số đã ghi nhận:</strong> <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{foundMeterInfo.lastReading ?? '0'} m³</span></p>
                        </div>
                    </div>

                    {/* Box Form Nhập Liệu Thay Thế */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5 border border-gray-200">
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
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div className="border-t border-dashed border-gray-200 my-2"></div>

                        {/* Thông tin đồng hồ MỚI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="newMeterCode" className="block mb-1.5 text-sm font-medium text-gray-700">Mã Đồng Hồ MỚI (meter_code) <span className="text-red-500">*</span></label>
                                <input
                                    type="text" id="newMeterCode" name="newMeterCode"
                                    value={formData.newMeterCode} onChange={handleChange}
                                    placeholder="Nhập mã vạch/serial đồng hồ mới"
                                    required
                                    className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                                    className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        {/* Lý do thay thế */}
                        <div>
                            <label htmlFor="replacementReason" className="block mb-1.5 text-sm font-medium text-gray-700">Lý do thay thế <span className="text-red-500">*</span></label>
                            <select
                                id="replacementReason" name="replacementReason"
                                value={formData.replacementReason} onChange={handleChange}
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="BROKEN">Do Bị Hỏng</option>
                                <option value="CALIBRATION">Do Đến Hạn Kiểm Định (5 năm)</option>
                            </select>
                        </div>
                        
                        {/* Chi phí (Chỉ hiện khi là Kiểm Định) */}
                        {formData.replacementReason === 'CALIBRATION' && (
                             <div className="bg-purple-50 p-4 rounded-md border border-purple-100 animate-in fade-in zoom-in duration-300">
                                <label htmlFor="calibrationCost" className="block mb-1.5 text-sm font-medium text-purple-800">Chi Phí Kiểm Định (VNĐ) <span className="text-red-500">*</span></label>
                                <input
                                    type="number" min="0"
                                    id="calibrationCost" name="calibrationCost"
                                    value={formData.calibrationCost} onChange={handleChange}
                                    placeholder="Nhập chi phí kiểm định"
                                    required={formData.replacementReason === 'CALIBRATION'}
                                    className="appearance-none block w-full border border-purple-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-purple-500 focus:border-purple-500"
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
                            {imagePreview && (
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 mb-1">Xem trước:</p>
                                    <img src={imagePreview} alt="Xem trước" className="max-w-xs h-auto rounded border border-gray-300 shadow-sm" />
                                </div>
                            )}
                        </div>

                        {/* Ghi chú */}
                         <div>
                            <label htmlFor="notes" className="block mb-1.5 text-sm font-medium text-gray-700">Ghi Chú Chung</label>
                            <textarea
                                id="notes" name="notes" rows="3"
                                value={formData.notes} onChange={handleChange}
                                placeholder="Ghi chú thêm nếu cần..."
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
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
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        Xác Nhận Thay Thế
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận thay thế"
                message={`Bạn có chắc chắn muốn xác nhận thay thế đồng hồ cũ [${oldMeterCode}] bằng đồng hồ mới [${formData.newMeterCode}] không?`}
                isLoading={submitting}
            />

        </div>
    );
}

export default MeterReplacementForm;