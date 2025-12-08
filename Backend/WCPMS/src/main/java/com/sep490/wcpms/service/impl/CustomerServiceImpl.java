package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.InvoiceDTO; // <-- THÊM
import com.sep490.wcpms.entity.Customer; // <-- THÊM
import com.sep490.wcpms.entity.Invoice; // <-- THÊM
import com.sep490.wcpms.exception.AccessDeniedException; // <-- THÊM
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.InvoiceMapper; // <-- THÊM
import com.sep490.wcpms.repository.AccountRepository; // <-- THÊM
import com.sep490.wcpms.repository.CustomerRepository; // <-- THÊM
import com.sep490.wcpms.repository.InvoiceRepository; // <-- THÊM
// ... (các import cũ)
import com.sep490.wcpms.repository.MeterInstallationRepository;
import com.sep490.wcpms.service.ContractCustomerService;
import com.sep490.wcpms.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page; // <-- THÊM
import org.springframework.data.domain.Pageable; // <-- THÊM
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List; // <-- THÊM
import java.util.stream.Collectors; // <-- THÊM
import com.sep490.wcpms.dto.InstallationDetailDTO; // <-- Thêm
import com.sep490.wcpms.entity.MeterInstallation; // <-- Thêm

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    // --- INJECT CÁC REPO CẦN THIẾT ---
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceMapper invoiceMapper;
    private final MeterInstallationRepository meterInstallationRepository;
    // ... (các repo cũ)

    // ... (Các hàm cũ: requestNewContract, getMyContracts, ...)


    // === TRIỂN KHAI 2 HÀM MỚI ===

    /**
     * Helper (private) để lấy Customer từ Account ID
     */
    private Customer getCustomerFromAccountId(Integer customerAccountId) {
        return customerRepository.findByAccount_Id(customerAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng cho tài khoản: " + customerAccountId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceDTO> getMyInvoicesByStatus(Integer customerAccountId, List<String> statusStrings, String keyword, Pageable pageable) {
        Customer customer = getCustomerFromAccountId(customerAccountId);

        // 1. Xử lý Status
        List<Invoice.PaymentStatus> targetStatuses = null;
        if (statusStrings != null && !statusStrings.isEmpty() && !statusStrings.contains("ALL")) {
            targetStatuses = statusStrings.stream()
                    .map(s -> {
                        try {
                            return Invoice.PaymentStatus.valueOf(s.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            return null;
                        }
                    })
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());

            // Nếu lọc sai hết (vd gửi lên "ABC") -> trả về rỗng luôn
            if (targetStatuses.isEmpty()) {
                // return Page.empty(pageable); // Tùy chọn
            }
        }

        // 2. Xử lý Keyword (Trim)
        String searchKeyword = (keyword != null) ? keyword.trim() : null;

        // 3. Gọi Repository
        Page<Invoice> invoices = invoiceRepository.searchMyInvoices(
                customer.getId(),
                targetStatuses,
                searchKeyword,
                pageable
        );

        return invoices.map(invoiceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getMyInvoiceDetail(Integer customerAccountId, Integer invoiceId) {
        Customer customer = getCustomerFromAccountId(customerAccountId);

        // Gọi hàm repo mới (Bảo mật: tìm bằng ID và Customer)
        Invoice invoice = invoiceRepository.findByIdAndCustomer(invoiceId, customer)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy hoặc không có quyền truy cập hóa đơn này."));

        return invoiceMapper.toDto(invoice);
    }
    // === HẾT PHẦN THÊM ===

    // --- THÊM HÀM MỚI ---
    @Override
    @Transactional(readOnly = true)
    public InstallationDetailDTO getMyInstallationDetail(Integer customerAccountId, Integer installationId) {
        Customer customer = getCustomerFromAccountId(customerAccountId);

        MeterInstallation installation = meterInstallationRepository.findById(installationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Bản ghi Lắp đặt: " + installationId));

        // Xác thực Khách hàng
        if (!installation.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xem bản ghi lắp đặt này.");
        }

        return new InstallationDetailDTO(installation);
    }
    // ---
}