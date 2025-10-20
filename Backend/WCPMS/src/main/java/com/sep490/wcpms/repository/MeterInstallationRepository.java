package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.MeterInstallation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MeterInstallationRepository extends JpaRepository<MeterInstallation, Integer> {
    // Không cần thêm phương thức tùy chỉnh
}