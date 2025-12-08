package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.entity.MeterInstallation; // <-- THÊM IMPORT
import com.sep490.wcpms.entity.WaterMeter; // <-- THÊM IMPORT
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Comparator; // <-- THÊM IMPORT

/**
 * DTO đại diện cho một Hợp đồng Dịch vụ (Bảng 9)
 * dùng trong trang Quản lý Tuyến đọc.
 * (ĐÃ SỬA LỖI LOGIC)
 */
@Data
@NoArgsConstructor
public class RouteManagementDTO {

    private Integer contractId; // ID của WaterServiceContract (Bảng 9)
    private String customerName;
    private String customerAddress;
    private String meterCode; // (Sẽ được lấy từ Bảng 10/13)
    private Integer routeOrder; // Thứ tự hiện tại

    // Constructor (Sửa lại)
    public RouteManagementDTO(WaterServiceContract wsc) {
        this.contractId = wsc.getId();
        this.routeOrder = wsc.getRouteOrder();

        if (wsc.getCustomer() != null) {
            this.customerName = wsc.getCustomer().getCustomerName();
            // --- SỬA LOGIC LẤY ĐỊA CHỈ TẠI ĐÂY ---
            String displayAddress = wsc.getCustomer().getAddress(); // Mặc định: Địa chỉ KH

            // Ưu tiên 1: Địa chỉ từ Hợp đồng Dịch vụ (Bảng 9)
            if (wsc.getAddress() != null) {
                if (wsc.getAddress().getAddress() != null) {
                    displayAddress = wsc.getAddress().getAddress();
                } else {
                    displayAddress = wsc.getAddress().getStreet(); // Hoặc ghép chuỗi
                }
            }
            // Ưu tiên 2: Địa chỉ từ Hợp đồng Gốc (Bảng 8)
            else if (wsc.getSourceContract() != null && wsc.getSourceContract().getAddress() != null) {
                if (wsc.getSourceContract().getAddress().getAddress() != null) {
                    displayAddress = wsc.getSourceContract().getAddress().getAddress();
                } else {
                    displayAddress = wsc.getSourceContract().getAddress().getStreet();
                }
            }

            this.customerAddress = displayAddress;
            // ------------------------------------
        }

        // --- SỬA LỖI LOGIC LẤY MÃ ĐỒNG HỒ ---

        // XÓA CODE CŨ:
        // this.meterCode = wsc.getCustomer().getMeterCode(); // <-- SAI!

        // THÊM CODE MỚI:
        // Lấy đồng hồ từ Hợp đồng Dịch vụ (Bảng 9)
        // -> Danh sách Lắp đặt (Bảng 13)
        // -> Lấy cái MỚI NHẤT
        // -> Đồng hồ (Bảng 10)

        // --- SỬA LỖI LOGIC LẤY MÃ ĐỒNG HỒ (Lần 2) ---

        if (wsc.getMeterInstallations() != null && !wsc.getMeterInstallations().isEmpty()) {

            // Tìm bản ghi lắp đặt (Bảng 13) MỚI NHẤT
            // VÀ đồng hồ (Bảng 10) phải đang ở trạng thái "INSTALLED"
            MeterInstallation activeInstallation = wsc.getMeterInstallations().stream()
                    // 1. Lọc: Chỉ giữ lại những bản ghi có đồng hồ đang INSTALLED
                    .filter(mi -> mi.getWaterMeter() != null &&
                            mi.getWaterMeter().getMeterStatus() == WaterMeter.MeterStatus.INSTALLED)
                    // 2. Sắp xếp: Lấy cái mới nhất (theo ngày lắp đặt)
                    .sorted(Comparator.comparing(MeterInstallation::getInstallationDate).reversed())
                    .findFirst() // Lấy cái đầu tiên
                    .orElse(null); // Nếu không có cái nào INSTALLED, trả về null

            if (activeInstallation != null) {
                // Lấy meterCode từ Bảng 10 (của đồng hồ đang INSTALLED)
                this.meterCode = activeInstallation.getWaterMeter().getMeterCode();
            } else {
                this.meterCode = "N/A (No INSTALLED Meter)"; // Không có đồng hồ nào đang chạy
            }
        } else {
            this.meterCode = "N/A (No Install Record)"; // Không có lịch sử lắp đặt
        }
        // --- HẾT PHẦN SỬA ---
    }
}