package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.AiScanLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiScanLogRepository extends JpaRepository<AiScanLog, Integer> {
    // Không cần hàm gì thêm
}