package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.WaterMeter;
import com.sep490.wcpms.dto.CustomerMeterDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // --- CHECK TRÙNG KHI TẠO MỚI ---
    boolean existsByMeterCode(String meterCode);
    boolean existsBySerialNumber(String serialNumber);

    // --- CHECK TRÙNG KHI CẬP NHẬT (Trừ ID hiện tại ra) ---
    boolean existsByMeterCodeAndIdNot(String meterCode, Integer id);
    boolean existsBySerialNumberAndIdNot(String serialNumber, Integer id);

    // --- PHÂN TRANG ---
    // Lấy tất cả (kể cả Retired)
    Page<WaterMeter> findAll(Pageable pageable);

    // Lấy tất cả ngoại trừ trạng thái cụ thể (ví dụ RETIRED)
    Page<WaterMeter> findByMeterStatusNot(WaterMeter.MeterStatus status, Pageable pageable);

    // --- SỬA LẠI HOÀN TOÀN CÂU QUERY NÀY ---
    /**
     * Lấy danh sách đồng hồ (ID, Mã, Địa chỉ) đang ở trạng thái INSTALLED
     * và thuộc về Hợp đồng Dịch vụ đang ACTIVE của một Khách hàng.
     * @param customerId ID của Khách hàng (Bảng 7)
     * @return Danh sách DTO đồng hồ rút gọn
     */


    /**
     * Lấy danh sách đồng hồ (ID, Mã, Địa chỉ) đang ở trạng thái INSTALLED.
     * ƯU TIÊN lấy địa chỉ lắp đặt cụ thể trong Hợp đồng (Bảng Address).
     * Nếu không có, mới lấy địa chỉ chung của Khách hàng.
     */
    @Query("SELECT DISTINCT new com.sep490.wcpms.dto.CustomerMeterDTO(" +
            "   wm.id, " +
            "   wm.meterCode, " +
            // Logic lấy địa chỉ:
            // 1. Lấy từ bảng Address của Hợp đồng (cột address đầy đủ)
            // 2. Nếu không có, lấy cột street
            // 3. Nếu vẫn không có, lấy địa chỉ của Customer (fallback)
            "   COALESCE(addr.address, addr.street, cust.address) " +
            ") " +
            "FROM MeterInstallation mi " +           // 1. Từ Bảng Lắp đặt
            "JOIN mi.waterMeter wm " +               // 2. Join Đồng hồ
            "JOIN mi.contract ctr " +                // 3. Join Hợp đồng Lắp đặt (quan trọng: lấy contract, ko phải waterServiceContract)
            "LEFT JOIN ctr.address addr " +          // 4. Join sang bảng Address (địa chỉ lắp đặt)
            "JOIN ctr.customer cust " +              // 5. Join Khách hàng
            "WHERE cust.id = :customerId " +
            "AND wm.meterStatus = com.sep490.wcpms.entity.WaterMeter.MeterStatus.INSTALLED " +
            // Đảm bảo chỉ lấy bản ghi lắp đặt MỚI NHẤT của đồng hồ đó (tránh lặp nếu đồng hồ từng được lắp chỗ khác)
            "AND mi.id = (SELECT MAX(mi2.id) FROM MeterInstallation mi2 WHERE mi2.waterMeter.id = wm.id)")
    List<CustomerMeterDTO> findActiveMetersByCustomerId(@Param("customerId") Integer customerId);
    // --- HẾT PHẦN SỬA ---
}