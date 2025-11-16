package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.entity.WaterServiceContract.WaterServiceContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
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
}