package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.PaymentLinkDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.CustomerNotification;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerNotificationSmsService {

    private final SmsService smsService;
    private final ContractRepository contractRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentService paymentService;  // Lấy STK, tên TK từ PayOS

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter MONTH_YEAR_FMT = DateTimeFormatter.ofPattern("MM/yyyy");

    /**
     * Gửi SMS cho 1 CustomerNotification đã lưu trong DB.
     */
    public void sendForNotification(CustomerNotification notification) {
        try {
            if (notification == null) return;

            Customer customer = notification.getCustomer();
            if (customer == null) {
                log.warn("[CN-SMS] notification id={} không có customer, bỏ qua.", notification.getId());
                return;
            }

            String phone = resolveCustomerPhone(customer);
            if (phone == null) {
                log.warn("[CN-SMS] customer id={} không có số điện thoại, bỏ qua SMS.", customer.getId());
                return;
            }

            boolean hasEmail = hasEmail(customer);

            String smsContent = buildSmsContent(notification, customer, hasEmail);
            if (smsContent == null || smsContent.isBlank()) {
                log.info("[CN-SMS] Không có nội dung SMS cho messageType={}, notification id={}",
                        notification.getMessageType(), notification.getId());
                return;
            }

            smsService.sendSms(phone, smsContent);

        } catch (Exception e) {
            log.error("[CN-SMS] Lỗi khi gửi SMS cho notification id={}: {}",
                    notification.getId(), e.getMessage(), e);
        }
    }

    // ================== BUILD NỘI DUNG CHÍNH ==================

    private String buildSmsContent(CustomerNotification notification,
                                   Customer customer,
                                   boolean hasEmail) {

        CustomerNotification.CustomerNotificationMessageType type = notification.getMessageType();
        if (type == null) return null;

        // Lấy Contract nếu relatedType = CONTRACT
        Contract contract = null;
        if (notification.getRelatedType() == CustomerNotification.CustomerNotificationRelatedType.CONTRACT
                && notification.getRelatedId() != null) {
            contract = contractRepository.findById(notification.getRelatedId()).orElse(null);
        }

        // Invoice: ưu tiên lấy từ field invoice trong notification
        Invoice invoice = notification.getInvoice();

        String contractNumber = (contract != null && contract.getContractNumber() != null)
                ? contract.getContractNumber()
                : (invoice != null && invoice.getContract() != null
                ? invoice.getContract().getContractNumber()
                : null);

        return switch (type) {
            case ACCOUNT_CREATED -> buildAccountCreatedSms(notification, customer, hasEmail, contractNumber);
            case REGISTRATION_RECEIVED ->
                    buildRegistrationReceivedSms(notification, customer, hasEmail, contractNumber);
            case TECHNICAL_SURVEY_RESULT -> buildSurveyResultSms(notification, customer, hasEmail, contractNumber);
            case CONTRACT_READY_TO_SIGN ->
                    buildContractReadyToSignSms(notification, customer, hasEmail, contractNumber);
            case CONTRACT_ACTIVATED -> buildContractActivatedSms(notification, customer, hasEmail, contract);
            case WATER_BILL_ISSUED -> buildWaterBillIssuedSms(notification, customer, hasEmail, invoice);
            case INSTALLATION_INVOICE_ISSUED ->
                    buildInstallationInvoiceIssuedSms(notification, customer, hasEmail, invoice, contractNumber);
            case SERVICE_INVOICE_ISSUED -> buildServiceInvoiceIssuedSms(notification, customer, hasEmail, invoice);
            case PAYMENT_REMINDER -> buildPaymentReminderSms(notification, customer, hasEmail, invoice);
            case LATE_PAYMENT_NOTICE -> buildLatePaymentNoticeSms(notification, customer, hasEmail, invoice);
            case INVOICE_PAYMENT_SUCCESS -> buildInvoicePaymentSuccessSms(notification, customer, hasEmail, invoice);
            case CONTRACT_EXPIRY_REMINDER -> buildContractExpiryReminderSms(notification, customer, hasEmail, contract);
            case LEAK_WARNING -> buildLeakWarningSms(notification, customer, hasEmail);
            default -> buildGeneralSms(notification, customer, hasEmail);
        };
    }

    // ---------- TỪNG TEMPLATE CỤ THỂ ----------

    private String buildAccountCreatedSms(CustomerNotification n,
                                          Customer customer,
                                          boolean hasEmail,
                                          String contractNumber) {
        return String.format(
                "Cap nuoc Phu Tho: Tai khoan khach hang da duoc tao cho hop dong %s. " +
                        "Neu chua nhan duoc mat khau, vui long lien he nhan vien ho tro.",
                safe(contractNumber)
        );
    }

    private String buildRegistrationReceivedSms(CustomerNotification n,
                                                Customer customer,
                                                boolean hasEmail,
                                                String contractNumber) {
        String base = String.format(
                "Cap nuoc Phu Tho: Da tiep nhan yeu cau dau noi nuoc ma hop dong %s. ",
                safe(contractNumber)
        );
        if (hasEmail) {
            return base + "Vui long kiem tra email de xem thong tin chi tiet ho so dang ky.";
        } else {
            return base + "Nhan vien se lien he de xac nhan thong tin va hen lich khao sat.";
        }
    }

    private String buildSurveyResultSms(CustomerNotification n,
                                        Customer customer,
                                        boolean hasEmail,
                                        String contractNumber) {
        String base = String.format(
                "Cap nuoc Phu Tho: Da hoan tat khao sat ky thuat cho hop dong %s. ",
                safe(contractNumber)
        );
        if (hasEmail) {
            return base + "Vui long kiem tra email de xem ket qua khao sat va du toan chi phi chi tiet.";
        } else {
            return base + "Nhan vien se lien he de trao doi ket qua va huong dan buoc tiep theo.";
        }
    }

    private String buildContractReadyToSignSms(CustomerNotification n,
                                               Customer customer,
                                               boolean hasEmail,
                                               String contractNumber) {
        String base = String.format(
                "Cap nuoc Phu Tho: Hop dong cap nuoc so %s da duoc phe duyet va san sang ky. ",
                safe(contractNumber)
        );
        if (hasEmail) {
            return base + "Vui long kiem tra email de xem ban hop dong va huong dan ky.";
        } else {
            return base + "Vui long den quay giao dich hoac lien he nhan vien dich vu de duoc huong dan ky hop dong.";
        }
    }

    private String buildContractActivatedSms(CustomerNotification n,
                                             Customer customer,
                                             boolean hasEmail,
                                             Contract contract) {
        String number = contract != null ? contract.getContractNumber() : null;
        String start = contract != null && contract.getStartDate() != null
                ? contract.getStartDate().format(DATE_FMT) : "";
        String base = String.format(
                "Cap nuoc Phu Tho: Hop dong cap nuoc so %s da co hieu luc tu ngay %s. ",
                safe(number),
                start
        );
        if (hasEmail) {
            return base + "Vui long kiem tra email de xem chi tiet hop dong.";
        } else {
            return base + "Hoa don tien nuoc se duoc tinh tu ky doc nuoc ke tiep.";
        }
    }

    private String buildWaterBillIssuedSms(CustomerNotification n,
                                           Customer customer,
                                           boolean hasEmail,
                                           Invoice invoice) {
        if (invoice == null) return null;

        String ky = "";
        LocalDate from = invoice.getFromDate();
        if (from != null) {
            ky = from.format(MONTH_YEAR_FMT); // MM/yyyy
        }

        String base;
        if (!ky.isEmpty()) {
            base = String.format(
                    "Cap nuoc Phu Tho: Da phat hanh hoa don tien nuoc ky %s, so %s, so tien %sđ. ",
                    ky,
                    safe(invoice.getInvoiceNumber()),
                    invoice.getTotalAmount().toPlainString()
            );
        } else {
            base = String.format(
                    "Cap nuoc Phu Tho: Da phat hanh hoa don tien nuoc so %s, so tien %sđ. ",
                    safe(invoice.getInvoiceNumber()),
                    invoice.getTotalAmount().toPlainString()
            );
        }

        String bankLine = buildBankTransferLine(invoice);

        if (hasEmail) {
            return base
                    + "Quy khach co the thanh toan tai diem thu hoac chuyen khoan theo thong tin duoi day. "
                    + bankLine
                    + " Vui long kiem tra email de xem chi tiet hoa don.";
        } else {
            return base
                    + "Quy khach co the thanh toan tai diem thu hoac chuyen khoan theo thong tin duoi day. "
                    + bankLine;
        }
    }

    private String buildInstallationInvoiceIssuedSms(CustomerNotification n,
                                                     Customer customer,
                                                     boolean hasEmail,
                                                     Invoice invoice,
                                                     String contractNumber) {
        if (invoice == null) return null;
        String base = String.format(
                "Cap nuoc Phu Tho: Da phat hanh hoa don lap dat cho hop dong %s, so %s, so tien %sđ. ",
                safe(contractNumber),
                safe(invoice.getInvoiceNumber()),
                invoice.getTotalAmount().toPlainString()
        );

        String bankLine = buildBankTransferLine(invoice);

        if (hasEmail) {
            return base
                    + "Quy khach co the thanh toan truc tiep tai quay/diem thu hoac chuyen khoan. "
                    + bankLine
                    + " Vui long kiem tra email de xem chi tiet hoa don.";
        } else {
            return base
                    + "Quy khach co the thanh toan truc tiep tai quay/diem thu hoac chuyen khoan. "
                    + bankLine;
        }
    }

    private String buildServiceInvoiceIssuedSms(CustomerNotification n,
                                                Customer customer,
                                                boolean hasEmail,
                                                Invoice invoice) {
        if (invoice == null) return null;
        String base = String.format(
                "Cap nuoc Phu Tho: Da phat hanh hoa don dich vu so %s, so tien %sđ. ",
                safe(invoice.getInvoiceNumber()),
                invoice.getTotalAmount().toPlainString()
        );

        String bankLine = buildBankTransferLine(invoice);

        if (hasEmail) {
            return base
                    + "Quy khach co the thanh toan tai diem thu hoac chuyen khoan. "
                    + bankLine
                    + " Vui long kiem tra email de xem chi tiet.";
        } else {
            return base
                    + "Quy khach co the thanh toan tai diem thu hoac chuyen khoan. "
                    + bankLine;
        }
    }

    private String buildPaymentReminderSms(CustomerNotification n,
                                           Customer customer,
                                           boolean hasEmail,
                                           Invoice invoice) {
        if (invoice == null) return null;
        String due = invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : "";
        String base = String.format(
                "Cap nuoc Phu Tho: Nhac thanh toan hoa don so %s so tien %sđ, han den %s. ",
                safe(invoice.getInvoiceNumber()),
                invoice.getTotalAmount().toPlainString(),
                due
        );

        String bankLine = buildBankTransferLine(invoice);

        if (hasEmail) {
            return base
                    + "Quy khach co the thanh toan tai diem thu hoac chuyen khoan. "
                    + bankLine
                    + " Vui long kiem tra email de xem chi tiet hoa don.";
        } else {
            return base
                    + "Quy khach co the thanh toan tai diem thu hoac chuyen khoan. "
                    + bankLine
                    + " Neu da thanh toan, vui long bo qua tin nhan nay.";
        }
    }

    private String buildLatePaymentNoticeSms(CustomerNotification n,
                                             Customer customer,
                                             boolean hasEmail,
                                             Invoice invoice) {
        if (invoice == null) return null;

        String base = String.format(
                "Cap nuoc Phu Tho: Hoa don so %s da qua han, tong so tien hien tai %sđ. ",
                safe(invoice.getInvoiceNumber()),
                invoice.getTotalAmount().toPlainString()
        );

        String bankLine = buildBankTransferLine(invoice);

        if (hasEmail) {
            return base
                    + "De tranh bi tam ngung cap nuoc, vui long thanh toan som tai diem thu hoac chuyen khoan. "
                    + bankLine
                    + " Vui long kiem tra email de xem chi tiet phi nop muon.";
        } else {
            return base
                    + "De tranh bi tam ngung cap nuoc, vui long thanh toan som tai diem thu hoac chuyen khoan. "
                    + bankLine;
        }
    }

    private String buildInvoicePaymentSuccessSms(CustomerNotification n,
                                                 Customer customer,
                                                 boolean hasEmail,
                                                 Invoice invoice) {
        if (invoice == null) return null;

        String paidDateStr = invoice.getPaidDate() != null
                ? invoice.getPaidDate().format(DATE_FMT) : "";

        String base = String.format(
                "Cap nuoc Phu Tho: Da nhan thanh toan hoa don so %s so tien %sđ ngay %s. ",
                safe(invoice.getInvoiceNumber()),
                invoice.getTotalAmount().toPlainString(),
                paidDateStr
        );

        if (hasEmail) {
            return base + "Vui long kiem tra email de xem chi tiet hoa don da thanh toan.";
        } else {
            return base + "Xin cam on Quy khach. Neu can ban in hoa don, vui long den quay giao dich hoac lien he tong dai.";
        }
    }

    private String buildContractExpiryReminderSms(CustomerNotification n,
                                                  Customer customer,
                                                  boolean hasEmail,
                                                  Contract contract) {
        if (contract == null || contract.getEndDate() == null) return null;
        String end = contract.getEndDate().format(DATE_FMT);
        String number = contract.getContractNumber();
        String base = String.format(
                "Cap nuoc Phu Tho: Hop dong cap nuoc so %s se het han ngay %s. ",
                safe(number), end
        );
        if (hasEmail) {
            return base + "Vui long kiem tra email de xem chi tiet va huong dan gia han.";
        } else {
            return base + "Vui long lien he nhan vien dich vu/tong dai de duoc huong dan gia han hop dong.";
        }
    }

    private String buildLeakWarningSms(CustomerNotification n,
                                       Customer customer,
                                       boolean hasEmail) {
        String base = "Cap nuoc Phu Tho: San luong nuoc su dung ky nay tang bat thuong, co kha nang ro ri. ";
        if (hasEmail) {
            return base + "Vui long kiem tra email de xem chi tiet so lieu va khuyen nghi xu ly.";
        } else {
            return base + "Vui long kiem tra duong ong va thiet bi trong nha. Neu can ho tro, vui long lien he tong dai hoac nhan vien ky thuat.";
        }
    }

    private String buildGeneralSms(CustomerNotification n,
                                   Customer customer,
                                   boolean hasEmail) {
        String subject = n.getMessageSubject();
        String base = "Cap nuoc Phu Tho: " + (subject != null ? subject : "Thong bao tu he thong.");
        if (hasEmail) {
            return base + " Vui long kiem tra email de xem noi dung chi tiet.";
        } else {
            return base;
        }
    }

    // ================== HELPER ==================

    /**
     * Lấy thông tin STK + tên TK từ PayOS, ND CK = đúng invoiceNumber.
     */
    private String buildBankTransferLine(Invoice invoice) {
        if (invoice == null) return "";

        String invoiceNumber = invoice.getInvoiceNumber();
        if (invoiceNumber == null) invoiceNumber = "";

        try {
            PaymentLinkDTO link = paymentService.createPaymentLink(invoice.getId());
            if (link == null) {
                log.warn("[CN-SMS] PayOS trả null khi lấy bank info cho invoice {}", invoice.getId());
                return "";
            }

            String accNumber = link.getAccountNumber();
            String accName = link.getAccountName();

            return String.format(
                    "Thanh toan: tai diem thu/thu ngan hoac CK STK %s - %s. ND: %s.",
                    safe(accNumber),
                    safe(accName),
                    invoiceNumber
            );

        } catch (Exception ex) {
            log.error("[CN-SMS] Loi goi PayOS lay bank info cho invoice {}: {}",
                    invoice.getId(), ex.getMessage(), ex);
            return "";
        }
    }

    private String resolveCustomerPhone(Customer customer) {
        if (customer == null) return null;

        if (customer.getContactPersonPhone() != null
                && !customer.getContactPersonPhone().isBlank()) {
            return customer.getContactPersonPhone().trim();
        }

        if (customer.getAccount() != null) {
            if (customer.getAccount().getPhone() != null
                    && !customer.getAccount().getPhone().isBlank()) {
                return customer.getAccount().getPhone().trim();
            }
            String username = customer.getAccount().getUsername();
            if (username != null && username.matches("\\d{9,11}")) {
                return username;
            }
        }
        return null;
    }

    private boolean hasEmail(Customer customer) {
        if (customer == null) return false;

        return customer.getAccount() != null
                && customer.getAccount().getEmail() != null
                && !customer.getAccount().getEmail().isBlank();
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }
}