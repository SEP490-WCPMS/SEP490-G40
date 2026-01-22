package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CashierContractDetailDTO;
import com.sep490.wcpms.dto.dashboard.CashierDashboardStatsDTO;
import com.sep490.wcpms.dto.dashboard.DailyReadingCountDTO;
import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.ReceiptDTO;
import com.sep490.wcpms.dto.ReadingRouteDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.AccessDeniedException;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.InvoiceMapper;
import com.sep490.wcpms.mapper.ReceiptMapper;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.ReceiptRepository;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.CashierService;
import com.sep490.wcpms.service.ActivityLogService;
import com.sep490.wcpms.service.InvoiceNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.dto.RouteManagementDTO;
import com.sep490.wcpms.entity.ReadingRoute;
import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.repository.ReadingRouteRepository;
import com.sep490.wcpms.repository.WaterServiceContractRepository;
import com.sep490.wcpms.repository.MeterReadingRepository;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService {

    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final AccountRepository accountRepository;
    private final InvoiceMapper invoiceMapper;
    private final ReceiptMapper receiptMapper;
    private final ReadingRouteRepository readingRouteRepository;
    private final WaterServiceContractRepository waterServiceContractRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final InvoiceNotificationService invoiceNotificationService;
    private final ActivityLogService activityLogService; // NEW injection
    private final SpringTemplateEngine templateEngine; // render receipt HTML

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO findUnpaidInvoice(String invoiceNumber) {

        List<Invoice.PaymentStatus> unpaidStatuses = List.of(
                Invoice.PaymentStatus.PENDING,
                Invoice.PaymentStatus.OVERDUE
        );

        Invoice invoice = invoiceRepository.findUnpaidByInvoiceNumber(invoiceNumber.trim(), unpaidStatuses)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Hóa đơn CHƯA THANH TOÁN (Pending/Overdue) với mã: " + invoiceNumber));

        return invoiceMapper.toDto(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> searchUnpaidInvoices(String keyword) {
        String searchKey = (keyword == null) ? "" : keyword.trim().toLowerCase();

        // Gọi Repo
        List<Invoice> invoices = invoiceRepository.searchUnpaidInvoices(searchKey);

        // Map sang DTO
        return invoices.stream()
                .map(invoiceMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReceiptDTO processCashPayment(Integer invoiceId, Integer cashierId, BigDecimal amountPaid, String evidenceImage) {

        // 1. Lấy Thu ngân (người đang đăng nhập)
        Account cashier = accountRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Thu ngân: " + cashierId));

        // 2. Lấy Hóa đơn
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Hóa đơn: " + invoiceId));

        // 3. Kiểm tra Hóa đơn
        if (invoice.getPaymentStatus() == Invoice.PaymentStatus.PAID) {
            throw new IllegalStateException("Hóa đơn này đã được thanh toán trước đó.");
        }
        if (invoice.getPaymentStatus() == Invoice.PaymentStatus.CANCELLED) {
            throw new IllegalStateException("Hóa đơn này đã bị hủy.");
        }

        // 4. Kiểm tra số tiền (Phải khớp 100% khi trả tiền mặt)
        if (amountPaid.compareTo(invoice.getTotalAmount()) != 0) {
            throw new IllegalArgumentException("Số tiền thanh toán (" + amountPaid +
                    ") không khớp với Tổng tiền Hóa đơn (" + invoice.getTotalAmount() + ").");
        }

        // 5. CẬP NHẬT HÓA ĐƠN (Bảng 17)
        invoice.setPaymentStatus(Invoice.PaymentStatus.PAID);
        invoice.setPaidDate(LocalDate.now());
        invoiceRepository.save(invoice);

        // 6. TẠO / CẬP NHẬT BIÊN LAI (Bảng 19)
        // Nếu đã "in biên nhận trước" thì receipt đã tồn tại -> update vào đó để tránh trùng receipt_number (unique)
        Receipt receipt = receiptRepository.findTopByInvoice_IdOrderByIdDesc(invoiceId).orElse(null);
        if (receipt == null) {
            receipt = new Receipt();
            receipt.setReceiptNumber(generateReceiptNumber(invoice)); // BL-<invoiceNumber> (+ suffix nếu trùng)
            receipt.setInvoice(invoice);
        }

        // set thông tin thanh toán (confirm)
        receipt.setPaymentAmount(amountPaid);
        receipt.setPaymentDate(LocalDate.now());
        receipt.setPaymentMethod(Receipt.PaymentMethod.CASH);
        receipt.setCashier(cashier);
        receipt.setNotes("Thu tiền mặt tại quầy.");

        // === LƯU ẢNH BẰNG CHỨNG ===
        if (evidenceImage == null || evidenceImage.isBlank()) {
            throw new IllegalArgumentException("Bắt buộc phải upload ảnh bằng chứng (chữ ký khách hàng) khi thu tiền mặt.");
        }
        receipt.setEvidenceImageBase64(evidenceImage);
        // ==========================

        Receipt savedReceipt = receiptRepository.save(receipt);

        // 7. Gửi thông báo thanh toán thành công (Email + SMS)
        try {
            invoiceNotificationService.sendInvoicePaymentSuccess(invoice, "Tiền mặt");
        } catch (Exception ex) {
            // Không chặn nghiệp vụ thu tiền mặt nếu lỗi gửi thông báo
            System.err.println(">>> WARN: Không gửi được thông báo thanh toán thành công: " + ex.getMessage());
        }

        // Persist activity log for payment (actor = cashier)
        try {
            ActivityLog paymentLog = new ActivityLog();
            paymentLog.setSubjectType("INVOICE");
            paymentLog.setSubjectId(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : String.valueOf(invoice.getId()));
            paymentLog.setAction("PAYMENT_RECEIVED");
            paymentLog.setActorType("STAFF");
            paymentLog.setActorId(cashier.getId());
            paymentLog.setActorName(cashier.getFullName());
            if (cashier.getFullName() != null) {
                paymentLog.setInitiatorName(cashier.getFullName());
                paymentLog.setInitiatorType("STAFF");
                paymentLog.setInitiatorId(cashier.getId());
            }
            // If invoice linked to a customer, prefer to record initiator as CUSTOMER
            if (invoice.getCustomer() != null) {
                paymentLog.setInitiatorType("CUSTOMER");
                paymentLog.setInitiatorId(invoice.getCustomer().getId());
                paymentLog.setInitiatorName(invoice.getCustomer().getCustomerName());
            }
            // Optionally include payload with amount
            paymentLog.setPayload("amount=" + (invoice.getTotalAmount() != null ? invoice.getTotalAmount().toString() : "0"));

            // save via ActivityLogService
            activityLogService.save(paymentLog);
        } catch (Exception ex) {
            // swallow
        }

        return receiptMapper.toDto(savedReceipt);
    }

    // === THÊM 3 HÀM MỚI (2 public, 1 private) ===

    /**
     * (Helper private) Lấy danh sách Route ID mà Thu ngân quản lý.
     */
    private List<Integer> getMyRouteIds(Integer cashierId) {
        Account cashier = accountRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Thu ngân: " + cashierId));

        // Tìm các tuyến (Bảng 4) mà Thu ngân này được gán
        List<ReadingRoute> routes = readingRouteRepository.findAllByAssignedReader(cashier);

        if (routes.isEmpty()) {
            throw new AccessDeniedException("Thu ngân này không được gán cho tuyến đọc nào.");
        }

        // Trả về danh sách các ID
        return routes.stream().map(ReadingRoute::getId).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceDTO> getInvoicesByMyRoutes(Integer cashierId, String keyword, String filterType, Pageable pageable) {
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        // Xử lý keyword
        String searchKey = (keyword == null) ? "" : keyword.trim().toLowerCase();

        // Xử lý filterType (Mặc định là ALL nếu null)
        String filter = (filterType == null || filterType.isEmpty()) ? "ALL" : filterType;

        Page<Invoice> invoices = invoiceRepository.findInvoicesForCashierCollection(
                myRouteIds,
                searchKey,
                filter,
                pageable
        );

        return invoices.map(invoiceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getCashierInvoiceDetail(Integer cashierId, Integer invoiceId) {
        // 1. Lấy danh sách ID Tuyến mà Thu ngân này quản lý (để xác thực)
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        // 2. Tìm Hóa đơn (dùng hàm Repo bảo mật)
        Invoice invoice = invoiceRepository.findByIdAndRouteIds(invoiceId, myRouteIds)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy hoặc không có quyền xem Hóa đơn này (không thuộc tuyến của bạn)."));

        return invoiceMapper.toDto(invoice);
    }
    // === HẾT PHẦN THÊM ===

    @Override
    @Transactional
    public byte[] exportWaterPaymentReceiptHtml(Integer cashierId, Integer invoiceId) {
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        Invoice invoice = invoiceRepository.findByIdAndRouteIds(invoiceId, myRouteIds)
                .orElseThrow(() -> new AccessDeniedException(
                        "Không tìm thấy hoặc không có quyền xem Hóa đơn này (không thuộc tuyến của bạn)."
                ));

        // Nếu chưa có receipt (trường hợp in trước khi thanh toán) -> tạo receipt "nháp" để có receiptNumber
        Receipt receipt = receiptRepository.findTopByInvoice_IdOrderByIdDesc(invoiceId).orElse(null);
        if (receipt == null) {
            Account cashier = getCashierAccount(cashierId);

            Receipt draft = new Receipt();
            draft.setReceiptNumber(generateReceiptNumber(invoice));
            draft.setInvoice(invoice);
            draft.setPaymentAmount(invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO);
            draft.setPaymentDate(LocalDate.now());
            draft.setPaymentMethod(Receipt.PaymentMethod.CASH);
            draft.setCashier(cashier);
            draft.setNotes("In biên nhận trước khi xác nhận thanh toán.");
            receipt = receiptRepository.save(draft);
        }

        String receiptText = buildReceiptText(invoice, receipt);

        Context ctx = new Context();
        ctx.setVariable("receiptText", receiptText);

        String html = templateEngine.process("receipt-water-payment", ctx);
        return html.getBytes(StandardCharsets.UTF_8);
    }

    // === THÊM/SỬA CÁC HÀM GHI CHỈ SỐ ===

    /**
     * (Helper private) Lấy Account Thu ngân (đã có)
     */
    private Account getCashierAccount(Integer cashierId) {
        return accountRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Thu ngân: " + cashierId));
    }

    /**
     * (Mới - Req 1) Lấy danh sách Tuyến (Bảng 4) được gán
     */
    @Override
    @Transactional(readOnly = true)
    public List<ReadingRouteDTO> getMyAssignedRoutes(Integer cashierId) {
        Account cashier = getCashierAccount(cashierId);

        List<ReadingRoute> routes = readingRouteRepository.findByAssignedReaderAndStatus(cashier, ReadingRoute.Status.ACTIVE);

        return routes.stream()
                .map(ReadingRouteDTO::new) // Dùng constructor DTO
                .collect(Collectors.toList());
    }

    /**
     * (Sửa - Req 1) Lấy Hợp đồng của 1 Tuyến CỤ THỂ
     */
    @Override
    @Transactional(readOnly = true)
    public Page<RouteManagementDTO> getMyContractsByRoute(Integer cashierId, Integer routeId, String keyword, Pageable pageable) {
        // 1. Lấy các tuyến của Thu ngân (để xác thực quyền)
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        // 2. Xác thực
        if (!myRouteIds.contains(routeId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập Tuyến đọc (ID: " + routeId + ").");
        }

        // 3. Xử lý Keyword
        String searchKeyword = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            searchKeyword = keyword.trim().toLowerCase();
        }

        // 4. Gọi Repository MỚI (Trả về Page)
        Page<WaterServiceContract> contracts = waterServiceContractRepository.searchContractsInRoute(
                routeId,
                searchKeyword,
                pageable
        );

        // 5. Map sang DTO
        return contracts.map(RouteManagementDTO::new);
    }

    /**
     * (Mới - Req 3) Lấy Chi tiết 1 Hợp đồng (xác thực)
     */
    @Override
    @Transactional(readOnly = true)
    public CashierContractDetailDTO getCashierContractDetail(Integer cashierId, Integer contractId) {
        // 1. Lấy các tuyến của Thu ngân (để xác thực)
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        // 2. Lấy HĐ Dịch vụ (Bảng 9)
        WaterServiceContract wsc = waterServiceContractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Hợp đồng Dịch vụ: " + contractId));

        // 3. Xác thực
        if (wsc.getReadingRoute() == null || !myRouteIds.contains(wsc.getReadingRoute().getId())) {
            throw new AccessDeniedException("Bạn không có quyền xem Hợp đồng này (không thuộc tuyến của bạn).");
        }

        // 4. Map sang DTO chi tiết
        return new CashierContractDetailDTO(wsc);
    }
    // === HẾT PHẦN THÊM ===


    // --- HÀM MỚI (CHO DASHBOARD) ---
    @Override
    @Transactional(readOnly = true)
    public List<RouteManagementDTO> getMyRouteContracts(Integer cashierId) {
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        if (myRouteIds.isEmpty()) {
            return List.of(); // Trả về danh sách rỗng
        }

        List<WaterServiceContract> contracts = waterServiceContractRepository
                .findByReadingRoute_IdInAndContractStatusOrderByReadingRoute_IdAscRouteOrderAsc(
                        myRouteIds,
                        WaterServiceContract.WaterServiceContractStatus.ACTIVE
                );

        return contracts.stream()
                .map(RouteManagementDTO::new)
                .collect(Collectors.toList());
    }
    // --- HẾT HÀM MỚI ---


    // === THÊM 2 HÀM MỚI (Dashboard) ===

    @Override
    @Transactional(readOnly = true)
    public CashierDashboardStatsDTO getDashboardStats(Integer cashierId) {
        Account cashier = getCashierAccount(cashierId);
        CashierDashboardStatsDTO stats = new CashierDashboardStatsDTO();
        LocalDate today = LocalDate.now();

        // 1. Số đồng hồ đã ghi HÔM NAY
        stats.setReadingsTodayCount(
                meterReadingRepository.countByReaderAndReadingDate(cashier, today)
        );

        // 2. Tiền mặt đã thu HÔM NAY
        BigDecimal cashToday = receiptRepository.sumAmountByCashierAndDateAndMethod(
                cashier, today, Receipt.PaymentMethod.CASH, Invoice.PaymentStatus.PAID
        );
        stats.setCashCollectedToday(cashToday != null ? cashToday : BigDecimal.ZERO);

        // 3. Lấy các tuyến của Thu ngân
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        if (myRouteIds.isEmpty()) {
            // Nếu Thu ngân chưa được gán tuyến, trả về 0
            stats.setPendingInvoicesOnMyRoutesCount(0);
            stats.setPendingInvoicesOnMyRoutesAmount(BigDecimal.ZERO);
        } else {
            // --- SỬA ĐOẠN NÀY (Dùng logic mới) ---

            // 4. Đếm số lượng HĐ cần thu thực tế
            long count = invoiceRepository.countInvoicesForCashierCollection(myRouteIds);
            stats.setPendingInvoicesOnMyRoutesCount(count);

            // 5. Tính tổng tiền cần thu thực tế
            BigDecimal amount = invoiceRepository.sumAmountForCashierCollection(myRouteIds);
            stats.setPendingInvoicesOnMyRoutesAmount(amount != null ? amount : BigDecimal.ZERO);

            // ------------------------------------
        }

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyReadingCountDTO> getReadingChartData(Integer cashierId, LocalDate startDate, LocalDate endDate) {
        Account cashier = getCashierAccount(cashierId);

        // Gọi thẳng hàm Repository
        return meterReadingRepository.getDailyReadingCountReport(cashier, startDate, endDate);
    }
    // === HẾT PHẦN THÊM ===

    // =========================
// Receipt HTML helpers
// =========================
    private static final int RECEIPT_WIDTH = 32;
    private static final DateTimeFormatter PRINT_DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private String buildReceiptText(Invoice invoice, Receipt receipt) {
        String companyName = "Công ty CP cấp nước Phú Thọ";
        String hotline = "0210.6251998";

        String customerCode = "";
        try {
            if (invoice.getCustomer() != null && invoice.getCustomer().getCustomerCode() != null) {
                customerCode = String.valueOf(invoice.getCustomer().getCustomerCode());
            }
        } catch (Exception ignored) {}

        String routeCode = "";
        if (invoice.getContract() != null && invoice.getContract().getReadingRoute() != null) {
            routeCode = safe(invoice.getContract().getReadingRoute().getRouteCode());
        }

        String customerName = invoice.getCustomer() != null ? safe(invoice.getCustomer().getCustomerName()) : "";
        String customerAddress = resolveServiceAddress(invoice);
        String contractNo = invoice.getContract() != null ? safe(invoice.getContract().getContractNumber()) : "";

        BigDecimal oldReading = invoice.getMeterReading() != null ? invoice.getMeterReading().getPreviousReading() : null;
        BigDecimal newReading = invoice.getMeterReading() != null ? invoice.getMeterReading().getCurrentReading() : null;

        BigDecimal consumption = invoice.getTotalConsumption() != null ? invoice.getTotalConsumption() : BigDecimal.ZERO;
        BigDecimal subtotal = invoice.getSubtotalAmount() != null ? invoice.getSubtotalAmount() : BigDecimal.ZERO;
        BigDecimal vat = invoice.getVatAmount() != null ? invoice.getVatAmount() : BigDecimal.ZERO;
        BigDecimal env = invoice.getEnvironmentFeeAmount() != null ? invoice.getEnvironmentFeeAmount() : BigDecimal.ZERO;
        BigDecimal total = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;

        BigDecimal unitPrice = resolveUnitPrice(invoice, consumption, subtotal);

        String amountWords = amountToWords(total) + " chẵn";

        LocalDateTime now = LocalDateTime.now();
        String cashierName = (receipt.getCashier() != null) ? safe(receipt.getCashier().getFullName()) : "null";
        if (cashierName.isBlank()) cashierName = "null";

        DecimalFormatSymbols us = new DecimalFormatSymbols(Locale.US);
        DecimalFormat df1 = new DecimalFormat("0.0", us);
        DecimalFormat df2 = new DecimalFormat("0.00", us);

        StringBuilder sb = new StringBuilder();
        sb.append(companyName).append('\n');
        sb.append("Hotline: ").append(hotline).append('\n');
        sb.append('\n');
        appendCentered(sb, "Biên nhận thanh toán");
        appendCentered(sb, "tiền nước");
        appendWrapped(sb, "Số BL:", safe(receipt.getReceiptNumber()));
        sb.append("Từ ").append(fmtDate(invoice.getFromDate())).append(" đến ").append(fmtDate(invoice.getToDate())).append('\n');

        sb.append(kv("Mã KH:", customerCode));
        sb.append(kv("Mã Tuyến:", routeCode));
        appendWrapped(sb, "Tên KH:", customerName);
        appendWrapped(sb, "Địa chỉ:", customerAddress);
        sb.append(kv("Số HĐ:", contractNo));
        sb.append(kv("CS cũ:", fmtIntVN(oldReading)));
        sb.append(kv("CS mới:", fmtIntVN(newReading)));
        sb.append(kv("Số TT (m3):", fmtIntVN(consumption)));

        sb.append("Chi tiết HĐ::\n");
        sb.append(df1.format(consumption)).append(" x ")
                .append(df2.format(unitPrice)).append(" = ")
                .append(df1.format(subtotal)).append('\n');
        sb.append('\n');

        sb.append(kv("Trước thuế:", fmtMoneyVN(subtotal)));
        sb.append(kv("VAT:", fmtMoneyVN(vat)));
        sb.append(kv("Phí BVMT:", fmtMoneyVN(env)));
        sb.append(kv("Tổng tiền:", fmtMoneyVN(total)));
        appendWrapped(sb, "Bằng chữ:", amountWords);
        sb.append(kv("Ngày in:", PRINT_DT_FMT.format(now)));
        sb.append(kv("NV Thu Ngân:", cashierName));
        sb.append("\nTra cứu HĐĐT tại\n");
        sb.append("https://phuthowaco.vnpt\n");
        sb.append("-invoice.com.vn\n");
        return sb.toString();
    }

    private String generateReceiptNumber(Invoice invoice) {
        String invNo = "";
        try {
            if (invoice != null && invoice.getInvoiceNumber() != null) {
                invNo = invoice.getInvoiceNumber().trim();
            }
        } catch (Exception ignored) {}

        if (invNo.isBlank()) {
            invNo = (invoice != null && invoice.getId() != null) ? String.valueOf(invoice.getId()) : String.valueOf(System.currentTimeMillis());
        }

        String base = "BL-" + invNo;
        if (!receiptRepository.existsByReceiptNumber(base)) return base;

        // fallback nếu (hiếm) bị trùng
        for (int i = 1; i <= 50; i++) {
            String candidate = base + "-" + i;
            if (!receiptRepository.existsByReceiptNumber(candidate)) return candidate;
        }
        return base + "-" + System.currentTimeMillis();
    }

    private BigDecimal resolveUnitPrice(Invoice invoice, BigDecimal consumption, BigDecimal subtotal) {
        try {
            if (invoice.getInvoiceDetails() != null && invoice.getInvoiceDetails().size() == 1) {
                InvoiceDetail d = invoice.getInvoiceDetails().get(0);
                if (d != null && d.getUnitPrice() != null) return d.getUnitPrice();
            }
        } catch (Exception ignored) {}
        if (consumption == null || consumption.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return subtotal.divide(consumption, 2, java.math.RoundingMode.HALF_UP);
    }

    private void appendCentered(StringBuilder sb, String text) {
        text = safe(text);
        int pad = Math.max(0, (RECEIPT_WIDTH - text.length()) / 2);
        sb.append(" ".repeat(pad)).append(text).append('\n');
    }

    private String kv(String key, String value) {
        key = safe(key);
        value = safe(value);
        int spaces = Math.max(1, RECEIPT_WIDTH - key.length() - value.length());
        return key + " ".repeat(spaces) + value + "\n";
    }

    private void appendWrapped(StringBuilder sb, String prefix, String value) {
        prefix = safe(prefix);
        value = safe(value);
        int maxFirst = Math.max(5, RECEIPT_WIDTH - prefix.length());
        if (value.length() <= maxFirst) {
            sb.append(prefix).append(value).append('\n');
            return;
        }
        sb.append(prefix).append(value, 0, maxFirst).append('\n');
        String rest = value.substring(maxFirst);
        while (!rest.isEmpty()) {
            int len = Math.min(RECEIPT_WIDTH, rest.length());
            sb.append(rest, 0, len).append('\n');
            rest = rest.substring(len);
        }
    }

    private String fmtDate(LocalDate d) {
        if (d == null) return "";
        return d.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private BigDecimal normalizeVnd(BigDecimal v) {
        if (v == null) return BigDecimal.ZERO;
        return v.setScale(0, RoundingMode.HALF_UP);
    }

    private String fmtMoneyVN(BigDecimal v) {
        v = normalizeVnd(v);
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        nf.setMaximumFractionDigits(0);
        nf.setMinimumFractionDigits(0);
        return nf.format(v);
    }

    private String fmtIntVN(BigDecimal v) {
        if (v == null) return "";
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        nf.setMaximumFractionDigits(0);
        nf.setMinimumFractionDigits(0);
        return nf.format(v);
    }

    private String safe(String s) {
        return s == null ? "" : s.trim();
    }

    // Copy logic from InvoicePdfExportService (để in đúng địa chỉ theo HĐ nếu có)
    private String resolveServiceAddress(Invoice invoice) {
        try {
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
        } catch (Exception ignored) {}

        Customer c = invoice != null ? invoice.getCustomer() : null;
        return (c != null && c.getAddress() != null) ? c.getAddress() : "";
    }

    private static final String[] NUM_WORDS = {"không","một","hai","ba","bốn","năm","sáu","bảy","tám","chín"};

    private String readThreeDigits(int number) {
        int hundred = number / 100;
        int ten = (number % 100) / 10;
        int unit = number % 10;

        StringBuilder sb = new StringBuilder();

        if (hundred > 0) {
            sb.append(NUM_WORDS[hundred]).append(" trăm");
            if (ten == 0 && unit > 0) sb.append(" linh");
        }

        if (ten > 1) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(NUM_WORDS[ten]).append(" mươi");
            if (unit == 1) sb.append(" mốt");
            else if (unit == 4) sb.append(" tư");
            else if (unit == 5) sb.append(" lăm");
            else if (unit > 0) sb.append(" ").append(NUM_WORDS[unit]);
        } else if (ten == 1) {
            if (sb.length() > 0) sb.append(" ");
            sb.append("mười");
            if (unit == 1) sb.append(" một");
            else if (unit == 4) sb.append(" bốn");
            else if (unit == 5) sb.append(" lăm");
            else if (unit > 0) sb.append(" ").append(NUM_WORDS[unit]);
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
        if (value == 0) return "Không đồng";

        String[] units = {"", " nghìn", " triệu", " tỷ"};
        StringBuilder result = new StringBuilder();

        int unitIndex = 0;
        while (value > 0 && unitIndex < units.length) {
            int threeDigits = (int) (value % 1000);
            if (threeDigits != 0) {
                String part = readThreeDigits(threeDigits);
                if (!part.isEmpty()) {
                    if (result.length() > 0) result.insert(0, " ");
                    result.insert(0, part + units[unitIndex]);
                }
            }
            value /= 1000;
            unitIndex++;
        }

        String s = result.toString().trim();
        if (s.isEmpty()) s = "không";
        return s.substring(0, 1).toUpperCase() + s.substring(1) + " đồng";
    }
}