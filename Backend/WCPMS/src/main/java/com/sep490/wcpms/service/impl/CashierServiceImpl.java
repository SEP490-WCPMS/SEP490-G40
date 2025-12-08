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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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
    private final ActivityLogService activityLogService; // NEW injection

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
    public ReceiptDTO processCashPayment(Integer invoiceId, Integer cashierId, BigDecimal amountPaid) {

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

        // 6. TẠO BIÊN LAI (Bảng 19)
        Receipt receipt = new Receipt();
        receipt.setReceiptNumber("BL-" + invoice.getInvoiceNumber()); // Tạo mã biên lai
        receipt.setInvoice(invoice);
        receipt.setPaymentAmount(amountPaid);
        receipt.setPaymentDate(LocalDate.now());
        receipt.setPaymentMethod(Receipt.PaymentMethod.CASH); // <-- Thanh toán TIỀN MẶT
        receipt.setCashier(cashier);
        receipt.setNotes("Thu tiền mặt tại quầy.");

        Receipt savedReceipt = receiptRepository.save(receipt);

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
                cashier, today, Receipt.PaymentMethod.CASH
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
}