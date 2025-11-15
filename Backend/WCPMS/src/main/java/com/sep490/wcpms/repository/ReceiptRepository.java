package com.sep490.wcpms.repository;

import com.sep490.wcpms.dto.dashboard.DailyRevenueDTO;
import com.sep490.wcpms.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Integer> {
    // (Không cần hàm tùy chỉnh)

    // --- THÊM HÀM MỚI ---
    /**
     * Tính tổng doanh thu (paymentAmount) từ Bảng 19 (Receipts),
     * nhóm theo ngày (paymentDate) và lọc trong một khoảng thời gian.
     */
    @Query("SELECT new com.sep490.wcpms.dto.dashboard.DailyRevenueDTO(r.paymentDate, SUM(r.paymentAmount)) " +
            "FROM Receipt r " +
            "WHERE r.paymentDate BETWEEN :startDate AND :endDate " +
            "GROUP BY r.paymentDate " +
            "ORDER BY r.paymentDate ASC")
    List<DailyRevenueDTO> getDailyRevenueReport(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    // --- HẾT PHẦN THÊM ---
}