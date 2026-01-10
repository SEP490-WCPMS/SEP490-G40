package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.MeterInstallationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InstallationAcceptancePdfService {

    private final ContractRepository contractRepository;
    private final MeterInstallationRepository meterInstallationRepository;

    private static final String TEMPLATE_CLASSPATH = "pdf-templates/Phieu_nghiem_thu_lap_dat_dong_ho.pdf";
    private static final String FONT_CLASSPATH = "fonts/times.ttf";

    private static final float FONT_12 = 12f;

    // ====== bbox (top-left) chuẩn theo pdftotext -bbox (A4 595.32 x 841.92) ======

    // "Số:" label + vùng chấm: 92.664..109.94, chấm bắt đầu 113.1696
    private static final float TOP_SO_LABEL_X = 92.664000f;
    private static final float TOP_SO_X = 113.169600f;
    private static final float TOP_SO_BASELINE = 128.859360f;
    private static final float TOP_SO_RECT_YMIN = 116.512640f;
    private static final float TOP_SO_RECT_YMAX = 130.859360f;

    // Date: ngày/tháng/năm
    private static final float TOP_DATE_BASELINE = 195.339360f;
    private static final float TOP_DATE_RECT_YMIN = 182.992640f;
    private static final float TOP_DATE_RECT_YMAX = 197.339360f;

    private static final float TOP_DAY_X = 175.583520f;
    private static final float TOP_DAY_RECT_XMAX = 191.795040f;

    private static final float TOP_MONTH_X = 227.276640f;
    private static final float TOP_MONTH_RECT_XMAX = 243.488160f;

    private static final float TOP_YEAR_X = 272.380320f;
    private static final float TOP_YEAR_RECT_XMAX = 291.834720f;

    // Company rep (chỉ 1 dòng: kỹ thuật)
    private static final float TOP_COMPANY1_X = 194.037440f;
    private static final float TOP_COMPANY1_BASELINE = 252.939360f;
    private static final float TOP_COMPANY1_RECT_YMIN = 240.592640f;
    private static final float TOP_COMPANY1_RECT_YMAX = 254.939360f;
    private static final float TOP_COMPANY1_RECT_XMAX = 512.432960f;

    // Customer rep
    private static final float TOP_CUSTOMER_X = 153.620000f;
    private static final float TOP_CUSTOMER_BASELINE = 308.529360f;
    private static final float TOP_CUSTOMER_RECT_YMIN = 296.182640f;
    private static final float TOP_CUSTOMER_RECT_YMAX = 310.529360f;
    private static final float TOP_CUSTOMER_RECT_XMAX = 514.193120f;

    // Address
    private static final float TOP_ADDRESS_X = 139.460000f;
    private static final float TOP_ADDRESS_BASELINE = 325.689360f;
    private static final float TOP_ADDRESS_RECT_YMIN = 313.342640f;
    private static final float TOP_ADDRESS_RECT_YMAX = 327.689360f;
    private static final float TOP_ADDRESS_RECT_XMAX = 513.096800f;

    // Meter type + phi
    private static final float TOP_METER_TYPE_X = 117.590880f;
    private static final float TOP_METER_TYPE_BASELINE = 360.129360f;
    private static final float TOP_METER_TYPE_RECT_YMIN = 347.782640f;
    private static final float TOP_METER_TYPE_RECT_YMAX = 362.129360f;
    private static final float TOP_METER_TYPE_RECT_XMAX = 351.550000f;

    private static final float TOP_METER_PHI_X = 380.583760f;
    private static final float TOP_METER_PHI_BASELINE = 360.129360f;
    private static final float TOP_METER_PHI_RECT_YMIN = 347.782640f;
    private static final float TOP_METER_PHI_RECT_YMAX = 362.129360f;
    private static final float TOP_METER_PHI_RECT_XMAX = 513.803680f;

    // Serial + initial reading
    private static final float TOP_SERIAL_X = 148.293120f;
    private static final float TOP_SERIAL_BASELINE = 377.289360f;
    private static final float TOP_SERIAL_RECT_YMIN = 364.942640f;
    private static final float TOP_SERIAL_RECT_YMAX = 379.289360f;
    private static final float TOP_SERIAL_RECT_XMAX = 258.660480f;

    private static final float TOP_INITIAL_READING_X = 399.846720f;
    private static final float TOP_INITIAL_READING_BASELINE = 377.289360f;
    private static final float TOP_INITIAL_READING_RECT_YMIN = 364.942640f;
    private static final float TOP_INITIAL_READING_RECT_YMAX = 379.289360f;
    private static final float TOP_INITIAL_READING_RECT_XMAX = 497.483680f;

    // Technical condition 2 lines
    private static final float TOP_TECH_LINE1_X = 222.925440f;
    private static final float TOP_TECH_LINE1_BASELINE = 394.449360f;
    private static final float TOP_TECH_LINE1_RECT_YMIN = 382.102640f;
    private static final float TOP_TECH_LINE1_RECT_YMAX = 396.449360f;
    private static final float TOP_TECH_LINE1_RECT_XMAX = 515.620000f;

    private static final float TOP_TECH_LINE2_X = 56.640000f;
    private static final float TOP_TECH_LINE2_BASELINE = 411.609360f;
    private static final float TOP_TECH_LINE2_RECT_YMIN = 399.262640f;
    private static final float TOP_TECH_LINE2_RECT_YMAX = 413.609360f;
    private static final float TOP_TECH_LINE2_RECT_XMAX = 514.900000f;

    // Tick: dùng 3 cột cố định cho CẢ 2 hàng để cân nhau
    private static final float TOP_TICK_INSTALL_BASELINE = 454.229360f;
    private static final float TOP_TICK_PURPOSE_BASELINE = 494.549360f;
    private static final float TICK_COL_1_X = 120.000000f;
    private static final float TICK_COL_2_X = 250.000000f;
    private static final float TICK_COL_3_X = 430.000000f;

    // ====== “clear dots” đẹp hơn: chỉ xóa 1 dải mỏng thay vì phủ cả block cao ======
    // Trim bớt trên/dưới vùng bbox để tránh cảm giác “mảng trắng”
    private static final float DOT_CLEAR_TRIM_TOP = 3.0f;
    private static final float DOT_CLEAR_TRIM_BOTTOM = 3.0f;

    // Nudge nhẹ baseline lên trên một chút (đơn vị top-left)
    private static final float NUDGE_BASELINE_UP = -1.0f;

    @Transactional
    public byte[] exportForCustomer(Integer customerAccountId, Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        // Permission check: chỉ customer của hợp đồng mới tải được
        Integer ownerAccountId = null;
        if (contract.getCustomer() != null && contract.getCustomer().getAccount() != null) {
            ownerAccountId = contract.getCustomer().getAccount().getId();
        }
        if (ownerAccountId == null || !ownerAccountId.equals(customerAccountId)) {
            throw new AccessDeniedException("Bạn không có quyền tải phiếu nghiệm thu này.");
        }

        // Lấy bản lắp đặt mới nhất + đồng hồ
        MeterInstallation mi = findLatestInstallation(contract);
        WaterMeter wm = (mi != null) ? mi.getWaterMeter() : null;

        // ====== data ======
        String contractNumber = safe(contract.getContractNumber());
        String soPhieu = isBlank(contractNumber) ? "" : (contractNumber + "/KH-CN");

        LocalDate acceptanceDate = (mi != null && mi.getInstallationDate() != null)
                ? mi.getInstallationDate()
                : (contract.getInstallationDate() != null ? contract.getInstallationDate() : LocalDate.now());

        // Chỉ điền TÊN KỸ THUẬT, bỏ tên dịch vụ
        String companyRep1 = "";
        if (mi != null && mi.getTechnicalStaff() != null) {
            companyRep1 = safe(mi.getTechnicalStaff().getFullName());
        }
        if (isBlank(companyRep1) && contract.getTechnicalStaff() != null) {
            companyRep1 = safe(contract.getTechnicalStaff().getFullName());
        }

        Customer customer = contract.getCustomer();
        String customerRep = "";
        if (customer != null) {
            customerRep = firstNonBlank(
                    customer.getContactPersonName(),
                    customer.getCustomerName(),
                    customer.getAccount() != null ? customer.getAccount().getFullName() : null
            );
        }

        String address = "";
        if (contract.getAddress() != null) {
            address = buildAddress(contract.getAddress());
        }
        if (isBlank(address) && customer != null) {
            address = buildCustomerAddress(customer);
        }

        String meterType = "";
        String meterPhi = "";
        String serial = "";
        if (wm != null) {
            meterType = firstNonBlank(wm.getMeterName(), wm.getMeterType());
            meterPhi = safe(wm.getSize());
            serial = safe(wm.getSerialNumber());
        }

        String initialReading = "";
        if (mi != null && mi.getInitialReading() != null) {
            initialReading = stripTrailingZeros(mi.getInitialReading());
        }

        String technicalCondition = "";
        if (mi != null) technicalCondition = safe(mi.getNotes());
        if (isBlank(technicalCondition)) {
            technicalCondition = "Đồng hồ và phụ kiện lắp đặt đảm bảo kỹ thuật, vận hành ổn định.";
        }

        // ====== tick logic ======
        String notesLower = technicalCondition.toLowerCase(Locale.ROOT);
        boolean tickLapMoi = containsAny(notesLower, "lắp mới", "lap moi");
        boolean tickThay = containsAny(notesLower, "thay", "thay thế", "thay the");
        boolean tickLapThem = containsAny(notesLower, "lắp thêm", "lap them", "bổ sung", "bo sung");
        if (!tickLapMoi && !tickThay && !tickLapThem) tickLapMoi = true;

        PurposeTick purposeTick = inferPurpose(contract, customer);

        // ====== Render PDF ======
        try (
                InputStream templateIs = new ClassPathResource(TEMPLATE_CLASSPATH).getInputStream();
                PDDocument doc = PDDocument.load(templateIs);
                InputStream fontIs = new ClassPathResource(FONT_CLASSPATH).getInputStream();
                ByteArrayOutputStream baos = new ByteArrayOutputStream()
        ) {
            PDType0Font font = PDType0Font.load(doc, fontIs, true);

            PDPage page = doc.getPage(0);
            PDRectangle box = page.getMediaBox();
            float pageH = box.getHeight();

            try (PDPageContentStream cs = new PDPageContentStream(
                    doc, page, PDPageContentStream.AppendMode.APPEND, true, true
            )) {

                // ====== 1) Số: phủ trắng rộng để không bị "đè ...", rồi vẽ lại ======
                // phủ trắng cả cụm "Số: ....../KH-CN" (cho REQ-... dài)
                fillWhiteRectTop(cs, pageH, 92.000f, TOP_SO_RECT_YMIN, 250.000f, TOP_SO_RECT_YMAX);

                // vẽ lại label "Số:"
                drawTop(cs, font, FONT_12, pageH, TOP_SO_LABEL_X, TOP_SO_BASELINE, "Số:");

                // số phiếu: co font nếu quá dài để tránh đè sang phải
                float soMaxWidth = 250.000f - TOP_SO_X - 2f;
                float soFont = fontSizeToFit(font, FONT_12, 9.0f, soPhieu, soMaxWidth);
                drawTop(cs, font, soFont, pageH, TOP_SO_X, TOP_SO_BASELINE, soPhieu);

                // ====== 2) Ngày / tháng / năm: xóa dải “...” mỏng + canh giữa ======
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_DATE_BASELINE,
                        TOP_DAY_X, TOP_DAY_RECT_XMAX,
                        TOP_DATE_RECT_YMIN, TOP_DATE_RECT_YMAX,
                        pad2(acceptanceDate.getDayOfMonth()),
                        Align.CENTER, 0f, NUDGE_BASELINE_UP);

                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_DATE_BASELINE,
                        TOP_MONTH_X, TOP_MONTH_RECT_XMAX,
                        TOP_DATE_RECT_YMIN, TOP_DATE_RECT_YMAX,
                        pad2(acceptanceDate.getMonthValue()),
                        Align.CENTER, 0f, NUDGE_BASELINE_UP);

                // Fix “năm2025” bị dính chữ: nudge X sang phải một chút
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_DATE_BASELINE,
                        TOP_YEAR_X, TOP_YEAR_RECT_XMAX,
                        TOP_DATE_RECT_YMIN, TOP_DATE_RECT_YMAX,
                        String.valueOf(acceptanceDate.getYear()),
                        Align.CENTER, 6f, NUDGE_BASELINE_UP);

                // ====== 3) Đại diện công ty: chỉ điền kỹ thuật (xóa “...” mỏng để không còn chấm sau chữ) ======
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_COMPANY1_BASELINE,
                        TOP_COMPANY1_X, TOP_COMPANY1_RECT_XMAX,
                        TOP_COMPANY1_RECT_YMIN, TOP_COMPANY1_RECT_YMAX,
                        companyRep1,
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                // ====== 4) Đại diện khách hàng + địa chỉ ======
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_CUSTOMER_BASELINE,
                        TOP_CUSTOMER_X, TOP_CUSTOMER_RECT_XMAX,
                        TOP_CUSTOMER_RECT_YMIN, TOP_CUSTOMER_RECT_YMAX,
                        customerRep,
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                String addrFit = fitText(font, FONT_12, address, TOP_ADDRESS_RECT_XMAX - TOP_ADDRESS_X);
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_ADDRESS_BASELINE,
                        TOP_ADDRESS_X, TOP_ADDRESS_RECT_XMAX,
                        TOP_ADDRESS_RECT_YMIN, TOP_ADDRESS_RECT_YMAX,
                        addrFit,
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                // ====== 5) Đồng hồ: loại + Φ + serial ======
                String typeFit = fitText(font, FONT_12, meterType, TOP_METER_TYPE_RECT_XMAX - TOP_METER_TYPE_X);
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_METER_TYPE_BASELINE,
                        TOP_METER_TYPE_X, TOP_METER_TYPE_RECT_XMAX,
                        TOP_METER_TYPE_RECT_YMIN, TOP_METER_TYPE_RECT_YMAX,
                        typeFit,
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                String phiFit = fitText(font, FONT_12, meterPhi, TOP_METER_PHI_RECT_XMAX - TOP_METER_PHI_X);
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_METER_PHI_BASELINE,
                        TOP_METER_PHI_X, TOP_METER_PHI_RECT_XMAX,
                        TOP_METER_PHI_RECT_YMIN, TOP_METER_PHI_RECT_YMAX,
                        phiFit,
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                String serialFit = fitText(font, FONT_12, serial, TOP_SERIAL_RECT_XMAX - TOP_SERIAL_X);
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_SERIAL_BASELINE,
                        TOP_SERIAL_X, TOP_SERIAL_RECT_XMAX,
                        TOP_SERIAL_RECT_YMIN, TOP_SERIAL_RECT_YMAX,
                        serialFit,
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                // ====== 6) Chỉ số khi lắp: xóa “...” mỏng + canh giữa, nudge X nhẹ ======
                String readingFit = fitText(font, FONT_12, initialReading, TOP_INITIAL_READING_RECT_XMAX - TOP_INITIAL_READING_X);
                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_INITIAL_READING_BASELINE,
                        TOP_INITIAL_READING_X, TOP_INITIAL_READING_RECT_XMAX,
                        TOP_INITIAL_READING_RECT_YMIN, TOP_INITIAL_READING_RECT_YMAX,
                        readingFit,
                        Align.CENTER, 2f, NUDGE_BASELINE_UP);

                // ====== 7) Tình trạng kỹ thuật: 2 dòng, xóa “...” mỏng để sạch ======
                TwoLines tl = wrapTwoLines(font, FONT_12, technicalCondition,
                        TOP_TECH_LINE1_RECT_XMAX - TOP_TECH_LINE1_X,
                        TOP_TECH_LINE2_RECT_XMAX - TOP_TECH_LINE2_X
                );

                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_TECH_LINE1_BASELINE,
                        TOP_TECH_LINE1_X, TOP_TECH_LINE1_RECT_XMAX,
                        TOP_TECH_LINE1_RECT_YMIN, TOP_TECH_LINE1_RECT_YMAX,
                        tl.line1(),
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                drawOnDotsFieldTopClean(cs, font, FONT_12, pageH,
                        TOP_TECH_LINE2_BASELINE,
                        TOP_TECH_LINE2_X, TOP_TECH_LINE2_RECT_XMAX,
                        TOP_TECH_LINE2_RECT_YMIN, TOP_TECH_LINE2_RECT_YMAX,
                        tl.line2(),
                        Align.LEFT, 0f, NUDGE_BASELINE_UP);

                // ====== 8) Tick: dùng 3 cột chung để 2 hàng cân nhau ======
                if (tickLapMoi) drawTop(cs, font, FONT_12, pageH, TICK_COL_1_X, TOP_TICK_INSTALL_BASELINE, "X");
                if (tickThay) drawTop(cs, font, FONT_12, pageH, TICK_COL_2_X, TOP_TICK_INSTALL_BASELINE, "X");
                if (tickLapThem) drawTop(cs, font, FONT_12, pageH, TICK_COL_3_X, TOP_TICK_INSTALL_BASELINE, "X");

                if (purposeTick.sinhHoat) drawTop(cs, font, FONT_12, pageH, TICK_COL_1_X, TOP_TICK_PURPOSE_BASELINE, "X");
                if (purposeTick.sanXuat) drawTop(cs, font, FONT_12, pageH, TICK_COL_2_X, TOP_TICK_PURPOSE_BASELINE, "X");
                if (purposeTick.kinhDoanh) drawTop(cs, font, FONT_12, pageH, TICK_COL_3_X, TOP_TICK_PURPOSE_BASELINE, "X");
            }

            doc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export acceptance PDF: " + e.getMessage(), e);
        }
    }

    // ========================= Finder (không tạo method repo mới) =========================

    private MeterInstallation findLatestInstallation(Contract contract) {
        if (contract == null) return null;

        // Ưu tiên dùng method đã có trong repo (nếu có); nếu không có thì catch và fallback
        try {
            Optional<MeterInstallation> opt = meterInstallationRepository
                    .findTopByContractAndWaterMeter_MeterStatusOrderByCreatedAtDesc(contract, WaterMeter.MeterStatus.INSTALLED);
            if (opt.isPresent()) return opt.get();
        } catch (Exception ignore) { }

        try {
            Optional<MeterInstallation> opt = meterInstallationRepository.findTopByContractOrderByCreatedAtDesc(contract);
            if (opt.isPresent()) return opt.get();
        } catch (Exception ignore) { }

        // Fallback: lấy từ contract.getMeterInstallations()
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
                .filter(mi -> mi != null)
                .max(cmp)
                .orElse(null);
    }

    // ========================= Purpose inference =========================

    private PurposeTick inferPurpose(Contract contract, Customer customer) {
        PurposeTick t = new PurposeTick(true, false, false);

        String typeCode = "";

        if (contract != null && contract.getContractUsageDetails() != null) {
            for (ContractUsageDetail d : contract.getContractUsageDetails()) {
                if (d == null || d.getPriceType() == null) continue;
                String c = safe(d.getPriceType().getTypeCode());
                if (!isBlank(c)) { typeCode = c; break; }
            }
        }

        if (isBlank(typeCode) && customer != null && customer.getPriceType() != null) {
            typeCode = safe(customer.getPriceType().getTypeCode());
        }

        String lc = typeCode.toLowerCase(Locale.ROOT);

        if (containsAny(lc, "sx", "sanxuat", "sảnxuất", "san xuat", "sản xuất")) {
            return new PurposeTick(false, true, false);
        }
        if (containsAny(lc, "kd", "kinhdoanh", "kinh doanh", "dv", "dichvu", "dịch vụ", "service")) {
            return new PurposeTick(false, false, true);
        }
        return t;
    }

    private static class PurposeTick {
        final boolean sinhHoat;
        final boolean sanXuat;
        final boolean kinhDoanh;

        PurposeTick(boolean sinhHoat, boolean sanXuat, boolean kinhDoanh) {
            this.sinhHoat = sinhHoat;
            this.sanXuat = sanXuat;
            this.kinhDoanh = kinhDoanh;
        }
    }

    // ========================= PDF helpers =========================

    private static void drawTop(PDPageContentStream cs, PDType0Font font, float fontSize,
                                float pageHeight, float xTop, float yTopBaseline, String text) throws Exception {
        if (text == null) text = "";
        float yPdf = pageHeight - yTopBaseline;
        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(xTop, yPdf);
        cs.showText(text);
        cs.endText();
    }

    private static String fitText(PDType0Font font, float fontSize, String text, float maxWidth) throws Exception {
        text = safe(text);
        if (isBlank(text)) return "";
        String cur = text;
        while (!cur.isEmpty() && textWidth(font, fontSize, cur) > maxWidth) {
            cur = cur.substring(0, cur.length() - 1);
        }
        return cur;
    }

    private static float textWidth(PDType0Font font, float fontSize, String s) throws Exception {
        if (s == null) return 0f;
        return (font.getStringWidth(s) / 1000f) * fontSize;
    }

    private record TwoLines(String line1, String line2) {}

    private static TwoLines wrapTwoLines(PDType0Font font, float fontSize, String text, float w1, float w2) throws Exception {
        text = safe(text);
        if (isBlank(text)) return new TwoLines("", "");

        String[] words = text.split("\\s+");
        StringBuilder l1 = new StringBuilder();
        StringBuilder l2 = new StringBuilder();

        int i = 0;
        for (; i < words.length; i++) {
            String next = (l1.length() == 0) ? words[i] : (l1 + " " + words[i]);
            if (textWidth(font, fontSize, next) <= w1) {
                if (l1.length() > 0) l1.append(' ');
                l1.append(words[i]);
            } else break;
        }
        for (; i < words.length; i++) {
            String next = (l2.length() == 0) ? words[i] : (l2 + " " + words[i]);
            if (textWidth(font, fontSize, next) <= w2) {
                if (l2.length() > 0) l2.append(' ');
                l2.append(words[i]);
            } else break;
        }

        return new TwoLines(l1.toString(), l2.toString());
    }

    private enum Align { LEFT, CENTER }

    private static void fillWhiteRectTop(PDPageContentStream cs, float pageH,
                                         float x1, float yMinTop, float x2, float yMaxTop) throws Exception {
        float yPdf = pageH - yMaxTop;
        float h = yMaxTop - yMinTop;
        cs.saveGraphicsState();
        cs.setNonStrokingColor(Color.WHITE);
        cs.addRect(x1, yPdf, (x2 - x1), h);
        cs.fill();
        cs.restoreGraphicsState();
    }

    private static void fillWhiteRectTopTrimmed(PDPageContentStream cs, float pageH,
                                                float x1, float yMinTop, float x2, float yMaxTop,
                                                float trimTop, float trimBottom) throws Exception {
        float y1 = yMinTop + trimTop;
        float y2 = yMaxTop - trimBottom;
        if (y2 <= y1) {
            // fallback nếu trim quá tay
            y1 = yMinTop;
            y2 = yMaxTop;
        }
        fillWhiteRectTop(cs, pageH, x1, y1, x2, y2);
    }

    private static float fontSizeToFit(PDType0Font font, float start, float min,
                                       String text, float maxWidth) throws Exception {
        if (text == null) return start;
        float fs = start;
        while (fs > min) {
            float w = (font.getStringWidth(text) / 1000f) * fs;
            if (w <= maxWidth) return fs;
            fs -= 0.25f;
        }
        return min;
    }

    /**
     * “Clean” dotted placeholders:
     * - Không phủ trắng nguyên block cao (trông như mảng trắng)
     * - Chỉ xóa 1 dải mỏng trong vùng dấu chấm (trim top/bottom)
     * - Chỉ xóa khi text != blank (nếu trống thì giữ nguyên template)
     */
    private static void drawOnDotsFieldTopClean(PDPageContentStream cs, PDType0Font font, float fontSize,
                                                float pageH,
                                                float baselineTop,
                                                float rectXMin, float rectXMax,
                                                float rectYMinTop, float rectYMaxTop,
                                                String text,
                                                Align align,
                                                float nudgeX,
                                                float nudgeYTop) throws Exception {

        text = (text == null) ? "" : text.trim();
        if (isBlank(text)) {
            // không có dữ liệu thì để nguyên dấu chấm của template
            return;
        }

        float textW = (font.getStringWidth(text) / 1000f) * fontSize;
        float rectW = rectXMax - rectXMin;

        float x;
        if (align == Align.CENTER) {
            x = rectXMin + (rectW - textW) / 2f + nudgeX;
        } else {
            x = rectXMin + nudgeX;
        }

        // Xóa dotted line bằng “dải mỏng” trong bbox => nhìn tự nhiên hơn
        fillWhiteRectTopTrimmed(cs, pageH, rectXMin, rectYMinTop, rectXMax, rectYMaxTop,
                DOT_CLEAR_TRIM_TOP, DOT_CLEAR_TRIM_BOTTOM);

        // Vẽ text (nudge baseline lên nhẹ để nhìn thoáng)
        drawTop(cs, font, fontSize, pageH, x, baselineTop + nudgeYTop, text);
    }

    // ========================= String/date helpers =========================

    private static String pad2(int n) {
        return (n < 10) ? ("0" + n) : String.valueOf(n);
    }

    private static String stripTrailingZeros(BigDecimal v) {
        if (v == null) return "";
        return v.stripTrailingZeros().toPlainString();
    }

    private static boolean containsAny(String haystackLower, String... needles) {
        if (haystackLower == null) return false;
        for (String n : needles) {
            if (n == null) continue;
            if (haystackLower.contains(n.toLowerCase(Locale.ROOT))) return true;
        }
        return false;
    }

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String firstNonBlank(String... arr) {
        if (arr == null) return "";
        for (String s : arr) {
            if (!isBlank(s)) return s.trim();
        }
        return "";
    }

    // ========================= Address helpers =========================

    private static String buildAddress(Address addr) {
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

    private static String buildCustomerAddress(Customer customer) {
        if (customer == null) return "";

        if (!isBlank(customer.getAddress())) return customer.getAddress().trim();

        String street = safe(customer.getStreet());
        String district = safe(customer.getDistrict());
        String province = safe(customer.getProvince());

        StringBuilder sb = new StringBuilder();
        if (!isBlank(street)) sb.append(street);
        if (!isBlank(district)) sb.append(sb.length() == 0 ? "" : ", ").append(district);
        if (!isBlank(province)) sb.append(sb.length() == 0 ? "" : ", ").append(province);
        return sb.toString();
    }
}