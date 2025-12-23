package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.*;
import com.sep490.wcpms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MeterInstallationRepository meterInstallationRepository;
    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;

    @Scheduled(cron = "0 0 2 * * ?") // Chạy 2h sáng (Production)
    //@Scheduled(cron = "0 */1 * * * ?") // Test: Chạy mỗi 1 phút
    @Transactional
    public void checkForCalibrationDue() {
        System.out.println("SCHEDULER: Đang chạy tác vụ kiểm tra đồng hồ quá hạn 5 năm...");

        Role serviceRole = roleRepository.findByRoleName(Role.RoleName.SERVICE_STAFF)
                .orElseThrow(() -> new RuntimeException("Role SERVICE_STAFF không tồn tại trong DB"));

        // Tìm tất cả các bản lắp đặt quá hạn 5 năm VÀ đang hoạt động
        List<MeterInstallation> overdueInstallations = meterInstallationRepository.findOverdueInstallations();

        System.out.println("SCHEDULER: Tìm thấy " + overdueInstallations.size() + " đồng hồ quá hạn kiểm định.");

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String todayStr = LocalDate.now().format(dateFormatter);

        for (MeterInstallation installation : overdueInstallations) {

            //String ticketNumber = "CAL-" + installation.getId() + "-" + todayStr;
            String ticketNumber = "CAL-" + installation.getId() + "-" + LocalDate.now().getYear();

            if (!customerFeedbackRepository.existsByFeedbackNumber(ticketNumber)) {

                Account assignedStaff = accountRepository.findServiceStaffWithLeastTickets(serviceRole.getId())
                        .orElse(null);

                if (assignedStaff == null) {
                    System.err.println("SCHEDULER ERROR: Không tìm thấy nhân viên Dịch vụ nào khả dụng.");
                    continue;
                }

                CustomerFeedback request = new CustomerFeedback();
                request.setFeedbackNumber(ticketNumber);

                // === [SỬA ĐỔI: ƯU TIÊN LẤY TỪ BẢNG 8 (CONTRACT)] ===
                Customer currentCustomer = null;

                // 1. Lấy từ HĐ Lắp đặt (Bảng 8) liên kết với bản ghi lắp đặt này
                Contract contract = installation.getContract();
                if (contract != null && contract.getCustomer() != null) {
                    currentCustomer = contract.getCustomer(); // Đây là chủ sở hữu hiện tại (sau chuyển nhượng)
                }
                // 2. Fallback: Lấy từ bản ghi lắp đặt (người cũ) nếu ko tìm thấy HĐ
                else {
                    currentCustomer = installation.getCustomer();
                }

                request.setCustomer(currentCustomer);
                // ===================================================

                request.setWaterMeter(installation.getWaterMeter());
                request.setFeedbackType(CustomerFeedback.FeedbackType.SUPPORT_REQUEST);

                String description = String.format(
                        "Hệ thống tự động: Đồng hồ mã [%s] (Serial: %s) của Khách hàng [%s - %s] " +
                                "được lắp đặt ngày %s đã đến hạn kiểm định 5 năm.",
                        installation.getWaterMeter().getMeterCode(),
                        installation.getWaterMeter().getSerialNumber(),
                        currentCustomer.getCustomerCode(), // Dùng thông tin chuẩn vừa lấy
                        currentCustomer.getCustomerName(),
                        installation.getInstallationDate().toString()
                );
                request.setDescription(description);

                request.setSubmittedDate(LocalDateTime.now());
                request.setStatus(CustomerFeedback.Status.PENDING);
                request.setAssignedTo(assignedStaff);

                customerFeedbackRepository.save(request);

                System.out.println("SCHEDULER: Đã tạo ticket " + ticketNumber + " cho KH " + currentCustomer.getCustomerName());
            }
        }
        System.out.println("SCHEDULER: Hoàn thành tác vụ kiểm tra.");
    }
}