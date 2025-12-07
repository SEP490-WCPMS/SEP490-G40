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

    /**
     * Chọn 1 nhân viên kế toán (ACCOUNTING, status=1)
     * có ÍT HỢP ĐỒNG được phân công mà CHƯA có hóa đơn lắp đặt nhất.
     *
     * Hóa đơn lắp đặt: invoice.meterReading IS NULL và invoice.invoiceNumber LIKE 'CN%'.
     */
    @Query(value = """
        SELECT a.*
        FROM accounts a
        LEFT JOIN (
            SELECT c.accounting_staff_id AS acc_id, COUNT(*) AS workload
            FROM contracts c
            LEFT JOIN invoices i
                ON i.contract_id = c.id
               AND i.meter_reading_id IS NULL
               AND i.invoice_number LIKE 'CN%%'
            WHERE c.contract_status = 'ACTIVE'
              AND c.accounting_staff_id IS NOT NULL
              AND i.id IS NULL              -- chỉ tính HĐ chưa có hóa đơn lắp đặt
            GROUP BY c.accounting_staff_id
        ) w ON w.acc_id = a.id
        WHERE a.department = 'ACCOUNTING'
          AND a.status = 1
        ORDER BY COALESCE(w.workload, 0) ASC, a.id ASC
        LIMIT 1
        """, nativeQuery = true)
    Optional<Account> findLeastBusyAccountingStaffForInstallationTask();


}