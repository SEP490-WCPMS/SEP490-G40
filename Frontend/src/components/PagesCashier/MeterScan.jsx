import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { scanMeterImage } from "../Services/apiCashierStaff"; 
import { Camera, RefreshCw, Loader2, AlertCircle, Save, ArrowRight } from 'lucide-react';

// 1. IMPORT TOAST VÀ MODAL
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

function MeterScan() {
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false); 
    // const [error, setError] = useState(null); // Bỏ state error UI cũ
    const navigate = useNavigate();

    // State lưu kết quả
    const [formData, setFormData] = useState({
        reading: '',
        meterId: '' 
    });

    // State log
    const [logData, setLogData] = useState({
        aiDetectedReading: null,
        aiDetectedMeterId: null,
        scanImageBase64: null
    });

    // State cho Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- XỬ LÝ CAMERA & AI ---
    const handleOpenCamera = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*;capture=camera"; 
        input.capture = "environment";

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const imageURL = URL.createObjectURL(file);
            setImagePreview(imageURL);
            
            setLoadingAI(true);
            setFormData({ reading: '', meterId: '' }); 
            setLogData({ aiDetectedReading: null, aiDetectedMeterId: null, scanImageBase64: null }); 

            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64WithHeader = reader.result;
                    const base64 = base64WithHeader.split(",")[1];

                    // Gọi API Scan
                    const response = await scanMeterImage(base64WithHeader);
                    const aiResult = response.data;

                    if (aiResult) {
                        setFormData({
                            reading: aiResult.reading || '',
                            meterId: aiResult.meterId || ''
                        });
                        setLogData({
                            aiDetectedReading: aiResult.reading,
                            aiDetectedMeterId: aiResult.meterId,
                            scanImageBase64: base64
                        });
                        
                        // Thông báo nhẹ khi AI nhận diện xong
                        toast.success("AI đã nhận diện xong. Vui lòng kiểm tra lại!", { autoClose: 2000 });
                    }

                } catch (err) {
                    console.error("Lỗi khi gửi ảnh:", err);
                    // Dùng Toast báo lỗi thay vì hiện text đỏ
                    toast.error("AI không nhận diện được ảnh này. Vui lòng nhập tay.", { position: "top-center" });
                } finally {
                    setLoadingAI(false);
                }
            };
            reader.onerror = () => {
                toast.error("Không thể đọc file ảnh.");
                setLoadingAI(false);
                setImagePreview(null);
            };
            reader.readAsDataURL(file);
        };
        input.click(); 
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (imagePreview) {
             setImagePreview(null); 
             setLogData({ 
                aiDetectedReading: null,
                aiDetectedMeterId: null,
                scanImageBase64: null 
             });
        }
    };

    // --- 2. XỬ LÝ SUBMIT VỚI MODAL ---

    // Bước 1: Kiểm tra dữ liệu và mở Modal
    const handlePreSubmit = () => {
        // Validate
        if (!formData.meterId || formData.reading === '') { 
            toast.warn("Vui lòng nhập đầy đủ Mã Đồng Hồ và Chỉ Số Mới.");
            return;
        }

        // Mở modal xác nhận
        setShowConfirmModal(true);
    };

    // Bước 2: Chuyển trang (Sau khi bấm "Có")
    const handleConfirmSubmit = () => {
        setShowConfirmModal(false);
        
        // Chuyển sang trang Xác nhận
        navigate('/cashier/submit-reading', {
            state: {
                physicalMeterId: formData.meterId, 
                currentReading: formData.reading,  
                ...logData, 
                userCorrectedMeterIdText: formData.meterId 
            }
        });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Ghi Chỉ Số Đồng Hồ</h1>
                    <p className="text-sm text-gray-600">Sử dụng camera để quét hoặc nhập thủ công chỉ số.</p>
                </div>
                <button
                    onClick={handleOpenCamera}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors focus:outline-none"
                    disabled={loadingAI}
                >
                    <Camera size={16} className="mr-2" />
                    {imagePreview ? 'Chụp lại' : 'Mở Camera (Hỗ trợ AI)'}
                </button>
            </div>

            {/* Đã bỏ phần hiển thị lỗi cũ */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CỘT 1: NHẬP LIỆU */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                    <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                        Thông tin Ghi nhận
                    </h2>
                    
                    {/* Loading AI */}
                    {loadingAI && (
                        <div className="flex items-center text-gray-500 p-3 bg-blue-50 rounded-md animate-pulse">
                            <Loader2 size={18} className="animate-spin mr-3 text-blue-600" />
                            Đang phân tích ảnh... Vui lòng chờ.
                        </div>
                    )}
                    
                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="meterId" className="block mb-1.5 text-sm font-medium text-gray-700">Mã Đồng Hồ <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="meterId"
                                name="meterId"
                                value={formData.meterId}
                                onChange={handleChange}
                                placeholder="Nhập mã đồng hồ (VD: DH001)"
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            {logData.aiDetectedMeterId && formData.meterId !== logData.aiDetectedMeterId && (
                                <p className="text-xs text-orange-600 mt-1 flex items-center">
                                    <AlertCircle size={12} className="mr-1"/> AI gợi ý: {logData.aiDetectedMeterId}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="reading" className="block mb-1.5 text-sm font-medium text-gray-700">Chỉ Số Mới (m³) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                step="0.01"
                                id="reading"
                                name="reading"
                                value={formData.reading}
                                onChange={handleChange}
                                placeholder="Nhập chỉ số nước"
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            {logData.aiDetectedReading && formData.reading !== logData.aiDetectedReading && (
                                <p className="text-xs text-orange-600 mt-1 flex items-center">
                                    <AlertCircle size={12} className="mr-1"/> AI gợi ý: {logData.aiDetectedReading}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Nút Submit */}
                    <div className="pt-4 border-t">
                        <button
                            onClick={handlePreSubmit} // <-- Mở Modal
                            disabled={loadingAI}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all"
                        >
                            Xác nhận & Tiếp tục <ArrowRight size={16} className="ml-2" />
                        </button>
                    </div>
                </div>
                
                {/* CỘT 2: ẢNH XEM TRƯỚC */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                     <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                        Ảnh minh chứng
                    </h2>
                    {imagePreview ? (
                        <div className="relative group">
                            <img src={imagePreview} alt="Ảnh đồng hồ" className="w-full h-auto rounded border border-gray-300 shadow-sm" />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                Ảnh vừa chụp
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                            <Camera size={40} className="mb-2 opacity-50" />
                            <p className="text-sm">Chưa có ảnh chụp.</p>
                        </div>
                    )}
                </div>

            </div>
            
            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận ghi chỉ số"
                message={`Bạn có chắc chắn muốn ghi nhận chỉ số [${formData.reading}] cho đồng hồ [${formData.meterId}] không?`}
            />

        </div>
    );
}

export default MeterScan;