package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BulkInvoiceResponseDTO {
    private int successCount; // Số lượng tạo thành công
    private int failureCount; // Số lượng thất bại
    private String message;   // Thông báo tổng hợp (VD: "Đã tạo 50/50 hóa đơn")
}