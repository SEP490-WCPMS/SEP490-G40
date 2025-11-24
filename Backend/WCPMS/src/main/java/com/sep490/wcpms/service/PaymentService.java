package com.sep490.wcpms.service;

import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode; // Import mới
import com.sep490.wcpms.dto.PaymentLinkDTO; // Sẽ tạo DTO này sau

public interface PaymentService {

    /** Xử lý Webhook từ PayOS */
    void processPayOSWebhook(JsonNode webhookData) throws Exception;

    /** Tạo Link thanh toán cho Hóa đơn */
    PaymentLinkDTO createPaymentLink(Integer invoiceId) throws Exception;
}