package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WaterPriceRepository extends JpaRepository<WaterPrice, Integer> {
    // Tìm tất cả giá đang 'ACTIVE' (theo đúng Enum trong Entity)
    List<WaterPrice> findAllByStatus(WaterPrice.Status status);
}