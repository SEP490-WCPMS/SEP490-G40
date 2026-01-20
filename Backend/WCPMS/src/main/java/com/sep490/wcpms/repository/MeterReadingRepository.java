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
    // Sử dụng JOIN FETCH để fetch địa chỉ từ bảng addresses
    @Query("SELECT DISTINCT mr FROM MeterReading mr " +
            "JOIN FETCH mr.meterInstallation mi " +
            "JOIN FETCH mi.waterMeter wm " +
            "LEFT JOIN FETCH mr.reader rd " +            // Fetch reader để tránh N+1
            "LEFT JOIN FETCH mr.accountingStaff accStaff " + // Fetch accounting staff
            "LEFT JOIN FETCH mi.waterServiceContract wsc " +
            "LEFT JOIN FETCH wsc.customer c " +
            "LEFT JOIN FETCH wsc.address wscAddr " +     // Địa chỉ từ WaterServiceContract
            "LEFT JOIN FETCH wscAddr.ward wscWard " +    // Ward của địa chỉ WSC
            "LEFT JOIN FETCH mi.contract ct " +          // Hợp đồng lắp đặt
            "LEFT JOIN FETCH ct.address ctAddr " +       // Địa chỉ từ Contract
            "LEFT JOIN FETCH ctAddr.ward ctWard " +      // Ward của địa chỉ Contract
            "LEFT JOIN FETCH mi.customer miCustomer " +  // Fallback: Customer từ MeterInstallation
            "WHERE mr.readingStatus = com.sep490.wcpms.entity.MeterReading.ReadingStatus.COMPLETED " +
            // 1. GIỮ NGUYÊN LOGIC CŨ: Phải đúng là Staff đang đăng nhập
            "AND mr.accountingStaff.id = :staffId " +
            "AND mr.consumption > 0 " +
            "AND NOT EXISTS (SELECT 1 FROM Invoice inv WHERE inv.meterReading.id = mr.id) " +
            // 2. THÊM LOGIC MỚI: Nếu có keyword thì lọc, không thì lấy hết
            // Search theo địa chỉ từ bảng addresses (wscAddr, ctAddr) thay vì từ customer cũ
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(wm.meterCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(c.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(wscAddr.street) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(ctAddr.street) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(c.address) LIKE LOWER(CONCAT('%', :keyword, '%')))")  // Giữ fallback cho customer cũ
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

    // Trong MeterReadingRepository.java

    @Query("SELECT mr FROM MeterReading mr " +
            "WHERE mr.meterInstallation.id = :installationId " +
            "AND mr.readingDate < :currentDate " +
            "ORDER BY mr.readingDate DESC")
    List<MeterReading> findPreviousReadings(
            @Param("installationId") Integer installationId,
            @Param("currentDate") LocalDate currentDate
    );

    /**
     * Tìm bản ghi đọc số mới nhất của 1 đồng hồ, NHƯNG loại trừ trạng thái cụ thể (ví dụ: DISPUTED).
     */
    Optional<MeterReading> findTopByMeterInstallationAndReadingStatusNotOrderByReadingDateDesc(
            MeterInstallation installation,
            MeterReading.ReadingStatus status
    );
}