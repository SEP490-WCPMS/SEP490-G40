package com.sep490.wcpms.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class SmsService {

    @Value("${httpsms.base-url}")
    private String baseUrl;

    @Value("${httpsms.api-key}")
    private String apiKey;

    // Số SIM trên điện thoại cài app httpSMS
    @Value("${httpsms.from-phone}")
    private String fromPhone;

    // Bật/tắt gửi thật (mock khi false)
    @Value("${httpsms.enabled:true}")
    private boolean enabled;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Gửi SMS cho số toPhone với nội dung content qua httpSMS.
     */
    @Async
    public void sendSms(String toPhone, String content) {
        if (toPhone == null || toPhone.isBlank()) {
            log.warn("[SMS] Không gửi SMS vì số điện thoại trống.");
            return;
        }

        if (content == null || content.isBlank()) {
            log.warn("[SMS] Không gửi SMS vì nội dung trống.");
            return;
        }

        if (!enabled) {
            // MOCK: chỉ log, không gọi API thật
            log.info("==================================================");
            log.info("[SMS MOCK - httpSMS]");
            log.info("TO      : {}", toPhone);
            log.info("CONTENT : {}", content);
            log.info("==================================================");
            return;
        }

        if (baseUrl == null || baseUrl.isBlank() ||
                apiKey == null || apiKey.isBlank() ||
                fromPhone == null || fromPhone.isBlank()) {
            log.error("[SMS] Cấu hình httpSMS thiếu (base-url/api-key/from-phone). Chỉ log, không gửi.");
            log.info("[SMS FALLBACK LOG] TO={}, CONTENT={}", toPhone, content);
            return;
        }

        try {
            String normalizedTo = normalizePhone(toPhone);
            String normalizedFrom = normalizePhone(fromPhone);

            String url = baseUrl.endsWith("/")
                    ? baseUrl + "messages/send"
                    : baseUrl + "/messages/send";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);

            HttpSmsRequest body = new HttpSmsRequest();
            body.setContent(content);
            body.setFrom(normalizedFrom);
            body.setTo(normalizedTo);
            body.setEncrypted(false);

            HttpEntity<HttpSmsRequest> entity = new HttpEntity<>(body, headers);

            log.info("[SMS] Gửi SMS qua httpSMS: {} -> {}", normalizedFrom, normalizedTo);
            long start = System.currentTimeMillis();

            ResponseEntity<String> response =
                    restTemplate.postForEntity(url, entity, String.class);

            long duration = System.currentTimeMillis() - start;
            log.info("[SMS] httpSMS response: status={}, time={}ms, body={}",
                    response.getStatusCode(), duration, response.getBody());
        } catch (Exception e) {
            log.error("[SMS] Lỗi khi gửi SMS bằng httpSMS: {}", e.getMessage(), e);
        }
    }

    /**
     * Chuẩn hoá số điện thoại về dạng +84xxxx...
     */
    private String normalizePhone(String phone) {
        if (phone == null) return null;

        // giữ lại số và dấu +
        String p = phone.trim().replaceAll("[^0-9+]", "");
        if (p.isBlank()) return null;

        // đổi 00xx -> +xx
        if (p.startsWith("00")) p = "+" + p.substring(2);

        // nếu bắt đầu bằng + thì giữ
        if (p.startsWith("+")) return p;

        // Vietnam common cases
        if (p.startsWith("0")) return "+84" + p.substring(1);
        if (p.startsWith("84")) return "+84" + p.substring(2);

        // fallback: chuỗi số thuần -> coi như VN nếu dài 9-11
        if (p.matches("^\\d{9,11}$")) return "+84" + p.replaceFirst("^0+", "");

        return p;
    }

    @Data
    private static class HttpSmsRequest {
        private String content;
        private boolean encrypted;
        private String from;
        private String to;
        // Nếu sau này cần thêm request_id, send_at... thì bổ sung ở đây
    }
}
