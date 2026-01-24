package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho thao tác tạo tài khoản Guest hàng loạt
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BulkCreateGuestAccoutResponseDTO {
    private int successCount; // Số lượng thành công
    private int failureCount; // Số lượng thất bại
    private String message;   // Thông báo tổng hợp
}

