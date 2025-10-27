package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Customer;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    // Spring Data JPA sẽ tự động tạo câu query để tìm Customer dựa trên ID của đối tượng Account liên kết
    Optional<Customer> findByAccount_Id(Integer accountId);

    // HÀM MỚI: Tìm customer_code lớn nhất từ bảng CUSTOMERS
    // Giả sử customer_code có dạng 'KH' + số (ví dụ: KH001, KH123)
    @Query("SELECT MAX(c.customerCode) FROM Customer c WHERE c.customerCode LIKE 'KH%'")
    Optional<String> findMaxCustomerCode();
}