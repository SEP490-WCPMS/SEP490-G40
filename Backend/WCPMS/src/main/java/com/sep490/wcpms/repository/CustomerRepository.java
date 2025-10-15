package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Tìm thông tin khách hàng dựa trên ID của tài khoản liên kết
    Optional<Customer> findByAccountId(Long accountId);
}