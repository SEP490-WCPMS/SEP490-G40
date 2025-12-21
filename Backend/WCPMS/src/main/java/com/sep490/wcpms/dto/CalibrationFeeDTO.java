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
        this.notes = calibration.getNotes();

        if (calibration.getMeter() != null) {
            this.meterCode = calibration.getMeter().getMeterCode();

            // 1. Kiểm tra xem Phí này ĐÃ CÓ HÓA ĐƠN chưa?
            if (calibration.getInvoice() != null) {
                // === NẾU ĐÃ CÓ HÓA ĐƠN -> LẤY KHÁCH HÀNG TỪ HÓA ĐƠN (LỊCH SỬ) ===
                Invoice invoice = calibration.getInvoice();
                if (invoice.getCustomer() != null) {
                    this.customerId = invoice.getCustomer().getId();
                    this.customerName = invoice.getCustomer().getCustomerName(); // Lấy Thắng
                    this.customerCode = invoice.getCustomer().getCustomerCode();
                    this.customerAddress = invoice.getCustomer().getAddress();
                    // (Lấy thêm SĐT nếu cần)
                }
            } else {
                // === NẾU CHƯA CÓ HÓA ĐƠN (Đang chờ duyệt) -> LẤY CHỦ HỢP ĐỒNG HIỆN TẠI (Thịnh) ===
                // (Logic cũ của chúng ta nằm ở đây)

                // Tìm bản ghi lắp đặt MỚI NHẤT
                MeterInstallation installation = calibration.getMeter().getInstallations()
                        .stream()
                        .sorted((a, b) -> b.getInstallationDate().compareTo(a.getInstallationDate()))
                        .findFirst().orElse(null);

                if (installation != null) {
                    // === SỬA LỖI TẠI ĐÂY ===
                    // Ưu tiên lấy khách hàng từ Hợp đồng hiện tại (vì HĐ có thể đã chuyển nhượng)
                    Contract contract = installation.getContract();
                    Customer currentCustomer = null;

                    if (contract != null && contract.getCustomer() != null) {
                        // Nếu có hợp đồng, lấy chủ sở hữu hiện tại của hợp đồng (Thịnh)
                        currentCustomer = contract.getCustomer();
                    } else {
                        // Fallback: Nếu không tìm thấy HĐ (ít khi xảy ra), lấy người lắp đặt ban đầu (Minh)
                        currentCustomer = installation.getCustomer();
                    }

                    if (currentCustomer != null) {
                        this.customerId = currentCustomer.getId();
                        this.customerName = currentCustomer.getCustomerName();
                        this.customerCode = currentCustomer.getCustomerCode();

                        // Logic lấy địa chỉ (giữ nguyên hoặc cập nhật theo customer mới)
                        this.customerAddress = currentCustomer.getAddress();
                        // (Nếu bạn muốn lấy địa chỉ lắp đặt từ contract thì dùng logic cũ ở đây)
                        if (contract != null && contract.getAddress() != null) {
                            if (contract.getAddress().getAddress() != null) {
                                this.customerAddress = contract.getAddress().getAddress();
                            }
                        }

                        if (currentCustomer.getAccount() != null) {
                            this.customerPhone = currentCustomer.getAccount().getPhone();
                            this.customerEmail = currentCustomer.getAccount().getEmail();
                        }
                    }

                    if (contract != null) {
                        this.contractId = contract.getId();
                    }
                }
            }
        }
    }
}