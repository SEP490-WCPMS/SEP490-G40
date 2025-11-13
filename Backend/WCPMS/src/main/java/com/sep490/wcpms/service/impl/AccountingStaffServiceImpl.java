package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CalibrationFeeDTO;
import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractMapper;
import com.sep490.wcpms.mapper.InvoiceMapper; // <-- Cần tạo Mapper này
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.AccountingStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterCalibration;
import com.sep490.wcpms.dto.ServiceInvoiceCreateDTO; // <-- THÊM IMPORT
import com.sep490.wcpms.entity.Customer; // <-- THÊM IMPORT
import com.sep490.wcpms.entity.Contract; // <-- THÊM IMPORT
import java.time.LocalDateTime;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountingStaffServiceImpl implements AccountingStaffService {

    private final MeterCalibrationRepository calibrationRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceDetailRepository invoiceDetailRepository; // (Cần tạo Repo Bảng 18)
    private final AccountRepository accountRepository;
    private final InvoiceMapper invoiceMapper; // (Cần tạo Mapper Bảng 17)
    private final WaterPriceTypeRepository priceTypeRepository; // (Cần tạo Repo Bảng 5)
    private final CustomerRepository customerRepository; // <-- Cần Repo này
    private final ContractRepository contractRepository; // <-- Cần Repo này
    private final ContractMapper contractMapper; // (Cần tạo Mapper Bảng )

    @Override
    @Transactional(readOnly = true)
    public Page<CalibrationFeeDTO> getUnbilledCalibrationFees(Pageable pageable) {
        Page<MeterCalibration> feesPage = calibrationRepository.findUnbilledFees(pageable);
        // Chuyển Page<Entity> sang Page<DTO>
        return feesPage.map(CalibrationFeeDTO::new); // Dùng constructor của DTO
    }

    // --- HÀM TẠO HÓA ĐƠN (ĐÃ SỬA LỖI) ---
    @Override
    @Transactional
    public InvoiceDTO createServiceInvoice(ServiceInvoiceCreateDTO invoiceDto, Integer accountingStaffId) {

        // 1. Lấy bản ghi phí (Bảng 14)
        MeterCalibration calibration = calibrationRepository.findById(invoiceDto.getCalibrationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Phí Kiểm định: " + invoiceDto.getCalibrationId()));

        // 2. Kiểm tra
        if (calibration.getInvoice() != null) {
            throw new IllegalStateException("Phí này đã được lập Hóa đơn (ID: " + calibration.getInvoice().getId() + ").");
        }

        // 3. Lấy các đối tượng liên quan từ ID
        Customer customer = customerRepository.findById(invoiceDto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Khách hàng: " + invoiceDto.getCustomerId()));

        Contract installContract = contractRepository.findById(invoiceDto.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Hợp đồng: " + invoiceDto.getContractId()));

        Account accountingStaff = accountRepository.findById(accountingStaffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Kế toán: " + accountingStaffId));

        // 4. TẠO HÓA ĐƠN MỚI (Bảng 17) - Dùng dữ liệu từ DTO
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceDto.getInvoiceNumber());
        invoice.setCustomer(customer);
        invoice.setContract(installContract);
        invoice.setMeterReading(null); // QUAN TRỌNG: NULL

        invoice.setFromDate(invoiceDto.getInvoiceDate());
        invoice.setToDate(invoiceDto.getInvoiceDate());
        invoice.setInvoiceDate(invoiceDto.getInvoiceDate());
        invoice.setDueDate(invoiceDto.getDueDate());

        invoice.setTotalConsumption(BigDecimal.ZERO); // Không có tiêu thụ
        invoice.setSubtotalAmount(invoiceDto.getSubtotalAmount()); // Tiền phí
        invoice.setVatAmount(invoiceDto.getVatAmount());
        invoice.setTotalAmount(invoiceDto.getTotalAmount());

        invoice.setPaymentStatus(Invoice.PaymentStatus.PENDING);
        invoice.setAccountingStaff(accountingStaff);

        // (Không set invoice.notes vì Bảng 17 không có cột này)

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // --- BƯỚC 5 (ĐÃ XÓA) ---
        // (Không cần tạo InvoiceDetail cho Phí Dịch vụ)
        // ---

        // 6. CẬP NHẬT BẢNG 14 (Đánh dấu đã lập hóa đơn)
        calibration.setInvoice(savedInvoice);
        calibrationRepository.save(calibration);

        return invoiceMapper.toDto(savedInvoice);
    }
    // --- HẾT PHẦN SỬA ---

    // === THÊM 3 HÀM MỚI ===

    /**
     * (Req 1) Lấy chi tiết 1 khoản phí "treo"
     */
    @Override
    @Transactional(readOnly = true)
    public CalibrationFeeDTO getUnbilledFeeDetail(Integer calibrationId) {
        MeterCalibration calibration = calibrationRepository.findById(calibrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Phí Kiểm định: " + calibrationId));

        // Kiểm tra xem đã lập hóa đơn chưa
        if (calibration.getInvoice() != null) {
            throw new IllegalStateException("Phí này đã được lập Hóa đơn (ID: " + calibration.getInvoice().getId() + ").");
        }

        // Dùng constructor của DTO để map
        return new CalibrationFeeDTO(calibration);
    }

    /**
     * (Req 3+4) Lấy danh sách Hóa đơn (có lọc)
     */
    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceDTO> getInvoices(String status, Pageable pageable) {
        Page<Invoice> invoicePage;

        if (status != null && !status.equalsIgnoreCase("ALL") && !status.isBlank()) {
            // 1. Lọc theo Status
            try {
                Invoice.PaymentStatus paymentStatus = Invoice.PaymentStatus.valueOf(status.toUpperCase());
                invoicePage = invoiceRepository.findByPaymentStatus(paymentStatus, pageable);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái hóa đơn không hợp lệ: " + status);
            }
        } else {
            // 2. Lấy tất cả
            invoicePage = invoiceRepository.findAll(pageable);
        }

        return invoicePage.map(invoiceMapper::toDto);
    }

    /**
     * (Mới) Lấy chi tiết 1 Hóa đơn
     */
    @Override
    @Transactional(readOnly = true)
    public AccountingInvoiceDetailDTO getInvoiceDetail(Integer invoiceId) {
        // 1. Lấy Hóa đơn (Bảng 17)
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Hóa đơn: " + invoiceId));

        // 2. Lấy Phí gốc (Bảng 14) liên quan đến Hóa đơn này
        // (findByInvoice trả về Optional<MeterCalibration>)
        MeterCalibration calibration = calibrationRepository.findByInvoice(invoice)
                .orElse(null); // (Sẽ là null nếu đây là HĐ tiền nước, nhưng ở đây ta mặc định là HĐ Dịch vụ)

        // 3. Map
        AccountingInvoiceDetailDTO detailDTO = new AccountingInvoiceDetailDTO();
        detailDTO.setInvoice(invoiceMapper.toDto(invoice)); // Map Hóa đơn

        if (calibration != null) {
            detailDTO.setFee(new CalibrationFeeDTO(calibration)); // Map Phí Gốc
        }

        return detailDTO;
    }

    /**
     * (Req 5) Hủy một Hóa đơn
     */
    @Override
    @Transactional
    public InvoiceDTO cancelInvoice(Integer invoiceId, Integer staffId) {
        // 1. Tìm Hóa đơn
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Hóa đơn: " + invoiceId));

        // 2. Tìm NV Kế toán (để ghi log, không bắt buộc)
        Account staff = accountRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Kế toán: " + staffId));

        // 3. Chỉ cho phép hủy HĐ đang PENDING
        if (invoice.getPaymentStatus() != Invoice.PaymentStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể hủy Hóa đơn đang ở trạng thái 'PENDING'. Trạng thái hiện tại: " + invoice.getPaymentStatus());
        }

        // 4. Cập nhật HĐ -> CANCELLED
        invoice.setPaymentStatus(Invoice.PaymentStatus.CANCELLED);
        //invoice.setNotes(invoice.getNotes() + "\n [Hủy bởi " + staff.getFullName() + " ngày " + LocalDateTime.now() + "]");
        Invoice cancelledInvoice = invoiceRepository.save(invoice);

        // 5. QUAN TRỌNG: "Mở khóa" Phí Kiểm định (Bảng 14)
        // Tìm Phí (Bảng 14) đang liên kết với Hóa đơn này
        Optional<MeterCalibration> calibrationOpt = calibrationRepository.findByInvoice(cancelledInvoice);
        if (calibrationOpt.isPresent()) {
            MeterCalibration calibration = calibrationOpt.get();
            calibration.setInvoice(null); // Set invoice_id = NULL
            calibrationRepository.save(calibration);
            // Khoản phí này bây giờ sẽ xuất hiện lại trong trang "Duyệt Phí"
        }

        return invoiceMapper.toDto(cancelledInvoice);
    }

    // === HẾT PHẦN THÊM ===

    // === THÊM 3 HÀM MỚI ===

    // --- THÊM MỚI: sinh số hóa đơn CN-YYYY-xxxx ---
    private String generateContractInvoiceNumber(LocalDate invoiceDate) {
        LocalDate startOfYear = invoiceDate.withDayOfYear(1);
        LocalDate endOfYear = invoiceDate.withMonth(12).withDayOfMonth(31);

        long countThisYear = invoiceRepository.countByInvoiceTypeAndInvoiceDateBetween(
                Invoice.InvoiceType.CONTRACT,
                startOfYear,
                endOfYear
        );

        long next = countThisYear + 1;
        return String.format("CN-%d-%04d", invoiceDate.getYear(), next);
    }

    @Override
    public Page<ContractDTO> getActiveContractsWithoutInstallationInvoice(Pageable pageable) {
        // 1. Lấy tất cả HĐ ACTIVE
        Page<Contract> activeContracts =
                contractRepository.findByContractStatus(Contract.ContractStatus.ACTIVE, pageable);

        // 2. Lọc bỏ HĐ đã có hóa đơn lắp đặt (CONTRACT)
        List<ContractDTO> list = activeContracts.getContent().stream()
                .filter(c -> !invoiceRepository.existsByContract_IdAndInvoiceType(
                        c.getId(), Invoice.InvoiceType.CONTRACT
                ))
                .map(contract -> {
                    ContractDTO dto = new ContractDTO();
                    // copy các field cơ bản
                    BeanUtils.copyProperties(contract, dto);

                    // set thêm các id liên kết (đang dùng giống convertToDTO trong ContractCustomerService)
                    dto.setCustomerId(
                            contract.getCustomer() != null ? contract.getCustomer().getId() : null
                    );
                    dto.setServiceStaffId(
                            contract.getServiceStaff() != null ? contract.getServiceStaff().getId() : null
                    );
                    dto.setTechnicalStaffId(
                            contract.getTechnicalStaff() != null ? contract.getTechnicalStaff().getId() : null
                    );

                    return dto;
                })
                .toList();

        return new PageImpl<>(list, pageable, activeContracts.getTotalElements());
    }

    @Override
    @Transactional
    public InvoiceDTO createInstallationInvoice(ContractInstallationInvoiceCreateDTO request, Integer staffId) {

        // 1. Lấy Hợp đồng
        Contract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + request.getContractId()));

        // 2. Kiểm tra trạng thái ACTIVE
        if (contract.getContractStatus() != Contract.ContractStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ tạo hóa đơn lắp đặt cho HĐ đang ACTIVE");
        }

        // 3. Kiểm tra đã có HĐ lắp đặt chưa
        boolean exists = invoiceRepository.existsByContract_IdAndInvoiceType(
                contract.getId(), Invoice.InvoiceType.CONTRACT
        );
        if (exists) {
            throw new IllegalStateException("Hợp đồng này đã có hóa đơn lắp đặt");
        }

        // 4. Lấy giá trị tiền do FE gửi lên
        BigDecimal subtotal = request.getSubtotalAmount();
        BigDecimal vatAmount = request.getVatAmount();
        BigDecimal total = request.getTotalAmount();

        LocalDate invoiceDate = request.getInvoiceDate();
        LocalDate dueDate = request.getDueDate();

        // 5. Số hóa đơn: nếu bạn muốn backend sinh, có thể override request.getInvoiceNumber()
        String invoiceNumber = request.getInvoiceNumber();
        if (invoiceNumber == null || invoiceNumber.isBlank()) {
            invoiceNumber = generateContractInvoiceNumber(invoiceDate);
        }

        // 6. Ngày kỳ tính: tạm dùng ngày lắp đặt nếu có, ngược lại dùng invoiceDate
        LocalDate baseDate = contract.getInstallationDate() != null
                ? contract.getInstallationDate()
                : invoiceDate;

        Invoice inv = new Invoice();
        inv.setInvoiceNumber(invoiceNumber);
        inv.setCustomer(contract.getCustomer());
        inv.setContract(contract);
        inv.setMeterReading(null); // Hóa đơn lắp đặt không gắn meter_reading

        inv.setFromDate(baseDate);
        inv.setToDate(baseDate);
        inv.setTotalConsumption(BigDecimal.ZERO);

        inv.setSubtotalAmount(subtotal);
        inv.setVatAmount(vatAmount);
        inv.setEnvironmentFeeAmount(BigDecimal.ZERO);
        inv.setTotalAmount(total);
        inv.setLatePaymentFee(BigDecimal.ZERO);
        inv.setIsMinimumUsageFee(0);

        inv.setInvoiceDate(invoiceDate);
        inv.setDueDate(dueDate);
        inv.setPaymentStatus(Invoice.PaymentStatus.PENDING);

        // Kế toán lập HĐ
        if (staffId != null) {
            Account staff = accountRepository.findById(staffId)
                    .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + staffId));
            inv.setAccountingStaff(staff);
        }

        // Loại hóa đơn lắp đặt
        inv.setInvoiceType(Invoice.InvoiceType.CONTRACT);

        Invoice saved = invoiceRepository.save(inv);
        return invoiceMapper.toDto(saved);
    }

    // === HẾT PHẦN THÊM ===
}