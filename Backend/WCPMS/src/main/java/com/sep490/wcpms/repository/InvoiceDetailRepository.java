package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.InvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface cho Bảng 18 (invoice_details).
 * Cung cấp các hàm CRUD (Create, Read, Update, Delete) cơ bản.
 */
@Repository
public interface InvoiceDetailRepository extends JpaRepository<InvoiceDetail, Integer> {

    // Spring Data JPA sẽ tự động cung cấp các hàm:
    // save(InvoiceDetail entity) - Dùng để lưu chi tiết hóa đơn
    // findById(Integer id)
    // ...

    // (Không cần thêm hàm tùy chỉnh cho luồng hiện tại)
}