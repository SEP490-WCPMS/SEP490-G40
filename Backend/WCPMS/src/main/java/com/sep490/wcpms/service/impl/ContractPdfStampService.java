package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.WaterPriceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ContractPdfStampService {

    private final ContractRepository contractRepository;
    private final WaterPriceRepository waterPriceRepository;

    private static final String TEMPLATE_CLASSPATH = "pdf-templates/HOP_DONG_CUNG_CAP_NUOC.pdf";
    private static final String FONT_CLASSPATH = "fonts/times.ttf";

    // ====== TỌA ĐỘ ======
    // Quy ước: x theo chiều ngang; yTop là tọa độ TOP-LEFT theo trang.
    // PDFBox dùng gốc BOTTOM-LEFT, nên ta convert y ở hàm drawTextTopLeft.

    // Page 1 (index 0)
    private static final int PAGE_0 = 0;

    private static final float P0_YTOP_LINE_HEADER = 91.44698f;  // dòng "Số:" + "Phú Thọ, ngày..."

    private static final float P0_YTOP_CUST_NAME = 587.56036f;   // "Đại diện Ông (Bà): ..."
    private static final float P0_X_CUST_NAME = 170f;

    private static final float P0_YTOP_CUST_ADDRESS = 608.2586f; // "Địa chỉ: ...."
    private static final float P0_X_CUST_ADDRESS = 115f;

    private static final float P0_YTOP_CUST_CODE = 628.95685f;   // "Mã khách hàng: ...."
    private static final float P0_X_CUST_CODE = 155f;

    private static final float P0_YTOP_PHONE = 649.6551f;        // "Điện thoại: ...."
    private static final float P0_X_PHONE = 125f;

    // Page 4 (index 3) - bảng loại sử dụng
    private static final int PAGE_3 = 3;
    private static final float P3_X_METER_CODE = 125f;  // cột "Đồng hồ"
    private static final float P3_X_SERIAL = 200f;      // cột "Sê ry"
    private static final float P3_X_PRICE = 435f;       // cột "Giá bán"
    private static final float P3_X_PERCENT = 505f;     // cột "Tỷ lệ %" (template đã có dấu %)

    private static final float P3_YTOP_ROW_RESIDENTIAL = 277.8086f;     // dòng "Sinh hoạt..."
    private static final float P3_YTOP_ROW_ADMINISTRATIVE = 301.32666f; // dòng "Cơ quan..."
    private static final float P3_YTOP_ROW_COMMERCIAL = 357.2720f;      // dòng "Kinh doanh..."

    private static final float FONT_SIZE_12 = 12f;
    private static final float FONT_SIZE_13 = 13f;

    private static final DecimalFormat MONEY_FMT = new DecimalFormat("#,##0");

    @Transactional
    public byte[] exportForCustomer(Integer customerAccountId, Integer contractId) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        // chặn khách tải hợp đồng không phải của mình
        Integer ownerAccountId = null;
        if (contract.getCustomer() != null && contract.getCustomer().getAccount() != null) {
            ownerAccountId = contract.getCustomer().getAccount().getId();
        }
        if (ownerAccountId == null || !ownerAccountId.equals(customerAccountId)) {
            throw new AccessDeniedException("Bạn không có quyền tải hợp đồng này.");
        }

        try (
                PDDocument doc = loadTemplateAsPlainDocument(TEMPLATE_CLASSPATH);
                InputStream fontIs = new ClassPathResource(FONT_CLASSPATH).getInputStream()
        ) {
            PDType0Font font = PDType0Font.load(doc, fontIs, true);

            // ========= Data cần điền =========
            String contractNumber = safe(contract.getContractNumber());

            // Ngày in trên hợp đồng: ưu tiên start_date (ngày hiệu lực)
            // Fallback: application_date -> created_at -> now
            LocalDate contractEffectiveDate = contract.getStartDate();
            if (contractEffectiveDate == null) {
                contractEffectiveDate = contract.getApplicationDate();
            }
            if (contractEffectiveDate == null) {
                LocalDateTime createdAt = contract.getCreatedAt();
                contractEffectiveDate = createdAt != null ? createdAt.toLocalDate() : LocalDate.now();
            }
            int day = contractEffectiveDate.getDayOfMonth();
            int month = contractEffectiveDate.getMonthValue();
            int year = contractEffectiveDate.getYear();

            Customer customer = contract.getCustomer();

            String customerName = "";
            String phone = "";
            String customerCode = "";

            if (customer != null) {
                customerName = firstNonBlank(
                        customer.getContactPersonName(),
                        customer.getCustomerName(),
                        customer.getAccount() != null ? customer.getAccount().getFullName() : null
                );

                phone = firstNonBlank(
                        customer.getContactPersonPhone(),
                        customer.getAccount() != null ? customer.getAccount().getPhone() : null,
                        contract.getContactPhone()
                );

                customerCode = firstNonBlank(
                        customer.getCustomerCode(),
                        customer.getAccount() != null ? customer.getAccount().getCustomerCode() : null
                );
            } else {
                // trường hợp guest
                phone = safe(contract.getContactPhone());
            }

            // Ưu tiên địa chỉ lắp đặt trong contract.address, nếu không có thì lấy địa chỉ khách hàng
            String address = "";
            if (contract.getAddress() != null) {
                address = buildAddress(contract.getAddress());
            }
            if (isBlank(address) && customer != null) {
                address = buildCustomerAddress(customer);
            }

            // Đồng hồ (lấy cái mới nhất trong contract.installations)
            WaterMeter wm = findLatestWaterMeter(contract);
            String meterCode = wm != null ? safe(wm.getMeterCode()) : "";
            String serial = wm != null ? safe(wm.getSerialNumber()) : "";

            // Usage details: map typeCode -> percent
            Map<String, BigDecimal> percentByType = mapPercentByType(contract.getContractUsageDetails());

            // Giá bán: lấy theo water_prices (ACTIVE, effective_date <= createdDate)
            LocalDate effectiveDate = contractEffectiveDate;
            Map<String, String> priceByType = new HashMap<>();
            for (ContractPdfRow row : ContractPdfRow.values()) {
                String typeCode = row.typeCode;
                WaterPriceType wpt = findPriceTypeFromContractUsage(contract.getContractUsageDetails(), typeCode);
                if (wpt != null) {
                    String price = resolveUnitPrice(wpt, effectiveDate);
                    priceByType.put(typeCode, price);
                }
            }

            // ========= Fill PDF =========
            // Page 1
            fillPage0(doc, font, contractNumber, day, month, year,
                    customerName, address, customerCode, phone);

            // Page 4 - bảng
            fillPage3Table(doc, font, meterCode, serial, percentByType, priceByType);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Không tạo được PDF hợp đồng: " + e.getMessage(), e);
        }
    }

    /**
     * Service Staff tải PDF hợp đồng (không giới hạn theo owner).
     * Controller: GET /api/service/contracts/{contractId}/pdf
     */
    @Transactional
    public byte[] exportForServiceStaff(Integer contractId) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        try (
                PDDocument doc = loadTemplateAsPlainDocument(TEMPLATE_CLASSPATH);
                InputStream fontIs = new ClassPathResource(FONT_CLASSPATH).getInputStream()
        ) {
            PDType0Font font = PDType0Font.load(doc, fontIs, true);

            // ========= Data cần điền =========
            String contractNumber = safe(contract.getContractNumber());

            LocalDate contractEffectiveDate = contract.getStartDate();
            if (contractEffectiveDate == null) contractEffectiveDate = contract.getApplicationDate();
            if (contractEffectiveDate == null) {
                LocalDateTime createdAt = contract.getCreatedAt();
                contractEffectiveDate = createdAt != null ? createdAt.toLocalDate() : LocalDate.now();
            }

            int day = contractEffectiveDate.getDayOfMonth();
            int month = contractEffectiveDate.getMonthValue();
            int year = contractEffectiveDate.getYear();

            Customer customer = contract.getCustomer();

            String customerName = "";
            String phone = "";
            String customerCode = "";

            if (customer != null) {
                customerName = firstNonBlank(
                        customer.getContactPersonName(),
                        customer.getCustomerName(),
                        customer.getAccount() != null ? customer.getAccount().getFullName() : null
                );

                phone = firstNonBlank(
                        customer.getContactPersonPhone(),
                        customer.getAccount() != null ? customer.getAccount().getPhone() : null,
                        contract.getContactPhone()
                );

                customerCode = firstNonBlank(
                        customer.getCustomerCode(),
                        customer.getAccount() != null ? customer.getAccount().getCustomerCode() : null
                );
            } else {
                phone = safe(contract.getContactPhone());
            }

            String address = "";
            if (contract.getAddress() != null) address = buildAddress(contract.getAddress());
            if (isBlank(address) && customer != null) address = buildCustomerAddress(customer);

            WaterMeter wm = findLatestWaterMeter(contract);
            String meterCode = wm != null ? safe(wm.getMeterCode()) : "";
            String serial = wm != null ? safe(wm.getSerialNumber()) : "";

            Map<String, BigDecimal> percentByType = mapPercentByType(contract.getContractUsageDetails());

            LocalDate effectiveDate = contractEffectiveDate;
            Map<String, String> priceByType = new HashMap<>();
            for (ContractPdfRow row : ContractPdfRow.values()) {
                String typeCode = row.typeCode;
                WaterPriceType wpt = findPriceTypeFromContractUsage(contract.getContractUsageDetails(), typeCode);
                if (wpt != null) {
                    String price = resolveUnitPrice(wpt, effectiveDate);
                    priceByType.put(typeCode, price);
                }
            }

            fillPage0(doc, font, contractNumber, day, month, year,
                    customerName, address, customerCode, phone);

            fillPage3Table(doc, font, meterCode, serial, percentByType, priceByType);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Không tạo được PDF hợp đồng: " + e.getMessage(), e);
        }
    }

    private void fillPage0(PDDocument doc, PDType0Font font,
                           String contractNumber,
                           int day, int month, int year,
                           String customerName,
                           String address,
                           String customerCode,
                           String phone) throws Exception {

        if (doc.getNumberOfPages() <= PAGE_0) return;
        PDPage page = doc.getPage(PAGE_0);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

            // ==============================
            // 1) HEADER: Số + ContractNumber
            // ==============================
            // Template có sẵn "Số:" và có thể có sẵn "/HĐDVCN" + dấu .... => phải phủ trắng trước.
            // Phủ từ sau chữ "Số:" đến gần trước cụm "Phú Thọ, ngày..."
            fillWhiteTopLeft(cs, page,
                    65f,                      // x bắt đầu (sau chữ "Số:" một chút)
                    P0_YTOP_LINE_HEADER - 2f, // yTop
                    265f,                     // width vùng số hợp đồng
                    22f                       // height
            );
            setTextBlack(cs);

            // Viết FULL theo format: <contractNumber>/HĐDVCN
            // (nếu contractNumber đã chứa /HĐDVCN thì tránh lặp)
            String fullNo = contractNumber;
            if (!isBlank(fullNo) && !fullNo.toUpperCase().contains("/HĐDVCN")) {
                fullNo = fullNo + "/HĐDVCN";
            }

            // Wrap trong vùng trái để không chèn sang cụm ngày tháng
            drawTextTopLeftWrap(
                    cs, page, font,
                    12f,
                    80f,                      // x viết số
                    P0_YTOP_LINE_HEADER,      // yTop
                    250f,                     // maxWidth lớn hơn trước để đủ chỗ
                    2,
                    fullNo
            );

            // ==============================
            // 2) HEADER: Phú Thọ, ngày...tháng...năm...
            // ==============================
            // Template có sẵn chữ + có sẵn "202" => phải phủ trắng rồi viết lại 1 dòng hoàn chỉnh
            fillWhiteTopLeft(cs, page,
                    320f,
                    P0_YTOP_LINE_HEADER - 2f,
                    290f,
                    22f
            );
            setTextBlack(cs);

            String dateLine = String.format("Phú Thọ, ngày %d tháng %d năm %d", day, month, year);
            drawTextTopLeft(cs, page, font, FONT_SIZE_13,
                    330f,
                    P0_YTOP_LINE_HEADER,
                    dateLine
            );

            // ==============================
            // 3) CÁC TRƯỜNG CÓ DẤU "......"
            // -> phủ trắng trước rồi vẽ chữ
            // ==============================

            // Đại diện Ông(Bà)
            if (!isBlank(customerName)) {
                fillWhiteTopLeft(cs, page,
                        160f, P0_YTOP_CUST_NAME - 2f,
                        410f, 18f
                );
                setTextBlack(cs);
                drawTextTopLeft(cs, page, font, FONT_SIZE_12,
                        P0_X_CUST_NAME, P0_YTOP_CUST_NAME,
                        trimTo(customerName, 60)
                );
            }

            // Địa chỉ
            if (!isBlank(address)) {
                fillWhiteTopLeft(cs, page,
                        110f, P0_YTOP_CUST_ADDRESS - 2f,
                        470f, 18f
                );
                setTextBlack(cs);
                drawTextTopLeft(cs, page, font, FONT_SIZE_12,
                        P0_X_CUST_ADDRESS, P0_YTOP_CUST_ADDRESS,
                        trimTo(address, 140)
                );
            }

            // Mã KH
            if (!isBlank(customerCode)) {
                fillWhiteTopLeft(cs, page,
                        150f, P0_YTOP_CUST_CODE - 2f,
                        240f, 18f
                );
                setTextBlack(cs);
                drawTextTopLeft(cs, page, font, FONT_SIZE_12,
                        P0_X_CUST_CODE, P0_YTOP_CUST_CODE,
                        customerCode
                );
            }

            // Điện thoại
            if (!isBlank(phone)) {
                fillWhiteTopLeft(cs, page,
                        120f, P0_YTOP_PHONE - 2f,
                        240f, 18f
                );
                setTextBlack(cs);
                drawTextTopLeft(cs, page, font, FONT_SIZE_12,
                        P0_X_PHONE, P0_YTOP_PHONE,
                        phone
                );
            }
        }
    }

    private void fillPage3Table(PDDocument doc, PDType0Font font,
                                String meterCode,
                                String serial,
                                Map<String, BigDecimal> percentByType,
                                Map<String, String> priceByType) throws Exception {

        if (doc.getNumberOfPages() <= PAGE_3) return;
        PDPage page = doc.getPage(PAGE_3);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

            for (ContractPdfRow row : ContractPdfRow.values()) {

                BigDecimal percent = percentByType.get(row.typeCode);
                if (percent == null || percent.compareTo(BigDecimal.ZERO) <= 0) {
                    // không dùng thì bỏ qua (không điền)
                    continue;
                }

                float yTop = row.yTop;

                // meter code + serial (điền giống nhau cho các dòng được dùng)
                if (!isBlank(meterCode)) drawTextTopLeft(cs, page, font, FONT_SIZE_12, P3_X_METER_CODE, yTop, meterCode);
                if (!isBlank(serial)) drawTextTopLeft(cs, page, font, FONT_SIZE_12, P3_X_SERIAL, yTop, serial);

                // price
                String price = priceByType.getOrDefault(row.typeCode, "");
                if (!isBlank(price)) drawTextTopLeft(cs, page, font, FONT_SIZE_12, P3_X_PRICE, yTop, price);

                // percent: template đã có dấu "%" trong ô -> chỉ điền số
                String pText = percent.stripTrailingZeros().toPlainString();
                drawTextTopLeft(cs, page, font, FONT_SIZE_12, P3_X_PERCENT, yTop, pText);
            }
        }
    }

    // ===== Drawing helpers =====

    private void fillWhiteTopLeft(PDPageContentStream cs, PDPage page,
                                  float x, float yTop, float w, float h) throws Exception {
        PDRectangle mediaBox = page.getMediaBox();
        float pageHeight = mediaBox.getHeight();

        // TOP-LEFT -> PDF y (BOTTOM-LEFT)
        float y = pageHeight - yTop - h;

        cs.saveGraphicsState();
        cs.setNonStrokingColor(255, 255, 255);
        cs.addRect(x, y, w, h);
        cs.fill();
        cs.restoreGraphicsState();
    }

    private void setTextBlack(PDPageContentStream cs) throws Exception {
        cs.setNonStrokingColor(0, 0, 0);
    }

    private void drawTextTopLeft(PDPageContentStream cs, PDPage page,
                                 PDType0Font font, float fontSize,
                                 float x, float yTop, String text) throws Exception {
        if (text == null) return;
        PDRectangle mediaBox = page.getMediaBox();
        float pageHeight = mediaBox.getHeight();

        // Convert TOP-LEFT y => PDFBox y (BOTTOM-LEFT) + chỉnh theo fontSize
        float y = pageHeight - yTop - fontSize;

        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }

    private void drawTextTopLeftWrap(PDPageContentStream cs, PDPage page,
                                     PDType0Font font, float fontSize,
                                     float x, float yTop,
                                     float maxWidth,
                                     int maxLines,
                                     String text) throws Exception {
        if (isBlank(text)) return;

        List<String> lines = wrapByWidthPreferDash(font, text.trim(), fontSize, maxWidth, maxLines);

        float lineGap = 2f; // khoảng cách giữa 2 dòng (tính theo top-left)
        for (int i = 0; i < lines.size(); i++) {
            float yLineTop = yTop + i * (fontSize + lineGap);
            drawTextTopLeft(cs, page, font, fontSize, x, yLineTop, lines.get(i));
        }
    }

    private List<String> wrapByWidthPreferDash(PDType0Font font, String text, float fontSize,
                                               float maxWidth, int maxLines) throws Exception {
        List<String> out = new ArrayList<>();
        String remaining = text;

        for (int line = 0; line < maxLines && !isBlank(remaining); line++) {
            // nếu cả đoạn còn lại đã vừa => add luôn và break
            if (textWidth(font, remaining, fontSize) <= maxWidth) {
                out.add(remaining);
                remaining = "";
                break;
            }

            // tìm điểm cắt tốt nhất: ưu tiên dấu '-' gần cuối
            int cut = -1;

            // 1) ưu tiên cắt tại '-' (contract number thường có dạng REQ-3-...)
            for (int i = remaining.length() - 1; i >= 0; i--) {
                if (remaining.charAt(i) == '-') {
                    String candidate = remaining.substring(0, i + 1); // giữ cả dấu '-'
                    if (textWidth(font, candidate, fontSize) <= maxWidth) {
                        cut = i + 1;
                        break;
                    }
                }
            }

            // 2) nếu không có '-', cắt theo độ dài giảm dần
            if (cut == -1) {
                for (int i = remaining.length() - 1; i >= 1; i--) {
                    String candidate = remaining.substring(0, i);
                    if (textWidth(font, candidate, fontSize) <= maxWidth) {
                        cut = i;
                        break;
                    }
                }
            }

            // nếu vẫn không cut được (maxWidth quá nhỏ) => ép 1 phần nhỏ
            if (cut <= 0) cut = Math.min(8, remaining.length());

            String lineText = remaining.substring(0, cut).trim();
            out.add(lineText);

            remaining = remaining.substring(cut).trim();
        }

        // Nếu vẫn còn mà hết line => nối phần còn lại vào line cuối (không mất dữ liệu)
        if (!isBlank(remaining) && !out.isEmpty()) {
            out.set(out.size() - 1, out.get(out.size() - 1) + " " + remaining);
        }

        return out;
    }

    /**
     * Vẽ text nhưng tự co font hoặc rút gọn giữa (AAA…BBB) để không vượt quá maxWidth.
     */
    private void drawTextTopLeftAutoFit(PDPageContentStream cs, PDPage page,
                                        PDType0Font font,
                                        float startFontSize, float minFontSize,
                                        float x, float yTop,
                                        float maxWidth,
                                        String text) throws Exception {
        if (isBlank(text)) return;

        String out = text.trim();
        float fs = startFontSize;

        // 1) thử giảm fontSize
        while (fs > minFontSize && textWidth(font, out, fs) > maxWidth) {
            fs -= 0.5f;
        }

        // 2) nếu vẫn dài -> rút gọn giữa
        if (textWidth(font, out, fs) > maxWidth) {
            out = shortenMiddleToFit(font, out, fs, maxWidth);
        }

        drawTextTopLeft(cs, page, font, fs, x, yTop, out);
    }

    private float textWidth(PDType0Font font, String text, float fontSize) throws Exception {
        if (text == null) return 0f;
        return (font.getStringWidth(text) / 1000f) * fontSize;
    }

    private String shortenMiddleToFit(PDType0Font font, String text, float fontSize, float maxWidth) throws Exception {
        if (isBlank(text)) return "";
        String t = text.trim();
        if (t.length() <= 4) return t;

        // giữ tối thiểu 2 ký tự đầu + 2 ký tự cuối
        int left = Math.min(6, Math.max(2, t.length() / 3));
        int right = Math.min(6, Math.max(2, t.length() / 3));

        while (left + right + 1 < t.length()) {
            String candidate = t.substring(0, left) + "…" + t.substring(t.length() - right);
            if (textWidth(font, candidate, fontSize) <= maxWidth) {
                return candidate;
            }
            // giảm dần để vừa
            if (left > 2) left--;
            if (right > 2) right--;
            if (left == 2 && right == 2) break;
        }
        return t.substring(0, 2) + "…" + t.substring(t.length() - 2);
    }

    // ===== Helpers =====

    private WaterMeter findLatestWaterMeter(Contract contract) {
        if (contract == null) return null;

        List<MeterInstallation> list = contract.getMeterInstallations();
        if (list == null || list.isEmpty()) return null;

        Comparator<MeterInstallation> cmp = Comparator
                .comparing((MeterInstallation mi) ->
                        mi.getInstallationDate() != null ? mi.getInstallationDate() : LocalDate.MIN
                )
                .thenComparing(mi ->
                        mi.getCreatedAt() != null ? mi.getCreatedAt() : LocalDateTime.MIN
                );

        return list.stream()
                .filter(mi -> mi != null && mi.getWaterMeter() != null)
                .max(cmp)
                .map(MeterInstallation::getWaterMeter)
                .orElse(null);
    }

    private Map<String, BigDecimal> mapPercentByType(List<ContractUsageDetail> list) {
        Map<String, BigDecimal> map = new HashMap<>();
        if (list == null) return map;
        for (ContractUsageDetail d : list) {
            if (d == null || d.getPriceType() == null) continue;
            String typeCode = safe(d.getPriceType().getTypeCode()).toUpperCase();
            BigDecimal pct = d.getUsagePercentage() != null ? d.getUsagePercentage() : BigDecimal.ZERO;
            map.put(typeCode, pct);
        }
        return map;
    }

    private WaterPriceType findPriceTypeFromContractUsage(List<ContractUsageDetail> list, String typeCode) {
        if (list == null) return null;
        for (ContractUsageDetail d : list) {
            if (d == null || d.getPriceType() == null) continue;
            if (typeCode.equalsIgnoreCase(d.getPriceType().getTypeCode())) {
                return d.getPriceType();
            }
        }
        return null;
    }

    private String resolveUnitPrice(WaterPriceType type, LocalDate date) {
        Optional<WaterPrice> opt = waterPriceRepository
                .findTopByPriceTypeAndStatusAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                        type, WaterPrice.Status.ACTIVE, date
                );

        if (opt.isEmpty() || opt.get().getUnitPrice() == null) return "";
        return MONEY_FMT.format(opt.get().getUnitPrice());
    }

    private String buildAddress(Address addr) {
        if (addr == null) return "";
        if (!isBlank(addr.getAddress())) return addr.getAddress();

        String street = safe(addr.getStreet());
        Ward w = addr.getWard();
        if (w == null) return street;

        String wardName = safe(w.getWardName());
        String district = safe(w.getDistrict());
        String province = safe(w.getProvince());

        StringBuilder sb = new StringBuilder();
        if (!isBlank(street)) sb.append(street);
        if (!isBlank(wardName)) sb.append(sb.length() == 0 ? "" : ", ").append(wardName);
        if (!isBlank(district)) sb.append(sb.length() == 0 ? "" : ", ").append(district);
        if (!isBlank(province)) sb.append(sb.length() == 0 ? "" : ", ").append(province);
        return sb.toString();
    }

    private String buildCustomerAddress(Customer customer) {
        if (customer == null) return "";

        if (!isBlank(customer.getAddress())) return customer.getAddress().trim();

        String street = safe(customer.getStreet());
        String district = safe(customer.getDistrict());
        String province = safe(customer.getProvince());

        String wardName = "";
        if (customer.getWard() != null) {
            wardName = safe(customer.getWard().getWardName());
        }

        StringBuilder sb = new StringBuilder();
        if (!isBlank(street)) sb.append(street);
        if (!isBlank(wardName)) sb.append(sb.length() == 0 ? "" : ", ").append(wardName);
        if (!isBlank(district)) sb.append(sb.length() == 0 ? "" : ", ").append(district);
        if (!isBlank(province)) sb.append(sb.length() == 0 ? "" : ", ").append(province);
        return sb.toString();
    }

    private enum ContractPdfRow {
        RESIDENTIAL("RESIDENTIAL", P3_YTOP_ROW_RESIDENTIAL),
        ADMINISTRATIVE("ADMINISTRATIVE", P3_YTOP_ROW_ADMINISTRATIVE),
        COMMERCIAL("COMMERCIAL", P3_YTOP_ROW_COMMERCIAL);

        final String typeCode;
        final float yTop;

        ContractPdfRow(String typeCode, float yTop) {
            this.typeCode = typeCode;
            this.yTop = yTop;
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }

    private static String firstNonBlank(String... arr) {
        if (arr == null) return "";
        for (String s : arr) {
            if (!isBlank(s)) return s.trim();
        }
        return "";
    }

    private static String trimTo(String s, int max) {
        if (s == null) return "";
        String t = s.trim();
        if (t.length() <= max) return t;
        return t.substring(0, max - 1) + "…";
    }

    private PDDocument loadTemplateAsPlainDocument(String classpath) throws Exception {
        // Rewrite template using PDFBox so output is compatible with more viewers and
        // avoid "COSStream has been closed" (happens when importing pages from a closed source doc).
        try (InputStream is = new ClassPathResource(classpath).getInputStream();
             PDDocument src = PDDocument.load(is)) {

            if (src.getDocumentCatalog() != null) {
                src.getDocumentCatalog().setStructureTreeRoot(null);
                src.getDocumentCatalog().setMetadata(null);
                src.getDocumentCatalog().setMarkInfo(null);
            }
            src.setVersion(1.4f);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            src.save(baos);

            PDDocument dst = PDDocument.load(baos.toByteArray());
            dst.setVersion(1.4f);
            if (dst.getDocumentCatalog() != null) {
                dst.getDocumentCatalog().setStructureTreeRoot(null);
                dst.getDocumentCatalog().setMetadata(null);
                dst.getDocumentCatalog().setMarkInfo(null);
            }
            return dst;
        }
    }
}