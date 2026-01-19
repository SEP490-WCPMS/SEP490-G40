package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.repository.CustomerNotificationRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.service.CustomerNotificationEmailService;
import com.sep490.wcpms.service.CustomerNotificationSmsService;
import com.sep490.wcpms.service.LeakDetectionNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeakDetectionNotificationServiceImpl implements LeakDetectionNotificationService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final CustomerNotificationSmsService smsNotificationService;

    private static final BigDecimal THRESHOLD_RATIO = new BigDecimal("3");

    @Override
    public void checkAndSendLeakWarning(Invoice currentWaterInvoice) {
        try {
            if (currentWaterInvoice == null
                    || currentWaterInvoice.getCustomer() == null
                    || currentWaterInvoice.getMeterReading() == null) {
                return;
            }

            boolean exists = notificationRepository.existsByInvoiceAndMessageType(
                    currentWaterInvoice,
                    CustomerNotification.CustomerNotificationMessageType.LEAK_WARNING
            );
            if (exists) {
                return;
            }

            Customer customer = currentWaterInvoice.getCustomer();

            List<Invoice> recent = invoiceRepository
                    .findTop4ByCustomerAndMeterReadingIsNotNullOrderByInvoiceDateDesc(customer);

            if (recent.size() < 2) {
                return;
            }

            Invoice first = recent.get(0);
            if (!first.getId().equals(currentWaterInvoice.getId())) {
                return;
            }

            BigDecimal currentConsumption = safe(currentWaterInvoice.getTotalConsumption());
            if (currentConsumption.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }

            // ===== NEW FORMULA START =====
            int prevCount = Math.min(3, recent.size() - 1); // số kỳ trước đang có (1..3)

            BigDecimal sumPrevConsumption = BigDecimal.ZERO;
            long sumPrevDays = 0L;

            for (int i = 1; i <= prevCount; i++) {
                Invoice prev = recent.get(i);
                sumPrevConsumption = sumPrevConsumption.add(safe(prev.getTotalConsumption()));
                sumPrevDays += safeBillingDays(prev);
            }

            if (sumPrevDays <= 0) {
                return;
            }

            // avg/day của các kỳ trước
            BigDecimal avgDailyPrev = sumPrevConsumption
                    .divide(BigDecimal.valueOf(sumPrevDays), 6, RoundingMode.HALF_UP);

            if (avgDailyPrev.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }

            // n ngày kỳ hiện tại (vd: 01->16 => 16 ngày)
            long currentDays = safeBillingDays(currentWaterInvoice);
            if (currentDays <= 0) {
                return;
            }

            // expected = avgDailyPrev * n
            BigDecimal expected = avgDailyPrev
                    .multiply(BigDecimal.valueOf(currentDays))
                    .setScale(2, RoundingMode.HALF_UP);

            if (expected.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }

            BigDecimal ratio = currentConsumption.divide(expected, 2, RoundingMode.HALF_UP);
            if (ratio.compareTo(THRESHOLD_RATIO) < 0) {
                return;
            }
            // ===== NEW FORMULA END =====

            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(currentWaterInvoice);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.LEAK_WARNING);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SYSTEM);
            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.METER_READING);
            n.setRelatedId(currentWaterInvoice.getMeterReading().getId());

            n.setMessageSubject("Cảnh báo rò rỉ nước");

            // Bạn yêu cầu: chỉ cần expected (không hiển thị avgPrev)
            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Hệ thống ghi nhận sản lượng sử dụng nước kỳ này cao hơn mức dự kiến.%n" +
                            "Sản lượng kỳ này: %s m³.%n" +
                            "Mức dự kiến (theo trung bình/ngày 3 kỳ gần nhất × %d ngày): %s m³.%n%n" +
                            "Đây có thể là dấu hiệu rò rỉ hoặc thiết bị đang sử dụng liên tục. " +
                            "Quý khách vui lòng kiểm tra các vị trí có khả năng rò rỉ trong nhà (ống ngầm, bể chứa, nhà vệ sinh...).%n" +
                            "Nếu cần hỗ trợ, vui lòng liên hệ Tổng đài chăm sóc khách hàng.%n%n" +
                            "Trân trọng.",
                    customer.getCustomerName(),
                    currentConsumption.toPlainString(),
                    currentDays,
                    expected.toPlainString()
            );

            n.setMessageContent(body);
            n.setStatus(CustomerNotification.CustomerNotificationStatus.PENDING);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.save(n);
            emailService.sendEmail(n);
            smsNotificationService.sendForNotification(n);

        } catch (Exception ex) {
            log.error("[LEAK-DETECTION] Error when checking leak warning for invoice {}: {}",
                    currentWaterInvoice != null ? currentWaterInvoice.getId() : null,
                    ex.getMessage(), ex);
        }
    }

    /**
     * Ưu tiên tính theo fromDate/toDate (inclusive).
     * Nếu thiếu from/to thì fallback theo số ngày của tháng (tự xử lý năm nhuận).
     */
    private long safeBillingDays(Invoice inv) {
        if (inv == null) return 0L;

        LocalDate from = inv.getFromDate();
        LocalDate to = inv.getToDate();
        if (from != null && to != null) {
            long days = ChronoUnit.DAYS.between(from, to) + 1; // inclusive
            return Math.max(0L, days);
        }

        LocalDate anchor = inv.getInvoiceDate();
        if (anchor == null && inv.getMeterReading() != null) {
            anchor = inv.getMeterReading().getReadingDate();
        }
        if (anchor != null) {
            return YearMonth.from(anchor).lengthOfMonth(); // tự tính 28/29/30/31
        }

        return 0L;
    }

    private BigDecimal safe(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}