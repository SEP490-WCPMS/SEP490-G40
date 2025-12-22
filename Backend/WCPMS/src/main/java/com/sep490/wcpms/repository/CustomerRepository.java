package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.dto.CustomerSimpleDTO; // <-- THÊM IMPORT NÀY
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List; // <-- THÊM IMPORT NÀY

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
    // --- THÊM HÀM MỚI ---
    /**
     * Lấy danh sách Khách hàng (rút gọn: ID, Tên, Mã)
     * Sử dụng DTO Constructor Expression để tối ưu
     * Sắp xếp theo Tên Khách hàng.
     */
    @Query("SELECT new com.sep490.wcpms.dto.CustomerSimpleDTO(c.id, c.customerName, c.customerCode) " +
            "FROM Customer c ORDER BY c.customerName ASC")
    List<CustomerSimpleDTO> findSimpleList();
    // --- HẾT PHẦN THÊM ---

    // Count customers created between datetimes
    long countByCreatedAtBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);

    // Fetch customers with their accounts to avoid lazy loading issues when building DTOs
    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.account")
    List<Customer> findAllWithAccount();

    // Tìm kiếm Customer theo tên, số CMND/CCCD và số điện thoại (sử dụng LIKE để tìm kiếm tương đối)
    @Query("SELECT c FROM Customer c " +
            "LEFT JOIN FETCH c.account a " +
            "WHERE (:customerName IS NULL OR LOWER(c.customerName) LIKE LOWER(CONCAT('%', :customerName, '%'))) " +
            "AND (:identityNumber IS NULL OR c.identityNumber LIKE CONCAT('%', :identityNumber, '%')) " +
            "AND (:phone IS NULL OR a.phone LIKE CONCAT('%', :phone, '%'))")
    List<Customer> findByCustomerNameIdentityAndPhone(
            @Param("customerName") String customerName,
            @Param("identityNumber") String identityNumber,
            @Param("phone") String phone
    );
}