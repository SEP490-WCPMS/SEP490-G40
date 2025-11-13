package com.sep490.wcpms.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Sự kiện phát sinh khi KH tạo yêu cầu hợp đồng (Contract ở trạng thái DRAFT).
 * Lắng nghe với @TransactionalEventListener(phase = AFTER_COMMIT) để đảm bảo chỉ gửi sau khi commit thành công.
 */
@Getter
@AllArgsConstructor
public class ContractRequestCreatedEvent {
    private final Integer contractId;
    private final Integer customerId;
    private final String customerName;
    private final String contractNumber;
    private final LocalDateTime createdAt;
}

