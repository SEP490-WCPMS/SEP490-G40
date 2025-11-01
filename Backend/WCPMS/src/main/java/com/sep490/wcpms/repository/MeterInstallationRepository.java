package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.WaterMeter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeterInstallationRepository extends JpaRepository<MeterInstallation, Integer> {
    // Không cần thêm phương thức tùy chỉnh
    Optional<MeterInstallation> findByContract(Contract contract);

    /** THÊM HÀM NÀY: Tìm bản ghi lắp đặt bằng đối tượng Đồng hồ */
    // Giả định một đồng hồ chỉ được lắp 1 lần (hoặc tìm bản mới nhất)
    Optional<MeterInstallation> findByWaterMeter(WaterMeter waterMeter);

    // HÀM MỚI: Tìm bản ghi lắp đặt (mới nhất) dựa trên đối tượng WaterMeter
    Optional<MeterInstallation> findTopByWaterMeterOrderByInstallationDateDesc(WaterMeter waterMeter);
}