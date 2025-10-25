package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterMeter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WaterMeterRepository extends JpaRepository<WaterMeter, Integer> {
    // Tự động có findById()
    /** THÊM HÀM NÀY: Tìm đồng hồ bằng mã (số serial) */
    Optional<WaterMeter> findByMeterCode(String meterCode);
}