package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterPrice;
import com.sep490.wcpms.entity.WaterPriceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaterPriceRepository extends JpaRepository<WaterPrice, Integer> {
    // Tìm tất cả giá đang 'ACTIVE' (theo đúng Enum trong Entity)
    List<WaterPrice> findAllByStatus(WaterPrice.Status status);
    /**
     * Tìm biểu giá đang ACTIVE, theo đúng loại giá (priceType),
     * và có ngày hiệu lực (effectiveDate) gần nhất VÀ trước hoặc bằng ngày đọc số.
     */
    @Query("SELECT wp FROM WaterPrice wp " +
            "WHERE wp.priceType = :priceType " +
            "AND wp.effectiveDate <= :readingDate " +
            "AND wp.status = com.sep490.wcpms.entity.WaterPrice.Status.ACTIVE " +
            "ORDER BY wp.effectiveDate DESC " +
            "LIMIT 1")
    Optional<WaterPrice> findActivePriceForDate(@Param("priceType") WaterPriceType priceType,
                                                @Param("readingDate") LocalDate readingDate);
}