package com.sep490.wcpms.repository;

import com.sep490.wcpms.dto.dashboard.DailyRevenueDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Integer> {

    // --- THÊM HÀM MỚI ---
    /**
     * Tính tổng tiền mặt (CASH) mà 1 Thu ngân đã thu trong 1 ngày.
     */
    @Query("SELECT SUM(r.paymentAmount) FROM Receipt r " +
            "WHERE r.cashier = :cashier " +
            "AND r.paymentDate = :date " +
            "AND r.paymentMethod = :method")
    BigDecimal sumAmountByCashierAndDateAndMethod(
            @Param("cashier") Account cashier,
            @Param("date") LocalDate date,
            @Param("method") Receipt.PaymentMethod method
    );
    // --- HẾT PHẦN THÊM ---
}