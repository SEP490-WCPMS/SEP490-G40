package com.sep490.wcpms.mapper;

import com.sep490.wcpms.dto.ReceiptDTO;
import com.sep490.wcpms.entity.Receipt;
import org.springframework.stereotype.Component;

@Component
public class ReceiptMapper {

    public ReceiptDTO toDto(Receipt entity) {
        if (entity == null) return null;

        ReceiptDTO dto = new ReceiptDTO();
        dto.setId(entity.getId());
        dto.setReceiptNumber(entity.getReceiptNumber());
        dto.setPaymentAmount(entity.getPaymentAmount());
        dto.setPaymentDate(entity.getPaymentDate());
        dto.setPaymentMethod(entity.getPaymentMethod());

        if (entity.getCashier() != null) {
            dto.setCashierName(entity.getCashier().getFullName());
        }
        if (entity.getInvoice() != null) {
            dto.setInvoiceNumber(entity.getInvoice().getInvoiceNumber());
        }

        return dto;
    }
}