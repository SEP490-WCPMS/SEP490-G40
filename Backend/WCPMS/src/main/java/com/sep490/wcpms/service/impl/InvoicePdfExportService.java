package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterReading;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvoicePdfExportService {

    private final PdfExportService pdfExportService;

    // Thư mục lưu file PDF trên server
    private static final String BASE_DIR = "invoices-pdf";

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter MONTH_YEAR_FMT =
            DateTimeFormatter.ofPattern("MM/yyyy");

    private static final String[] NUM_WORDS = {
            "không", "một", "hai", "ba", "bốn", "năm",
            "sáu", "bảy", "tám", "chín"
    };

    private String fmtDate(LocalDate d) {
        return d == null ? "" : d.format(DATE_FMT);
    }

    private String fmtMoney(BigDecimal amount) {
        if (amount == null) return "0";
        DecimalFormat df = new DecimalFormat("#,###");
        return df.format(amount);
    }

    private String readThreeDigits(int number) {
        int hundred = number / 100;
        int ten = (number % 100) / 10;
        int unit = number % 10;

        StringBuilder sb = new StringBuilder();

        if (hundred > 0) {
            sb.append(NUM_WORDS[hundred]).append(" trăm");
            if (ten == 0 && unit > 0) {
                sb.append(" linh");
            }
        }

        if (ten > 1) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(NUM_WORDS[ten]).append(" mươi");
            if (unit == 1) {
                sb.append(" mốt");
            } else if (unit == 4) {
                sb.append(" tư");
            } else if (unit == 5) {
                sb.append(" lăm");
            } else if (unit > 0) {
                sb.append(" ").append(NUM_WORDS[unit]);
            }
        } else if (ten == 1) {
            if (sb.length() > 0) sb.append(" ");
            sb.append("mười");
            if (unit == 1) {
                sb.append(" một");
            } else if (unit == 4) {
                sb.append(" bốn");
            } else if (unit == 5) {
                sb.append(" lăm");
            } else if (unit > 0) {
                sb.append(" ").append(NUM_WORDS[unit]);
            }
        } else if (ten == 0 && hundred == 0 && unit > 0) {
            sb.append(NUM_WORDS[unit]);
        } else if (ten == 0 && unit > 0) {
            sb.append(" ").append(NUM_WORDS[unit]);
        }

        return sb.toString().trim();
    }

    private String amountToWords(BigDecimal amount) {
        if (amount == null) return "";
        long value = amount.longValue();

        if (value == 0) {
            return "Không đồng";
        }

        String[] units = {"", " nghìn", " triệu", " tỷ"};
        StringBuilder result = new StringBuilder();

        int unitIndex = 0;
        while (value > 0 && unitIndex < units.length) {
            int threeDigits = (int) (value % 1000);
            if (threeDigits != 0) {
                String part = readThreeDigits(threeDigits);
                if (!part.isEmpty()) {
                    if (result.length() > 0) {
                        result.insert(0, " ");
                    }
                    result.insert(0, part + units[unitIndex]);
                }
            }
            value /= 1000;
            unitIndex++;
        }

        // Viết hoa chữ cái đầu, thêm "đồng"
        String s = result.toString().trim();
        if (s.isEmpty()) {
            s = "không";
        }
        s = s.substring(0, 1).toUpperCase() + s.substring(1) + " đồng";

        return s;
    }

    /** Tiền nước */
    public String exportWaterBillPdf(Invoice invoice, MeterReading reading,
                                     String companyAddress, String companyPhone, String companyEmail,
                                     String bankAccount, String bankName) {

        Customer c = invoice.getCustomer();
        Map<String, Object> model = new HashMap<>();

        model.put("companyAddress", companyAddress);
        model.put("companyPhone", companyPhone);
        model.put("companyEmail", companyEmail);

        LocalDate today = LocalDate.now();
        model.put("noticeDate", fmtDate(today));

        model.put("customerCode", c.getCustomerCode());
        model.put("customerAddress", c.getAddress());
        model.put("customerName", c.getCustomerName());

        String period = fmtDate(invoice.getFromDate()) + " - " + fmtDate(invoice.getToDate());
        model.put("period", period);
        model.put("totalConsumption", invoice.getTotalConsumption() != null
                ? invoice.getTotalConsumption().toPlainString() : "0");

        model.put("subtotalAmount", fmtMoney(invoice.getSubtotalAmount()));
        model.put("vatAmount", fmtMoney(invoice.getVatAmount()));
        model.put("environmentFeeAmount", fmtMoney(invoice.getEnvironmentFeeAmount()));
        model.put("totalAmount", fmtMoney(invoice.getTotalAmount()));

        model.put("vatRate", "5%"); // nếu sau này bạn lấy từ price thì sửa ở đây
        model.put("amountInWords", amountToWords(invoice.getTotalAmount()));

        model.put("bankAccount", bankAccount);
        model.put("bankName", bankName);
        model.put("transferNote", invoice.getInvoiceNumber());

        model.put("dueDate", fmtDate(invoice.getDueDate()));

        model.put("printDay", today.getDayOfMonth());
        model.put("printMonth", today.getMonthValue());
        model.put("printYear", today.getYear());

        return pdfExportService.renderPdfToFile(
                "notice-water-bill",
                model,
                BASE_DIR,
                "water-bill-" + invoice.getId()
        );
    }

    /** Lắp đặt */
    public String exportInstallationInvoicePdf(Invoice invoice, String contractCode,
                                               LocalDate contractSignDate,
                                               String companyAddress, String companyPhone, String companyEmail,
                                               String bankAccount, String bankName) {

        Customer c = invoice.getCustomer();
        Map<String, Object> model = new HashMap<>();

        LocalDate today = LocalDate.now();

        model.put("companyAddress", companyAddress);
        model.put("companyPhone", companyPhone);
        model.put("companyEmail", companyEmail);

        model.put("noticeDate", fmtDate(today));
        model.put("customerCode", c.getCustomerCode());
        model.put("customerAddress", c.getAddress());
        model.put("customerName", c.getCustomerName());

        model.put("contractCode", contractCode);
        model.put("contractSignDate", fmtDate(contractSignDate));

        model.put("subtotalAmount", fmtMoney(invoice.getSubtotalAmount()));
        model.put("vatAmount", fmtMoney(invoice.getVatAmount()));
        model.put("totalAmount", fmtMoney(invoice.getTotalAmount()));
        model.put("vatRate", "10%"); // hoặc tham số riêng

        model.put("amountInWords", amountToWords(invoice.getTotalAmount()));
        model.put("bankAccount", bankAccount);
        model.put("bankName", bankName);
        model.put("transferNote", invoice.getInvoiceNumber());
        model.put("dueDate", fmtDate(invoice.getDueDate()));

        model.put("printDay", today.getDayOfMonth());
        model.put("printMonth", today.getMonthValue());
        model.put("printYear", today.getYear());

        return pdfExportService.renderPdfToFile(
                "notice-installation-invoice",
                model,
                BASE_DIR,
                "installation-invoice-" + invoice.getId()
        );
    }

    /** Dịch vụ phát sinh */
    public String exportServiceInvoicePdf(Invoice invoice, String serviceDescription,
                                          String vatRate,
                                          String companyAddress, String companyPhone, String companyEmail,
                                          String bankAccount, String bankName) {

        Customer c = invoice.getCustomer();
        Map<String, Object> model = new HashMap<>();

        LocalDate today = LocalDate.now();

        model.put("companyAddress", companyAddress);
        model.put("companyPhone", companyPhone);
        model.put("companyEmail", companyEmail);

        model.put("noticeDate", fmtDate(today));
        model.put("customerCode", c.getCustomerCode());
        model.put("customerAddress", c.getAddress());
        model.put("customerName", c.getCustomerName());

        model.put("serviceDescription", serviceDescription);
        model.put("subtotalAmount", fmtMoney(invoice.getSubtotalAmount()));
        model.put("vatAmount", fmtMoney(invoice.getVatAmount()));
        model.put("totalAmount", fmtMoney(invoice.getTotalAmount()));
        model.put("vatRate", vatRate);
        model.put("amountInWords", amountToWords(invoice.getTotalAmount()));

        model.put("bankAccount", bankAccount);
        model.put("bankName", bankName);
        model.put("transferNote", invoice.getInvoiceNumber());
        model.put("dueDate", fmtDate(invoice.getDueDate()));

        model.put("printDay", today.getDayOfMonth());
        model.put("printMonth", today.getMonthValue());
        model.put("printYear", today.getYear());

        return pdfExportService.renderPdfToFile(
                "notice-service-invoice",
                model,
                BASE_DIR,
                "service-invoice-" + invoice.getId()
        );
    }
}
