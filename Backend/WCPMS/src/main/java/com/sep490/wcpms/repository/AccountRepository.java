package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    //  Tìm tài khoản theo username
    Optional<Account> findByUsername(String username);

    //  Tìm tài khoản theo email
    Optional<Account> findByEmail(String email);

    //  Tìm tài khoản theo số điện thoại
    Optional<Account> findByPhone(String phone);

    //  Kiểm tra username đã tồn tại chưa
    boolean existsByUsername(String username);

    //  Kiểm tra email đã tồn tại chưa
    boolean existsByEmail(String email);

    //  Lấy tất cả tài khoản theo vai trò (VD: "service_staff", "technical_staff", ...)
    List<Account> findByRole_RoleName(String roleName);

    //  Lấy tài khoản theo mã khách hàng (nếu account có customer_code)
    Optional<Account> findByCustomerCode(String customerCode);
}