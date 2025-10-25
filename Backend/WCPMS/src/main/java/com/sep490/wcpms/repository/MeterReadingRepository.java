package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.MeterReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReading, Integer> {

    /**
     * Tìm bản ghi chỉ số CUỐI CÙNG (mới nhất) của một Hợp đồng (MeterInstallation)
     * để lấy 'current_reading' (sẽ trở thành 'previous_reading' của lần này)
     */
    Optional<MeterReading> findTopByMeterInstallationOrderByReadingDateDesc(MeterInstallation meterInstallation);
}