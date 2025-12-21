package com.sep490.wcpms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO (Data Transfer Object) để nhận dữ liệu
 * từ Form "Tạo Hóa đơn Dịch vụ" của Kế toán.
 */
@Data
public class ServiceInvoiceCreateDTO {

    @NotNull
    private Integer calibrationId; // ID của Phí (Bảng 14)

    @NotNull
    private Integer customerId; // ID Khách hàng (Bảng 7)

    @NotNull
    private Integer contractId; // ID Hợp đồng Lắp đặt (Bảng 8)

    @NotNull
    private String invoiceNumber; // Số HĐ

    @NotNull
    private LocalDate invoiceDate;

    @NotNull
    private LocalDate dueDate; // Hạn thanh toán

    @NotNull
    private BigDecimal subtotalAmount; // Tiền

    @NotNull
    private BigDecimal vatAmount; // VAT

    @NotNull
    private BigDecimal totalAmount; // Tổng

    private String notes; // Ghi chú của Kế toán
}