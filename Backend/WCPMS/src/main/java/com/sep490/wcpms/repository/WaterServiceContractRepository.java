package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterServiceContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WaterServiceContractRepository extends JpaRepository<WaterServiceContract, Integer> {

    // Spring Data JPA sẽ tự động cung cấp các hàm CRUD (Create, Read, Update, Delete)
    // như save(), findById(), findAll(), delete().

    // Bạn không cần thêm hàm tùy chỉnh nào cho luồng Technical/Cashier hiện tại.
}