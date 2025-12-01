package com.sep490.wcpms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PaymentLinkDTO {
    private String bin; // Mã ngân hàng (VD: 970418)
    private String accountNumber; // Số tài khoản
    private String accountName; // Tên chủ TK
    private long amount; // Số tiền
    private String description; // Nội dung CK
    private long orderCode; // Mã đơn hàng (PayOS)
    private String qrCode; // Chuỗi mã QR
    private String checkoutUrl; // Link trang thanh toán của PayOS
}