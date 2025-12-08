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

        if (wsc.getCustomer() != null) {
            Customer customer = wsc.getCustomer();
            this.customerName = customer.getCustomerName();
            // === [SỬA LẠI LOGIC LẤY ĐỊA CHỈ TẠI ĐÂY] ===
            String displayAddress = wsc.getCustomer().getAddress(); // Mặc định: Lấy của Customer

            // Ưu tiên 1: Lấy từ HĐ Dịch vụ (Bảng 9) -> Bảng Address
            if (wsc.getAddress() != null) {
                if (wsc.getAddress().getAddress() != null) {
                    displayAddress = wsc.getAddress().getAddress();
                } else {
                    // Tự ghép chuỗi nếu cần (Street + Ward)
                    String street = wsc.getAddress().getStreet();
                    String ward = wsc.getAddress().getWard() != null ? wsc.getAddress().getWard().getWardName() : "";
                    displayAddress = street + (ward.isEmpty() ? "" : ", " + ward);
                }
            }
            // Ưu tiên 2: Lấy từ HĐ Lắp đặt gốc (Bảng 8) -> Bảng Address
            else if (wsc.getSourceContract() != null && wsc.getSourceContract().getAddress() != null) {
                if (wsc.getSourceContract().getAddress().getAddress() != null) {
                    displayAddress = wsc.getSourceContract().getAddress().getAddress();
                } else {
                    String street = wsc.getSourceContract().getAddress().getStreet();
                    String ward = wsc.getSourceContract().getAddress().getWard() != null ? wsc.getSourceContract().getAddress().getWard().getWardName() : "";
                    displayAddress = street + (ward.isEmpty() ? "" : ", " + ward);
                }
            }

            this.customerAddress = displayAddress;
            // ===========================================

            if (customer.getAccount() != null) {
                this.customerPhone = customer.getAccount().getPhone();
                this.customerEmail = customer.getAccount().getEmail();
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