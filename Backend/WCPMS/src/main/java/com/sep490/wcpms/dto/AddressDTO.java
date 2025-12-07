package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressDTO {

    private Integer id;
    private Integer customerId;
    private String customerName;

    // Địa chỉ chi tiết
    private String street; // Số nhà, tên đường
    private Integer wardId;
    private String wardName;
    private String districtName;
    private String provinceName;
    private String address; // Địa chỉ đầy đủ

    // Metadata
    private Integer isActive; // 1: Đang dùng, 0: Không dùng nữa
    private String notes;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

