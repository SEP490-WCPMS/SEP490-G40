package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterReading;
import com.sep490.wcpms.dto.PaymentLinkDTO;
import com.sep490.wcpms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvoicePdfExportService {

    private final PdfExportService pdfExportService;
    private final PaymentService paymentService;

    // Thư mục lưu file PDF trên server
    private static final String BASE_DIR = "invoices-pdf";

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter MONTH_YEAR_FMT =
            DateTimeFormatter.ofPattern("MM/yyyy");
    private static final DateTimeFormatter FILE_DATE_FMT =
            DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final String[] NUM_WORDS = {
            "không", "một", "hai", "ba", "bốn", "năm",
            "sáu", "bảy", "tám", "chín"
    };

    // ---- EMV QR DECODE (TLV) ----
    private Map<String, String> parseEmvTlv(String data) {
        Map<String, String> map = new java.util.LinkedHashMap<>();
        if (data == null) return map;

        int index = 0;
        int len = data.length();

        while (index + 4 <= len) {
            String id = data.substring(index, index + 2);
            String lenStr = data.substring(index + 2, index + 4);
            int valueLen;
            try {
                valueLen = Integer.parseInt(lenStr);
            } catch (NumberFormatException e) {
                break; // dữ liệu lỗi, dừng lại
            }

            int valueStart = index + 4;
            int valueEnd = valueStart + valueLen;
            if (valueEnd > len) {
                break; // tránh IndexOutOfBounds
            }

            String value = data.substring(valueStart, valueEnd);
            map.put(id, value);

            index = valueEnd;
        }

        return map;
    }

    private static class EmvQrInfo {
        String bin;           // 970418
        String accountNumber; // V3CAS4271015210
        Long amount;          // 27500
        String description;   // "CSI6PBTX3J6 TT HDCN18112025"
        String currency;      // 704
    }

    private EmvQrInfo decodeEmvFromPayOs(String emv) {
        if (emv == null || emv.isBlank()) return null;

        EmvQrInfo info = new EmvQrInfo();

        // Top-level TLV
        Map<String, String> top = parseEmvTlv(emv);

        info.currency = top.get("53");
        if (top.containsKey("54")) {
            try {
                info.amount = Long.parseLong(top.get("54"));
            } catch (NumberFormatException ignored) {
            }
        }

        // Additional data (tag 62) → thường chứa nội dung CK ở sub-tag 08
        String v62 = top.get("62");
        if (v62 != null) {
            Map<String, String> add = parseEmvTlv(v62);
            info.description = add.get("08");
        }

        // Merchant Account Info / VietQR (tag 38) → trong đó:
        // - sub-tag 01: chuỗi TLV chứa bin + accountNumber
        String v38 = top.get("38");
        if (v38 != null) {
            Map<String, String> m38 = parseEmvTlv(v38);
            String sub01 = m38.get("01");
            if (sub01 != null) {
                Map<String, String> accInfo = parseEmvTlv(sub01);
                info.bin = accInfo.get("00");           // 970418
                info.accountNumber = accInfo.get("01"); // V3CAS4271015210
            }
        }

        return info;
    }

    // Dùng thông tin PayOS (decode từ EMV) để build lại URL VietQR (ảnh PNG)
    private String buildVietQrUrlFromPayOs(PaymentLinkDTO link) {
        try {
            EmvQrInfo emv = decodeEmvFromPayOs(link.getQrCode());

            // Ưu tiên lấy từ EMV; nếu thiếu thì fallback sang các field trong DTO
            String bin =
                    (emv != null && emv.bin != null && !emv.bin.isBlank())
                            ? emv.bin
                            : link.getBin();

            String accountNumber =
                    (emv != null && emv.accountNumber != null && !emv.accountNumber.isBlank())
                            ? emv.accountNumber
                            : link.getAccountNumber();

            Long amount =
                    (emv != null && emv.amount != null)
                            ? emv.amount
                            : link.getAmount();

            String content =
                    (emv != null && emv.description != null && !emv.description.isBlank())
                            ? emv.description
                            : link.getDescription();

            // Tên chủ TK: ưu tiên lấy từ PayOS
            String accountName = link.getAccountName();

            // Validate tối thiểu – nếu thiếu bin / accountNumber thì coi như PayOS trả thiếu
            if (bin == null || bin.isBlank() || accountNumber == null || accountNumber.isBlank()) {
                throw new IllegalStateException("Missing bin/accountNumber from PayOS");
            }

            if (amount == null) amount = 0L;
            if (content == null) content = "";
            if (accountName == null) accountName = "";

            // VietQR template: dùng đúng như frontend đang dùng: "compact"
            String template = "compact";

            String encodedContent = URLEncoder.encode(content, StandardCharsets.UTF_8);
            String encodedAccountName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);

            return String.format(
                    "https://img.vietqr.io/image/%s-%s-%s.png?amount=%d&addInfo=%s&accountName=%s",
                    bin,
                    accountNumber,
                    template,
                    amount,
                    encodedContent,
                    encodedAccountName
            );
        } catch (Exception e) {
            throw new RuntimeException("Error building VietQR URL from PayOS EMV", e);
        }
    }

    // Lấy ảnh QR từ PayOS
    private String resolveQrImage(Invoice invoice) {
        try {
            PaymentLinkDTO link = paymentService.createPaymentLink(invoice.getId());
            if (link == null) {
                System.err.println("[QR] PaymentService trả về null cho invoice " + invoice.getId());
                return null;
            }

            String qr = link.getQrCode();

            // 1) Nếu PayOS trả sẵn URL hoặc data-image => dùng luôn
            if (qr != null && !qr.isBlank()) {
                if (qr.startsWith("http://") || qr.startsWith("https://") || qr.startsWith("data:image")) {
                    System.out.println("[QR] Using PAYOS qrCode URL/data for invoice " + invoice.getId());
                    return qr;
                }
            }

            // 2) Còn lại: coi qrCode là EMV payload => decode EMV + build VietQR URL
            String url = buildVietQrUrlFromPayOs(link);
            System.out.println("[QR] Using PAYOS EMV→VietQR for invoice " + invoice.getId());
            return url;

        } catch (Exception ex) {
            System.err.println("Loi tao QR PayOS cho invoice " + invoice.getId() + ": " + ex.getMessage());
            ex.printStackTrace();
            // Không fallback demo nữa, đúng yêu cầu "hoàn toàn dựa vào PaymentService"
            return null;
        }
    }

    // Lấy nội dung chuyển khoản từ PayOS
    private String resolveTransferNote(Invoice invoice) {
        try {
            PaymentLinkDTO link = paymentService.createPaymentLink(invoice.getId());
            if (link == null) {
                System.err.println("[TransferNote] PayOS trả null cho invoice " + invoice.getId());
                return null;
            }

            // Ưu tiên description trong EMV (tag 62.08), nếu không có thì dùng link.getDescription()
            EmvQrInfo emv = decodeEmvFromPayOs(link.getQrCode());
            if (emv != null && emv.description != null && !emv.description.isBlank()) {
                System.out.println("[TransferNote] Using EMV description for invoice " + invoice.getId()
                        + ": " + emv.description);
                return emv.description;
            }

            System.out.println("[TransferNote] Using PayOS link.description for invoice " + invoice.getId()
                    + ": " + link.getDescription());
            return link.getDescription(); // có thể null – chấp nhận

        } catch (Exception ex) {
            System.err.println("[TransferNote] Lỗi gọi PayOS cho invoice "
                    + invoice.getId() + ": " + ex.getMessage());
            ex.printStackTrace();
            return null;
        }
    }

    private String fmtDate(LocalDate d) {
        return d == null ? "" : d.format(DATE_FMT);
    }

    private String fmtMoney(BigDecimal amount) {
        if (amount == null) return "0";
        DecimalFormat df = new DecimalFormat("#,###");
        return df.format(amount);
    }

    private String buildInvoicePdfFilePrefix(String typePrefix, Invoice invoice, String contractCode, LocalDate today) {
        String contractNumber = contractCode;
        if (contractNumber == null || contractNumber.isBlank()) {
            if (invoice.getContract() != null && invoice.getContract().getContractNumber() != null) {
                contractNumber = invoice.getContract().getContractNumber();
            } else {
                contractNumber = "NO_CONTRACT";
            }
        }

        String invoiceNumber = invoice.getInvoiceNumber() != null
                ? invoice.getInvoiceNumber()
                : "NO_INVOICE_NUMBER";

        String dateStr = today.format(FILE_DATE_FMT);

        return String.format("%s-INVOICE_%s_%s_%s", typePrefix, contractNumber, invoiceNumber, dateStr);
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
        model.put("transferNote", resolveTransferNote(invoice));
        model.put("qrImage", resolveQrImage(invoice));

        model.put("dueDate", fmtDate(invoice.getDueDate()));

        model.put("printDay", today.getDayOfMonth());
        model.put("printMonth", today.getMonthValue());
        model.put("printYear", today.getYear());

        String filePrefix = buildInvoicePdfFilePrefix("WS", invoice, null, today);

        return pdfExportService.renderPdfToFile(
                "notice-water-bill",
                model,
                BASE_DIR,
                filePrefix
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
        model.put("transferNote", resolveTransferNote(invoice));
        model.put("qrImage", resolveQrImage(invoice));

        model.put("dueDate", fmtDate(invoice.getDueDate()));

        model.put("printDay", today.getDayOfMonth());
        model.put("printMonth", today.getMonthValue());
        model.put("printYear", today.getYear());

        String filePrefix = buildInvoicePdfFilePrefix("CN", invoice, contractCode, today);

        return pdfExportService.renderPdfToFile(
                "notice-installation-invoice",
                model,
                BASE_DIR,
                filePrefix
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
        model.put("transferNote", resolveTransferNote(invoice));
        model.put("qrImage", resolveQrImage(invoice));

        model.put("dueDate", fmtDate(invoice.getDueDate()));

        model.put("printDay", today.getDayOfMonth());
        model.put("printMonth", today.getMonthValue());
        model.put("printYear", today.getYear());

        String filePrefix = buildInvoicePdfFilePrefix("SV", invoice, null, today);

        return pdfExportService.renderPdfToFile(
                "notice-service-invoice",
                model,
                BASE_DIR,
                filePrefix
        );
    }
}
