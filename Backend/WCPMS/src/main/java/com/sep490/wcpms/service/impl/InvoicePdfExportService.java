package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.Address;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterReading;
import com.sep490.wcpms.entity.ReadingRoute;
import com.sep490.wcpms.dto.PaymentLinkDTO;
import com.sep490.wcpms.repository.WaterPriceRepository;
import com.sep490.wcpms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InvoicePdfExportService {

    private final PdfExportService pdfExportService;
    private final PaymentService paymentService;
    private final WaterPriceRepository waterPriceRepository;

    // Thư mục lưu file PDF trên server
    private static final String BASE_DIR = resolveWritableInvoiceDir();

    private static String resolveWritableInvoiceDir() {
        List<Path> candidates = List.of(
                // 1) ưu tiên thư mục chạy app
                Paths.get(System.getProperty("user.dir", "."), "invoices-pdf"),

                // 2) user home (ổn định hơn tmp)
                Paths.get(System.getProperty("user.home", "."), "wcpms-data", "invoices-pdf"),

                // 3) tmp dir (gần như luôn ghi được)
                Paths.get(System.getProperty("java.io.tmpdir", "."), "wcpms-data", "invoices-pdf")
        );

        for (Path p : candidates) {
            try {
                Files.createDirectories(p);
                // test quyền ghi nhẹ: tạo file rỗng tạm rồi xóa
                Path test = p.resolve(".write_test");
                Files.writeString(test, "ok");
                Files.deleteIfExists(test);
                return p.toAbsolutePath().toString();
            } catch (Exception ignored) {
            }
        }

        // fallback cuối cùng (giữ nguyên behavior cũ)
        return "invoices-pdf";
    }

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

        // Merchant Account Info / VietQR (tag 38)
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

            String accountName = link.getAccountName();

            if (bin == null || bin.isBlank() || accountNumber == null || accountNumber.isBlank()) {
                throw new IllegalStateException("Missing bin/accountNumber from PayOS");
            }

            if (amount == null) amount = 0L;
            if (content == null) content = "";
            if (accountName == null) accountName = "";

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

            EmvQrInfo emv = decodeEmvFromPayOs(link.getQrCode());
            if (emv != null && emv.description != null && !emv.description.isBlank()) {
                System.out.println("[TransferNote] Using EMV description for invoice " + invoice.getId()
                        + ": " + emv.description);
                return emv.description;
            }

            System.out.println("[TransferNote] Using PayOS link.description for invoice " + invoice.getId()
                    + ": " + link.getDescription());
            return link.getDescription();

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

    private String fmtSignedDate(Invoice invoice) {
        if (invoice == null || invoice.getCreatedAt() == null) return "";
        return invoice.getCreatedAt().toLocalDate().format(DATE_FMT);
    }

    private String fmtMoney(BigDecimal amount) {
        if (amount == null) return "0";
        DecimalFormat df = new DecimalFormat("#,###");
        return df.format(normalizeVnd(amount));
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

    private BigDecimal normalizeVnd(BigDecimal amount) {
        if (amount == null) return BigDecimal.ZERO;
        return amount.setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal safeDivideVnd(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return null;
        if (b.compareTo(BigDecimal.ZERO) == 0) return null;
        // đơn giá VND làm tròn 0 chữ số
        return a.divide(b, 0, RoundingMode.HALF_UP);
    }

    /**
     * Đơn giá nước nằm ở:
     * contract_usage_details.price_type_id -> water_price_types -> water_prices.unit_price
     * Lấy giá ACTIVE mới nhất có effective_date <= invoice.toDate (hoặc now)
     */
    private BigDecimal resolveWaterUnitPrice(Invoice invoice) {
        try {
            if (invoice == null || invoice.getContract() == null) return null;

            var ct = invoice.getContract();
            var details = ct.getContractUsageDetails();
            if (details == null || details.isEmpty()) return null;

            var best = details.stream()
                    .filter(d -> d.getPriceType() != null)
                    .max(Comparator.comparing(d ->
                            d.getUsagePercentage() == null ? BigDecimal.ZERO : d.getUsagePercentage()))
                    .orElse(null);

            if (best == null || best.getPriceType() == null) return null;

            LocalDate asOf = invoice.getToDate() != null ? invoice.getToDate() : LocalDate.now();

            return waterPriceRepository
                    .findTopByPriceTypeAndStatusAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                            best.getPriceType(),
                            com.sep490.wcpms.entity.WaterPrice.Status.ACTIVE,
                            asOf
                    )
                    .map(com.sep490.wcpms.entity.WaterPrice::getUnitPrice)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    // ====== NEW: Tuyến (route_code) theo contract.readingRoute ======
    private String resolveRouteCode(Invoice invoice) {
        try {
            if (invoice == null) return "";
            Contract ct = invoice.getContract();
            if (ct == null) return "";
            ReadingRoute rr = ct.getReadingRoute(); // route_id -> reading_routes
            if (rr == null) return "";
            return rr.getRouteCode() != null ? rr.getRouteCode() : "";
        } catch (Exception e) {
            return "";
        }
    }

    private String fmtPlain(BigDecimal v) {
        if (v == null) return "";
        return v.stripTrailingZeros().toPlainString();
    }

    private static class LineItem {
        private final String description;
        private final String quantity;
        private final String unitPrice;
        private final String amount;

        public LineItem(String description, String quantity, String unitPrice, String amount) {
            this.description = description;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.amount = amount;
        }

        public String getDescription() { return description; }
        public String getQuantity() { return quantity; }
        public String getUnitPrice() { return unitPrice; }
        public String getAmount() { return amount; }
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
        long value = normalizeVnd(amount).longValue();

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

        String s = result.toString().trim();
        if (s.isEmpty()) {
            s = "không";
        }
        s = s.substring(0, 1).toUpperCase() + s.substring(1) + " đồng";

        return s;
    }

    private String resolveServiceAddress(Invoice invoice) {
        if (invoice != null && invoice.getContract() != null && invoice.getContract().getAddress() != null) {
            Address a = invoice.getContract().getAddress();
            if (a.getAddress() != null && !a.getAddress().isBlank()) return a.getAddress();

            String street = a.getStreet() != null ? a.getStreet().trim() : "";
            String ward = (a.getWard() != null && a.getWard().getWardName() != null) ? a.getWard().getWardName().trim() : "";
            String district = (a.getWard() != null && a.getWard().getDistrict() != null) ? a.getWard().getDistrict().trim() : "";
            String province = (a.getWard() != null && a.getWard().getProvince() != null) ? a.getWard().getProvince().trim() : "";

            StringBuilder sb = new StringBuilder();
            if (!street.isEmpty()) sb.append(street);
            if (!ward.isEmpty()) sb.append(sb.length() > 0 ? ", " : "").append(ward);
            if (!district.isEmpty()) sb.append(sb.length() > 0 ? ", " : "").append(district);
            if (!province.isEmpty()) sb.append(sb.length() > 0 ? ", " : "").append(province);

            String built = sb.toString().trim();
            if (!built.isEmpty()) return built;
        }
        Customer c = invoice != null ? invoice.getCustomer() : null;
        return c != null && c.getAddress() != null ? c.getAddress() : "";
    }

    /** Tiền nước */
    public String exportWaterBillPdf(Invoice invoice, MeterReading reading,
                                     String companyAddress, String companyPhone, String companyEmail,
                                     String bankAccount, String bankName) {

        Customer c = invoice.getCustomer();
        Map<String, Object> model = new HashMap<>();

        BigDecimal lateFee = invoice.getLatePaymentFee();
        boolean hasLateFee = lateFee != null && lateFee.compareTo(BigDecimal.ZERO) > 0;

        LocalDate printDate = (invoice.getInvoiceDate() != null) ? invoice.getInvoiceDate() : LocalDate.now();

        model.put("companyAddress", companyAddress);
        model.put("companyPhone", companyPhone);
        model.put("companyEmail", companyEmail);

        model.put("customerCode", c.getCustomerCode());
        model.put("customerAddress", resolveServiceAddress(invoice));
        model.put("customerName", c.getCustomerName());
        model.put("customerIdentityNumber", c.getIdentityNumber() != null ? c.getIdentityNumber() : "");

        // Tuyến = reading_routes.route_code (qua contract)
        model.put("routeCode", resolveRouteCode(invoice));

        model.put("fromDate", fmtDate(invoice.getFromDate()));
        model.put("toDate", fmtDate(invoice.getToDate()));
        model.put("oldIndex", reading != null ? fmtPlain(reading.getPreviousReading()) : "");
        model.put("newIndex", reading != null ? fmtPlain(reading.getCurrentReading()) : "");

        // line items
        List<LineItem> items = new ArrayList<>();

        BigDecimal consumption = invoice.getTotalConsumption() != null ? invoice.getTotalConsumption() : BigDecimal.ZERO;

        BigDecimal unitPrice = resolveWaterUnitPrice(invoice);
        // fallback nếu DB không ra: lấy bình quân subtotal/consumption
        if (unitPrice == null && consumption.compareTo(BigDecimal.ZERO) > 0) {
            unitPrice = safeDivideVnd(invoice.getSubtotalAmount(), consumption);
        }

        items.add(new LineItem(
                "Tiền nước",
                consumption.compareTo(BigDecimal.ZERO) > 0 ? fmtPlain(consumption) : "",
                unitPrice != null ? fmtMoney(unitPrice) : "",
                fmtMoney(invoice.getSubtotalAmount())
        ));

        if (hasLateFee) {
            items.add(new LineItem(
                    "Phí nộp phạt",
                    "",
                    "",
                    fmtMoney(lateFee)
            ));
        }

        model.put("lineItems", items);
        // Form bên phải có số dòng cố định (ví dụ 5). Có thêm lineItem (phí phạt) thì giảm dòng trống để không đẩy sang trang 2.
        int maxRows = 5; // bạn có thể chỉnh 4 hoặc 5 tùy muốn form trống nhiều hay ít
        int blankRows = Math.max(0, maxRows - items.size());
        model.put("blankRows", blankRows);

        // Cộng = subtotal + lateFee (để khớp bảng)
        BigDecimal sub = invoice.getSubtotalAmount() != null ? invoice.getSubtotalAmount() : BigDecimal.ZERO;
        BigDecimal subDisplay = hasLateFee ? sub.add(lateFee) : sub;
        model.put("subTotalDisplay", fmtMoney(subDisplay));

        model.put("vatRate", "5%");
        model.put("environmentFeeRate", "10%");
        model.put("vatAmount", fmtMoney(invoice.getVatAmount()));
        model.put("environmentFeeAmount", fmtMoney(invoice.getEnvironmentFeeAmount()));
        model.put("totalAmount", fmtMoney(invoice.getTotalAmount()));

        model.put("amountInWords", amountToWords(invoice.getTotalAmount()));

        model.put("bankAccount", bankAccount);
        model.put("bankName", bankName);
        model.put("transferNote", resolveTransferNote(invoice));
        model.put("qrImage", resolveQrImage(invoice));

        model.put("dueDate", fmtDate(invoice.getDueDate()));
        model.put("signedDate", fmtSignedDate(invoice));

        model.put("printDay", printDate.getDayOfMonth());
        model.put("printMonth", printDate.getMonthValue());
        model.put("printYear", printDate.getYear());

        String filePrefix = buildInvoicePdfFilePrefix("WS", invoice, null, printDate);

        return pdfExportService.renderPdfToFile(
                "vat-invoice",
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

        BigDecimal lateFee = invoice.getLatePaymentFee();
        boolean hasLateFee = lateFee != null && lateFee.compareTo(BigDecimal.ZERO) > 0;

        LocalDate printDate = (invoice.getInvoiceDate() != null) ? invoice.getInvoiceDate() : LocalDate.now();

        model.put("companyAddress", companyAddress);
        model.put("companyPhone", companyPhone);
        model.put("companyEmail", companyEmail);

        model.put("customerCode", c.getCustomerCode());
        model.put("customerAddress", resolveServiceAddress(invoice));
        model.put("customerName", c.getCustomerName());
        model.put("customerIdentityNumber", c.getIdentityNumber() != null ? c.getIdentityNumber() : "");

        // Không có tuyến/chỉ số -> để trống, KHÔNG ẨN
        model.put("routeCode", "");
        model.put("fromDate", "");
        model.put("toDate", "");
        model.put("oldIndex", "");
        model.put("newIndex", "");

        List<LineItem> items = new ArrayList<>();
        items.add(new LineItem("Phí lắp đặt", "", "", fmtMoney(invoice.getSubtotalAmount())));

        if (hasLateFee) {
            items.add(new LineItem("Phí nộp phạt", "", "", fmtMoney(lateFee)));
        }
        model.put("lineItems", items);
        // Form bên phải có số dòng cố định (ví dụ 5). Có thêm lineItem (phí phạt) thì giảm dòng trống để không đẩy sang trang 2.
        int maxRows = 5; // bạn có thể chỉnh 4 hoặc 5 tùy muốn form trống nhiều hay ít
        int blankRows = Math.max(0, maxRows - items.size());
        model.put("blankRows", blankRows);

        BigDecimal sub = invoice.getSubtotalAmount() != null ? invoice.getSubtotalAmount() : BigDecimal.ZERO;
        BigDecimal subDisplay = hasLateFee ? sub.add(lateFee) : sub;
        model.put("subTotalDisplay", fmtMoney(subDisplay));

        // VAT lắp đặt 8%
        model.put("vatRate", "8%");
        model.put("environmentFeeRate", "10%");
        model.put("vatAmount", fmtMoney(invoice.getVatAmount()));
        model.put("environmentFeeAmount", fmtMoney(invoice.getEnvironmentFeeAmount())); // có thể 0
        model.put("totalAmount", fmtMoney(invoice.getTotalAmount()));

        model.put("amountInWords", amountToWords(invoice.getTotalAmount()));

        model.put("bankAccount", bankAccount);
        model.put("bankName", bankName);
        model.put("transferNote", resolveTransferNote(invoice));
        model.put("qrImage", resolveQrImage(invoice));

        model.put("dueDate", fmtDate(invoice.getDueDate()));
        model.put("signedDate", fmtSignedDate(invoice));

        model.put("printDay", printDate.getDayOfMonth());
        model.put("printMonth", printDate.getMonthValue());
        model.put("printYear", printDate.getYear());

        String filePrefix = buildInvoicePdfFilePrefix("CN", invoice, contractCode, printDate);

        return pdfExportService.renderPdfToFile(
                "vat-invoice",
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

        BigDecimal lateFee = invoice.getLatePaymentFee();
        boolean hasLateFee = lateFee != null && lateFee.compareTo(BigDecimal.ZERO) > 0;

        LocalDate printDate = (invoice.getInvoiceDate() != null) ? invoice.getInvoiceDate() : LocalDate.now();

        model.put("companyAddress", companyAddress);
        model.put("companyPhone", companyPhone);
        model.put("companyEmail", companyEmail);

        model.put("customerCode", c.getCustomerCode());
        model.put("customerAddress", resolveServiceAddress(invoice));
        model.put("customerName", c.getCustomerName());
        model.put("customerIdentityNumber", c.getIdentityNumber() != null ? c.getIdentityNumber() : "");

        // Không có tuyến/chỉ số -> để trống, KHÔNG ẨN
        model.put("routeCode", "");
        model.put("fromDate", "");
        model.put("toDate", "");
        model.put("oldIndex", "");
        model.put("newIndex", "");

        List<LineItem> items = new ArrayList<>();
        // Description theo context mới
        items.add(new LineItem("Phí dịch vụ phát sinh", "", "", fmtMoney(invoice.getSubtotalAmount())));

        if (hasLateFee) {
            items.add(new LineItem("Phí nộp phạt", "", "", fmtMoney(lateFee)));
        }
        model.put("lineItems", items);
        // Form bên phải có số dòng cố định (ví dụ 5). Có thêm lineItem (phí phạt) thì giảm dòng trống để không đẩy sang trang 2.
        int maxRows = 5; // bạn có thể chỉnh 4 hoặc 5 tùy muốn form trống nhiều hay ít
        int blankRows = Math.max(0, maxRows - items.size());
        model.put("blankRows", blankRows);

        BigDecimal sub = invoice.getSubtotalAmount() != null ? invoice.getSubtotalAmount() : BigDecimal.ZERO;
        BigDecimal subDisplay = hasLateFee ? sub.add(lateFee) : sub;
        model.put("subTotalDisplay", fmtMoney(subDisplay));

        // Dịch vụ phát sinh VAT 5% (ignore param vatRate cũ để đúng rule)
        model.put("vatRate", "5%");
        model.put("environmentFeeRate", "10%");
        model.put("vatAmount", fmtMoney(invoice.getVatAmount()));
        model.put("environmentFeeAmount", fmtMoney(invoice.getEnvironmentFeeAmount()));
        model.put("totalAmount", fmtMoney(invoice.getTotalAmount()));

        model.put("amountInWords", amountToWords(invoice.getTotalAmount()));

        model.put("bankAccount", bankAccount);
        model.put("bankName", bankName);
        model.put("transferNote", resolveTransferNote(invoice));
        model.put("qrImage", resolveQrImage(invoice));

        model.put("dueDate", fmtDate(invoice.getDueDate()));
        model.put("signedDate", fmtSignedDate(invoice));

        model.put("printDay", printDate.getDayOfMonth());
        model.put("printMonth", printDate.getMonthValue());
        model.put("printYear", printDate.getYear());

        String filePrefix = buildInvoicePdfFilePrefix("SV", invoice, null, printDate);

        return pdfExportService.renderPdfToFile(
                "vat-invoice",
                model,
                BASE_DIR,
                filePrefix
        );
    }
}