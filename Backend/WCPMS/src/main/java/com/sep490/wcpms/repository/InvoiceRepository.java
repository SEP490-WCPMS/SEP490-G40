package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.MeterReading;
import org.springframework.data.domain.Page; // <-- THÊM
import org.springframework.data.domain.Pageable; // <-- THÊM
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // <-- THÊM IMPORT
import org.springframework.data.repository.query.Param; // <-- THÊM IMPORT
import org.springframework.stereotype.Repository;
import com.sep490.wcpms.entity.Invoice.PaymentStatus; // <-- THÊM
import java.math.BigDecimal; // <-- THÊM
import java.time.LocalDate; // <-- THÊM

import java.util.Collection;
import java.util.List;
import java.util.Optional; // <-- THÊM IMPORT

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

    // --- THÊM HÀM MỚI ---
    /**
     * Tìm Hóa đơn (Bảng 17) bằng Số Hóa đơn (chuỗi).
     * Dùng để Webhook tìm HĐ từ nội dung chuyển khoản.
     */
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM 2 HÀM MỚI ---

    /**
     * Lấy danh sách Hóa đơn (phân trang) CÓ LỌC theo Trạng thái.
     */
    Page<Invoice> findByPaymentStatus(Invoice.PaymentStatus status, Pageable pageable);

    /**
     * Lấy danh sách Hóa đơn (phân trang) KHÔNG LỌC (Lấy tất cả).
     * (Hàm này đã có sẵn, JpaRepository tự cung cấp: findAll(Pageable pageable))
     */
    // Page<Invoice> findAll(Pageable pageable);
    // --- HẾT PHẦN THÊM ---

    // --- THÊM 2 HÀM MỚI CHO KHÁCH HÀNG ---

    /**
     * Tìm Hóa đơn (Bảng 17) theo ID và ID Khách hàng (Bảo mật)
     */
    Optional<Invoice> findByIdAndCustomer(Integer invoiceId, Customer customer);

    /**
     * Tìm Hóa đơn (Bảng 17) theo Khách hàng VÀ theo danh sách Trạng thái
     * (Dùng cho trang PENDING, OVERDUE, PAID)
     */
    Page<Invoice> findByCustomerAndPaymentStatusIn(Customer customer, List<Invoice.PaymentStatus> statuses, Pageable pageable);

    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    /**
     * Tìm TẤT CẢ Hóa đơn (không lọc status) của một Khách hàng.
     */
    Page<Invoice> findByCustomer(Customer customer, Pageable pageable);
    // --- THÊM 2 HÀM MỚI ---

    // Đếm số hóa đơn theo loại và theo khoảng ngày (để đánh số CN-YYYY-xxxx)
    long countByInvoiceDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );

    boolean existsByContract_Id(Integer contractId);

    // --- HẾT PHẦN THÊM ---

    /**
     * Kiểm tra xem đã tồn tại Hóa đơn nào được tạo từ MeterReading này chưa.
     */
    boolean existsByMeterReading(MeterReading meterReading);

    // Hàm  (cho Thu ngân tại quầy)
    /**
     * Dùng cho Thu ngân (Cashier) thu tiền mặt.
     * Tìm Hóa đơn (Bảng 17) bằng Số Hóa đơn
     * VÀ chỉ trả về nếu trạng thái là PENDING hoặc OVERDUE.
     */
    @Query("SELECT inv FROM Invoice inv " +
            "WHERE inv.invoiceNumber = :invoiceNumber " +
            "AND inv.paymentStatus IN :statuses") // Tìm trong danh sách
    Optional<Invoice> findUnpaidByInvoiceNumber(
            @Param("invoiceNumber") String invoiceNumber,
            @Param("statuses") Collection<Invoice.PaymentStatus> statuses
    );
    // --- HẾT PHẦN THÊM ---

    // --- THÊM 2 HÀM MỚI (Cho Thu ngân tại nhà) ---

    /**
     * Lấy danh sách Hóa đơn (phân trang)
     * dựa trên DANH SÁCH CÁC TUYẾN (routeIds) VÀ DANH SÁCH TRẠNG THÁI.
     * (Giả định: Invoice (17) -> Contract (8) -> route_id)
     */
    @Query("SELECT inv FROM Invoice inv " +
            "WHERE inv.contract.readingRoute.id IN :routeIds " + // Lọc theo route_id trên Bảng 8
            "AND inv.paymentStatus IN :statuses")
    Page<Invoice> findByRouteIdsAndStatus(
            @Param("routeIds") Collection<Integer> routeIds,
            @Param("statuses") Collection<Invoice.PaymentStatus> statuses,
            Pageable pageable
    );

    /**
     * Lấy chi tiết 1 Hóa đơn VÀ kiểm tra xem HĐ đó
     * có thuộc 1 trong các tuyến (routeIds) mà Thu ngân quản lý không.
     */
    @Query("SELECT inv FROM Invoice inv " +
            "WHERE inv.id = :invoiceId " +
            "AND inv.contract.readingRoute.id IN :routeIds")
    Optional<Invoice> findByIdAndRouteIds(
            @Param("invoiceId") Integer invoiceId,
            @Param("routeIds") Collection<Integer> routeIds
    );
    // --- HẾT PHẦN THÊM ---

    // --- THÊM 3 HÀM MỚI CHO STATS ---

    /**
     * Đếm số Hóa đơn theo danh sách trạng thái
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.paymentStatus IN :statuses")
    long countByPaymentStatusIn(@Param("statuses") Collection<PaymentStatus> statuses);

    /**
     * Tính TỔNG TIỀN của Hóa đơn theo danh sách trạng thái
     */
    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.paymentStatus IN :statuses")
    BigDecimal sumTotalAmountByPaymentStatusIn(@Param("statuses") Collection<PaymentStatus> statuses);

    /**
     * Đếm số Hóa đơn QUÁ HẠN (OVERDUE và ngày < hôm nay)
     * (Thực ra status OVERDUE đã đủ, nhưng đây là cách check an toàn hơn)
     */
    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.paymentStatus = :status AND i.dueDate < :today")
    long countOverdueInvoices(
            @Param("status") PaymentStatus status,
            @Param("today") LocalDate today
    );
    // --- HẾT PHẦN THÊM ---

    // --- THÊM 2 HÀM MỚI CHO STATS ---

    /**
     * Đếm số Hóa đơn (Bảng 17) theo danh sách Tuyến (Routes) và Trạng thái.
     */
    @Query("SELECT COUNT(inv) FROM Invoice inv " +
            "WHERE inv.contract.readingRoute.id IN :routeIds " +
            "AND inv.paymentStatus IN :statuses")
    long countByRouteIdsAndStatus(
            @Param("routeIds") Collection<Integer> routeIds,
            @Param("statuses") Collection<Invoice.PaymentStatus> statuses
    );

    /**
     * Tính TỔNG TIỀN của Hóa đơn (Bảng 17) theo Tuyến và Trạng thái.
     */
    @Query("SELECT SUM(inv.totalAmount) FROM Invoice inv " +
            "WHERE inv.contract.readingRoute.id IN :routeIds " +
            "AND inv.paymentStatus IN :statuses")
    BigDecimal sumTotalAmountByRouteIdsAndStatus(
            @Param("routeIds") Collection<Integer> routeIds,
            @Param("statuses") Collection<Invoice.PaymentStatus> statuses
    );
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI CHO RANGE TIỀN ---
    /**
     * Tính tổng tiền của các hóa đơn theo danh sách trạng thái trong khoảng ngày invoiceDate BETWEEN :from AND :to
     */
    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.paymentStatus IN :statuses AND i.invoiceDate BETWEEN :from AND :to")
    BigDecimal sumTotalAmountByPaymentStatusInAndInvoiceDateBetween(@Param("statuses") Collection<PaymentStatus> statuses,
                                                                     @Param("from") LocalDate from,
                                                                     @Param("to") LocalDate to);

    // --- Thêm query group by ngày ---
    @Query("SELECT i.invoiceDate, SUM(i.totalAmount) FROM Invoice i WHERE i.invoiceDate BETWEEN :from AND :to GROUP BY i.invoiceDate ORDER BY i.invoiceDate")
    List<Object[]> sumTotalGroupedByInvoiceDate(@Param("from") LocalDate from, @Param("to") LocalDate to);
}