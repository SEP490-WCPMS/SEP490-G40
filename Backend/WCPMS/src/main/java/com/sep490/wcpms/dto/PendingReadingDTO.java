package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.MeterReading;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO hiển thị danh sách các chỉ số đã đọc, chờ Kế toán lập hóa đơn tiền nước.
 */
@Data
@NoArgsConstructor
public class PendingReadingDTO {

    private Integer readingId; // ID của bản ghi MeterReading
    private LocalDate readingDate;
    private BigDecimal consumption;
    private String meterCode;
    private Integer customerId;
    private String customerCode;
    private String customerName;
    private String customerAddress;
    private String readerName;

    // ========== THÊM MỚI (cho auto-assign) ==========
    private Integer accountingStaffId;
    private String accountingStaffName;
    // =================================================

    // Constructor để map từ Entity
    public PendingReadingDTO(MeterReading mr) {
        this.readingId = mr.getId();
        this.readingDate = mr.getReadingDate();
        this.consumption = mr.getConsumption();

        if (mr.getReader() != null) {
            this.readerName = mr.getReader().getFullName();
        }

        if (mr.getMeterInstallation() != null) {
            if (mr.getMeterInstallation().getWaterMeter() != null) {
                this.meterCode = mr.getMeterInstallation().getWaterMeter().getMeterCode();
            }
            // Lấy thông tin Customer từ Hợp đồng Dịch vụ
            MeterInstallation inst = mr.getMeterInstallation();
            Customer resolved = null;

            // 1) Nếu bản ghi lắp đặt đang trỏ trực tiếp tới 1 WaterServiceContract -> ưu tiên đó
            if (inst.getWaterServiceContract() != null && inst.getWaterServiceContract().getCustomer() != null) {
                resolved = inst.getWaterServiceContract().getCustomer();
            }
            // 2) Nếu không có, thử lấy từ Hợp đồng lắp đặt (Contract.primaryWaterContract)
            else if (inst.getContract() != null && inst.getContract().getPrimaryWaterContract() != null
                    && inst.getContract().getPrimaryWaterContract().getCustomer() != null) {
                resolved = inst.getContract().getPrimaryWaterContract().getCustomer();
            }
            // 3) Fallback: dùng trực tiếp customer trên bản ghi lắp đặt
            else if (inst.getCustomer() != null) {
                resolved = inst.getCustomer();
            }

            if (resolved != null) {
                this.customerId = resolved.getId();
                this.customerCode = resolved.getCustomerCode();
                this.customerName = resolved.getCustomerName();
                this.customerAddress = resolved.getAddress();
            }
        }

        // ========== THÊM MỚI ==========
        if (mr.getAccountingStaff() != null) {
            this.accountingStaffId = mr.getAccountingStaff().getId();
            this.accountingStaffName = mr.getAccountingStaff().getFullName();
        }
        // ==============================
    }
}