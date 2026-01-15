package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Invoice; // Import Enum
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO (Data Transfer Object) cho Bảng 17 (Invoices - Hóa đơn).
 * Dùng để hiển thị chi tiết Hóa đơn cho Kế toán, Khách hàng, hoặc Thu ngân.
 */
@Data
public class InvoiceDTO {

    private Integer id;
    private String invoiceNumber; // Số hóa đơn (vd: HD-123 hoặc DV-456)

    // --- Thông tin Khách hàng (Lấy từ Bảng 7) ---
    private Integer customerId;
    private String customerName;
    private String customerCode;
    private String customerAddress;
    private String customerPhone;
    private String customerEmail;

    // --- Thông tin Hợp đồng (Lấy từ Bảng 8 hoặc 9) ---
    private Integer contractId; // ID HĐ Lắp đặt (Bảng 8)
    // (Bạn có thể thêm serviceContractId nếu cần)

    // --- Thông tin Đọc số & Đồng hồ (THÊM MỚI Ở ĐÂY) ---
    private Integer meterReadingId;
    private String meterCode;           // <--- Mã đồng hồ
    private BigDecimal oldIndex;        // <--- Chỉ số cũ
    private BigDecimal newIndex;        // <--- Chỉ số mới
    private BigDecimal consumption;     // <--- Số khối tiêu thụ
    private String billingPeriod;       // <--- Kỳ ghi số (VD: 12/2025)

    // --- Thông tin Kỳ tính toán (Gốc của Invoice) ---
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal totalConsumption;

    // --- Thông tin Tiền ---
    private BigDecimal subtotalAmount; // Tiền nước (hoặc phí dịch vụ)
    private BigDecimal vatAmount;
    private BigDecimal environmentFeeAmount;
    private BigDecimal otherFees; // <-- Cột phí khác (nếu bạn dùng Cách 2)
    private BigDecimal latePaymentFee;
    private BigDecimal totalAmount; // Tổng cộng

    // --- Trạng thái ---
    private Invoice.PaymentStatus paymentStatus; // (PENDING, PAID, ...)
    private LocalDate invoiceDate; // Ngày lập HĐ
    private LocalDate dueDate; // Hạn thanh toán
    private LocalDate paidDate; // Ngày thanh toán (nếu có)

    // --- Nhân viên ---
    private String accountingStaffName; // Tên Kế toán lập HĐ

    private String evidenceImageBase64; // Ảnh bằng chứng (nếu có)
    private String receiptNumber;       // Số biên lai
    private String paymentMethod;       // Phương thức thanh toán
}