package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.ActivityLog;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.Receipt;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.ReceiptRepository;
import com.sep490.wcpms.service.ActivityLogService;
import com.sep490.wcpms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final AccountRepository accountRepository; // Để lấy NV Thu ngân (nếu cần)
    private final ActivityLogService activityLogService; // NEW

    @Override
    @Transactional
    public void processPaymentNotification(Map<String, Object> payload) {
        // --- GIẢ ĐỊNH CẤU TRÚC PAYLOAD (Cần điều chỉnh theo tài liệu của Ngân hàng) ---
        // { "transactionId": "FT25345345", "amount": 108000, "description": "HD-12345" }

        String bankTransactionId = (String) payload.get("transactionId");
        // Nội dung chuyển khoản (chính là invoice_number)
        String message = (String) payload.get("description");
        BigDecimal amountPaid = new BigDecimal(payload.get("amount").toString());
        // ---

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Webhook không có Nội dung (description/message). Bỏ qua.");
        }

        // 1. Tìm Hóa đơn (Bảng 17) dựa trên Số Hóa đơn trong nội dung
        // (Bạn cần thêm hàm findByInvoiceNumber vào InvoiceRepository)
        Invoice invoice = invoiceRepository.findByInvoiceNumber(message.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Hóa đơn khớp với nội dung: " + message));

        // 2. Kiểm tra Hóa đơn
        if (invoice.getPaymentStatus() == Invoice.PaymentStatus.PAID) {
            System.err.println("Cảnh báo: Hóa đơn " + message + " đã được thanh toán trước đó. Bỏ qua.");
            return; // Đã xử lý rồi, không làm gì cả
        }

        // 3. Kiểm tra Số tiền
        // (Cho phép sai số nhỏ, ví dụ 1 VND)
        if (amountPaid.compareTo(invoice.getTotalAmount()) != 0) {
            // Tạm thời chỉ log cảnh báo, nhưng vẫn ghi nhận (hoặc chuyển sang PARTIALLY_PAID)
            System.err.println("Cảnh báo: Số tiền thanh toán (" + amountPaid +
                    ") không khớp 100% với Hóa đơn (" + invoice.getTotalAmount() + ").");
        }

        // 4. CẬP NHẬT HÓA ĐƠN (Bảng 17)
        invoice.setPaymentStatus(Invoice.PaymentStatus.PAID);
        invoice.setPaidDate(LocalDate.now());
        invoiceRepository.save(invoice);

        // 5. TẠO BIÊN LAI (Bảng 19)
        Receipt receipt = new Receipt();
        receipt.setReceiptNumber("BL-" + bankTransactionId); // Dùng mã giao dịch NH
        receipt.setInvoice(invoice);
        receipt.setPaymentAmount(amountPaid);
        receipt.setPaymentDate(LocalDate.now());
        receipt.setPaymentMethod(Receipt.PaymentMethod.BANK_APP); // Thanh toán qua App

        // Gán cho 1 NV Thu ngân (ví dụ ID 2 'thungan')
        Account cashier = accountRepository.findById(2)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Thu ngân (ID 2)"));
        receipt.setCashier(cashier);

        receipt.setNotes("Thanh toán tự động qua VietQR. Mã GD ngân hàng: " + bankTransactionId);

        receiptRepository.save(receipt);

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
            al.setPayload("bankTransactionId=" + bankTransactionId + ";amount=" + amountPaid.toString());
            activityLogService.save(al);
        } catch (Exception ex) {
            // swallow
        }
    }
}