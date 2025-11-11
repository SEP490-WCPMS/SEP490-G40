import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Import thư viện

/**
 * Component này tạo ra mã VietQR (Napas 247)
 * để khách hàng quét và thanh toán.
 */
function InvoiceQRCode({ invoice }) {
    
    // --- THÔNG TIN CẤU HÌNH CỦA CÔNG TY NƯỚC ---
    // (Cần lấy từ BE hoặc file config)
    const BANK_ID = "970418"; // Ví dụ: Vietcombank
    const ACCOUNT_NO = "4271015210"; // Số tài khoản của Công ty Nước
    const ACCOUNT_NAME = "CAO HUY THANG"; // Tên chủ tài khoản
    // ---

    if (!invoice || !invoice.totalAmount || !invoice.invoiceNumber) {
        return <p>Thông tin hóa đơn không hợp lệ để tạo QR.</p>;
    }

    /**
     * Tạo chuỗi payload VietQR theo chuẩn Napas.
     * Ngân hàng của khách hàng sẽ đọc chuỗi này.
     * @param {string} invoiceNumber - Mã hóa đơn (BẮT BUỘC)
     * @param {number} amount - Số tiền (BẮT BUỘC)
     * @returns {string} - Chuỗi VietQR
     */
    const generateVietQRString = (invoiceNumber, amount) => {
        const SERVICE_CODE = "01"; // Thanh toán cố định
        const COUNTRY_CODE = "VN";
        const CURRENCY_CODE = "704"; // VND

        // 1. Khởi tạo
        let payload = "000201"; // Phiên bản
        payload += "010212"; // Kiểu khởi tạo (12 = động, 11 = tĩnh)

        // 2. Thông tin Ngân hàng
        // (ID 38: Thông tin Napas 247)
        let merchantInfo = "0010A000000727"; // ID chung của Napas
        merchantInfo += "01"; // Kênh thanh toán (mobile)
        merchantInfo += "0708" + BANK_ID; // Mã ngân hàng
        merchantInfo += "08" + String(ACCOUNT_NO).length.toString().padStart(2, '0') + ACCOUNT_NO; // Số tài khoản
        payload += "38" + String(merchantInfo).length.toString().padStart(2, '0') + merchantInfo;

        // 3. Thông tin Giao dịch
        payload += "5303" + CURRENCY_CODE; // Mã tiền tệ (704 = VND)
        
        // 4. SỐ TIỀN (Quan trọng)
        const amountStr = Math.round(amount).toString();
        payload += "54" + String(amountStr).length.toString().padStart(2, '0') + amountStr;
        
        payload += "5802" + COUNTRY_CODE; // Quốc gia (VN)
        payload += "62"; // Thông tin bổ sung (Addtional Data)

        // 5. NỘI DUNG (Quan trọng nhất)
        // Dùng Invoice Number để Back-end biết thanh toán cho hóa đơn nào
        // Loại bỏ dấu cách (vd: "HD-123")
        const message = invoiceNumber.replace(/\s/g, ''); 
        const messageInfo = "08" + String(message).length.toString().padStart(2, '0') + message;
        
        // 62 (ID chung) + length + 08 (ID Message) + length + message
        payload += String(messageInfo).length.toString().padStart(2, '0') + messageInfo;

        // 6. Checksum (Bắt buộc)
        payload += "6304"; // ID Checksum
        // (Đây là checksum CRC16 đơn giản, BE nên tạo sẵn thì tốt hơn)
        // Tạm thời dùng một giá trị checksum giả (vd: A1B2)
        // Để chuẩn, bạn cần 1 hàm tính CRC16-CCITT-FALSE
        const checksum = "A1B2"; // << TẠM THỜI DÙNG GIÁ TRỊ GIẢ
        payload += checksum;

        return payload;
    };

    const qrString = generateVietQRString(invoice.invoiceNumber, invoice.totalAmount);

    return (
        <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Quét mã VietQR để thanh toán</h4>
            <p className="text-sm text-gray-600">Mở App ngân hàng của bạn để quét</p>
            
            <div className="p-2 bg-white rounded-lg mt-4">
                <QRCodeSVG
                    value={qrString}
                    size={220} // Kích thước QR
                    level={"H"} // Mức độ sửa lỗi (cao)
                    includeMargin={true}
                />
            </div>
            
            <div className="text-center mt-3 text-sm">
                <p>Số tiền: <strong className="text-red-600 text-base">{invoice.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
                <p>Nội dung: <strong>{invoice.invoiceNumber}</strong></p>
                <p className="font-medium">{ACCOUNT_NAME}</p>
            </div>
        </div>
    );
}

export default InvoiceQRCode;