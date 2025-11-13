package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Integer> {
    // (Không cần hàm tùy chỉnh)
}