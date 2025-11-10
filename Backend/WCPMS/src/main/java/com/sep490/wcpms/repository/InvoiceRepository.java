package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Invoice;
import org.springframework.data.domain.Page; // <-- THÊM
import org.springframework.data.domain.Pageable; // <-- THÊM
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
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
}