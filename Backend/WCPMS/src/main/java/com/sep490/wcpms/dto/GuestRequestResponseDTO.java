package com.sep490.wcpms.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class GuestRequestResponseDTO {
    private Integer contractId;
    private String contractNumber;
    private String guestPhone;    // SĐT liên hệ
    private String guestAddress;  // Địa chỉ lắp đặt
    private String guestName;     // Tên (lấy từ Note)
    private LocalDate requestDate;
    private String status;
}