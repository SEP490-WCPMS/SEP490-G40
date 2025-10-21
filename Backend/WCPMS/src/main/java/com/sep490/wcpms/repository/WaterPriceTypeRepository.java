package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterPriceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WaterPriceTypeRepository extends JpaRepository<WaterPriceType, Integer> {
    // Tự động tạo query để tìm tất cả các loại giá có trạng thái ACTIVE
    List<WaterPriceType> findAllByStatus(WaterPriceType.Status status);
}