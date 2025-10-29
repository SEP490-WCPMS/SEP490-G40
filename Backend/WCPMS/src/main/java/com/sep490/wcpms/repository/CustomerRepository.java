package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Customer;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    // Spring Data JPA sẽ tự động tạo câu query để tìm Customer dựa trên ID của đối tượng Account liên kết
    Optional<Customer> findByAccount_Id(Integer accountId);

    // HÀM MỚI: Tìm customer_code lớn nhất từ bảng CUSTOMERS
    // Giả sử customer_code có dạng 'KH' + số (ví dụ: KH001, KH123)
    @Query("SELECT MAX(c.customerCode) FROM Customer c WHERE c.customerCode LIKE 'KH%'")
    Optional<String> findMaxCustomerCode();

    // Tìm kiếm Customer theo tên và số CMND/CCCD (sử dụng LIKE để tìm kiếm tương đối)
    @Query("SELECT c FROM Customer c WHERE " +
            "(:customerName IS NULL OR LOWER(c.customerName) LIKE LOWER(CONCAT('%', :customerName, '%'))) AND " +
            "(:identityNumber IS NULL OR c.identityNumber LIKE CONCAT('%', :identityNumber, '%'))")
    List<Customer> findByCustomerNameAndIdentityNumber(
            @Param("customerName") String customerName,
            @Param("identityNumber") String identityNumber
    );
}