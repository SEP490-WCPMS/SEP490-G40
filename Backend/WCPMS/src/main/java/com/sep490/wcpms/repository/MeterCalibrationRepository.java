package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterCalibration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page; // <-- THÊM
import org.springframework.data.domain.Pageable; // <-- THÊM
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface MeterCalibrationRepository extends JpaRepository<MeterCalibration, Integer> {
    // JpaRepository đã cung cấp hàm save()

    // --- THÊM HÀM MỚI ---
    /**
     * Tìm tất cả các bản ghi kiểm định (Bảng 14)
     * 1. Đã có chi phí (cost > 0)
     * 2. Chưa được gán Hóa đơn (invoice_id IS NULL)
     */
    @Query("SELECT cal FROM MeterCalibration cal " +
            "WHERE cal.invoice IS NULL " +
            "AND cal.calibrationCost > 0")
    Page<MeterCalibration> findUnbilledFees(Pageable pageable);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /**
     * Tìm bản ghi Phí (Bảng 14) dựa trên Hóa đơn (Bảng 17).
     * Dùng để "mở khóa" (set invoice_id = NULL) khi Kế toán Hủy Hóa đơn.
     */
    Optional<MeterCalibration> findByInvoice(Invoice invoice);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /**
     * Đếm số lượng phí dịch vụ (Bảng 14) chưa lập hóa đơn.
     */
    @Query("SELECT COUNT(cal) FROM MeterCalibration cal " +
            "WHERE cal.invoice IS NULL " +
            "AND cal.calibrationCost > 0")
    long countUnbilledFees();
    // --- HẾT PHẦN THÊM ---
}

