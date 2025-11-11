package com.sep490.wcpms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO này chứa thông tin chi tiết đầy đủ của một Hóa đơn Dịch vụ,
 * bao gồm cả thông tin Hóa đơn (Bảng 17) và Phí gốc (Bảng 14).
 */
@Data
@NoArgsConstructor
public class AccountingInvoiceDetailDTO {

    /**
     * Thông tin trên Hóa đơn (Bảng 17)
     * (Số HĐ, Ngày, Tiền, Status...)
     */
    private InvoiceDTO invoice;

    /**
     * Thông tin Phí Gốc (Từ Bảng 14)
     * (Ai kiểm định, Ghi chú Kỹ thuật, Chi phí gốc...)
     */
    private CalibrationFeeDTO fee;
}