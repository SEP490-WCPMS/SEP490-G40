package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    // Spring Data JPA sẽ tự động tạo query để tìm kiếm theo username
    Optional<Account> findByUsername(String username);
}