package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Address;
import com.sep490.wcpms.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Integer> {

    /**
     * Tìm tất cả địa chỉ của một customer
     */
    List<Address> findByCustomer(Customer customer);

    /**
     * Tìm tất cả địa chỉ của customer theo ID
     */
    List<Address> findByCustomerId(Integer customerId);

    /**
     * Tìm địa chỉ đang hoạt động của customer
     */
    @Query("SELECT a FROM Address a WHERE a.customer.id = :customerId AND a.isActive = 1")
    List<Address> findActiveAddressesByCustomerId(@Param("customerId") Integer customerId);

    /**
     * Tìm địa chỉ mặc định (đầu tiên) của customer
     */
    @Query("SELECT a FROM Address a WHERE a.customer.id = :customerId AND a.isActive = 1 ORDER BY a.id ASC")
    Optional<Address> findDefaultAddressByCustomerId(@Param("customerId") Integer customerId);

    /**
     * Tìm địa chỉ theo ward
     */
    @Query("SELECT a FROM Address a WHERE a.ward.id = :wardId AND a.isActive = 1")
    List<Address> findByWardId(@Param("wardId") Integer wardId);

    /**
     * Kiểm tra customer đã có địa chỉ chưa
     */
    boolean existsByCustomerId(Integer customerId);

    /**
     * Đếm số địa chỉ đang hoạt động của customer
     */
    @Query("SELECT COUNT(a) FROM Address a WHERE a.customer.id = :customerId AND a.isActive = 1")
    long countActiveAddressesByCustomerId(@Param("customerId") Integer customerId);

    /**
     * Tìm địa chỉ theo customer và ward (tránh trùng lặp)
     */
    @Query("SELECT a FROM Address a WHERE a.customer.id = :customerId AND a.ward.id = :wardId AND a.street = :street")
    Optional<Address> findByCustomerIdAndWardIdAndStreet(
            @Param("customerId") Integer customerId,
            @Param("wardId") Integer wardId,
            @Param("street") String street
    );
}

