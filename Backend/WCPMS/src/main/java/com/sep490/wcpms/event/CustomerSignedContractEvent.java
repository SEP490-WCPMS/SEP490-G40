package com.sep490.wcpms.event;

import org.springframework.context.ApplicationEvent;
import java.time.LocalDateTime;

public class CustomerSignedContractEvent extends ApplicationEvent {
    private final Integer contractId;
    private final String contractNumber;
    private final Integer serviceStaffId;  // Notify Service Staff
    private final String customerName;
    private final LocalDateTime signedAt;
    private final Integer customerAccountId; // account id of customer who signed

    public CustomerSignedContractEvent(
            Object source,
            Integer contractId,
            String contractNumber,
            Integer serviceStaffId,
            String customerName,
            LocalDateTime signedAt,
            Integer customerAccountId) {
        super(source);
        this.contractId = contractId;
        this.contractNumber = contractNumber;
        this.serviceStaffId = serviceStaffId;
        this.customerName = customerName;
        this.signedAt = signedAt;
        this.customerAccountId = customerAccountId;
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

    public String getCustomerName() {
        return customerName;
    }

    public LocalDateTime getSignedAt() {
        return signedAt;
    }

    public Integer getCustomerAccountId() {
        return customerAccountId;
    }
}
