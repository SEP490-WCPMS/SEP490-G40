package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.MeterInstallation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeterInstallationRepository extends JpaRepository<MeterInstallation, Integer> {
    // Không cần thêm phương thức tùy chỉnh
    Optional<MeterInstallation> findByContract(Contract contract);
}