package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterCalibration;
import com.sep490.wcpms.entity.WaterMeter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
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
    // SỬA HÀM NÀY: Thêm tham số staffId
    @Query("SELECT cal FROM MeterCalibration cal " +
            "WHERE cal.invoice IS NULL " +
            "AND cal.calibrationCost > 0 " +
            "AND cal.assignedAccountant.id = :staffId") // <-- LỌC THEO STAFF ID
    Page<MeterCalibration> findUnbilledFeesForStaff(@Param("staffId") Integer staffId, Pageable pageable);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI NÀY ĐỂ TÌM KIẾM ---
    /**
     * Tìm kiếm phí kiểm định chưa lập hóa đơn.
     * Logic:
     * 1. Phải được gán cho Staff ID này.
     * 2. Chưa có hóa đơn (invoice IS NULL).
     * 3. Có phí (> 0).
     * 4. Tìm kiếm Keyword trong: Mã đồng hồ OR Tên Khách hàng OR Địa chỉ.
     * (Dùng EXISTS để join sang bảng Customer thông qua MeterInstallation)
     */
    @Query("SELECT mc FROM MeterCalibration mc " +
            "WHERE mc.assignedAccountant.id = :staffId " +
            "AND mc.invoice IS NULL " +
            "AND mc.calibrationCost > 0 " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(mc.meter.meterCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     EXISTS (SELECT mi FROM MeterInstallation mi WHERE mi.waterMeter = mc.meter AND " +
            "             (LOWER(mi.customer.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "              LOWER(mi.customer.account.phone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "              LOWER(mi.customer.address) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "     ) " +
            ")")
    Page<MeterCalibration> searchUnbilledFees(
            @Param("staffId") Integer staffId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
    // ------------------------------------

    // Trong MeterCalibrationRepository.java

    @Query("SELECT mc FROM MeterCalibration mc " +
            "LEFT JOIN FETCH mc.invoice i " +       // Lấy luôn Invoice
            "LEFT JOIN FETCH i.customer c " +       // Lấy luôn Customer của Invoice
            "LEFT JOIN FETCH c.account a " +        // <--- QUAN TRỌNG: Lấy luôn Account của Customer
            "WHERE mc.invoice.id = :invoiceId")
    Optional<MeterCalibration> findByInvoiceIdWithDetails(@Param("invoiceId") Integer invoiceId);

    // --- THÊM HÀM MỚI ---
    /**
     * Tìm bản ghi Phí (Bảng 14) dựa trên Hóa đơn (Bảng 17).
     * Dùng để "mở khóa" (set invoice_id = NULL) khi Kế toán Hủy Hóa đơn.
     */
    Optional<MeterCalibration> findByInvoice(Invoice invoice);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /**
     * Đếm số phí kiểm định chưa lập hóa đơn ĐƯỢC GÁN CHO STAFF CỤ THỂ
     */
    @Query("SELECT COUNT(m) FROM MeterCalibration m " +
            "WHERE m.assignedAccountant.id = :staffId " + // Giả định bạn có field assignedAccountant
            "AND m.invoice IS NULL")
    long countUnbilledFeesByStaff(@Param("staffId") Integer staffId);
    // --- HẾT PHẦN THÊM ---

    /**
     * Kiểm tra xem đồng hồ này có phiếu kiểm định nào chưa có Invoice (invoice_id IS NULL) không.
     */
    boolean existsByMeterAndInvoiceIsNull(WaterMeter meter);
}

