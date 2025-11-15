package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Receipt;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ReceiptDTO {
    private Integer id;
    private String receiptNumber;
    private BigDecimal paymentAmount;
    private LocalDate paymentDate;
    private Receipt.PaymentMethod paymentMethod;
    private String cashierName;
    private String invoiceNumber;
}