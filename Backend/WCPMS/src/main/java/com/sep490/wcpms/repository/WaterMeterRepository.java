package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterMeter;
import com.sep490.wcpms.dto.CustomerMeterDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.sep490.wcpms.entity.WaterMeter.MeterStatus;
import com.sep490.wcpms.entity.WaterServiceContract.WaterServiceContractStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaterMeterRepository extends JpaRepository<WaterMeter, Integer> {
    // Tự động có findById()
    /** THÊM HÀM NÀY: Tìm đồng hồ bằng mã (số serial) */
    Optional<WaterMeter> findByMeterCode(String meterCode);

    // --- SỬA LẠI HOÀN TOÀN CÂU QUERY NÀY ---
    /**
     * Lấy danh sách đồng hồ (ID, Mã, Địa chỉ) đang ở trạng thái INSTALLED
     * và thuộc về Hợp đồng Dịch vụ đang ACTIVE của một Khách hàng.
     * @param customerId ID của Khách hàng (Bảng 7)
     * @return Danh sách DTO đồng hồ rút gọn
     */
    @Query("SELECT DISTINCT new com.sep490.wcpms.dto.CustomerMeterDTO(wm.id, wm.meterCode, c.address) " +
            "FROM MeterInstallation mi " + // 1. Bắt đầu từ Bảng Lắp đặt (Bảng 13)
            "JOIN mi.waterMeter wm " + // 2. Join sang Đồng hồ (Bảng 12)
            "JOIN mi.waterServiceContract wsc " + // 3. Join sang HĐ Dịch vụ (Bảng 9)
            "JOIN wsc.customer c " + // 4. Join sang Khách hàng (Bảng 7)
            "WHERE c.id = :customerId " + // Lọc theo Khách hàng
            "AND wm.meterStatus = com.sep490.wcpms.entity.WaterMeter.MeterStatus.INSTALLED " + // Đồng hồ phải INSTALLED
            "AND wsc.contractStatus = com.sep490.wcpms.entity.WaterServiceContract.WaterServiceContractStatus.ACTIVE") // HĐ Dịch vụ phải ACTIVE
    List<CustomerMeterDTO> findActiveMetersByCustomerId(@Param("customerId") Integer customerId);
    // --- HẾT PHẦN SỬA ---
}