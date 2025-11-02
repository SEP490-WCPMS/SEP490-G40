package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.dto.CustomerSimpleDTO; // <-- THÊM IMPORT NÀY
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; // <-- THÊM IMPORT NÀY

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    // Spring Data JPA sẽ tự động tạo câu query để tìm Customer dựa trên ID của đối tượng Account liên kết
    Optional<Customer> findByAccount_Id(Integer accountId);

    // HÀM MỚI: Tìm customer_code lớn nhất từ bảng CUSTOMERS
    // Giả sử customer_code có dạng 'KH' + số (ví dụ: KH001, KH123)
    @Query("SELECT MAX(c.customerCode) FROM Customer c WHERE c.customerCode LIKE 'KH%'")
    Optional<String> findMaxCustomerCode();

    // --- THÊM HÀM MỚI ---
    /**
     * Lấy danh sách Khách hàng (rút gọn: ID, Tên, Mã)
     * Sử dụng DTO Constructor Expression để tối ưu
     * Sắp xếp theo Tên Khách hàng.
     */
    @Query("SELECT new com.sep490.wcpms.dto.CustomerSimpleDTO(c.id, c.customerName, c.customerCode) " +
            "FROM Customer c ORDER BY c.customerName ASC")
    List<CustomerSimpleDTO> findSimpleList();
    // --- HẾT PHẦN THÊM ---
}