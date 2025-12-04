package com.sep490.wcpms.dto;

import com.fasterxml.jackson.annotation.JsonFormat; // <-- Thêm import này
import lombok.AllArgsConstructor; // <-- Thêm import này
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor; // <-- Thêm import này

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor // <-- QUAN TRỌNG: Cần thiết cho Jackson
@AllArgsConstructor // <-- Cần thiết khi dùng @Builder
public class WaterPriceAdminResponseDTO {
    private Integer id;
    private Integer priceTypeId;
    private String priceTypeName;
    private String typeName;
    private BigDecimal unitPrice;
    private BigDecimal environmentFee;
    private BigDecimal vatRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate effectiveDate;
    private String approvedBy;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

