package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterReading;

/**
 * Service nghiệp vụ dùng cho các loại THÔNG BÁO liên quan đến HÓA ĐƠN:
 *  - Hóa đơn tiền nước
 *  - Hóa đơn lắp đặt
 *  - Hóa đơn dịch vụ phát sinh
 *
 * Nhiệm vụ:
 *  - Gọi export PDF (InvoicePdfExportService)
 *  - Tạo bản ghi CustomerNotification (gán attachment_url)
 *  - Gọi CustomerNotificationEmailService.sendEmail(...)
 */
public interface InvoiceNotificationService {

    /**
     * Gửi thông báo + PDF cho hóa đơn TIỀN NƯỚC (gắn với MeterReading).
     *
     * @param invoice     hóa đơn tiền nước đã lưu DB.
     * @param reading     bản ghi đọc số gắn với hóa đơn (có thể null nếu bạn không dùng).
     */
    void sendWaterBillIssued(Invoice invoice, MeterReading reading);

    /**
     * Gửi thông báo + PDF cho hóa đơn LẮP ĐẶT ĐỒNG HỒ.
     *
     * @param invoice  hóa đơn lắp đặt đã lưu DB.
     * @param contract hợp đồng lắp đặt liên quan.
     */
    void sendInstallationInvoiceIssued(Invoice invoice, Contract contract);

    /**
     * Gửi thông báo + PDF cho hóa đơn DỊCH VỤ PHÁT SINH.
     *
     * @param invoice           hóa đơn dịch vụ phát sinh đã lưu DB.
     * @param serviceDescription mô tả dịch vụ (ví dụ: "Phí kiểm định đồng hồ nước").
     * @param vatRate           thuế suất VAT hiển thị (ví dụ: "5%" hoặc "8%").
     */
    void sendServiceInvoiceIssued(Invoice invoice, String serviceDescription, String vatRate);
}

