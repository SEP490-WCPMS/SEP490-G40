package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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


    // THÊM: Tìm Kế toán đang có ít khoản phí "treo" nhất
    @Query(value = """
        SELECT a.* FROM accounts a 
        LEFT JOIN meter_calibrations mc ON mc.assigned_accountant_id = a.id 
            AND mc.invoice_id IS NULL -- Chỉ đếm những cái chưa xong
            AND mc.calibration_cost > 0
        WHERE a.role_id = :roleId AND a.status = 1 
        GROUP BY a.id 
        ORDER BY COUNT(mc.id) ASC, a.id ASC 
        LIMIT 1
    """, nativeQuery = true)
    Optional<Account> findAccountantWithLeastWorkload(@Param("roleId") int roleId);


    /**
     * TÌM KẾ TOÁN CÓ ÍT VIỆC NHẤT (LOAD BALANCING)
     * Logic:
     * 1. Lấy tất cả Account có role là ACCOUNTING (hoặc check theo Department)
     * 2. Chỉ lấy Account đang hoạt động (status = 1)
     * 3. Left Join với bảng Invoices để đếm số hóa đơn đang PENDING
     * 4. Sắp xếp theo số lượng task ASC (ít nhất lên đầu)
     */
    @Query("SELECT a FROM Account a " +
            "LEFT JOIN Invoice i ON i.accountingStaff.id = a.id AND i.paymentStatus = 'PENDING' " +
            "WHERE a.role.roleName = 'ACCOUNTING_STAFF' " + // Hoặc a.department = 'ACCOUNTING' tùy DB của bạn
            "AND a.status = 1 " +
            "GROUP BY a.id " +
            "ORDER BY COUNT(i.id) ASC, a.id ASC")
    List<Account> findAccountingStaffOrderedByWorkload(Pageable pageable);


    /**
     * Tìm nhân viên Dịch vụ (Service Staff) đang có ít ticket (PENDING/IN_PROGRESS) nhất.
     * Logic: Join với bảng feedback, đếm số lượng ticket đang xử lý, sắp xếp tăng dần -> lấy người đầu tiên.
     */
    @Query(value = """
        SELECT a.* FROM accounts a 
        LEFT JOIN customer_feedback cf ON cf.assigned_to = a.id 
            AND cf.status IN ('PENDING', 'IN_PROGRESS') -- Chỉ đếm việc chưa xong
        WHERE a.role_id = :roleId AND a.status = 1 
        GROUP BY a.id 
        ORDER BY COUNT(cf.id) ASC, a.id ASC 
        LIMIT 1
    """, nativeQuery = true)
    Optional<Account> findServiceStaffWithLeastTickets(@Param("roleId") int roleId);
}
