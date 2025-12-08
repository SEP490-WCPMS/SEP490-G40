package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.dto.ContractRequestStatusDTO;
import com.sep490.wcpms.dto.ContractRequestDetailDTO;
import com.sep490.wcpms.dto.WaterMeterResponseDTO;
import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.entity.Contract.ContractStatus;
import com.sep490.wcpms.event.ContractRequestCreatedEvent;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.*;
import com.sep490.wcpms.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ContractServiceImpl implements ContractService {

    @Autowired private ContractRepository contractRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private WaterPriceTypeRepository waterPriceTypeRepository;
    @Autowired private ContractUsageDetailRepository contractUsageDetailRepository;
    @Autowired private MeterInstallationRepository meterInstallationRepository;
    @Autowired private ReadingRouteRepository readingRouteRepository;
    @Autowired private AddressRepository addressRepository; // Inject AddressRepository
    @Autowired private ApplicationEventPublisher eventPublisher;

    // --- 1. LOGIC CHO CUSTOMER ĐÃ ĐĂNG NHẬP ---
    @Override
    @Transactional
    public void createContractRequest(ContractRequestDTO requestDTO) {
        Customer customer = null;
        if (requestDTO.getAccountId() != null) {
            // Chỉ tìm customer nếu có accountId (tức là đã đăng nhập)
            customer = customerRepository.findByAccount_Id(requestDTO.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng với account ID: " + requestDTO.getAccountId()));
        }
        if (requestDTO.getAddress() == null || requestDTO.getAddress().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập địa chỉ lắp đặt.");
        }
        WaterPriceType priceType = waterPriceTypeRepository.findById(requestDTO.getPriceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại giá nước"));

        ReadingRoute readingRoute = null;
        if (requestDTO.getRouteId() != null) {
            readingRoute = readingRouteRepository.findById(requestDTO.getRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tuyến đọc"));
        }

        // Logic Auto-assign cho Customer (nếu muốn áp dụng)
        Account assignedStaff = findLeastBusyServiceStaff();

        // 3. --- TẠO MỚI ADDRESS CHO HỢP ĐỒNG NÀY (GIỐNG GUEST) ---
        // Logic: Mỗi yêu cầu lắp đặt sẽ tạo ra một địa điểm (Address) mới gắn với Customer đó
        Address contractAddress = new Address();
        contractAddress.setCustomer(customer); // Gắn với Customer hiện tại (Khác Guest là null)
        contractAddress.setWard(null);         // Tạm để null nếu nhập text

        // Lưu địa chỉ từ form nhập
        contractAddress.setAddress(requestDTO.getAddress());
        contractAddress.setStreet(requestDTO.getAddress());
        contractAddress.setIsActive(1);

        // Lưu Address xuống DB
        Address savedAddress = addressRepository.save(contractAddress);
        // ----------------------------------------------------------

        Contract newContract = new Contract();
        newContract.setCustomer(customer);
        newContract.setAddress(savedAddress);
        newContract.setApplicationDate(LocalDate.now());
        newContract.setContractStatus(ContractStatus.DRAFT);
        newContract.setStartDate(LocalDate.now());
        newContract.setContractNumber("REQ-" + customer.getId() + "-" + System.currentTimeMillis());
        newContract.setNotes(requestDTO.getNotes());

        // Lưu thông tin liên hệ (ưu tiên lấy từ form nhập mới, nếu không thì lấy của customer cũ)
        String contactPhone = requestDTO.getPhone() != null && !requestDTO.getPhone().isBlank()
                ? requestDTO.getPhone()
                : customer.getContactPersonPhone(); // Fallback

        String contactName = requestDTO.getFullName() != null && !requestDTO.getFullName().isBlank()
                ? requestDTO.getFullName()
                : customer.getCustomerName(); // Fallback

        newContract.setContactPhone(contactPhone);

        // Lưu Note (ghi rõ tên người liên hệ cho lần lắp đặt này)
        String notes = String.format("NGƯỜI LIÊN HỆ: %s | SĐT: %s | GHI CHÚ: %s",
                contactName, contactPhone, requestDTO.getNotes() != null ? requestDTO.getNotes() : "");
        newContract.setNotes(notes);

        if (readingRoute != null) {
            newContract.setReadingRoute(readingRoute);
        }

        newContract.setServiceStaff(assignedStaff);

        Contract savedContract = contractRepository.save(newContract);

        ContractUsageDetail usageDetail = new ContractUsageDetail();
        usageDetail.setContract(savedContract);
        usageDetail.setPriceType(priceType);
        usageDetail.setOccupants(requestDTO.getOccupants());
        usageDetail.setUsagePercentage(new BigDecimal("100.00"));
        contractUsageDetailRepository.save(usageDetail);

        publishContractCreatedEvent(savedContract, customer.getId(), customer.getCustomerName());
    }

    // --- 2. LOGIC CHO GUEST (KHÁCH VÃNG LAI) ---
    @Override
    @Transactional
    public String createGuestContractRequest(ContractRequestDTO requestDTO) {
        // Validate
        if (requestDTO.getFullName() == null || requestDTO.getPhone() == null || requestDTO.getAddress() == null) {
            throw new IllegalArgumentException("Thông tin Guest (Tên, SĐT, Địa chỉ) không được để trống.");
        }

        WaterPriceType priceType = waterPriceTypeRepository.findById(requestDTO.getPriceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Loại giá không tồn tại"));

        Account assignedStaff = findLeastBusyServiceStaff();

        // A. TẠO & LƯU ADDRESS (Bỏ qua Ward/Customer)
        Address guestAddress = new Address();
        guestAddress.setCustomer(null); // Guest chưa có tài khoản
        guestAddress.setWard(null);     // Chưa chọn phường (đã update DB cho phép null)

        // Lưu địa chỉ khách nhập vào cột 'address' và 'street'
        guestAddress.setAddress(requestDTO.getAddress());
        guestAddress.setStreet(requestDTO.getAddress());
        guestAddress.setIsActive(1);

        // Lưu xuống DB -> Có ID
        Address savedAddress = addressRepository.save(guestAddress);

        // B. TẠO HỢP ĐỒNG
        Contract newContract = new Contract();
        newContract.setContractNumber("GUEST-" + System.currentTimeMillis());
        newContract.setCustomer(null);

        // Gắn Address vừa tạo
        newContract.setAddress(savedAddress);

        // Lưu thông tin liên hệ
        newContract.setContactPhone(requestDTO.getPhone());

        // Lưu Tên khách vào Note (để nhân viên biết tên)
        String notes = "KHÁCH: " + requestDTO.getFullName();
        if (requestDTO.getNotes() != null) notes += " | " + requestDTO.getNotes();
        newContract.setNotes(notes);

        newContract.setApplicationDate(LocalDate.now());
        newContract.setStartDate(LocalDate.now());
        newContract.setContractStatus(ContractStatus.DRAFT);
        newContract.setServiceStaff(assignedStaff);

        if (requestDTO.getRouteId() != null) {
            readingRouteRepository.findById(requestDTO.getRouteId())
                    .ifPresent(newContract::setReadingRoute);
        }

        Contract savedContract = contractRepository.save(newContract);

        // C. LƯU CHI TIẾT SỬ DỤNG
        ContractUsageDetail usageDetail = new ContractUsageDetail();
        usageDetail.setContract(savedContract);
        usageDetail.setPriceType(priceType);
        usageDetail.setOccupants(requestDTO.getOccupants() != null ? requestDTO.getOccupants() : 1);
        usageDetail.setUsagePercentage(new BigDecimal("100.00"));
        contractUsageDetailRepository.save(usageDetail);

        // D. PUBLISH EVENT (customerId = null)
        publishContractCreatedEvent(savedContract, null, requestDTO.getFullName());

        return savedContract.getContractNumber();
    }

    // --- HELPER: Publish Event an toàn ---
    private void publishContractCreatedEvent(Contract contract, Integer customerId, String customerName) {
        try {
            eventPublisher.publishEvent(new ContractRequestCreatedEvent(
                    contract.getId(),
                    customerId, // Có thể null
                    customerName,
                    contract.getContractNumber(),
                    java.time.LocalDateTime.now()
            ));
        } catch (Exception e) {
            System.err.println("Lỗi gửi event: " + e.getMessage());
        }
    }

    // --- HELPER: Auto-assign ---
    private Account findLeastBusyServiceStaff() {
        List<Object[]> workloads = accountRepository.findServiceStaffWorkloads();
        if (workloads.isEmpty()) {
            // Fallback: Tìm bất kỳ nhân viên Service nào active
            return accountRepository.findFirstByDepartmentAndStatus(Account.Department.SERVICE, 1)
                    .orElseThrow(() -> new ResourceNotFoundException("Hệ thống chưa có nhân viên Dịch vụ nào."));
        }
        Long minCount = (Long) workloads.get(0)[1];
        List<Account> candidates = new ArrayList<>();
        for (Object[] row : workloads) {
            if (row[1].equals(minCount)) candidates.add((Account) row[0]);
            else break;
        }
        if (candidates.size() == 1) return candidates.get(0);
        return candidates.get(new Random().nextInt(candidates.size()));
    }

    // --- CÁC HÀM GET (READ) ---

    @Override
    public List<ContractRequestStatusDTO> getContractRequestsByAccountId(Integer accountId) {
        List<ContractStatus> statusesToFetch = Arrays.asList(
                ContractStatus.DRAFT, ContractStatus.PENDING, ContractStatus.PENDING_SURVEY_REVIEW
        );
        List<Contract> contracts = contractRepository.findByCustomer_Account_IdAndContractStatusInOrderByIdDesc(accountId, statusesToFetch);
        return contracts.stream().map(ContractRequestStatusDTO::new).collect(Collectors.toList());
    }

    @Override
    public ContractRequestDetailDTO getContractRequestDetail(Integer contractId, Integer accountId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        // Check quyền (nếu có customer)
        if (contract.getCustomer() != null && contract.getCustomer().getAccount() != null) {
            if (!contract.getCustomer().getAccount().getId().equals(accountId)) {
                throw new ResourceNotFoundException("Bạn không có quyền truy cập vào hợp đồng này.");
            }
        }

        ContractUsageDetail usageDetail = contractUsageDetailRepository.findByContract_Id(contractId).orElse(null);
        return new ContractRequestDetailDTO(contract, usageDetail);
    }

    @Override
    @Transactional
    public WaterMeterResponseDTO getWaterMeterResponse(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng: " + contractId));

        WaterMeterResponseDTO dto = new WaterMeterResponseDTO();
        meterInstallationRepository.findTopByContractOrderByInstallationDateDesc(contract)
                .ifPresent(mi -> {
                    dto.setInstallationImageBase64(mi.getInstallationImageBase64());
                    if (mi.getWaterMeter() != null && String.valueOf(mi.getWaterMeter().getMeterStatus()).equalsIgnoreCase("INSTALLED")) {
                        dto.setInstalledMeterCode(mi.getWaterMeter().getMeterCode());
                    }
                });
        return dto;
    }
}