package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.MeterCalibration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MeterCalibrationRepository extends JpaRepository<MeterCalibration, Integer> {
    // JpaRepository đã cung cấp hàm save()
}

