package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.Customer;
import org.springframework.data.domain.Page; // <-- THÊM
import org.springframework.data.domain.Pageable; // <-- THÊM
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
    long countByInvoiceTypeAndInvoiceDateBetween(
            Invoice.InvoiceType type,
            LocalDate startDate,
            LocalDate endDate
    );

    boolean existsByContract_IdAndInvoiceType(Integer contractId, Invoice.InvoiceType type);

    // --- HẾT PHẦN THÊM ---

}