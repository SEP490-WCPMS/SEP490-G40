package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Contract;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractRequestStatusDTO {

    private Integer contractId;
    private String contractNumber; // Số hợp đồng (VD: "REQ-1-123456789")
    private LocalDate applicationDate; // Ngày gửi yêu cầu
    private String status; // Trạng thái: "PENDING", "APPROVED", ...
    private String notes; // Ghi chú mà khách hàng đã nhập

    // Hàm tiện ích để chuyển đổi từ Entity
    public ContractRequestStatusDTO(Contract entity) {
        this.contractId = entity.getId();
        this.contractNumber = entity.getContractNumber();
        this.applicationDate = entity.getApplicationDate();
        this.status = entity.getContractStatus().name(); // Lấy tên của Enum (VD: "PENDING")
        this.notes = entity.getNotes();
    }
}