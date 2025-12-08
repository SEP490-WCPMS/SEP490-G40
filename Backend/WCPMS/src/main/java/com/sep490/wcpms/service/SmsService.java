package com.sep490.wcpms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final RestTemplate restTemplate;

    @Value("${sms.provider.url}")
    private String apiUrl;

    @Value("${sms.provider.access-token}")
    private String accessToken;

    @Value("${sms.provider.sender-id}")
    private String senderId;

    @Value("${sms.provider.enabled}")
    private boolean isEnabled;

    /**
     * Gửi tin nhắn SMS bất đồng bộ (Async)
     * @param toPhone Số điện thoại người nhận (VD: 0912345678)
     * @param content Nội dung tin nhắn
     */
    @Async
    public void sendSms(String toPhone, String content) {
        // 1. Chế độ Test (Không gửi thật)
        if (!isEnabled) {
            log.info("==================================================");
            log.info("[SMS MOCK - GỬI GIẢ LẬP]");
            log.info("TO      : {}", toPhone);
            log.info("CONTENT : {}", content);
            log.info("==================================================");
            return;
        }

        // 2. Chế độ Gửi thật (Gọi API SpeedSMS)
        try {
            // Tạo Header (Basic Auth cho SpeedSMS: username=token, password=x)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String auth = accessToken + ":x";
            byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.UTF_8));
            String authHeader = "Basic " + new String(encodedAuth);
            headers.set("Authorization", authHeader);

            // Tạo Body
            Map<String, Object> body = new HashMap<>();
            body.put("to", new String[]{toPhone}); // SpeedSMS nhận mảng số điện thoại
            body.put("content", content);
            body.put("sms_type", 2); // 2: Tin nhắn CSKH (đầu số ngẫu nhiên), 4: Brandname

            if (senderId != null && !senderId.isEmpty()) {
                body.put("sender", senderId);
            }

            // Đóng gói Request
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            // Gửi POST
            log.info("Đang gửi SMS tới {} qua SpeedSMS...", toPhone);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Gửi SMS thành công: {}", response.getBody());
            } else {
                log.error("Gửi SMS thất bại. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
            }

        } catch (Exception e) {
            log.error("Lỗi khi gọi API SMS: {}", e.getMessage());
        }
    }
}