package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO hiển thị các khoản phí kiểm định chưa được lập hóa đơn.
 */
@Data
public class CalibrationFeeDTO {
    private Integer calibrationId; // ID của Bảng 14
    private LocalDate calibrationDate;
    private BigDecimal calibrationCost;
    private String notes;
    private String meterCode;
    // --- THÊM CÁC TRƯỜNG ĐỂ PRE-FILL FORM ---
    private Integer customerId;
    private String customerName;
    private String customerCode;
    private String customerAddress;
    private String customerPhone; // (Lấy từ Account)
    private String customerEmail; // (Lấy từ Account)
    private Integer contractId; // ID HĐ Lắp đặt (Bảng 8)
    // --- HẾT PHẦN THÊM ---

    // Constructor (Sửa lại)
    public CalibrationFeeDTO(MeterCalibration calibration) {
        this.calibrationId = calibration.getId();
        this.calibrationDate = calibration.getCalibrationDate();
        this.calibrationCost = calibration.getCalibrationCost();
        this.notes = calibration.getNotes(); // Đây là Ghi chú của Kỹ thuật

        if (calibration.getMeter() != null) {
            this.meterCode = calibration.getMeter().getMeterCode();

            // Tìm bản ghi lắp đặt MỚI NHẤT của đồng hồ này
            MeterInstallation installation = calibration.getMeter().getInstallations()
                    .stream()
                    .sorted((a, b) -> b.getInstallationDate().compareTo(a.getInstallationDate()))
                    .findFirst().orElse(null);

            if (installation != null && installation.getCustomer() != null) {
                var customer = installation.getCustomer();
                this.customerId = customer.getId();
                this.customerName = customer.getCustomerName();
                this.customerCode = customer.getCustomerCode();
                // ==================================================================
                // === SỬA TẠI ĐÂY: LOGIC ƯU TIÊN ĐỊA CHỈ HỢP ĐỒNG (CONTRACT) ===
                // ==================================================================

                // 1. Mặc định gán tạm địa chỉ của Khách hàng (đề phòng HĐ không có địa chỉ)
                this.customerAddress = customer.getAddress();

                // 2. Kiểm tra trong Hợp Đồng (Contract) có địa chỉ lắp đặt không?
                Contract contract = installation.getContract();
                if (contract != null && contract.getAddress() != null) {
                    // Nếu bảng Address là một Entity riêng (có street, ward, district...)
                    // Bạn cần ghép chuỗi hoặc lấy trường cụ thể. Ví dụ:
                    if (contract.getAddress().getAddress() != null && !contract.getAddress().getAddress().isEmpty()) {
                        // Ưu tiên cao nhất: Lấy trường address full trong bảng Address của HĐ
                        this.customerAddress = contract.getAddress().getAddress();
                    } else {
                        // Nếu trường address full rỗng, thử ghép Street + Ward (tùy cấu trúc DB của bạn)
                        String street = contract.getAddress().getStreet();
                        String ward = (contract.getAddress().getWard() != null) ? contract.getAddress().getWard().getWardName() : "";
                        this.customerAddress = street + (ward.isEmpty() ? "" : ", " + ward);
                    }
                }
                // ==================================================================


                if (customer.getAccount() != null) {
                    this.customerPhone = customer.getAccount().getPhone();
                    this.customerEmail = customer.getAccount().getEmail();
                }
            }

            if (installation != null && installation.getContract() != null) {
                this.contractId = installation.getContract().getId();
            }
        }
    }
}