package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.ReceiptDTO;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public Page<InvoiceDTO> getInvoicesByMyRoutes(Integer cashierId, Pageable pageable) {
        // 1. Lấy danh sách ID Tuyến mà Thu ngân này quản lý
        List<Integer> myRouteIds = getMyRouteIds(cashierId);

        // 2. Định nghĩa các status "Chưa thanh toán"
        List<Invoice.PaymentStatus> unpaidStatuses = List.of(
                Invoice.PaymentStatus.PENDING,
                Invoice.PaymentStatus.OVERDUE
        );

        // 3. Gọi hàm Repo mới
        Page<Invoice> invoices = invoiceRepository.findByRouteIdsAndStatus(
                myRouteIds,
                unpaidStatuses,
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
}