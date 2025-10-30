import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { scanMeterImage } from "../Services/apiCashierStaff"; // Đảm bảo đường dẫn đúng
import { Camera, RefreshCw } from 'lucide-react'; // Import icons

// Không cần import CSS riêng nếu bạn đã cấu hình Tailwind đúng
// import "./MeterScan.css";

function MeterScan() {
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false); // State cho spinner nhận diện
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
            setLoading(true); // Bật spinner
            setFormData({ reading: '', meterId: '' }); // Reset form cũ
            setLogData({ aiDetectedReading: null, aiDetectedMeterId: null, scanImageBase64: null }); // Reset log cũ

            // Đọc file thành base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64WithHeader = reader.result;
                    const base64 = base64WithHeader.split(",")[1];

                    // Gọi API Scan
                    const response = await scanMeterImage(base64);
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
                    setLoading(false); // Tắt spinner
                }
            };
            reader.onerror = () => { // Xử lý lỗi đọc file
                setError("Không thể đọc được file ảnh.");
                setLoading(false);
                setImagePreview(null);
            };
            reader.readAsDataURL(file);
        };
        input.click(); // Mở cửa sổ chọn file/camera
    };

    // Hàm xử lý khi người dùng nhập liệu vào form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Hàm xử lý khi nhấn nút "Xác nhận & Xem Hợp đồng"
    const handleSubmit = () => {
        // Kiểm tra input
        if (!formData.meterId || formData.reading === '') { // Cho phép chỉ số 0
            alert("Vui lòng nhập Mã Đồng Hồ và Chỉ Số Mới.");
            return;
        }
        if (!logData.scanImageBase64) {
             alert("Vui lòng chụp ảnh đồng hồ trước.");
             return;
        }

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
                 {/* <button onClick={handleOpenCamera} className="...">Chụp Lại</button> */}
            </div>

             {/* Hiển thị lỗi (nếu có) */}
             {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Phần Chụp Ảnh và Xem Trước */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                 <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Bước 1: Chụp Ảnh Đồng Hồ</h2>
                 <button
                    onClick={handleOpenCamera}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                 >
                    <Camera size={18} className="mr-2" />
                    Mở Camera / Chọn Ảnh
                 </button>

                 {/* Hiển thị Spinner khi đang nhận diện */}
                 {loading && (
                    <div className="flex items-center text-gray-500 mt-4">
                        <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">...</svg> {/* Thêm SVG spinner */}
                        Đang nhận diện...
                    </div>
                 )}

                {/* Hiển thị ảnh xem trước */}
                {imagePreview && !loading && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Ảnh đã chụp:</p>
                        <img src={imagePreview} alt="Ảnh đồng hồ đã chụp" className="max-w-xs md:max-w-md rounded border border-gray-300 shadow-sm" />
                    </div>
                 )}
            </div>

            {/* Phần Nhập/Sửa Kết Quả */}
             {/* Chỉ hiển thị form này sau khi đã chụp ảnh (có imagePreview) và không còn loading */}
            {imagePreview && !loading && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
                     <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Bước 2: Xác Nhận Thông Tin</h2>
                     <p className="text-sm text-gray-600 mb-4">AI đã tự động điền kết quả. Vui lòng kiểm tra và chỉnh sửa nếu cần thiết.</p>

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
                                placeholder="AI sẽ điền hoặc tự nhập"
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
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
                                placeholder="AI sẽ điền hoặc tự nhập"
                                required
                                className="appearance-none block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Nút Submit */}
                    <div className="pt-4">
                         <button
                            onClick={handleSubmit}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                         >
                            Xác nhận & Xem Hợp đồng
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MeterScan;