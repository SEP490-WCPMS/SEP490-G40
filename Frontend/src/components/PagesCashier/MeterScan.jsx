import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { scanMeterImage } from "../Services/apiCashierStaff"; // Đảm bảo đường dẫn đúng
import { Camera, RefreshCw, Loader2, AlertCircle } from 'lucide-react'; // Import icons

// Không cần import CSS riêng nếu bạn đã cấu hình Tailwind đúng
// import "./MeterScan.css";

function MeterScan() {
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false); // State cho spinner nhận diện
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State lưu kết quả AI/người dùng sửa
    const [formData, setFormData] = useState({
        reading: '',
        meterId: '' // Đây là MÃ ĐỒNG HỒ (meter_code)
    });

    // State lưu dữ liệu gốc để gửi log
    const [logData, setLogData] = useState({
        aiDetectedReading: null,
        aiDetectedMeterId: null,
        scanImageBase64: null
    });

    // Hàm mở camera và xử lý ảnh
    const handleOpenCamera = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*;capture=camera"; // Ưu tiên camera sau
        input.capture = "environment";

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Hiển thị ảnh xem trước
            const imageURL = URL.createObjectURL(file);
            setImagePreview(imageURL);
            setError(null); // Reset lỗi cũ
            setLoadingAI(true); // Bật spinner
            setFormData({ reading: '', meterId: '' }); // Reset form cũ
            setLogData({ aiDetectedReading: null, aiDetectedMeterId: null, scanImageBase64: null }); // Reset log cũ

            // Đọc file thành base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64WithHeader = reader.result;
                    const base64 = base64WithHeader.split(",")[1];

                    // Gọi API Scan
                    const response = await scanMeterImage(base64WithHeader);
                    const aiResult = response.data;

                    // Cập nhật form với kết quả AI
                    setFormData({
                        reading: aiResult.reading || '',
                        meterId: aiResult.meterId || ''
                    });

                    // Lưu dữ liệu gốc cho log
                    setLogData({
                        aiDetectedReading: aiResult.reading,
                        aiDetectedMeterId: aiResult.meterId,
                        scanImageBase64: base64
                    });

                } catch (err) {
                    console.error("Lỗi khi gửi ảnh:", err);
                    setError("Đã xảy ra lỗi khi nhận diện ảnh. Vui lòng thử lại.");
                    setImagePreview(null); // Ẩn ảnh nếu lỗi
                } finally {
                    setLoadingAI(false); // Tắt spinner
                }
            };
            reader.onerror = () => { // Xử lý lỗi đọc file
                setError("Không thể đọc được file ảnh.");
                setLoadingAI(false);
                setImagePreview(null);
            };
            reader.readAsDataURL(file);
        };
        input.click(); // Mở cửa sổ chọn file/camera
    };

    // Hàm xử lý khi người dùng nhập liệu vào form (thủ công)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
        
        // QUAN TRỌNG: Nếu người dùng gõ tay (không chụp ảnh)
        // chúng ta phải reset logData để đảm bảo ảnh là null
        // (Tránh trường hợp chụp ảnh, rồi lại xóa đi nhập tay)
        if (imagePreview) {
             setImagePreview(null); // Ẩn ảnh
             setLogData({ // Reset log AI
                aiDetectedReading: null,
                aiDetectedMeterId: null,
                scanImageBase64: null // Đặt ảnh về NULL
             });
        }
    };

    // Hàm xử lý khi nhấn nút "Xác nhận & Xem Hợp đồng"
    const handleSubmit = () => {
        // Kiểm tra input
        if (!formData.meterId || formData.reading === '') { // Cho phép chỉ số 0
            setError("Vui lòng nhập Mã Đồng Hồ và Chỉ Số Mới.");
            return;
        }
        // Nếu người dùng nhập tay (imagePreview = null),
        // logData.scanImageBase64 sẽ là null (đúng ý chúng ta)
        
        // Nếu người dùng chụp ảnh (imagePreview tồn tại),
        // logData.scanImageBase64 sẽ có giá trị (cũng đúng)

        // Chuyển sang trang Xác nhận, gửi kèm state
        navigate('/cashier/submit-reading', {
            state: {
                physicalMeterId: formData.meterId, // Mã đồng hồ người dùng xác nhận
                currentReading: formData.reading,  // Chỉ số người dùng xác nhận
                ...logData, // Dữ liệu AI gốc và ảnh base64
                userCorrectedMeterIdText: formData.meterId // Lưu lại ID người dùng xác nhận cho log
            }
        });
    };

    return (
        // Bố cục nền chung giống Dashboard
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Ghi Chỉ Số Đồng Hồ</h1>
                    <p className="text-sm text-gray-600">Sử dụng camera để quét hoặc nhập thủ công chỉ số và mã đồng hồ.</p>
                </div>
                 {/* Có thể thêm nút Làm mới/Chụp lại nếu muốn */}
                {/* Nút reset/chụp lại */}
                <button
                    onClick={handleOpenCamera}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                    disabled={loadingAI}
                >
                    <Camera size={16} className="mr-2" />
                    {imagePreview ? 'Chụp lại' : 'Mở Camera (Hỗ trợ AI)'}
                </button>
                 {/* <button onClick={handleOpenCamera} className="...">Chụp Lại</button> */}
            </div>

             {/* Hiển thị lỗi (nếu có) */}
             {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* --- GỘP BƯỚC 1 VÀ 2 LÀM MỘT --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CỘT 1: NHẬP LIỆU (LUÔN HIỂN THỊ) */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                    <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                        Xác Nhận Thông Tin
                    </h2>
                    
                    {/* Thông báo Loading AI */}
                    {loadingAI && (
                        <div className="flex items-center text-gray-500 p-3 bg-blue-50 rounded-md">
                            <Loader2 size={18} className="animate-spin mr-3 text-blue-600" />
                            Đang nhận diện... Vui lòng chờ.
                        </div>
                    )}
                    
                    {/* Form Nhập/Sửa */}
                    <div className="space-y-4">
                        {/* Trường Mã Đồng Hồ */}
                        <div>
                            <label htmlFor="meterId" className="block mb-1.5 text-sm font-medium text-gray-700">Mã Đồng Hồ (Mã vạch / Serial) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="meterId"
                                name="meterId"
                                value={formData.meterId}
                                onChange={handleChange}
                                placeholder="Nhập mã đồng hồ"
                                required
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                            />
                            {logData.aiDetectedMeterId && formData.meterId !== logData.aiDetectedMeterId && (
                                <p className="text-xs text-orange-600 mt-1">AI phát hiện: {logData.aiDetectedMeterId}</p>
                            )}
                        </div>

                        {/* Trường Chỉ Số Mới */}
                        <div>
                            <label htmlFor="reading" className="block mb-1.5 text-sm font-medium text-gray-700">Chỉ Số Mới (m³) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                step="0.01" // Cho phép số thập phân
                                id="reading"
                                name="reading"
                                value={formData.reading}
                                onChange={handleChange}
                                placeholder="Nhập chỉ số mới"
                                required
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                            />
                            {logData.aiDetectedReading && formData.reading !== logData.aiDetectedReading && (
                                <p className="text-xs text-orange-600 mt-1">AI phát hiện: {logData.aiDetectedReading}</p>
                            )}
                        </div>
                    </div>

                    {/* Nút Submit */}
                    <div className="pt-4 border-t">
                        <button
                            onClick={handleSubmit}
                            disabled={loadingAI} // Không cho bấm khi AI đang chạy
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            Xác nhận & Xem Hợp đồng
                        </button>
                    </div>
                </div>
                
                {/* CỘT 2: ẢNH XEM TRƯỚC */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                     <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                        Ảnh đã chụp
                    </h2>
                    {imagePreview ? (
                        <img src={imagePreview} alt="Ảnh đồng hồ" className="w-full h-auto rounded border border-gray-300 shadow-sm" />
                    ) : (
                        <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500">Chưa có ảnh chụp.</p>
                        </div>
                    )}
                </div>

            </div>
            {/* --- HẾT PHẦN GỘP --- */}
        </div>
    );
}

export default MeterScan;