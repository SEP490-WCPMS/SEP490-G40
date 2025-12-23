package com.sep490.wcpms.repository;

import com.sep490.wcpms.dto.dashboard.DailyReadingCountDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.MeterReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    /**
     * Lấy danh sách các bản ghi đọc số đã HOÀN THÀNH (COMPLETED)
     * và CHƯA được liên kết với bất kỳ hóa đơn nào (chưa được lập HĐ).
     */
    @Query("SELECT mr FROM MeterReading mr " +
            "WHERE mr.readingStatus = com.sep490.wcpms.entity.MeterReading.ReadingStatus.COMPLETED " +
            "AND mr.consumption > 0" +
            "AND NOT EXISTS (SELECT 1 FROM Invoice i WHERE i.meterReading = mr)")
    Page<MeterReading> findCompletedReadingsNotBilled(Pageable pageable);

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

//    // ========== Query MỚI (cho auto-assign) ==========
//    /**
//     * Tìm các meter_readings:
//     * - Status = COMPLETED
//     * - Được assign cho accountingStaffId
//     * - Tiêu thụ > 0 (consumption > 0)
//     * - Chưa có invoice (NOT EXISTS trong bảng invoices với meter_reading_id)
//     */
//    @Query("SELECT mr FROM MeterReading mr " +
//           "WHERE mr.readingStatus = com.sep490.wcpms.entity.MeterReading.ReadingStatus.COMPLETED " +
//           "AND mr.accountingStaff.id = :accountingStaffId " +
//           "AND mr.consumption > 0" +
//           "AND NOT EXISTS (" +
//           "    SELECT 1 FROM Invoice inv " +
//           "    WHERE inv.meterReading.id = mr.id" +
//           ")")
//    Page<MeterReading> findCompletedReadingsNotBilledByAccountingStaff(
//            @Param("accountingStaffId") Integer accountingStaffId,
//            Pageable pageable
//    );
    // --- TÍCH HỢP CẢ LOGIC GÁN STAFF VÀ SEARCH ---
    @Query("SELECT mr FROM MeterReading mr " +
            "JOIN mr.meterInstallation mi " +
            "JOIN mi.waterMeter wm " +
            "LEFT JOIN mi.waterServiceContract wsc " +
            "LEFT JOIN wsc.customer c " +
            "WHERE mr.readingStatus = com.sep490.wcpms.entity.MeterReading.ReadingStatus.COMPLETED " +
            // 1. GIỮ NGUYÊN LOGIC CŨ: Phải đúng là Staff đang đăng nhập
            "AND mr.accountingStaff.id = :staffId " +
            "AND mr.consumption > 0 " +
            "AND NOT EXISTS (SELECT 1 FROM Invoice inv WHERE inv.meterReading.id = mr.id) " +
            // 2. THÊM LOGIC MỚI: Nếu có keyword thì lọc, không thì lấy hết
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(wm.meterCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(c.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(c.address) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<MeterReading> searchPendingReadings(
            @Param("staffId") Integer staffId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * Đếm số chỉ số đã đọc (COMPLETED) được gán cho Kế toán này nhưng chưa lập hóa đơn.
     */
    @Query("SELECT COUNT(mr) FROM MeterReading mr " +
            "WHERE mr.readingStatus = com.sep490.wcpms.entity.MeterReading.ReadingStatus.COMPLETED " +
            "AND mr.accountingStaff.id = :staffId " + // <--- QUAN TRỌNG: Lọc theo staff
            "AND mr.consumption > 0 " +
            "AND NOT EXISTS (SELECT 1 FROM Invoice i WHERE i.meterReading = mr)")
    long countPendingWaterBillsByStaff(@Param("staffId") Integer staffId);
}