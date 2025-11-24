package com.sep490.wcpms.controller;

import com.sep490.wcpms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map; // Import Map
import com.fasterxml.jackson.databind.JsonNode; // Import
import com.sep490.wcpms.dto.PaymentLinkDTO; // Import

/**
 * Controller CÔNG KHAI (Public) để nhận thông báo (Webhook/IPN)
 * từ phía ngân hàng (VietQR/Napas) khi khách hàng thanh toán thành công.
 */
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@CrossOrigin("*") // Phải cho phép CORS vì ngân hàng sẽ gọi từ server lạ
public class PaymentWebhookController {

    private final PaymentService paymentService;

    // --- API NHẬN WEBHOOK TỪ PAYOS ---
    @PostMapping("/webhook/payos")
    public ResponseEntity<String> handlePayOSWebhook(@RequestBody JsonNode webhookBody) {
        try {
            // Gọi service để xác thực và xử lý
            paymentService.processPayOSWebhook(webhookBody);

            // PayOS yêu cầu trả về chuỗi "success" nếu thành công
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            System.err.println("LỖI WEBHOOK PAYOS (Đã bỏ qua để PayOS không retry): " + e.getMessage());
            e.printStackTrace();

            // QUAN TRỌNG: Vẫn phải trả về 200 OK "success"
            // Để PayOS biết là server mình vẫn sống và cho phép Lưu cấu hình.
            return ResponseEntity.ok("success");
        }
    }

    @PostMapping("/create-link/{invoiceId}")
    public ResponseEntity<?> createPaymentLink(@PathVariable Integer invoiceId) {
        try {
            PaymentLinkDTO dto = paymentService.createPaymentLink(invoiceId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            // 1. In lỗi đỏ lòm ra Console IntelliJ để bạn đọc
            System.err.println("LỖI TẠO LINK PAYOS: " + e.getMessage());
            e.printStackTrace();

            // 2. Trả lỗi về cho React hiển thị
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}