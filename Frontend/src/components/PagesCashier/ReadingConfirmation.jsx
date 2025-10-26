import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getReadingConfirmationDataByMeterCode, saveNewReading } from '../Services/apiService'; // Đảm bảo đường dẫn đúng
import { ArrowLeft } from 'lucide-react'; // Icon quay lại

function ReadingConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy dữ liệu từ state của trang Scan
    const {
        physicalMeterId,
        currentReading,
        aiDetectedReading,
        aiDetectedMeterId,
        scanImageBase64,
        userCorrectedMeterIdText
    } = location.state || {}; // Lấy state an toàn

    const [confirmationData, setConfirmationData] = useState(null); // Dữ liệu HĐ và chỉ số cũ từ API
    const [loading, setLoading] = useState(true); // Loading khi fetch dữ liệu ban đầu
    const [submitting, setSubmitting] = useState(false); // Loading khi nhấn nút gửi
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState(""); // State cho ô ghi chú

    // Fetch dữ liệu xác nhận khi component mount hoặc dữ liệu từ state thay đổi
    useEffect(() => {
        // Kiểm tra dữ liệu đầu vào
        if (!physicalMeterId || currentReading === undefined || currentReading === null) {
            setError("Dữ liệu đọc số không hợp lệ. Vui lòng quay lại trang Scan và thử lại.");
            setLoading(false);
            return; // Dừng nếu thiếu dữ liệu quan trọng
        }

        setLoading(true); // Bắt đầu loading
        setError(null); // Reset lỗi cũ
        getReadingConfirmationDataByMeterCode(physicalMeterId)
            .then(response => {
                setConfirmationData(response.data); // Lưu dữ liệu HĐ và chỉ số cũ
            })
            .catch(err => {
                console.error("Lỗi khi lấy dữ liệu xác nhận:", err);
                setError(err.response?.data?.message || "Lỗi tải dữ liệu hợp đồng. Mã đồng hồ có đúng và đã được lắp đặt chưa?");
            })
            .finally(() => setLoading(false)); // Kết thúc loading

    // Chỉ fetch lại nếu physicalMeterId thay đổi (currentReading không cần)
    }, [physicalMeterId]);

    // Hàm xử lý khi nhấn nút "Xác Nhận & Gửi Kế Toán"
    const handleSubmitReading = () => {
        // Kiểm tra lại confirmationData trước khi gửi
        if (!confirmationData) {
            setError("Chưa tải được thông tin hợp đồng để gửi.");
            return;
        }
        if (!window.confirm("Bạn chắc chắn muốn gửi chỉ số này cho bộ phận Kế toán?")) return;

        setSubmitting(true); // Bắt đầu submitting
        setError(null); // Reset lỗi cũ

        // Chuẩn bị dữ liệu gửi đi (DTO)
        const saveData = {
            meterInstallationId: confirmationData.meterInstallationId,
            previousReading: confirmationData.previousReading,
            currentReading: currentReading, // Chỉ số mới người dùng xác nhận
            notes: notes, // Ghi chú người dùng nhập
            aiDetectedReading: aiDetectedReading,
            aiDetectedMeterId: aiDetectedMeterId,
            userCorrectedMeterIdText: userCorrectedMeterIdText,
            scanImageBase64: scanImageBase64
        };

        // Gọi API lưu
        saveNewReading(saveData)
            .then(() => {
                alert("Đã gửi chỉ số thành công!");
                navigate('/cashier'); // Quay về trang chủ Thu ngân (hoặc trang Scan)
            })
            .catch(err => {
                console.error("Lỗi khi lưu chỉ số:", err);
                setError(err.response?.data?.message || "Lỗi khi lưu chỉ số. Vui lòng thử lại.");
            })
            .finally(() => setSubmitting(false)); // Kết thúc submitting
    };

    // --- Loading State ---
    if (loading) {
        return (
            // Spinner toàn trang
            <div className="flex justify-center items-center h-[calc(100vh-100px)]">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-3 text-gray-500 text-lg">Đang tải thông tin xác nhận...</span>
            </div>
        );
    }

    // --- Render Component ---
    return (
        // Bố cục nền chung
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header của trang */}
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                {/* Nút Quay lại */}
                <button
                    onClick={() => navigate(-1)} // Quay lại trang Scan
                    className="p-2 rounded-full hover:bg-gray-100 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Quay lại"
                >
                    <ArrowLeft size={20} className="text-gray-600"/>
                </button>
                {/* Tiêu đề trang */}
                <div>
                   <h1 className="text-2xl font-bold text-gray-800 mb-1">Xác Nhận Chỉ Số</h1>
                   <p className="text-sm text-gray-600">Kiểm tra thông tin trước khi gửi cho bộ phận Kế toán.</p>
               </div>
           </div>

            {/* Hiển thị lỗi */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                    {/* Nút quay lại Scan nếu lỗi nghiêm trọng */}
                    {(!confirmationData || !physicalMeterId) && (
                         <button onClick={() => navigate('/cashier/scan')} className="mt-2 text-sm text-red-700 underline hover:text-red-900">
                              Quay lại trang Scan
                         </button>
                    )}
                </div>
            )}

            {/* Box Xác nhận (Chỉ hiển thị khi có confirmationData) */}
            {confirmationData && physicalMeterId && currentReading !== undefined && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                    {/* Thông tin Hợp đồng */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông Tin Hợp Đồng
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                            <p><strong>Mã Hợp đồng:</strong> {confirmationData.contractNumber || 'N/A'}</p>
                            <p><strong>Khách hàng:</strong> {confirmationData.customerName || 'N/A'}</p>
                            <p className="md:col-span-2"><strong>Địa chỉ:</strong> {confirmationData.customerAddress || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Thông tin Chỉ số */}
                    <div>
                         <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-4">
                            Thông Tin Chỉ Số
                        </h3>
                        <div className="space-y-2 text-sm">
                            {/* Chỉ số cũ */}
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <strong className="text-gray-600">Chỉ số cũ:</strong>
                                <span className="font-medium text-gray-800">{confirmationData.previousReading ?? 'N/A'} m³</span>
                            </div>
                            {/* Chỉ số mới */}
                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                <strong className="text-blue-700">Chỉ số mới:</strong>
                                <span className="font-bold text-blue-700 text-base">{currentReading ?? 'N/A'} m³</span>
                            </div>
                             {/* Tiêu thụ tạm tính */}
                             <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                <strong className="text-green-700">Tiêu thụ (tạm tính):</strong>
                                <span className="font-semibold text-green-700">
                                    {/* Tính toán an toàn, trả về 'N/A' nếu không tính được */}
                                    { (typeof currentReading === 'number' && typeof confirmationData.previousReading === 'number')
                                        ? (currentReading - confirmationData.previousReading).toFixed(2) + ' m³'
                                        : 'N/A'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ô Ghi chú */}
                    <div>
                        <label htmlFor="notes" className="block mb-1.5 text-sm font-medium text-gray-700">Ghi Chú (Nếu có)</label>
                        <textarea
                            id="notes"
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ví dụ: Đồng hồ quay chậm, vắng nhà, chỉ số bất thường..."
                            className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Nút Gửi */}
                    <div className="pt-4">
                        <button
                            onClick={handleSubmitReading}
                            className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-150 ease-in-out ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={submitting}
                        >
                             {submitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">...</svg> {/* Thêm SVG spinner */}
                                    Đang gửi...
                                </>
                             ) : 'Xác Nhận & Gửi Kế Toán'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReadingConfirmation;