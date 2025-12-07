package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
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

    // Tìm tài khoản dựa trên reset token
    Optional<Account> findByPasswordResetToken(String token);

    // Hàm tìm tài khoản dựa trên token xác thực
    Optional<Account> findByVerificationToken(String token);

    //  Lấy tất cả tài khoản theo vai trò (Enum RoleName)
    List<Account> findByRole_RoleName(Role.RoleName roleName);

    //  Lấy tài khoản theo mã khách hàng (nếu account có customer_code)
    Optional<Account> findByCustomerCode(String customerCode);

    // Phương thức tìm customerCode lớn nhất (ví dụ: KH999)
    @Query("SELECT a.customerCode FROM Account a WHERE a.customerCode IS NOT NULL AND a.customerCode LIKE 'KH%' ORDER BY a.customerCode DESC LIMIT 1")
    Optional<String> findMaxCustomerCode();

    /**
     * Tìm tất cả các tài khoản KHÔNG PHẢI là CUSTOMER hoặc GUEST
     */
    List<Account> findByRole_RoleNameNotIn(Collection<Role.RoleName> roles);

    // Tìm 1 tài khoản thu ngân (department = CASHIER) có status = 1 (active)
    Optional<Account> findFirstByDepartmentAndStatus(Account.Department department, Integer status);

    // --- THÊM QUERY NÀY ---
    /**
     * Thống kê workload nhân viên Service.
     * Trả về: [Account, Số lượng hợp đồng]
     * Sắp xếp: Tăng dần (Ít việc nhất lên đầu)
     */
    @Query("SELECT a, COUNT(c) " +
            "FROM Account a " +
            "LEFT JOIN a.serviceContracts c " +
            "WHERE a.role.roleName = 'SERVICE_STAFF' " +
            "AND a.status = 1 " +
            "GROUP BY a " +
            "ORDER BY COUNT(c) ASC")
    List<Object[]> findServiceStaffWorkloads();
}