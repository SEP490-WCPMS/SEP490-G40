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
    public Page<InvoiceDTO> getMyInvoicesByStatus(Integer customerAccountId, List<String> statusStrings, Pageable pageable) {
        Customer customer = getCustomerFromAccountId(customerAccountId);

        // SỬA: Xử lý trường hợp FE gửi null hoặc rỗng (khi chọn "ALL")
        if (statusStrings == null || statusStrings.isEmpty()) {
            // Trả về TẤT CẢ hóa đơn
            Page<Invoice> invoices = invoiceRepository.findByCustomer(customer, pageable);
            return invoices.map(invoiceMapper::toDto);
        }

        // Chuyển List<String> ("PENDING", "OVERDUE") thành List<Enum>
        List<Invoice.PaymentStatus> statuses = statusStrings.stream()
                .map(s -> Invoice.PaymentStatus.valueOf(s.toUpperCase()))
                .collect(Collectors.toList());

        // Gọi hàm repo mới
        Page<Invoice> invoices = invoiceRepository.findByCustomerAndPaymentStatusIn(customer, statuses, pageable);

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