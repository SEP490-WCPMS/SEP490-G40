package com.sep490.wcpms.service;

import java.util.Map;

public interface PaymentService {

    /**
     * Xử lý thông báo thanh toán (payload) nhận được từ webhook của ngân hàng.
     * @param payload Dữ liệu JSON (đã parse thành Map) từ ngân hàng.
     */
    void processPaymentNotification(Map<String, Object> payload);
}