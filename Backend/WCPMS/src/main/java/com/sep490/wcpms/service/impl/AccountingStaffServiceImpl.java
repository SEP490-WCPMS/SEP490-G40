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
    private String generateContractInvoiceNumber(LocalDate invoiceDate, Integer contractId) {
        String month = String.format("%02d", invoiceDate.getMonthValue());
        int year = invoiceDate.getYear();
        return "CN" + contractId + month + year;
    }

    @Override
    public Page<ContractDTO> getActiveContractsWithoutInstallationInvoice(Pageable pageable) {
        // 1. Lấy tất cả HĐ ACTIVE
        Page<Contract> activeContracts =
                contractRepository.findByContractStatus(Contract.ContractStatus.ACTIVE, pageable);

        // 2. Lọc bỏ HĐ đã có hóa đơn lắp đặt (CONTRACT)
        List<ContractDTO> list = activeContracts.getContent().stream()
                .filter(c -> !invoiceRepository.existsByContract_Id(
                        c.getId()
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

        // Kế toán lập HĐ
        if (staffId != null) {
            Account staff = accountRepository.findById(staffId)
                    .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + staffId));
            inv.setAccountingStaff(staff);
        }

        Invoice saved = invoiceRepository.save(inv);
        return invoiceMapper.toDto(saved);
    }

    // === HẾT PHẦN THÊM ===

    // ==========================================================
    // === ✨ THÊM 2 HÀM MỚI CHO HÓA ĐƠN TIỀN NƯỚC ✨ ===
    // ==========================================================

    @Override
    @Transactional(readOnly = true)
    public Page<PendingReadingDTO> getPendingReadings(Pageable pageable) {
        // 1. Gọi hàm repo mới
        Page<MeterReading> readingsPage = meterReadingRepository.findCompletedReadingsNotBilled(pageable);

        // 2. Map sang DTO
        return readingsPage.map(PendingReadingDTO::new);
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
        invoice.setInvoiceNumber("HD-" + meterReadingId + "-" + System.currentTimeMillis()); // (Nên có logic sinh số HĐ tốt hơn)
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
    public AccountingStatsDTO getDashboardStats() {
        AccountingStatsDTO stats = new AccountingStatsDTO();

        // 1. (To-do) Phí chờ lập HĐ (Từ Bảng 14)
        stats.setUnbilledFeesCount(calibrationRepository.countUnbilledFees());

        // 2. (KPI) Hóa đơn chờ thanh toán (Pending + Overdue)
        List<PaymentStatus> pendingStatuses = List.of(PaymentStatus.PENDING, PaymentStatus.OVERDUE);
        stats.setPendingInvoicesCount(invoiceRepository.countByPaymentStatusIn(pendingStatuses));

        // 3. (KPI) Tổng tiền chờ thanh toán
        BigDecimal pendingAmount = invoiceRepository.sumTotalAmountByPaymentStatusIn(pendingStatuses);
        stats.setPendingInvoicesAmount(pendingAmount != null ? pendingAmount : BigDecimal.ZERO);

        // 4. (KPI) Số Hóa đơn đã quá hạn
        stats.setOverdueInvoicesCount(invoiceRepository.countOverdueInvoices(PaymentStatus.OVERDUE, LocalDate.now()));

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
        List<ReadingRoute> routes = readingRouteRepository.findAll();

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