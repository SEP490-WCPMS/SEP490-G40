package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Spring Data JPA sẽ tự động tạo câu query để tìm Customer dựa trên ID của đối tượng Account liên kết
    Optional<Customer> findByAccount_Id(Long accountId);
}