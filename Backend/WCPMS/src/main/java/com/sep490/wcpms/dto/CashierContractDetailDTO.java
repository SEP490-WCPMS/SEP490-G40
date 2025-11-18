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
            this.customerAddress = customer.getAddress();

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