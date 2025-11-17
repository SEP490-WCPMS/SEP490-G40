package com.sep490.wcpms.repository;

import com.sep490.wcpms.dto.dashboard.DailyReadingCountDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.MeterReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReading, Integer> {

    /**
     * Tìm bản ghi chỉ số CUỐI CÙNG (mới nhất) của một Hợp đồng (MeterInstallation)
     * để lấy 'current_reading' (sẽ trở thành 'previous_reading' của lần này)
     */
    Optional<MeterReading> findTopByMeterInstallationOrderByReadingDateDesc(MeterInstallation meterInstallation);

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Đếm số chỉ số đã ghi bởi 1 Thu ngân vào 1 ngày cụ thể.
     */
    long countByReaderAndReadingDate(Account reader, LocalDate readingDate);

    /**
     * Thống kê số lượng ghi số (cho Biểu đồ)
     */
    @Query("SELECT new com.sep490.wcpms.dto.dashboard.DailyReadingCountDTO(mr.readingDate, COUNT(mr.id)) " +
            "FROM MeterReading mr " +
            "WHERE mr.reader = :reader " +
            "AND mr.readingDate BETWEEN :startDate AND :endDate " +
            "GROUP BY mr.readingDate " +
            "ORDER BY mr.readingDate ASC")
    List<DailyReadingCountDTO> getDailyReadingCountReport(
            @Param("reader") Account reader,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    // --- HẾT PHẦN THÊM ---
}