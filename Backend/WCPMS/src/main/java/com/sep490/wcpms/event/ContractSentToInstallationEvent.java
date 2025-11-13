package com.sep490.wcpms.event;

import org.springframework.context.ApplicationEvent;
import java.time.LocalDateTime;

public class ContractSentToInstallationEvent extends ApplicationEvent {
    private final Integer contractId;
    private final String contractNumber;
    private final Integer serviceStaffId;
    private final Integer technicalStaffId; // NV kỹ thuật được gán (có thể null)
    private final String customerName;
    private final LocalDateTime sentAt;

    public ContractSentToInstallationEvent(
            Object source,
            Integer contractId,
            String contractNumber,
            Integer serviceStaffId,
            Integer technicalStaffId,
            String customerName,
            LocalDateTime sentAt) {
        super(source);
        this.contractId = contractId;
        this.contractNumber = contractNumber;
        this.serviceStaffId = serviceStaffId;
        this.technicalStaffId = technicalStaffId;
        this.customerName = customerName;
        this.sentAt = sentAt;
    }

    public Integer getContractId() {
        return contractId;
    }

    public String getContractNumber() {
        return contractNumber;
    }

    public Integer getServiceStaffId() {
        return serviceStaffId;
    }

    public Integer getTechnicalStaffId() {
        return technicalStaffId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }
}

