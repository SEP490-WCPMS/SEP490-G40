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
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeakDetectionNotificationServiceImpl implements LeakDetectionNotificationService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerNotificationRepository notificationRepository;
    private final CustomerNotificationEmailService emailService;
    private final CustomerNotificationSmsService smsNotificationService;

    private static final BigDecimal THRESHOLD_RATIO = new BigDecimal("1.5");

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

            if (recent.size() < 4) {
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

            BigDecimal sumPrev = BigDecimal.ZERO;
            for (int i = 1; i <= 3; i++) {
                sumPrev = sumPrev.add(safe(recent.get(i).getTotalConsumption()));
            }
            BigDecimal avgPrev = sumPrev.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
            if (avgPrev.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }

            BigDecimal ratio = currentConsumption.divide(avgPrev, 2, RoundingMode.HALF_UP);
            if (ratio.compareTo(THRESHOLD_RATIO) < 0) {
                return;
            }

            CustomerNotification n = new CustomerNotification();
            n.setCustomer(customer);
            n.setInvoice(currentWaterInvoice);
            n.setMessageType(CustomerNotification.CustomerNotificationMessageType.LEAK_WARNING);
            n.setIssuerRole(CustomerNotification.CustomerNotificationIssuerRole.SYSTEM);
            n.setRelatedType(CustomerNotification.CustomerNotificationRelatedType.METER_READING);
            n.setRelatedId(currentWaterInvoice.getMeterReading().getId());

            n.setMessageSubject("Cảnh báo rò rỉ nước");

            String body = String.format(
                    "Kính gửi Quý khách %s,%n%n" +
                            "Hệ thống ghi nhận sản lượng sử dụng nước kỳ này cao hơn bình thường.%n" +
                            "Sản lượng kỳ này: %s m³; trung bình 3 kỳ gần nhất: %s m³.%n%n" +
                            "Đây có thể là dấu hiệu rò rỉ hoặc thiết bị đang sử dụng liên tục. " +
                            "Quý khách vui lòng kiểm tra các vị trí có khả năng rò rỉ trong nhà (ống ngầm, bể chứa, nhà vệ sinh...).%n" +
                            "Nếu cần hỗ trợ, vui lòng liên hệ Tổng đài chăm sóc khách hàng.%n%n" +
                            "Trân trọng.",
                    customer.getCustomerName(),
                    currentConsumption.toPlainString(),
                    avgPrev.toPlainString()
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

    private BigDecimal safe(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}

