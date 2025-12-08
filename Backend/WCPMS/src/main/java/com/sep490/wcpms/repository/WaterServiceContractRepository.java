package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.entity.WaterServiceContract.WaterServiceContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface WaterServiceContractRepository extends JpaRepository<WaterServiceContract, Integer> {

    // Spring Data JPA sẽ tự động cung cấp các hàm CRUD (Create, Read, Update, Delete)
    // như save(), findById(), findAll(), delete().

    // Bạn không cần thêm hàm tùy chỉnh nào cho luồng Technical/Cashier hiện tại.

    // --- SỬA LẠI HOÀN TOÀN TÊN CÁC HÀM ---

    /**
     * Lấy TẤT CẢ HĐ (đã gán) của 1 Tuyến, SẮP XẾP theo thứ tự đã lưu
     * (Dùng cho Kế toán load ra danh sách)
     *
     * Sửa: Tên hàm từ 'findByRouteId...' -> 'findByReadingRoute_Id...'
     */
    List<WaterServiceContract> findByReadingRoute_IdAndContractStatusOrderByRouteOrderAsc(
            Integer routeId,
            WaterServiceContractStatus status
    );

    /**
     * Lấy TẤT CẢ HĐ (đã gán) của NHIỀU Tuyến, SẮP XẾP theo thứ tự đã lưu
     * (Dùng cho Thu ngân xem tất cả các tuyến của mình)
     *
     * Sửa: Tên hàm từ '...OrderByRouteIdAsc...' -> '...OrderByReadingRoute_IdAsc...'
     */
    List<WaterServiceContract> findByReadingRoute_IdInAndContractStatusOrderByReadingRoute_IdAscRouteOrderAsc(
            List<Integer> routeIds,
            WaterServiceContractStatus status
    );
    // --- HẾT PHẦN SỬA ---


    /**
     * Tìm kiếm Hợp đồng trong một Tuyến cụ thể:
     * - Theo Route ID
     * - Theo Status (ACTIVE)
     * - Tìm kiếm theo Keyword (Mã HĐ, Tên KH, Địa chỉ)
     * - Hỗ trợ Phân trang (Pageable)
     */
    @Query("SELECT c FROM WaterServiceContract c " +
            "WHERE c.readingRoute.id = :routeId " +
            "AND c.contractStatus = 'ACTIVE' " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(c.contractNumber) LIKE %:keyword% OR " +
            "     LOWER(c.customer.customerName) LIKE %:keyword% OR " +
            "     LOWER(c.customer.address) LIKE %:keyword%) " +
            "ORDER BY c.routeOrder ASC")
    Page<WaterServiceContract> searchContractsInRoute(
            @Param("routeId") Integer routeId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}