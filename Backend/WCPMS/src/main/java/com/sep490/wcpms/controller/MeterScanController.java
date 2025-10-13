package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.MeterImageDTO;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;

@RestController
@RequestMapping("/api/meter-scan")
@CrossOrigin(origins = "*")
public class MeterScanController {

    @PostMapping(value = "/scan", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Map<String, String>> scan(@RequestBody MeterImageDTO dto) {
        Map<String, String> result = new HashMap<>();

        try {
            if (dto.getImageBase64() == null || dto.getImageBase64().isEmpty()) {
                result.put("error", "No image provided");
                return ResponseEntity.badRequest().body(result);
            }

            byte[] imageBytes = Base64.getDecoder().decode(dto.getImageBase64());

            try (ImageAnnotatorClient vision = ImageAnnotatorClient.create()) {
                Image img = Image.newBuilder().setContent(ByteString.copyFrom(imageBytes)).build();
                Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
                AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                        .addFeatures(feat)
                        .setImage(img)
                        .build();

                BatchAnnotateImagesResponse response = vision.batchAnnotateImages(Collections.singletonList(request));
                AnnotateImageResponse res = response.getResponsesList().get(0);

                if (res.hasError()) {
                    result.put("error", "Vision API error: " + res.getError().getMessage());
                    return ResponseEntity.status(500).body(result);
                }

                if (res.getTextAnnotationsList() == null || res.getTextAnnotationsList().isEmpty()) {
                    result.put("message", "Không phát hiện được chữ nào trong ảnh.");
                    return ResponseEntity.ok(result);
                }

                // ✅ Toàn bộ text OCR
                String description = res.getTextAnnotationsList().get(0).getDescription();
                System.out.println("Vision OCR:\n" + description);

                // ======= Bước 1: Tìm số gần chữ m³ nhất =======
                String reading = null;
                Pattern nearM3 = Pattern.compile("(\\d{3,8})\\s*(?:m|m³|m3|M3|M³)");
                Matcher mNear = nearM3.matcher(description);
                if (mNear.find()) {
                    reading = mNear.group(1);
                }

                // ======= Bước 2: Nếu chưa tìm thấy, fallback về số đầu tiên =======
                if (reading == null) {
                    Pattern numPattern = Pattern.compile("\\b\\d{4,8}\\b");
                    Matcher numMatcher = numPattern.matcher(description);
                    if (numMatcher.find()) {
                        reading = numMatcher.group();
                    }
                }

                // ======= Bước 3: Tìm mã ID đồng hồ (thường ở viền ngoài, không gần m³) =======
                // Loại bỏ số vừa được nhận là reading
                List<String> allNumbers = new ArrayList<>();
                Matcher all = Pattern.compile("\\b\\d{4,8}\\b").matcher(description);
                while (all.find()) {
                    String num = all.group();
                    if (!num.equals(reading)) {
                        allNumbers.add(num);
                    }
                }

                // Chọn số cuối cùng (vì ID thường nằm cuối hoặc ở viền)
                String meterId = allNumbers.isEmpty() ? null : allNumbers.get(allNumbers.size() - 1);

                result.put("reading", reading != null ? reading : "(Không tìm thấy số m³)");
                result.put("meterId", meterId != null ? meterId : "(Không tìm thấy ID)");

                return ResponseEntity.ok(result);
            }

        } catch (IOException ex) {
            ex.printStackTrace();
            result.put("error", "Server error: " + ex.getMessage());
            return ResponseEntity.status(500).body(result);
        } catch (IllegalArgumentException ex) {
            result.put("error", "Invalid base64 format");
            return ResponseEntity.badRequest().body(result);
        }
    }
}
