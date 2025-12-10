package com.sep490.wcpms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AccountDTO {
    private Integer id;
    private String fullName;
    private Long workload;

    // === SỬA TẠI ĐÂY: Dùng 'Number' thay vì 'Long' cho tham số thứ 3 ===

    // Constructor dùng cho JPQL Query
    // Number sẽ tự động hứng được cả Long, Integer, BigInteger...
    public AccountDTO(Integer id, String fullName, Number workload) {
        this.id = id;
        this.fullName = fullName;
        // Chuyển đổi Number sang Long an toàn
        this.workload = (workload != null) ? workload.longValue() : 0L;
    }

    // Constructor 2 tham số (giữ nguyên cho các chỗ khác)
    public AccountDTO(Integer id, String fullName) {
        this.id = id;
        this.fullName = fullName;
        this.workload = 0L;
    }
}