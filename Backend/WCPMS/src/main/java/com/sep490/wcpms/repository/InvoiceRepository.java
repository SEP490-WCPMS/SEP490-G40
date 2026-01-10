package com.sep490.wcpms.repository;

import com.sep490.wcpms.dto.dashboard.DailyRevenueDTO;
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

    /**
     * Tìm kiếm Hóa đơn CHƯA THANH TOÁN (PENDING, OVERDUE) phục vụ cho Thu ngân.
     * Tìm theo: Số hóa đơn, Tên khách hàng, Mã khách hàng, hoặc Số điện thoại.
     */
    @Query("SELECT i FROM Invoice i " +
            "WHERE i.paymentStatus IN ('PENDING', 'OVERDUE') " +
            "AND (" +
            "   LOWER(i.invoiceNumber) LIKE %:keyword% OR " +
            "   LOWER(i.customer.customerName) LIKE %:keyword% OR " +
            "   LOWER(i.customer.customerCode) LIKE %:keyword% OR " +
            "   LOWER(i.customer.account.phone) LIKE %:keyword% " +
            ") " +
            "ORDER BY i.dueDate ASC") // Ưu tiên hiện cái nào sắp hết hạn/quá hạn trước
    List<Invoice> searchUnpaidInvoices(@Param("keyword") String keyword);

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

    // === CÁC HÀM THỐNG KÊ CHO DASHBOARD (PERSONALIZED) ===

    /**
     * 1. Đếm số Hóa đơn theo Staff ID và danh sách Trạng thái (Ví dụ: Đếm PENDING của tôi)
     */
    long countByAccountingStaff_IdAndPaymentStatusIn(Integer staffId, Collection<PaymentStatus> statuses);

    /**
     * 2. Tính TỔNG TIỀN của Hóa đơn theo Staff ID và danh sách Trạng thái (Ví dụ: Tổng tiền tôi cần thu)
     */
    @Query("SELECT SUM(i.totalAmount) FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND i.paymentStatus IN :statuses")
    BigDecimal sumTotalAmountByStaffAndStatus(
            @Param("staffId") Integer staffId,
            @Param("statuses") Collection<PaymentStatus> statuses
    );

    /**
     * 3. Đếm số Hóa đơn QUÁ HẠN được gán cho Staff ID
     */
    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND i.paymentStatus = :status " +
            "AND i.dueDate < :today")
    long countOverdueInvoicesByStaff(
            @Param("staffId") Integer staffId,
            @Param("status") PaymentStatus status,
            @Param("today") LocalDate today
    );

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

    // --- THÊM HÀM TÌM HÓA ĐƠN QUÁ HẠN ---
    /**
     * Tìm các hóa đơn chưa thanh toán (PENDING) mà đã quá hạn (dueDate < today).
     */
    @Query("SELECT i FROM Invoice i " +
            "WHERE i.paymentStatus = 'PENDING' " +
            "AND i.dueDate < :today " +
            "AND (i.latePaymentFee IS NULL OR i.latePaymentFee = 0)") // Chỉ lấy những cái chưa phạt
    List<Invoice> findOverdueInvoices(@Param("today") LocalDate today);
    // ---

    List<Invoice> findTop4ByCustomerAndMeterReadingIsNotNullOrderByInvoiceDateDesc(Customer customer);

    /**
     * Tìm các hóa đơn còn nợ, đến hạn vào đúng 1 ngày cụ thể.
     * Dùng cho scheduler nhắc thanh toán.
     */
    List<Invoice> findByPaymentStatusInAndDueDate(
            Collection<Invoice.PaymentStatus> statuses,
            LocalDate dueDate
    );

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

    boolean existsByContract_IdAndMeterReadingIsNullAndInvoiceNumberStartingWith(
            Integer contractId,
            String prefix
    );



    // === CÁC HÀM CHO ADMIN (GLOBAL) ===

    /**
     * 1. Đếm tổng số hóa đơn theo danh sách trạng thái (Admin)
     */
    long countByPaymentStatusIn(Collection<PaymentStatus> statuses);

    /**
     * 2. Đếm tổng số hóa đơn QUÁ HẠN toàn hệ thống (Admin)
     * (Khác với hàm countOverdueInvoicesByStaff của kế toán)
     */
    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.paymentStatus = :status " +
            "AND i.dueDate < :today")
    long countGlobalOverdueInvoices(
            @Param("status") PaymentStatus status,
            @Param("today") LocalDate today
    );

    /**
     * 3. Tính tổng tiền theo trạng thái và khoảng thời gian (Admin)
     * Lưu ý: Dùng COALESCE để tránh lỗi null khi không có dữ liệu
     */
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
            "WHERE i.paymentStatus IN :statuses " +
            "AND i.invoiceDate BETWEEN :from AND :to")
    BigDecimal sumGlobalTotalAmountByStatusAndDate(
            @Param("statuses") Collection<PaymentStatus> statuses,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    // Nếu bạn muốn tính "Doanh thu thực" (đã trả tiền), dùng hàm này:
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
            "WHERE i.paymentStatus = 'PAID' " +
            "AND i.invoiceDate BETWEEN :from AND :to")
    BigDecimal sumGlobalPaidAmountByDate(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );


    // === CÁC HÀM MỚI ĐỂ LỌC THEO NGƯỜI ĐƯỢC GIAO VIỆC (ACCOUNTING STAFF) ===

    /**
     * Tìm Hóa đơn của Kế toán viên theo Keyword (Mã HĐ, Tên KH, Mã KH).
     * (Không lọc trạng thái - Status = ALL)
     */
    @Query("SELECT i FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(i.invoiceNumber) LIKE %:keyword% OR " +
            "     LOWER(i.customer.customerName) LIKE %:keyword% OR " +
            "     LOWER(i.customer.account.phone) LIKE %:keyword% OR " +
            "     LOWER(i.customer.customerCode) LIKE %:keyword%)")
    Page<Invoice> searchByAccountingStaff_Id(
            @Param("staffId") Integer staffId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * Tìm Hóa đơn của Kế toán viên theo Trạng thái VÀ Keyword.
     */
    @Query("SELECT i FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND i.paymentStatus = :status " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(i.invoiceNumber) LIKE %:keyword% OR " +
            "     LOWER(i.customer.customerName) LIKE %:keyword% OR " +
            "     LOWER(i.customer.account.phone) LIKE %:keyword% OR " +
            "     LOWER(i.customer.customerCode) LIKE %:keyword%)")
    Page<Invoice> searchByAccountingStaff_IdAndStatus(
            @Param("staffId") Integer staffId,
            @Param("status") Invoice.PaymentStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // Nếu bạn muốn hỗ trợ status dạng String "ALL" thì xử lý logic ở Service, repo chỉ cần Enum


    // --- THÊM HÀM MỚI NÀY ---
    /**
     * Tìm kiếm Hóa đơn của khách hàng:
     * - Lọc theo Customer ID
     * - Lọc theo Status (Nếu null thì lấy hết)
     * - Tìm kiếm Keyword trong Số hóa đơn (Invoice Number)
     */
    @Query("SELECT i FROM Invoice i " +
            "WHERE i.customer.id = :customerId " +
            "AND (:statuses IS NULL OR i.paymentStatus IN :statuses) " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Invoice> searchMyInvoices(
            @Param("customerId") Integer customerId,
            @Param("statuses") List<Invoice.PaymentStatus> statuses,
            @Param("keyword") String keyword,
            Pageable pageable
    );
    // ------------------------

    /**
     * Lấy danh sách hóa đơn cho Thu ngân đi thu tiền theo Tuyến.
     * Logic:
     * 1. Phải thuộc các tuyến (routeIds) mà thu ngân quản lý.
     * 2. Điều kiện lọc:
     * - Hoặc: Hợp đồng đăng ký Tiền mặt (CASH) và chưa thanh toán (PENDING).
     * - Hoặc: Hóa đơn đã QUÁ HẠN (OVERDUE) (Bất kể phương thức thanh toán là gì -> Để đi nhắc nợ).
     */
    /**
     * Tìm kiếm & Lọc hóa đơn cho Thu ngân đi thu.
     * @param routeIds: Danh sách tuyến quản lý
     * @param keyword: Từ khóa tìm kiếm (Mã HĐ, Tên KH, Mã KH, Địa chỉ)
     * @param filterType: 'ALL', 'CASH', 'OVERDUE'
     */
    @Query("SELECT i FROM Invoice i " +
            "WHERE i.contract.readingRoute.id IN :routeIds " +
            // 1. Logic Tìm kiếm Keyword
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(i.invoiceNumber) LIKE %:keyword% OR " +
            "     LOWER(i.customer.customerName) LIKE %:keyword% OR " +
            "     LOWER(i.customer.customerCode) LIKE %:keyword% OR " +
            "     LOWER(i.customer.account.phone) LIKE %:keyword% OR " +
            "     LOWER(i.customer.address) LIKE %:keyword%) " +
            // 2. Logic Bộ lọc (Filter)
            "AND (" +
            "   (:filterType = 'ALL' AND (" +
            "       (i.contract.paymentMethod = 'CASH' AND i.paymentStatus = 'PENDING') OR " +
            "       (i.paymentStatus = 'OVERDUE')" +
            "   )) " +
            "   OR " +
            "   (:filterType = 'CASH' AND (i.contract.paymentMethod = 'CASH' AND i.paymentStatus = 'PENDING')) " +
            "   OR " +
            "   (:filterType = 'OVERDUE' AND i.paymentStatus = 'OVERDUE') " +
            ")")
    Page<Invoice> findInvoicesForCashierCollection(
            @Param("routeIds") Collection<Integer> routeIds,
            @Param("keyword") String keyword,
            @Param("filterType") String filterType,
            Pageable pageable
    );

    /**
     * Đếm số lượng hóa đơn cần thu (Logic mới: Tiền mặt hoặc Quá hạn).
     * Dùng cho Dashboard Stats.
     */
    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.contract.readingRoute.id IN :routeIds " +
            "AND (" +
            "   (i.contract.paymentMethod = 'CASH' AND i.paymentStatus = 'PENDING') " +
            "   OR " +
            "   (i.paymentStatus = 'OVERDUE') " +
            ")")
    long countInvoicesForCashierCollection(@Param("routeIds") Collection<Integer> routeIds);

    /**
     * Tính tổng tiền hóa đơn cần thu (Logic mới: Tiền mặt hoặc Quá hạn).
     * Dùng cho Dashboard Stats.
     */
    @Query("SELECT SUM(i.totalAmount) FROM Invoice i " +
            "WHERE i.contract.readingRoute.id IN :routeIds " +
            "AND (" +
            "   (i.contract.paymentMethod = 'CASH' AND i.paymentStatus = 'PENDING') " +
            "   OR " +
            "   (i.paymentStatus = 'OVERDUE') " +
            ")")
    BigDecimal sumAmountForCashierCollection(@Param("routeIds") Collection<Integer> routeIds);


    /**
     * Tính tổng doanh thu (Đã thanh toán) của các hóa đơn do Kế toán này tạo.
     * (Dựa trên ngày thanh toán paidDate)
     */
    @Query("SELECT SUM(i.totalAmount) FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND i.paymentStatus = 'PAID' " +
            "AND i.paidDate BETWEEN :startDate AND :endDate")
    BigDecimal sumMyRevenueByDateRange(
            @Param("staffId") Integer staffId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Đếm số Hóa đơn (Pending/Overdue) do Kế toán này tạo.
     */
    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND i.paymentStatus IN :statuses")
    long countMyPendingInvoices(@Param("staffId") Integer staffId,
                                @Param("statuses") Collection<PaymentStatus> statuses);

    /**
     * Đếm số Hóa đơn QUÁ HẠN do Kế toán này tạo.
     */
    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND i.paymentStatus = 'OVERDUE'") // Hoặc check dueDate < today
    long countMyOverdueInvoices(@Param("staffId") Integer staffId);

    /**
     * Lấy dữ liệu biểu đồ doanh thu THEO STAFF (Chỉ tính hóa đơn do staff này tạo và đã được thanh toán).
     * Group by ngày thanh toán (paidDate).
     */
    @Query("SELECT new com.sep490.wcpms.dto.dashboard.DailyRevenueDTO(i.paidDate, SUM(i.totalAmount)) " +
            "FROM Invoice i " +
            "WHERE i.accountingStaff.id = :staffId " +
            "AND i.paymentStatus = 'PAID' " +
            "AND i.paidDate BETWEEN :startDate AND :endDate " +
            "GROUP BY i.paidDate " +
            "ORDER BY i.paidDate ASC")
    List<DailyRevenueDTO> getDailyRevenueReportByStaff(
            @Param("staffId") Integer staffId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
    SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END
    FROM Invoice i
    WHERE i.contract.id = :contractId
      AND i.meterReading IS NULL
      AND UPPER(i.invoiceNumber) LIKE 'CN%'
""")
    boolean existsInstallationInvoiceByContractId(@Param("contractId") Integer contractId);

    /**
     *  Kiểm tra hợp đồng có hóa đơn chưa thanh toán (PENDING hoặc OVERDUE) không
     */
    // Kiểm tra xem hợp đồng có hóa đơn nào thuộc các trạng thái cung cấp không
    boolean existsByContract_IdAndPaymentStatusIn(Integer contractId, Collection<Invoice.PaymentStatus> statuses);

    /**
     * Lấy tổng doanh thu theo ngày trong khoảng thời gian, chỉ tính hóa đơn đã thanh toán
     */
    @Query("SELECT i.invoiceDate, SUM(i.totalAmount) FROM Invoice i WHERE i.paymentStatus = 'PAID' AND i.invoiceDate BETWEEN :from AND :to GROUP BY i.invoiceDate ORDER BY i.invoiceDate")
    List<Object[]> sumPaidGroupedByInvoiceDate(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT i FROM Invoice i " +
            "LEFT JOIN FETCH i.customer c " +
            "LEFT JOIN FETCH c.account a " + // <--- Lấy Account
            "LEFT JOIN FETCH i.contract ctr " +
            "WHERE i.id = :id")
    Optional<Invoice> findByIdWithDetails(@Param("id") Integer id);

    /**
     * Tìm Hóa đơn theo ID và ID Kế toán được phân công (Bảo mật).
     * (Dùng cho màn chi tiết/tải PDF của Accounting Staff)
     */
    Optional<Invoice> findByIdAndAccountingStaff_Id(Integer invoiceId, Integer staffId);
}