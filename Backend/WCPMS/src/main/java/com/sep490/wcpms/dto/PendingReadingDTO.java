package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Customer;
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
            if (mr.getMeterInstallation().getWaterServiceContract() != null) {
                Customer customer = mr.getMeterInstallation().getWaterServiceContract().getCustomer();
                if (customer != null) {
                    this.customerId = customer.getId();
                    this.customerCode = customer.getCustomerCode();
                    this.customerName = customer.getCustomerName();
                    this.customerAddress = customer.getAddress();
                }
            }
        }
    }
}