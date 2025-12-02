import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getReadingConfirmationDataByMeterCode, saveNewReading } from '../Services/apiCashierStaff'; 
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Save } from 'lucide-react';

// 1. IMPORT CÁC THÀNH PHẦN GIAO DIỆN MỚI
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

function ReadingConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        physicalMeterId,
        currentReading,
        aiDetectedReading,
        aiDetectedMeterId,
        scanImageBase64,
        userCorrectedMeterIdText
    } = location.state || {}; 

    const [confirmationData, setConfirmationData] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [submitting, setSubmitting] = useState(false); 
    // const [error, setError] = useState(null); // Không dùng state error hiển thị UI cũ
    const [notes, setNotes] = useState(""); 

    // State cho Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Fetch dữ liệu
    useEffect(() => {
        if (!physicalMeterId || currentReading === undefined || currentReading === null) {
            toast.error("Dữ liệu đọc số không hợp lệ. Vui lòng thử lại.");
            setLoading(false);
            return; 
        }

        setLoading(true);
        
        getReadingConfirmationDataByMeterCode(physicalMeterId)
            .then(response => {
                setConfirmationData(response.data); 
            })
            .catch(err => {
                console.error("Lỗi khi lấy dữ liệu xác nhận:", err);
                // Thay setError bằng toast
                toast.error(err.response?.data?.message || "Lỗi tải dữ liệu hợp đồng. Kiểm tra lại mã đồng hồ.");
            })
            .finally(() => setLoading(false)); 

    }, [physicalMeterId]);

    // --- CÁC HÀM XỬ LÝ MỚI ---

    // 1. Khi bấm nút "Gửi" -> Mở Modal
    const handlePreSubmit = () => {
        if (!confirmationData) {
            toast.error("Chưa tải được thông tin hợp đồng để gửi.");
            return;
        }
        setShowConfirmModal(true);
    };

    // 2. Khi bấm "Có" -> Gọi API
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false); // Đóng modal

        const saveData = {
            meterInstallationId: confirmationData.meterInstallationId,
            previousReading: confirmationData.previousReading,
            currentReading: currentReading, 
            notes: notes, 
            aiDetectedReading: aiDetectedReading,
            aiDetectedMeterId: aiDetectedMeterId,
            userCorrectedMeterIdText: userCorrectedMeterIdText,
            scanImageBase64: scanImageBase64
        };

        try {
            await saveNewReading(saveData);
            
            toast.success("Đã gửi chỉ số thành công!", {
                position: "top-center",
                autoClose: 2000
            });

            // Chuyển trang sau 2s
            setTimeout(() => {
                navigate('/cashier');
            }, 2000);

        } catch (err) {
            console.error("Lỗi khi lưu chỉ số:", err);
            toast.error(err.response?.data?.message || "Lỗi khi lưu chỉ số. Vui lòng thử lại.", {
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
                <span className="text-gray-500 text-lg">Đang tải thông tin xác nhận...</span>
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
                    <ArrowLeft size={20} className="text-gray-600"/>
                </button>
                <div>
                   <h1 className="text-2xl font-bold text-gray-800 mb-1">Xác Nhận Chỉ Số</h1>
                   <p className="text-sm text-gray-600">Kiểm tra thông tin trước khi gửi cho bộ phận Kế toán.</p>
               </div>
           </div>

           {/* Nếu lỗi tải dữ liệu quan trọng, hiện thông báo và nút quay lại */}
           {!confirmationData && !loading && (
                <div className="bg-white p-8 text-center rounded-lg shadow">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy dữ liệu hợp đồng</h3>
                    <p className="text-gray-500 mb-6">Có thể mã đồng hồ không đúng hoặc chưa được lắp đặt.</p>
                    <button 
                        onClick={() => navigate('/cashier/scan')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Quay lại trang Scan
                    </button>
                </div>
           )}

            {/* Box Xác nhận */}
            {confirmationData && physicalMeterId && currentReading !== undefined && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 space-y-6">
                    
                    {/* Thông tin Hợp đồng */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Thông Tin Hợp Đồng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-700">
                            <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                <span className="block text-xs text-gray-500 uppercase font-semibold">Mã Hợp đồng</span>
                                <span className="text-base font-medium text-gray-900">{confirmationData.contractNumber || 'N/A'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                <span className="block text-xs text-gray-500 uppercase font-semibold">Khách hàng</span>
                                <span className="text-base font-medium text-gray-900">{confirmationData.customerName || 'N/A'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border border-gray-100 md:col-span-2">
                                <span className="block text-xs text-gray-500 uppercase font-semibold">Địa chỉ lắp đặt</span>
                                <span className="text-base font-medium text-gray-900">{confirmationData.customerAddress || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin Chỉ số */}
                    <div>
                         <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-600" />
                            Thông Tin Chỉ Số
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Chỉ số cũ */}
                            <div className="flex flex-col justify-center items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-sm text-gray-500 mb-1">Chỉ số cũ</span>
                                <span className="text-xl font-bold text-gray-700">{confirmationData.previousReading ?? 'N/A'}</span>
                                <span className="text-xs text-gray-400 mt-1">m³</span>
                            </div>
                            
                            {/* Chỉ số mới */}
                            <div className="flex flex-col justify-center items-center p-4 bg-blue-50 rounded-lg border border-blue-200 ring-2 ring-blue-100">
                                <span className="text-sm text-blue-600 mb-1 font-semibold">Chỉ số mới (Vừa nhập)</span>
                                <span className="text-2xl font-extrabold text-blue-700">{currentReading ?? 'N/A'}</span>
                                <span className="text-xs text-blue-400 mt-1">m³</span>
                            </div>

                             {/* Tiêu thụ */}
                             <div className="flex flex-col justify-center items-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <span className="text-sm text-green-600 mb-1 font-semibold">Tiêu thụ (Tạm tính)</span>
                                <span className="text-2xl font-extrabold text-green-700">
                                     { (typeof currentReading === 'number' && typeof confirmationData.previousReading === 'number')
                                        ? (currentReading - confirmationData.previousReading).toFixed(2)
                                        : 'N/A'
                                     }
                                </span>
                                <span className="text-xs text-green-500 mt-1">m³</span>
                            </div>
                        </div>
                    </div>

                    {/* Ô Ghi chú */}
                    <div>
                        <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-700">Ghi Chú (Nếu có sự cố)</label>
                        <textarea
                            id="notes"
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ví dụ: Đồng hồ quay ngược, mặt kính mờ, vắng nhà..."
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Nút Gửi */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handlePreSubmit} // Mở Modal
                            disabled={submitting}
                            className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition-all transform active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                             {submitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                             ) : (
                                <Save size={18} className="mr-2" />
                             )}
                             {submitting ? 'Đang gửi...' : 'Xác Nhận & Gửi Kế Toán'}
                        </button>
                    </div>
                </div>
            )}

            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận gửi chỉ số"
                message={`Bạn có chắc chắn muốn gửi chỉ số [${currentReading}] cho mã đồng hồ [${physicalMeterId}] không?`}
                isLoading={submitting}
            />
        </div>
    );
}

export default ReadingConfirmation;