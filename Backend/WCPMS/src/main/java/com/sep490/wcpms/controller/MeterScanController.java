package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.MeterImageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/meter-scan")
@CrossOrigin(origins = "*")
public class MeterScanController {

    @Autowired
    private RestTemplate restTemplate;

    private final String AI_SERVICE_URL = "http://localhost:8000/read_meter";

    @PostMapping(value = "/scan", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Map<String, String>> scan(@RequestBody MeterImageDTO dto) {
        Map<String, String> result = new HashMap<>();

        try {
            if (dto.getImageBase64() == null || dto.getImageBase64().isEmpty()) {
                result.put("error", "No image provided");
                return ResponseEntity.badRequest().body(result);
            }

            // 1. Lấy chuỗi gốc
            String cleanBase64 = dto.getImageBase64();

            // 2. Cắt bỏ header "data:image..." nếu có
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }

            // 3. Xóa ký tự xuống dòng/khoảng trắng (QUAN TRỌNG ĐỂ TRÁNH LỖI 400)
            cleanBase64 = cleanBase64.replaceAll("\\s", "");

            // 4. GIẢI MÃ CHUỖI SẠCH (Sửa lỗi tại đây)
            byte[] imageBytes = Base64.getDecoder().decode(cleanBase64);

            // --- GỌI PYTHON ---
            ByteArrayResource fileResource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return "image.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> aiResponse = restTemplate.postForEntity(
                    AI_SERVICE_URL,
                    requestEntity,
                    Map.class
            );

            Map<String, String> responseBody = aiResponse.getBody();
            System.out.println("AI Python Result: " + responseBody);

            return ResponseEntity.ok(responseBody);

        } catch (IllegalArgumentException ex) {
            // Đây là nơi bắt lỗi nếu Base64 sai định dạng
            System.err.println("Lỗi Base64: " + ex.getMessage());
            result.put("error", "Invalid base64 format: " + ex.getMessage());
            return ResponseEntity.badRequest().body(result);
        } catch (Exception ex) {
            ex.printStackTrace();
            result.put("error", "Lỗi hệ thống: " + ex.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
}