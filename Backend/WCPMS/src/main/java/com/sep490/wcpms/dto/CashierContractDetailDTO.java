package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.WaterMeter;
import com.sep490.wcpms.entity.WaterServiceContract;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Comparator;

/**
 * DTO (Read-only) hiển thị thông tin chi tiết
 * cho Thu ngân khi đi ghi chỉ số.
 */
@Data
@NoArgsConstructor
public class CashierContractDetailDTO {

    // Thông tin Khách hàng
    private String customerName;
    private String customerAddress;
    private String customerPhone;
    private String customerEmail;

    // Thông tin Hợp đồng/Tuyến
    private String serviceContractNumber; // Số HĐ (Bảng 9)
    private String routeName;
    private Integer routeOrder;

    // Thông tin Đồng hồ
    private String meterCode;

    // Constructor (Tự map)
    public CashierContractDetailDTO(WaterServiceContract wsc) {
        this.serviceContractNumber = wsc.getContractNumber();
        this.routeOrder = wsc.getRouteOrder();

        if (wsc.getReadingRoute() != null) {
            this.routeName = wsc.getReadingRoute().getRouteName();
        }

        // === SỬA LOGIC LẤY KHÁCH HÀNG TẠI ĐÂY ===

        Customer displayCustomer = wsc.getCustomer(); // Mặc định lấy từ HĐ Dịch vụ (có thể là Minh)

        // [QUAN TRỌNG] Kiểm tra Hợp đồng gốc (Contract) xem ai đang sở hữu
        if (wsc.getSourceContract() != null && wsc.getSourceContract().getCustomer() != null) {
            displayCustomer = wsc.getSourceContract().getCustomer(); // Lấy từ HĐ Gốc (Thịnh)
        }

        if (displayCustomer != null) {
            this.customerName = displayCustomer.getCustomerName(); // Hiện tên Thịnh

            // --- LOGIC LẤY ĐỊA CHỈ (Giữ nguyên hoặc tinh chỉnh) ---
            String displayAddress = displayCustomer.getAddress();

            // Ưu tiên 1: Địa chỉ từ Hợp đồng Dịch vụ (Bảng 9)
            if (wsc.getAddress() != null) {
                if (wsc.getAddress().getAddress() != null) {
                    displayAddress = wsc.getAddress().getAddress();
                } else {
                    displayAddress = wsc.getAddress().getStreet();
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
            // ===========================================
            // 2. Lấy SĐT và Email
            // Kiểm tra xem Customer có liên kết với Account không
            if (displayCustomer.getAccount() != null) {
                this.customerPhone = displayCustomer.getAccount().getPhone();
                this.customerEmail = displayCustomer.getAccount().getEmail();
            } else {
                // Fallback: Nếu không có Account, thử xem trong bảng Customer có lưu contact_phone không?
                // (Nếu bạn có thêm cột phụ trong bảng Customer)
                // this.customerPhone = displayCustomer.getContactPhone();

                this.customerPhone = "(Chưa cập nhật tài khoản)";
                this.customerEmail = "(Chưa cập nhật Email)";
            }
        }

        // Lấy đồng hồ INSTALLED (Logic đã sửa ở lần trước)
        if (wsc.getMeterInstallations() != null && !wsc.getMeterInstallations().isEmpty()) {
            MeterInstallation activeInstallation = wsc.getMeterInstallations().stream()
                    .filter(mi -> mi.getWaterMeter() != null &&
                            mi.getWaterMeter().getMeterStatus() == WaterMeter.MeterStatus.INSTALLED)
                    .sorted(Comparator.comparing(MeterInstallation::getInstallationDate).reversed())
                    .findFirst()
                    .orElse(null);

            if (activeInstallation != null) {
                this.meterCode = activeInstallation.getWaterMeter().getMeterCode();
            } else {
                this.meterCode = "N/A (Chưa có đồng hồ INSTALLED)";
            }
        } else {
            this.meterCode = "N/A (Không có bản ghi lắp đặt)";
        }
    }
}