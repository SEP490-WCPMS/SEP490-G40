package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.ReadingRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingRouteRepository extends JpaRepository<ReadingRoute, Integer> {
    Optional<ReadingRoute> findByRouteCode(String routeCode);
    List<ReadingRoute> findAllByStatus(ReadingRoute.Status status);
    /**
     * Tìm tất cả các tuyến đọc (Bảng 4) được gán cho một NV Thu ngân (Account).
     */
    List<ReadingRoute> findAllByAssignedReader(Account cashier);

    // --- THÊM HÀM MỚI ---
    /**
     * Tìm tuyến theo Người đọc VÀ Trạng thái (ACTIVE)
     */
    List<ReadingRoute> findByAssignedReaderAndStatus(Account assignedReader, ReadingRoute.Status status);

    // --- HÀM MỚI: KIỂM TRA NHÂN VIÊN DỊCH VỤ ---
    /**
     * Tìm các tuyến đọc (ACTIVE) mà nhân viên này đang tham gia.
     * Dùng @Query để join vào bảng trung gian serviceStaffs
     */
    @Query("SELECT r FROM ReadingRoute r JOIN r.serviceStaffs s WHERE s.id = :staffId AND r.status = 'ACTIVE'")
    List<ReadingRoute> findActiveRoutesByServiceStaffId(@Param("staffId") Integer staffId);
}

