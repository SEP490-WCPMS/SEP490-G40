import React, { useState } from "react";
import "./MeterScan.css";

function MeterScan() {
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

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
      setResult("");
      setLoading(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        console.log("Đã đọc file xong!");
        try {
          const base64 = reader.result.split(",")[1];
          console.log("Độ dài base64:", base64.length);
          const response = await fetch("http://192.168.1.106:8080/api/meter-scan/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });

          if (!response.ok) throw new Error(await response.text());
          const data = await response.json();
          setResult(data);
        } catch (error) {
          console.error("Lỗi khi gửi ảnh:", error);
          setResult("Đã xảy ra lỗi khi nhận diện ảnh.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  return (
    <div className="container">
      <h1 className="title">Quét số đồng hồ nước (AI Scan)</h1>

      <button onClick={handleOpenCamera} className="button">
        Mở camera chụp đồng hồ
      </button>

      {loading && <p className="mt-4 text-gray-500 animate-pulse">⏳ Đang nhận diện...</p>}

      {imagePreview && <img src={imagePreview} alt="Ảnh đồng hồ" className="image" />}

      {result && !loading && (
        <div className="result">
          <h2>Kết quả nhận diện:</h2>
          <p><strong>Số m³ nước:</strong> {result.reading || "(Không có)"}</p>
          <p><strong>ID đồng hồ:</strong> {result.meterId || "(Không có)"}</p>
        </div>
      )}
    </div>
  );
}

export default MeterScan;
