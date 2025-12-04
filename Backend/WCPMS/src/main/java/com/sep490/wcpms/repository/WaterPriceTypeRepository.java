package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterPriceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WaterPriceTypeRepository extends JpaRepository<WaterPriceType, Integer> {

    // --- CHECK TRÙNG KHI TẠO MỚI ---
    boolean existsByTypeName(String typeName);
    boolean existsByTypeCode(String typeCode);

    // --- CHECK TRÙNG KHI CẬP NHẬT (Trừ ID hiện tại) ---
    boolean existsByTypeNameAndIdNot(String typeName, Integer id);
    boolean existsByTypeCodeAndIdNot(String typeCode, Integer id);

    // --- PHÂN TRANG ---
    // Lấy tất cả (cho includeInactive = true)
    Page<WaterPriceType> findAll(Pageable pageable);

    // Lấy theo trạng thái (cho includeInactive = false)
    Page<WaterPriceType> findAllByStatus(WaterPriceType.Status status, Pageable pageable);
    // Tự động tạo query để tìm tất cả các loại giá có trạng thái ACTIVE
    List<WaterPriceType> findAllByStatus(WaterPriceType.Status status);

    @Query("SELECT t FROM WaterPriceType t " +
            "WHERE t.status = com.sep490.wcpms.entity.WaterPriceType.Status.ACTIVE " +
            "AND t.id NOT IN (SELECT p.priceType.id FROM WaterPrice p WHERE p.status = com.sep490.wcpms.entity.WaterPrice.Status.ACTIVE)")
    List<WaterPriceType> findTypesWithoutActivePrice();
}