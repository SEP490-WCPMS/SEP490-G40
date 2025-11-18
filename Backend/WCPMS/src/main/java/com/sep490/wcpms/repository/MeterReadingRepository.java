package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.MeterReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReading, Integer> {

    /**
     * Tìm bản ghi chỉ số CUỐI CÙNG (mới nhất) của một Hợp đồng (MeterInstallation)
     * để lấy 'current_reading' (sẽ trở thành 'previous_reading' của lần này)
     */
    Optional<MeterReading> findTopByMeterInstallationOrderByReadingDateDesc(MeterInstallation meterInstallation);

    // ✨ THÊM HÀM MỚI NÀY ✨
    /**
     * Lấy danh sách các bản ghi đọc số đã HOÀN THÀNH (COMPLETED)
     * và CHƯA được liên kết với bất kỳ hóa đơn nào (chưa được lập HĐ).
     */
    @Query("SELECT mr FROM MeterReading mr " +
            "WHERE mr.readingStatus = com.sep490.wcpms.entity.MeterReading.ReadingStatus.COMPLETED " +
            "AND NOT EXISTS (SELECT 1 FROM Invoice i WHERE i.meterReading = mr)")
    Page<MeterReading> findCompletedReadingsNotBilled(Pageable pageable);
}