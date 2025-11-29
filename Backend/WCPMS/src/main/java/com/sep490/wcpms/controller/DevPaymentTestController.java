package com.sep490.wcpms.controller;

import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.service.InvoiceNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
// @Profile("local") // nếu bạn có profile local thì bật dòng này để tránh chạy ở môi trường khác
public class DevPaymentTestController {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceNotificationService invoiceNotificationService;

    /**
     * API test local:
     *  - Đặt invoice sang PAID (nếu chưa)
     *  - Gọi sendInvoicePaymentSuccess(...) để tạo CustomerNotification + gửi email
     *
     * Ví dụ gọi:
     *  POST /api/v1/dev/invoices/33/simulate-payment-success?method=Thanh+toán+test+local
     */
    @PostMapping("/invoices/{id}/simulate-payment-success")
    public ResponseEntity<String> simulatePaymentSuccess(
            @PathVariable Integer id,
            @RequestParam(name = "method", defaultValue = "Thanh toán test (local)") String paymentMethodLabel
    ) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID = " + id));

        // Đảm bảo đã PAID
        invoice.setPaymentStatus(Invoice.PaymentStatus.PAID);
        if (invoice.getPaidDate() == null) {
            invoice.setPaidDate(LocalDate.now());
        }
        invoiceRepository.save(invoice);

        // Gọi service gửi thông báo thanh toán thành công
        invoiceNotificationService.sendInvoicePaymentSuccess(invoice, paymentMethodLabel);

        return ResponseEntity.ok("Đã giả lập thanh toán thành công cho hóa đơn " + invoice.getInvoiceNumber());
    }
}
