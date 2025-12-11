package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.CustomerFeedback;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerFeedbackRepository;
import com.sep490.wcpms.repository.MeterInstallationRepository;
import com.sep490.wcpms.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MeterInstallationRepository meterInstallationRepository;
    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository; // <--- 1. Inject thêm RoleRepository

    /**
     * Tác vụ Tự động: Kiểm tra đồng hồ quá hạn kiểm định 5 năm.
     */
    @Scheduled(cron = "0 0 2 * * ?") // Chạy 2h sáng
    //@Scheduled(cron = "0 */1 * * * ?") // Test: Chạy mỗi 1 phút
    @Transactional
    public void checkForCalibrationDue() {
        System.out.println("SCHEDULER: Đang chạy tác vụ kiểm tra đồng hồ quá hạn 5 năm...");

        // 1. Lấy ID của Role SERVICE_STAFF
        Role serviceRole = roleRepository.findByRoleName(Role.RoleName.SERVICE_STAFF)
                .orElseThrow(() -> new RuntimeException("Role SERVICE_STAFF không tồn tại trong DB"));

        // 2. Tìm tất cả các bản lắp đặt quá hạn 5 năm VÀ chưa được xử lý
        List<MeterInstallation> overdueInstallations = meterInstallationRepository.findOverdueInstallations();

        System.out.println("SCHEDULER: Tìm thấy " + overdueInstallations.size() + " đồng hồ quá hạn kiểm định.");

        // 3. Lặp qua từng đồng hồ quá hạn và tạo ticket
        for (MeterInstallation installation : overdueInstallations) {

            String ticketNumber = "CAL-" + installation.getId() + "-" + LocalDate.now().getYear();

            // Kiểm tra trùng lặp
            if (!customerFeedbackRepository.existsByFeedbackNumber(ticketNumber)) {

                // --- 4. TỰ ĐỘNG GÁN CHO NHÂN VIÊN ÍT VIỆC NHẤT ---
                // Gọi hàm tìm kiếm mỗi lần lặp để đảm bảo cân bằng tải nếu có nhiều đơn cùng lúc
                Account assignedStaff = accountRepository.findServiceStaffWithLeastTickets(serviceRole.getId())
                        .orElse(null);

                if (assignedStaff == null) {
                    System.err.println("SCHEDULER ERROR: Không tìm thấy nhân viên Dịch vụ nào khả dụng (Active) để gán việc.");
                    continue; // Bỏ qua đơn này nếu không có nhân viên
                }
                // --------------------------------------------------

                // 5. Tạo Ticket
                CustomerFeedback request = new CustomerFeedback();
                request.setFeedbackNumber(ticketNumber);
                request.setCustomer(installation.getCustomer());
                request.setWaterMeter(installation.getWaterMeter());
                request.setFeedbackType(CustomerFeedback.FeedbackType.SUPPORT_REQUEST);

                String description = String.format(
                        "Hệ thống tự động: Đồng hồ mã [%s] (Serial: %s) của Khách hàng [%s - %s] " +
                                "được lắp đặt ngày %s đã đến hạn kiểm định 5 năm.",
                        installation.getWaterMeter().getMeterCode(),
                        installation.getWaterMeter().getSerialNumber(),
                        installation.getCustomer().getCustomerCode(),
                        installation.getCustomer().getCustomerName(),
                        installation.getInstallationDate().toString()
                );
                request.setDescription(description);

                request.setSubmittedDate(LocalDateTime.now());
                request.setStatus(CustomerFeedback.Status.PENDING);

                // Gán nhân viên vừa tìm được
                request.setAssignedTo(assignedStaff);

                customerFeedbackRepository.save(request);

                System.out.println("SCHEDULER: Đã tạo ticket " + ticketNumber + " và gán cho " + assignedStaff.getFullName());
            }
        }
        System.out.println("SCHEDULER: Hoàn thành tác vụ kiểm tra.");
    }
}