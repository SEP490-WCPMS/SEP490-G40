package com.sep490.wcpms.scheduler;

import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LateFeeScheduler {

    private static final Logger logger = LoggerFactory.getLogger(LateFeeScheduler.class);
    private final InvoiceRepository invoiceRepository;

    /**
     * Chạy mỗi ngày vào lúc 00:01 sáng (1 phút sau nửa đêm).
     * Cron expression: "giây phút giờ ngày tháng thứ"
     */
    @Scheduled(cron = "0 1 0 * * ?")
    @Transactional
    public void calculateLateFees() {
        logger.info("Bắt đầu tác vụ tự động: Tính phí phạt trả chậm...");

        LocalDate today = LocalDate.now();

        // 1. Tìm các hóa đơn quá hạn cần xử lý
        List<Invoice> overdueInvoices = invoiceRepository.findOverdueInvoices(today);

        if (overdueInvoices.isEmpty()) {
            logger.info("Không có hóa đơn nào quá hạn hôm nay.");
            return;
        }

        int count = 0;
        // Mức phí phạt cố định (hoặc bạn có thể tính %: invoice.getTotalAmount().multiply(0.05))
        BigDecimal penaltyFee = new BigDecimal("35000");

        for (Invoice invoice : overdueInvoices) {
            try {
                // 2. Cập nhật thông tin
                invoice.setLatePaymentFee(penaltyFee);

                // Cộng thêm vào tổng tiền
                BigDecimal newTotal = invoice.getTotalAmount().add(penaltyFee);
                invoice.setTotalAmount(newTotal);

                // Đổi trạng thái sang OVERDUE
                invoice.setPaymentStatus(Invoice.PaymentStatus.OVERDUE);

                // Ghi chú (Optional)
                // invoice.setNotes(invoice.getNotes() + " (Đã cộng phí phạt quá hạn)"); // Bỏ dòng này nếu Invoice không có notes

                invoiceRepository.save(invoice);
                count++;

                // (Nâng cao: Có thể gửi Email/SMS thông báo cho khách hàng tại đây)

            } catch (Exception e) {
                logger.error("Lỗi khi xử lý hóa đơn ID " + invoice.getId(), e);
            }
        }

        logger.info("Hoàn tất. Đã cập nhật phí phạt cho " + count + " hóa đơn.");
    }
}