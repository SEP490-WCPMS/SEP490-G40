// src/component/MeterScan.jsx
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import { scanMeterImage } from "../Services/apiService"; // <-- Import từ service
import "./MeterScan.css";

function MeterScan() {
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // <-- Hook để chuyển trang

  // State để lưu kết quả (cho phép chỉnh sửa)
  const [formData, setFormData] = useState({
    reading: '',
    meterId: ''
  });

  // --- THÊM STATE ĐỂ LƯU LOG ---
  const [logData, setLogData] = useState({
    aiDetectedReading: null,
    aiDetectedMeterId: null,
    scanImageBase64: null
  });

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
      setError(null);
      setLoading(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result.split(",")[1];
          // Gọi API từ service
          const response = await scanMeterImage(base64);
          const aiResult = response.data;
          
          // Cập nhật kết quả vào form
          setFormData({
             reading: aiResult.reading || '',
             meterId: aiResult.meterId || ''
          });

          // --- LƯU LẠI DỮ LIỆU GỐC ĐỂ GỬI LOG ---
          setLogData({
            aiDetectedReading: aiResult.reading,
            aiDetectedMeterId: aiResult.meterId,
            scanImageBase64: base64 // Lưu ảnh base64
          });
          // --- HẾT PHẦN LƯU LOG ---

        } catch (err) {
          console.error("Lỗi khi gửi ảnh:", err);
          setError("Đã xảy ra lỗi khi nhận diện ảnh.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Hàm xử lý khi người dùng tự gõ
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Hàm xử lý nút "Xem Hợp đồng"
  const handleSubmit = () => {
    if (!formData.meterId || !formData.reading) {
      alert("Vui lòng nhập ID Đồng hồ và Chỉ số m³.");
      return;
    }
    
    // Chuyển sang trang Xác nhận, mang theo dữ liệu
    navigate('/cashier/submit-reading', { 
        state: { 
            physicalMeterId: formData.meterId, // Gửi ID (logic của bạn: meterId = contractId)
            currentReading: formData.reading, // Gửi Chỉ số mới
            // Dữ liệu Log (gốc)
            ...logData, // Gửi kèm aiDetectedReading, aiDetectedMeterId, scanImageBase64
            // Gửi ID đồng hồ mà người dùng SỬA
            userCorrectedMeterIdText: formData.meterId
        } 
    });
  };

  return (
    <div className="container">
      <h1 className="title">Ghi chỉ số đồng hồ (AI Scan)</h1>

      <button onClick={handleOpenCamera} className="button">
        1. Mở camera chụp đồng hồ
      </button>

      {loading && <p className="mt-4 text-gray-500 animate-pulse">⏳ Đang nhận diện...</p>}
      {error && <p className="error-message">{error}</p>}
      {imagePreview && <img src={imagePreview} alt="Ảnh đồng hồ" className="image" />}

      {/* Hiển thị kết quả dưới dạng ô nhập liệu để CHỈNH SỬA */}
      <div className="result-form">
        <div className="form-group">
          <label htmlFor="meterId">ID Đồng Hồ (Mã vạch / Serial)</label>
          <input
            type="text" // Đổi sang text vì meter_code có thể có chữ
            id="meterId"
            name="meterId"
            value={formData.meterId}
            onChange={handleChange}
            placeholder="AI sẽ điền hoặc tự nhập"
          />
        </div>
        <div className="form-group">
          <label htmlFor="reading">Chỉ Số Mới (m³)</label>
          <input
            type="number"
            id="reading"
            name="reading"
            value={formData.reading}
            onChange={handleChange}
            placeholder="AI sẽ điền hoặc tự nhập"
          />
        </div>
        
        <button onClick={handleSubmit} className="button-submit">
          2. Xác nhận & Xem Hợp đồng
        </button>
      </div>

    </div>
  );
}

export default MeterScan;