package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO rút gọn chỉ chứa thông tin cơ bản của Khách hàng
 * Dùng để Service Staff chọn khi tạo Ticket hộ.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor // Cần AllArgsConstructor để @Query(SELECT new...) hoạt động
public class CustomerSimpleDTO {
    private Integer id;
    private String customerName;
    private String customerCode;
}

