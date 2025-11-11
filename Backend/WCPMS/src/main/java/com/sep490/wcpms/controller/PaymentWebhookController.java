package com.sep490.wcpms.controller;

import com.sep490.wcpms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map; // Import Map

/**
 * Controller CÔNG KHAI (Public) để nhận thông báo (Webhook/IPN)
 * từ phía ngân hàng (VietQR/Napas) khi khách hàng thanh toán thành công.
 */
@RestController
@RequestMapping("/api/payment/webhook")
@RequiredArgsConstructor
@CrossOrigin("*") // Phải cho phép CORS vì ngân hàng sẽ gọi từ server lạ
public class PaymentWebhookController {

    private final PaymentService paymentService;

    /**
     * Endpoint để nhận thông báo thanh toán (thường là HTTP POST).
     * @param payload Nội dung JSON mà ngân hàng gửi
     * @return ResponseEntity
     */
    @PostMapping("/vietqr")
    public ResponseEntity<Map<String, String>> handleVietQRWebhook(
            @RequestBody Map<String, Object> payload
            // @RequestHeader("X-Bank-Signature") String signature // (Nâng cao: Kiểm tra chữ ký bí mật)
    ) {
        System.out.println("ĐÃ NHẬN WEBHOOK THANH TOÁN: " + payload.toString());

        try {
            // (Nâng cao: Cần kiểm tra 'signature' hoặc IP nguồn để đảm bảo request là từ ngân hàng)

            // Gọi Service để xử lý payload
            paymentService.processPaymentNotification(payload);

            // Trả về 200 OK để báo cho ngân hàng biết đã nhận
            // (Ngân hàng VietQR thường yêu cầu response cụ thể)
            Map<String, String> response = Map.of("status", "00", "message", "Success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("LỖI XỬ LÝ WEBHOOK: " + e.getMessage());
            // Trả về 500 hoặc 400 để ngân hàng biết và thử gửi lại
            Map<String, String> response = Map.of("status", "01", "message", "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}