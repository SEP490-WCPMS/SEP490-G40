// src/components/Customer/QRCode/InvoiceQRCode.jsx
import React from 'react';

function InvoiceQRCode({ invoice }) {
    
    // Lấy từ .env hoặc config
    const BANK_ID = "970418"; // BIDV
    const ACCOUNT_NO = "4271015210"; 
    const ACCOUNT_NAME = "CONG TY CAP NUOC PHU THO"; 
    const TEMPLATE = "compact2"; // Mẫu giao diện QR (compact, qr_only, print)

    // Tạo URL Quick Link của VietQR
    // Cấu trúc: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
    
    // 1. Lấy mã hóa đơn (VD: "DV1112025")
    const content = invoice.invoiceNumber;

    // 2. Dùng encodeURIComponent để mã hóa chuỗi này một cách an toàn cho URL
    // Nó sẽ giữ lại dấu gạch ngang (-) và xử lý các ký tự đặc biệt khác nếu có.
    const encodedContent = encodeURIComponent(content);
    
    // 3. Tạo URL Quick Link của VietQR
    const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${invoice.totalAmount}&addInfo=${encodedContent}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;


    return (
        <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Quét mã để thanh toán</h4>
            
            {/* Hiển thị ảnh QR được tạo tự động từ API */}
            <img 
                src={qrUrl} 
                alt="Mã QR Thanh Toán" 
                className="w-full max-w-[300px] object-contain"
                // Thêm key để React tải lại ảnh nếu HĐ thay đổi (dùng cho web app)
                key={invoice.id} 
            />
            
            <div className="text-center mt-3 text-sm">
                <p>Số tiền: <strong className="text-red-600 text-base">{invoice.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
                {/* Hiển thị nội dung CHÍNH XÁC mà app ngân hàng sẽ thấy */}
                <p>Nội dung: <strong>{content}</strong></p>
            </div>
        </div>
    );
}

export default InvoiceQRCode;