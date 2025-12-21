package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CalibrationFeeDTO {
    private Integer calibrationId;
    private LocalDate calibrationDate;
    private BigDecimal calibrationCost;
    private String notes;
    private String meterCode;

    // Info khách hàng
    private Integer customerId;
    private String customerName;
    private String customerCode;
    private String customerAddress;
    private String customerPhone;
    private String customerEmail;
    private Integer contractId;

    public CalibrationFeeDTO(MeterCalibration calibration) {
        this.calibrationId = calibration.getId();
        this.calibrationDate = calibration.getCalibrationDate();
        this.calibrationCost = calibration.getCalibrationCost();
        this.notes = calibration.getNotes();

        if (calibration.getMeter() != null) {
            this.meterCode = calibration.getMeter().getMeterCode();

            // =================================================================
            // CASE 1: ĐÃ CÓ HÓA ĐƠN -> Lấy thông tin từ Invoice (Lịch sử)
            // =================================================================
            if (calibration.getInvoice() != null) {
                Invoice invoice = calibration.getInvoice();
                if (invoice.getCustomer() != null) {
                    this.customerId = invoice.getCustomer().getId();
                    this.customerName = invoice.getCustomer().getCustomerName();
                    this.customerCode = invoice.getCustomer().getCustomerCode();
                    this.customerAddress = invoice.getCustomer().getAddress();

                    // --- [BỔ SUNG ĐOẠN NÀY ĐỂ HIỆN SĐT & EMAIL] ---
                    if (invoice.getCustomer().getAccount() != null) {
                        this.customerPhone = invoice.getCustomer().getAccount().getPhone();
                        this.customerEmail = invoice.getCustomer().getAccount().getEmail();
                    }
                    // ----------------------------------------------
                }
            }
            // =================================================================
            // CASE 2: CHƯA CÓ HÓA ĐƠN -> Lấy chủ hợp đồng hiện tại
            // =================================================================
            else {
                MeterInstallation installation = calibration.getMeter().getInstallations()
                        .stream()
                        .sorted((a, b) -> b.getInstallationDate().compareTo(a.getInstallationDate()))
                        .findFirst().orElse(null);

                if (installation != null) {
                    Contract contract = installation.getContract();
                    Customer currentCustomer = null;

                    // Ưu tiên lấy Customer từ Contract
                    if (contract != null && contract.getCustomer() != null) {
                        currentCustomer = contract.getCustomer();
                    } else {
                        currentCustomer = installation.getCustomer();
                    }

                    if (currentCustomer != null) {
                        this.customerId = currentCustomer.getId();
                        this.customerName = currentCustomer.getCustomerName();
                        this.customerCode = currentCustomer.getCustomerCode();
                        this.customerAddress = currentCustomer.getAddress();

                        // Ưu tiên địa chỉ lắp đặt từ hợp đồng
                        if (contract != null && contract.getAddress() != null) {
                            if (contract.getAddress().getAddress() != null) {
                                this.customerAddress = contract.getAddress().getAddress();
                            } else {
                                String street = contract.getAddress().getStreet();
                                String ward = (contract.getAddress().getWard() != null) ? contract.getAddress().getWard().getWardName() : "";
                                this.customerAddress = street + (ward.isEmpty() ? "" : ", " + ward);
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