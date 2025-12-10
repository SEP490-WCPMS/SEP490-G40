package com.sep490.wcpms.repository;

import com.sep490.wcpms.dto.AccountDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role;
import org.springframework.data.domain.Page;
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
  // Tìm tài khoản theo username
  Optional<Account> findByUsername(String username);

  // Tìm tài khoản theo email
  Optional<Account> findByEmail(String email);

  // Tìm tài khoản theo số điện thoại
  Optional<Account> findByPhone(String phone);

  // Kiểm tra username đã tồn tại chưa
  boolean existsByUsername(String username);

  // Kiểm tra email đã tồn tại chưa
  boolean existsByEmail(String email);

  // Tìm tài khoản dựa trên reset token
  Optional<Account> findByPasswordResetToken(String token);

  // Hàm tìm tài khoản dựa trên token xác thực
  Optional<Account> findByVerificationToken(String token);

  // Lấy tất cả tài khoản theo vai trò (Enum RoleName)
  List<Account> findByRole_RoleName(Role.RoleName roleName);

  // Lấy tài khoản theo mã khách hàng (nếu account có customer_code)
  Optional<Account> findByCustomerCode(String customerCode);

  // Phương thức tìm customerCode lớn nhất (ví dụ: KH999)
  @Query("SELECT a.customerCode FROM Account a WHERE a.customerCode IS NOT NULL AND a.customerCode LIKE 'KH%' ORDER BY a.customerCode DESC LIMIT 1")
  Optional<String> findMaxCustomerCode();

  boolean existsByStaffCode(String staffCode);

    // 1. Lấy danh sách nhân viên (Trừ Admin, Guest, Customer) - Có phân trang
    @Query("SELECT a FROM Account a WHERE a.role.roleName NOT IN :roles")
    Page<Account> findStaffAccounts(@Param("roles") Collection<Role.RoleName> roles, Pageable pageable);

    // 2. Lấy danh sách nhân viên theo Phòng ban - Có phân trang
    @Query("SELECT a FROM Account a WHERE a.department = :department AND a.role.roleName NOT IN :roles")
    Page<Account> findStaffAccountsByDepartment(@Param("department") Account.Department department,
                                                @Param("roles") Collection<Role.RoleName> roles,
                                                Pageable pageable);

    // Hàm này dùng cho dropdown (không phân trang)
    List<Account> findByRole_RoleNameNotIn(Collection<Role.RoleName> roles);

  // Tìm 1 tài khoản thu ngân (department = CASHIER) có status = 1 (active)
  Optional<Account> findFirstByDepartmentAndStatus(Account.Department department, Integer status);

  /**
   * Chọn 1 nhân viên kế toán (ACCOUNTING, status=1)
   * có ÍT HỢP ĐỒNG được phân công mà CHƯA có hóa đơn lắp đặt nhất.
   *
   * Hóa đơn lắp đặt: invoice.meterReading IS NULL và invoice.invoiceNumber LIKE
   * 'CN%'.
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

  // ========== Query MỚI (cho HĐ tiền nước) ==========
  /**
   * Chọn 1 nhân viên kế toán (ACCOUNTING, status=1)
   * có ÍT METER_READINGS (COMPLETED) chưa có hóa đơn tiền nước nhất.
   *
   * Hóa đơn tiền nước: invoice.meterReadingId IS NOT NULL và
   * invoice.invoiceNumber LIKE 'TN%'.
   */
  @Query(value = """
      SELECT a.*
      FROM accounts a
      LEFT JOIN (
          SELECT mr.accounting_staff_id AS acc_id, COUNT(*) AS workload
          FROM meter_readings mr
          LEFT JOIN invoices i
              ON i.meter_reading_id = mr.id
             AND i.invoice_number LIKE 'TN%%'
          WHERE mr.reading_status = 'COMPLETED'
            AND mr.accounting_staff_id IS NOT NULL
            AND i.id IS NULL              -- chỉ tính reading chưa có HĐ tiền nước
          GROUP BY mr.accounting_staff_id
      ) w ON w.acc_id = a.id
      WHERE a.department = 'ACCOUNTING'
        AND a.status = 1
      ORDER BY COALESCE(w.workload, 0) ASC, a.id ASC
      LIMIT 1
      """, nativeQuery = true)
  Optional<Account> findLeastBusyAccountingStaffForWaterBillingTask();

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

    /**
     * Lấy danh sách nhân viên Kỹ thuật cùng với khối lượng công việc hiện tại.
     * Khối lượng công việc được tính là số hợp đồng đang ở trạng thái
     * PENDING, SIGNED, PENDING_SURVEY_REVIEW được phân công cho nhân viên đó.
     * Kết quả được sắp xếp theo khối lượng công việc tăng dần.
     */
    @Query("SELECT new com.sep490.wcpms.dto.AccountDTO(a.id, a.fullName, " +
            "(COUNT(DISTINCT c.id) + COUNT(DISTINCT t.id)) ) " + // Tổng số việc
            "FROM Account a " +
            "LEFT JOIN Contract c ON c.technicalStaff.id = a.id " +
            "    AND c.contractStatus IN ('PENDING', 'SIGNED', 'PENDING_SURVEY_REVIEW') " + // Việc khảo sát/lắp đặt
            "LEFT JOIN CustomerFeedback t ON t.assignedTo.id = a.id " +
            "    AND t.status = 'IN_PROGRESS' " + // Việc sửa chữa/hỗ trợ
            "WHERE a.role.roleName = 'TECHNICAL_STAFF' " +
            "  AND a.status = 1 " +
            "GROUP BY a.id, a.fullName " +
            "ORDER BY (COUNT(DISTINCT c.id) + COUNT(DISTINCT t.id)) ASC, a.fullName ASC")
    List<AccountDTO> findTechnicalStaffWithWorkload();

}
