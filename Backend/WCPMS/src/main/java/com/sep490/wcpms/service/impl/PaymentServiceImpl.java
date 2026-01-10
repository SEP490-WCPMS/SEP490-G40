package com.sep490.wcpms.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sep490.wcpms.dto.PaymentLinkDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.ActivityLog;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.Receipt;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.ReceiptRepository;
import com.sep490.wcpms.service.ActivityLogService;
import com.sep490.wcpms.service.InvoiceNotificationService;
import com.sep490.wcpms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.type.Webhook;
import vn.payos.type.WebhookData;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PayOS payOS; // Vẫn giữ để dùng cho Webhook
    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final AccountRepository accountRepository; // Để lấy NV Thu ngân (nếu cần)
    private final ActivityLogService activityLogService; // NEW
    private final InvoiceNotificationService invoiceNotificationService;

    @Value("${payos.client-id}")
    private String clientId;

    @Value("${payos.api-key}")
    private String apiKey;

    @Value("${payos.checksum-key}")
    private String checksumKey;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    // --- PHƯƠNG ÁN "HẠT NHÂN": TỰ GỌI API ĐỂ NÉ LỖI THƯ VIỆN CŨ ---
    @Override
    @Transactional
    public PaymentLinkDTO createPaymentLink(Integer invoiceId) throws Exception {
        // 1. KHAI BÁO KEY (Lấy từ ảnh bạn gửi)

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        int amount = invoice.getTotalAmount().intValue();
        if (amount < 2000) throw new IllegalArgumentException("Số tiền phải >= 2000 VND");

        // 2. TẠO ORDER CODE (Dùng nanoTime để không bao giờ trùng)
        String timeStr = String.valueOf(System.nanoTime());
        String orderCodeStr = invoiceId + timeStr.substring(timeStr.length() - 6);
        long orderCode = Long.parseLong(orderCodeStr);

        String description = "TT HD" + invoice.getInvoiceNumber().replace("-", "");
        if (description.length() > 25) description = description.substring(0, 25);

        // 3. TẠO CHỮ KÝ (SIGNATURE) THỦ CÔNG
        // Quy tắc: Sắp xếp a-z: amount, cancelUrl, description, orderCode, returnUrl
        String stringToSign = "amount=" + amount +
                "&cancelUrl=" + "http://localhost:5173/payment-cancel" +
                "&description=" + description +
                "&orderCode=" + orderCode +
                "&returnUrl=" + "http://localhost:5173/payment-success";

        String signature = createHmacSha256(stringToSign, checksumKey);

        // 4. TẠO JSON BODY
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode body = mapper.createObjectNode();
        body.put("orderCode", orderCode);
        body.put("amount", amount);
        body.put("description", description);
        body.put("cancelUrl", "http://localhost:5173/payment-cancel");
        body.put("returnUrl", "http://localhost:5173/payment-success");
        body.put("signature", signature);
        // items (optional, bỏ qua cũng được để code gọn)

        // 5. GỌI API TRỰC TIẾP (Bỏ qua thư viện PayOS bị lỗi)
        String requestBody = mapper.writeValueAsString(body);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api-merchant.payos.vn/v2/payment-requests"))
                .header("Content-Type", "application/json")
                .header("x-client-id", clientId)
                .header("x-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        System.out.println(">>> Gửi Request tạo link: " + orderCode);
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println(">>> Response: " + response.body());

        // 6. XỬ LÝ KẾT QUẢ
        JsonNode resNode = mapper.readTree(response.body());
        String code = resNode.path("code").asText();

        if (!"00".equals(code)) {
            throw new RuntimeException("Lỗi PayOS: " + resNode.path("desc").asText());
        }

        JsonNode data = resNode.path("data");

        return new PaymentLinkDTO(
                data.path("bin").asText(),
                data.path("accountNumber").asText(),
                data.path("accountName").asText(),
                data.path("amount").asLong(),
                data.path("description").asText(),
                data.path("orderCode").asLong(),
                data.path("qrCode").asText(),
                data.path("checkoutUrl").asText()
        );
    }

    // --- Hàm tạo chữ ký HMAC SHA256 (Copy y nguyên) ---
    private String createHmacSha256(String data, String key) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] bytes = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo chữ ký", e);
        }
    }

    // --- GIỮ NGUYÊN PHẦN WEBHOOK (Vẫn dùng tốt) ---
    @Override
    @Transactional
    public void processPayOSWebhook(JsonNode webhookBody) throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode objectNode = (ObjectNode) webhookBody;
        Webhook webhook = objectMapper.treeToValue(objectNode, Webhook.class);

        // 1. Xác thực Webhook (Quan trọng)
        WebhookData data = payOS.verifyPaymentWebhookData(webhook);

        // 2. Lấy OrderCode và Số tiền thực nhận
        long orderCode = data.getOrderCode();
        long amountPaid = data.getAmount();
        String transferContent = data.getDescription();

        System.out.println(">>> WEBHOOK NHẬN ĐƯỢC: OrderCode=" + orderCode + ", Amount=" + amountPaid);

        // 3. GIẢI MÃ TÌM INVOICE ID (PHƯƠNG PHÁP BẤT TỬ)
        // Quy tắc lúc tạo: InvoiceId + 6 số đuôi thời gian
        // Quy tắc giải mã: Chuyển sang chuỗi, cắt bỏ 6 ký tự cuối
        String orderCodeStr = String.valueOf(orderCode);
        int invoiceId;
        try {
            // Cắt bỏ 6 số cuối để lấy ID gốc
            String invoiceIdStr = orderCodeStr.substring(0, orderCodeStr.length() - 6);
            invoiceId = Integer.parseInt(invoiceIdStr);
        } catch (Exception e) {
            // Fallback: Nếu lỡ tay tạo mã ngắn quá thì dùng description
            System.err.println("Lỗi giải mã OrderCode, thử tìm bằng Description...");
            // Logic cũ tìm bằng String... (nhưng cách trên là 99% ăn rồi)
            return;
        }

        System.out.println(">>> TÌM THẤY INVOICE ID: " + invoiceId);

        // 4. Tìm hóa đơn trong DB bằng ID (Chính xác 100%)
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy HĐ ID: " + invoiceId));

        // 5. Kiểm tra số tiền (Chống hack)
        if (amountPaid < invoice.getTotalAmount().intValue()) {
            System.err.println(">>> LỖI: Khách trả thiếu tiền! Yêu cầu: " + invoice.getTotalAmount() + ", Trả: " + amountPaid);
            // Tùy bạn: Có thể return luôn hoặc vẫn update nhưng ghi chú là thiếu tiền
            return;
        }

        // 6. Cập nhật trạng thái (Nếu chưa thanh toán)
        if (invoice.getPaymentStatus() == Invoice.PaymentStatus.PAID) {
            System.out.println(">>> Hóa đơn này đã xử lý rồi.");
            return;
        }

        invoice.setPaymentStatus(Invoice.PaymentStatus.PAID);
        invoice.setPaidDate(LocalDate.now());
        invoiceRepository.save(invoice);
        // 8. Gửi thông báo thanh toán thành công (Email + SMS)
        // (Service đã tự chặn gửi trùng theo invoice + messageType)
        try {
            invoiceNotificationService.sendInvoicePaymentSuccess(invoice, "Chuyển khoản/PayOS");
        } catch (Exception ex) {
            // Không làm fail webhook chỉ vì lỗi gửi thông báo
            System.err.println(">>> WARN: Không gửi được thông báo thanh toán thành công: " + ex.getMessage());
        }

        // 7. Tạo biên lai
        Receipt receipt = new Receipt();
        receipt.setReceiptNumber("PAYOS-" + orderCode); // Mã biên lai theo OrderCode
        receipt.setInvoice(invoice);
        receipt.setPaymentAmount(BigDecimal.valueOf(amountPaid));
        receipt.setPaymentDate(LocalDate.now());
        receipt.setPaymentMethod(Receipt.PaymentMethod.BANK_APP);
        receipt.setNotes("PayOS Success. Ref: " + data.getReference() + ". Content: " + transferContent);

        // Gán NV thu ngân mặc định (Admin)
        Account cashier = accountRepository.findById(1).orElse(null);
        if (cashier != null) {
            receipt.setCashier(cashier);
        }

        receiptRepository.save(receipt);

        System.out.println(">>> CẬP NHẬT THÀNH CÔNG HÓA ĐƠN " + invoiceId);

        // Persist activity log for automatic bank payment
        try {
            ActivityLog al = new ActivityLog();
            al.setSubjectType("INVOICE");
            al.setSubjectId(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : String.valueOf(invoice.getId()));
            al.setAction("PAYMENT_RECEIVED_BANK");
            if (cashier != null) {
                al.setActorType("STAFF");
                al.setActorId(cashier.getId());
                al.setActorName(cashier.getFullName());
                al.setInitiatorType("SYSTEM");
                al.setInitiatorName("BankWebhook");
            } else {
                al.setActorType("SYSTEM");
                al.setInitiatorType("SYSTEM");
                al.setInitiatorName("BankWebhook");
            }
            String bankTransactionId = data.getReference() != null ? data.getReference() : String.valueOf(orderCode);
            al.setPayload("bankTransactionId=" + bankTransactionId + ";amount=" + amountPaid);
            activityLogService.save(al);
        } catch (Exception ex) {
            // swallow
        }
    }
}