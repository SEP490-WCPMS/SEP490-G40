package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CalibrationFeeDTO;
import com.sep490.wcpms.dto.InvoiceDTO;
import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractMapper;
import com.sep490.wcpms.mapper.InvoiceMapper;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.AccountingStaffService;
import com.sep490.wcpms.service.ActivityLogService;
import com.sep490.wcpms.service.InvoiceNotificationService;
import com.sep490.wcpms.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.MeterCalibration;
import com.sep490.wcpms.dto.ServiceInvoiceCreateDTO; // <-- THÊM IMPORT
import com.sep490.wcpms.entity.Customer; // <-- THÊM IMPORT
import com.sep490.wcpms.entity.Contract; // <-- THÊM IMPORT
import com.sep490.wcpms.dto.PendingReadingDTO;
import com.sep490.wcpms.entity.MeterReading;
import com.sep490.wcpms.entity.WaterPrice;
import com.sep490.wcpms.entity.WaterServiceContract;
import com.sep490.wcpms.repository.MeterReadingRepository;
import com.sep490.wcpms.repository.WaterPriceRepository;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import com.sep490.wcpms.dto.dashboard.AccountingStatsDTO;
import com.sep490.wcpms.dto.dashboard.DailyRevenueDTO;
import com.sep490.wcpms.entity.Invoice.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private final MeterReadingRepository meterReadingRepository;
    private final WaterPriceRepository waterPriceRepository;
    private final ReceiptRepository receiptRepository;
    private final ReadingRouteRepository readingRouteRepository;
    private final WaterServiceContractRepository waterServiceContractRepository;
    private final InvoiceNotificationService invoiceNotificationService;

    private final ActivityLogService activityLogService; // NEW: inject ActivityLogService

    private Account findLeastBusyAccountingStaff() {
        // 1. Lấy danh sách tất cả user có role 'ACCOUNTING' (hoặc 'Ke Toan 1', 'Ke Toan 2'...)
        // 2. Đếm số lượng hóa đơn có status = 'PENDING' của từng người.
        // 3. Chọn người có số lượng thấp nhất.

        // Ví dụ dùng Custom Query trong Repository:
    /*
    @Query("SELECT a FROM Account a " +
           "LEFT JOIN Invoice i ON i.createdBy.id = a.id AND i.paymentStatus = 'PENDING' " +
           "WHERE a.role.name = 'ROLE_ACCOUNTING_STAFF' " + // Hoặc check role ID
           "GROUP BY a.id " +
           "ORDER BY COUNT(i.id) ASC, a.id ASC")
    List<Account> findAccountingStaffOrderedByWorkload();
    */

        List<Account> staffList = accountRepository.findAccountingStaffOrderedByWorkload(PageRequest.of(0, 1));
        if (staffList.isEmpty()) {
            throw new RuntimeException("Không tìm thấy nhân viên kế toán nào để gán việc!");
        }
        return staffList.get(0); // Người đầu tiên là người ít việc nhất
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CalibrationFeeDTO> getMyUnbilledCalibrationFees(Integer staffId, String keyword, Pageable pageable) {
        String searchKey = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            searchKey = keyword.trim().toLowerCase();
        }

        // Gọi hàm Repo mới
        Page<MeterCalibration> feesPage = calibrationRepository.searchUnbilledFees(staffId, searchKey, pageable);
        return feesPage.map(CalibrationFeeDTO::new);
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

        // Persist activity log for created service invoice (actor = accounting staff)
        try {
            ActivityLog al = new ActivityLog();
            al.setSubjectType("INVOICE");
            al.setSubjectId(savedInvoice.getInvoiceNumber() != null ? savedInvoice.getInvoiceNumber() : String.valueOf(savedInvoice.getId()));
            al.setAction("INVOICE_CREATED");
            if (accountingStaff != null) {
                al.setActorType("STAFF");
                al.setActorId(accountingStaff.getId());
                al.setActorName(accountingStaff.getFullName());
                al.setInitiatorType("STAFF");
                al.setInitiatorId(accountingStaff.getId());
                al.setInitiatorName(accountingStaff.getFullName());
            } else {
                al.setActorType("SYSTEM");
            }
            activityLogService.save(al);
        } catch (Exception ex) {
            // swallow
        }

        // 6. CẬP NHẬT BẢNG 14 (Đánh dấu đã lập hóa đơn)
        calibration.setInvoice(savedInvoice);
        calibrationRepository.save(calibration);

        // 7. GỬI THÔNG BÁO + PDF HÓA ĐƠN DỊCH VỤ PHÁT SINH
        invoiceNotificationService.sendServiceInvoiceIssued(
                savedInvoice,
                "Phí kiểm định đồng hồ nước", // mô tả dịch vụ, đang dùng phí kiểm định
                "5%"                          // VAT hiển thị; chỉnh lại nếu bạn dùng % khác
        );

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
    // =================================================================
    // === 1. SỬA HÀM LẤY DANH SÁCH (CHỈ HIỆN CỦA TÔI) ===
    // =================================================================
    @Override
    public Page<InvoiceDTO> getInvoices(String status, Integer staffId, String keyword, Pageable pageable) {
        // Xử lý keyword
        String searchKey = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            searchKey = keyword.trim().toLowerCase();
        }

        if ("ALL".equals(status)) {
            // Gọi hàm tìm kiếm KHÔNG lọc status
            return invoiceRepository.searchByAccountingStaff_Id(staffId, searchKey, pageable)
                    .map(invoiceMapper::toDto);
        } else {
            // Gọi hàm tìm kiếm CÓ lọc status
            Invoice.PaymentStatus paymentStatus = Invoice.PaymentStatus.valueOf(status);
            return invoiceRepository.searchByAccountingStaff_IdAndStatus(staffId, paymentStatus, searchKey, pageable)
                    .map(invoiceMapper::toDto);
        }
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

        // persist activity log for cancellation
        try {
            ActivityLog al = new ActivityLog();
            al.setSubjectType("INVOICE");
            al.setSubjectId(cancelledInvoice.getInvoiceNumber() != null ? cancelledInvoice.getInvoiceNumber() : String.valueOf(cancelledInvoice.getId()));
            al.setAction("INVOICE_CANCELLED");
            if (staff != null) {
                al.setActorType("STAFF");
                al.setActorId(staff.getId());
                al.setInitiatorType("STAFF");
                al.setInitiatorId(staff.getId());
                al.setInitiatorName(staff.getFullName());
            } else {
                al.setActorType("SYSTEM");
            }
            activityLogService.save(al);
        } catch (Exception ex) {
            // swallow
        }

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
    private String generateContractInvoiceNumber(LocalDate invoiceDate, Integer contractId) {
        String month = String.format("%02d", invoiceDate.getMonthValue());
        int year = invoiceDate.getYear();
        return "CN" + contractId + month + year;
    }

    @Override
    public Page<ContractDTO> getActiveContractsWithoutInstallationInvoice(Pageable pageable,
                                                                          Integer accountingStaffId) {
        Page<Contract> activeContracts =
                contractRepository.findByContractStatus(Contract.ContractStatus.ACTIVE, pageable);

        List<ContractDTO> list = activeContracts.getContent().stream()
                // chỉ HĐ được assign cho kế toán hiện tại
                .filter(c -> c.getAccountingStaff() != null
                        && c.getAccountingStaff().getId().equals(accountingStaffId))
                // chưa có hóa đơn lắp đặt (CN*, meterReading null)
                .filter(c -> !invoiceRepository
                        .existsByContract_IdAndMeterReadingIsNullAndInvoiceNumberStartingWith(
                                c.getId(), "CN"
                        ))
                .map(contract -> {
                    ContractDTO dto = new ContractDTO();
                    BeanUtils.copyProperties(contract, dto);

                    dto.setCustomerId(
                            contract.getCustomer() != null ? contract.getCustomer().getId() : null
                    );
                    dto.setServiceStaffId(
                            contract.getServiceStaff() != null ? contract.getServiceStaff().getId() : null
                    );
                    dto.setTechnicalStaffId(
                            contract.getTechnicalStaff() != null ? contract.getTechnicalStaff().getId() : null
                    );
                    dto.setAccountingStaffId(
                            contract.getAccountingStaff() != null
                                    ? contract.getAccountingStaff().getId()
                                    : null
                    );

                    return dto;
                })
                .toList();

        return new PageImpl<>(list, pageable, list.size());
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
        boolean exists = invoiceRepository.existsByContract_Id(
                contract.getId()
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
            invoiceNumber = generateContractInvoiceNumber(invoiceDate, contract.getId());
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

        // Kế toán phụ trách = người đã được phân công trong hợp đồng
        if (contract.getAccountingStaff() != null) {
            inv.setAccountingStaff(contract.getAccountingStaff());
        }

        Invoice saved = invoiceRepository.save(inv);

        // Gửi thông báo + PDF hóa đơn LẮP ĐẶT
        invoiceNotificationService.sendInstallationInvoiceIssued(saved, contract);


        // persist activity log for installation invoice creation
        try {
            ActivityLog al = new ActivityLog();
            al.setSubjectType("INVOICE");
            al.setSubjectId(saved.getInvoiceNumber() != null ? saved.getInvoiceNumber() : String.valueOf(saved.getId()));
            al.setAction("INSTALLATION_INVOICE_CREATED");
            if (staffId != null) {
                Account st = accountRepository.findById(staffId).orElse(null);
                if (st != null) {
                    al.setActorType("STAFF");
                    al.setActorId(st.getId());
                    al.setActorName(st.getFullName());
                    al.setInitiatorType("STAFF");
                    al.setInitiatorId(st.getId());
                    al.setInitiatorName(st.getFullName());
                }
            } else {
                al.setActorType("SYSTEM");
            }
            activityLogService.save(al);
        } catch (Exception ex) {
            // swallow
        }

        return invoiceMapper.toDto(saved);
    }

    // === HẾT PHẦN THÊM ===

    // ==========================================================
    // === ✨ THÊM 2 HÀM MỚI CHO HÓA ĐƠN TIỀN NƯỚC ✨ ===
    // ==========================================================

    @Override
    @Transactional(readOnly = true)
    public Page<PendingReadingDTO> getPendingReadings(Pageable pageable) {
        // ❌ CŨ: Lấy TẤT CẢ reading chưa bill
        // Page<MeterReading> readingsPage = meterReadingRepository.findCompletedReadingsNotBilled(pageable);

        // ✅ MỚI: Chỉ lấy reading được ASSIGN cho Accounting Staff hiện tại
        Integer currentAccountingStaffId = getCurrentAccountingStaffId();
        Page<MeterReading> readingsPage = meterReadingRepository
            .findCompletedReadingsNotBilledByAccountingStaff(currentAccountingStaffId, pageable);

        // 2. Map sang DTO (Constructor đã có accountingStaffId và accountingStaffName)
        return readingsPage.map(PendingReadingDTO::new);
    }

    /**
     * Helper: Lấy ID của Accounting Staff đang đăng nhập từ SecurityContext
     */
    private Integer getCurrentAccountingStaffId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Chưa đăng nhập hoặc không có quyền truy cập.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl userDetails) {
            return userDetails.getId();
        }

        throw new IllegalStateException("Không thể xác định Accounting Staff hiện tại.");
    }

    @Override
    @Transactional
    public InvoiceDTO generateWaterBill(Integer meterReadingId, Integer accountingStaffId) {
        // 1. Lấy bản ghi đọc số
        MeterReading reading = meterReadingRepository.findById(meterReadingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi đọc số: " + meterReadingId));

        // 2. Kiểm tra (Double check)
        if (reading.getReadingStatus() != MeterReading.ReadingStatus.COMPLETED) {
            throw new IllegalStateException("Chỉ số này không ở trạng thái 'COMPLETED'.");
        }
        if (invoiceRepository.existsByMeterReading(reading)) {
            throw new IllegalStateException("Chỉ số này đã được lập hóa đơn.");
        }

        // 3. Lấy các thông tin liên quan
        MeterInstallation installation = reading.getMeterInstallation();
        WaterServiceContract serviceContract = installation.getWaterServiceContract();
        if (serviceContract == null) {
            throw new ResourceNotFoundException("Bản ghi lắp đặt này không liên kết với Hợp đồng Dịch vụ nào.");
        }
        Customer customer = serviceContract.getCustomer();
        WaterPriceType priceType = serviceContract.getPriceType();
        Account accountingStaff = accountRepository.findById(accountingStaffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Kế toán: " + accountingStaffId));

        // 4. Tìm biểu giá chính xác tại ngày đọc số
        WaterPrice price = waterPriceRepository.findActivePriceForDate(priceType, reading.getReadingDate())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biểu giá (" + priceType.getTypeName() + ") có hiệu lực cho ngày " + reading.getReadingDate()));

        // 5. Lấy các giá trị từ biểu giá
        BigDecimal consumption = reading.getConsumption(); // Số lượng
        BigDecimal unitPrice = price.getUnitPrice();       // Đơn giá
        BigDecimal envFeeRate = price.getEnvironmentFee(); // Phí BVMT
        BigDecimal vatRate = price.getVatRate();         // VAT % (ví dụ: 5.00)

        // 6. Áp dụng CÔNG THỨC TÍNH TIỀN
        // Tiền trước thuế = Số lượng X Đơn giá
        BigDecimal subtotal = consumption.multiply(unitPrice).setScale(0, RoundingMode.HALF_UP);
        // Phí BVMT = Số lượng X Phí BVMT
        BigDecimal envAmount = consumption.multiply(envFeeRate).setScale(0, RoundingMode.HALF_UP);
        // Thuế VAT = %VAT * (Tiền trước thuế)
        BigDecimal vatAmount = subtotal.multiply(vatRate.divide(new BigDecimal(100))).setScale(0, RoundingMode.HALF_UP);
        // Tổng tiền = Tiền trước thuế + Phí BVMT + Thuế VAT
        BigDecimal totalAmount = subtotal.add(envAmount).add(vatAmount);

        // 7. Tạo Hóa đơn (Bảng 17)
        Invoice invoice = new Invoice();
        // Sinh mã HĐ không chứa ký tự '-' để tránh vấn đề khi quét QR/Thanh toán ngân hàng
        invoice.setInvoiceNumber("HD" + meterReadingId + System.currentTimeMillis()); // (Nên có logic sinh số HĐ tốt hơn)
        invoice.setCustomer(customer);
        invoice.setContract(serviceContract.getSourceContract()); // Lấy HĐ Lắp đặt gốc
        invoice.setMeterReading(reading); // QUAN TRỌNG: Liên kết với bản ghi đọc số

        invoice.setFromDate(reading.getReadingDate().withDayOfMonth(1)); // (Cần logic xác định kỳ HĐ)
        invoice.setToDate(reading.getReadingDate()); // (Cần logic xác định kỳ HĐ)

        invoice.setTotalConsumption(consumption);
        invoice.setSubtotalAmount(subtotal);
        invoice.setEnvironmentFeeAmount(envAmount);
        invoice.setVatAmount(vatAmount);
        invoice.setTotalAmount(totalAmount);

        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(10)); // (Cần logic lấy hạn TT từ HĐ)
        invoice.setPaymentStatus(Invoice.PaymentStatus.PENDING);
        invoice.setAccountingStaff(accountingStaff);

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Gửi thông báo + PDF hóa đơn TIỀN NƯỚC
        invoiceNotificationService.sendWaterBillIssued(savedInvoice, reading);

        // persist activity log for water bill generation
        try {
            ActivityLog al = new ActivityLog();
            al.setSubjectType("INVOICE");
            al.setSubjectId(savedInvoice.getInvoiceNumber() != null ? savedInvoice.getInvoiceNumber() : String.valueOf(savedInvoice.getId()));
            al.setAction("WATER_INVOICE_GENERATED");
            if (accountingStaff != null) {
                al.setActorType("STAFF");
                al.setActorId(accountingStaff.getId());
                al.setActorName(accountingStaff.getFullName());
                al.setInitiatorType("STAFF");
                al.setInitiatorId(accountingStaff.getId());
                al.setInitiatorName(accountingStaff.getFullName());
            } else {
                al.setActorType("SYSTEM");
            }
            activityLogService.save(al);
        } catch (Exception ex) {
            // swallow
        }

        // 8. Cập nhật trạng thái bản ghi đọc số
        reading.setReadingStatus(MeterReading.ReadingStatus.VERIFIED);
        meterReadingRepository.save(reading);

        // 9. Trả về DTO của Hóa đơn vừa tạo
        return invoiceMapper.toDto(savedInvoice);
    }

    @Override
    @Transactional(readOnly = true)
    public WaterBillCalculationDTO calculateWaterBill(Integer meterReadingId) {
        // 1. Lấy dữ liệu
        MeterReading reading = meterReadingRepository.findById(meterReadingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỉ số: " + meterReadingId));

        MeterInstallation installation = reading.getMeterInstallation();
        WaterServiceContract serviceContract = installation.getWaterServiceContract();
        WaterPriceType priceType = serviceContract.getPriceType();

        // Tìm giá có hiệu lực
        WaterPrice price = waterPriceRepository.findActivePriceForDate(priceType, reading.getReadingDate())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giá áp dụng cho ngày " + reading.getReadingDate()));

        // 2. Tính toán
        BigDecimal consumption = reading.getConsumption();
        BigDecimal unitPrice = price.getUnitPrice();
        BigDecimal envFeeRate = price.getEnvironmentFee();
        BigDecimal vatRate = price.getVatRate();

        BigDecimal subtotal = consumption.multiply(unitPrice).setScale(0, RoundingMode.HALF_UP);
        BigDecimal envAmount = consumption.multiply(envFeeRate).setScale(0, RoundingMode.HALF_UP);
        BigDecimal vatAmount = subtotal.multiply(vatRate.divide(new BigDecimal(100))).setScale(0, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(envAmount).add(vatAmount);

        // 3. Trả về DTO
        WaterBillCalculationDTO dto = new WaterBillCalculationDTO();
        dto.setMeterReadingId(reading.getId());
        dto.setReadingDate(reading.getReadingDate());
        dto.setPreviousReading(reading.getPreviousReading());
        dto.setCurrentReading(reading.getCurrentReading());
        dto.setConsumption(consumption);

        dto.setPriceTypeName(priceType.getTypeName());
        dto.setUnitPrice(unitPrice);
        dto.setEnvironmentFee(envFeeRate);
        dto.setVatRate(vatRate);

        dto.setSubtotalAmount(subtotal);
        dto.setEnvironmentFeeAmount(envAmount);
        dto.setVatAmount(vatAmount);
        dto.setTotalAmount(totalAmount);

        return dto;
    }


    // --- THÊM HÀM MỚI ---
    @Override
    @Transactional(readOnly = true)
    public AccountingStatsDTO getDashboardStats(Integer staffId) {
        AccountingStatsDTO stats = new AccountingStatsDTO();
        LocalDate today = LocalDate.now();
        // Ví dụ: Kỳ doanh thu là tháng hiện tại
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        // 1. Tổng Doanh Thu (Của tôi - Trong tháng này)
        BigDecimal revenue = invoiceRepository.sumMyRevenueByDateRange(staffId, startOfMonth, endOfMonth);
        stats.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO); // <-- Cần thêm field này vào DTO

        // 2. Tổng Phí chờ lập Hóa đơn (Cả 3 loại)
        long waterPending = meterReadingRepository.countPendingWaterBills();
        long installPending = contractRepository.countPendingInstallationBills();
        long calibrationPending = calibrationRepository.countUnbilledFeesByStaff(staffId);

        stats.setUnbilledFeesCount(waterPending + installPending + calibrationPending);

        // 3. HĐ chờ thanh toán (Của tôi)
        List<PaymentStatus> pendingStatuses = List.of(PaymentStatus.PENDING, PaymentStatus.OVERDUE);
        stats.setPendingInvoicesCount(
                invoiceRepository.countMyPendingInvoices(staffId, pendingStatuses)
        );

        // 4. Hóa đơn QUÁ HẠN (Của tôi)
        stats.setOverdueInvoicesCount(
                invoiceRepository.countMyOverdueInvoices(staffId)
        );

        return stats;
    }
    // --- HẾT PHẦN THÊM ---

    // --- THÊM HÀM MỚI ---
    @Override
    @Transactional(readOnly = true)
    public List<DailyRevenueDTO> getRevenueReport(LocalDate startDate, LocalDate endDate) {
        // Gọi thẳng hàm Repository đã tạo
        return receiptRepository.getDailyRevenueReport(startDate, endDate);
    }
    // --- HẾT PHẦN THÊM ---

    // === SỬA LẠI HÀM NÀY ===
    @Override
    @Transactional(readOnly = true)
    public List<ReadingRouteDTO> getAllRoutes() {
        // 1. Lấy tất cả các tuyến (Entity)
        List<ReadingRoute> routes = readingRouteRepository.findAllByStatus(ReadingRoute.Status.ACTIVE);

        // 2. Chuyển đổi (Map) sang DTO để ngắt vòng lặp
        return routes.stream()
                .map(ReadingRouteDTO::new) // Dùng constructor của DTO
                .collect(Collectors.toList());
    }
    // --- HẾT PHẦN SỬA ---

    // (XÓA HÀM getUnassignedContracts())

    @Override
    @Transactional(readOnly = true)
    public List<RouteManagementDTO> getContractsByRoute(Integer routeId) {
        // Tìm HĐ (Bảng 9) Active và theo route_id (Đã sắp xếp theo routeOrder)
        List<WaterServiceContract> contracts = waterServiceContractRepository
                .findByReadingRoute_IdAndContractStatusOrderByRouteOrderAsc(
                        routeId,
                        WaterServiceContract.WaterServiceContractStatus.ACTIVE
                );

        return contracts.stream()
                .map(RouteManagementDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateRouteOrder(Integer routeId, RouteOrderUpdateRequestDTO dto) {
        // 1. Lấy Tuyến đọc (Bảng 4) (Chỉ để kiểm tra)
        readingRouteRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Tuyến đọc: " + routeId));

        // 2. Lấy danh sách ID HĐ (Bảng 9) mà FE gửi lên (đã có thứ tự)
        List<Integer> orderedContractIds = dto.getOrderedContractIds();

        if (orderedContractIds == null || orderedContractIds.isEmpty()) {
            return; // Không có gì để cập nhật
        }

        // 3. Lấy tất cả HĐ (Bảng 9) theo danh sách ID đó
        List<WaterServiceContract> contractsToUpdate = waterServiceContractRepository.findAllById(orderedContractIds);

        // 4. Dùng Map để tăng tốc độ tìm kiếm
        Map<Integer, WaterServiceContract> contractMap = contractsToUpdate.stream()
                .collect(Collectors.toMap(WaterServiceContract::getId, c -> c));

        // 5. Lặp qua danh sách ID ĐÃ SẮP XẾP từ FE
        for (int i = 0; i < orderedContractIds.size(); i++) {
            Integer contractId = orderedContractIds.get(i);
            WaterServiceContract contract = contractMap.get(contractId);

            if (contract != null) {
                // (Không cần gán Tuyến nữa, vì HĐ đã thuộc Tuyến này rồi)
                contract.setRouteOrder(i + 1); // Gán Thứ tự MỚI (1, 2, 3...)
            }
        }

        // 6. Lưu tất cả thay đổi 1 lần
        waterServiceContractRepository.saveAll(contractsToUpdate);
    }
    // === HẾT PHẦN SỬA ===
}

