package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.WaterMeter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MeterInstallationRepository extends JpaRepository<MeterInstallation, Integer> {
    // Không cần thêm phương thức tùy chỉnh
    Optional<MeterInstallation> findByContract(Contract contract);

    /** THÊM HÀM NÀY: Tìm bản ghi lắp đặt bằng đối tượng Đồng hồ */
    // Giả định một đồng hồ chỉ được lắp 1 lần (hoặc tìm bản mới nhất)
    Optional<MeterInstallation> findByWaterMeter(WaterMeter waterMeter);

    // HÀM MỚI: Tìm bản ghi lắp đặt (mới nhất) dựa trên đối tượng WaterMeter
    Optional<MeterInstallation> findTopByWaterMeterOrderByInstallationDateDesc(WaterMeter waterMeter);

    /**
     * Dùng cho Tác vụ Tự động (MaintenanceService - Trigger 5 năm).
     * Tìm tất cả các bản ghi lắp đặt đang hoạt động:
     * 1. Đã được lắp đặt TỪ 5 NĂM TRƯỚC (trở về quá khứ).
     * 2. Thuộc Hợp đồng Dịch vụ đang CÒN HOẠT ĐỘNG.
     * 3. Và KHÔNG CÓ bản ghi kiểm định nào (trong Bảng 14) được thực hiện TRONG VÒNG 5 NĂM qua.
     */
    @Query("SELECT mi FROM MeterInstallation mi " +
            "WHERE mi.installationDate <= :fiveYearsAgo " +
            "AND mi.waterServiceContract IS NOT NULL " +
            "AND mi.waterServiceContract.contractStatus = 'ACTIVE' " +
            "AND NOT EXISTS (" +
            "    SELECT cal FROM MeterCalibration cal " +
            "    WHERE cal.meter = mi.waterMeter " +
            "    AND cal.calibrationDate > :fiveYearsAgo" +
            ")")
    List<MeterInstallation> findOverdueInstallations(@Param("fiveYearsAgo") LocalDate fiveYearsAgo);

}