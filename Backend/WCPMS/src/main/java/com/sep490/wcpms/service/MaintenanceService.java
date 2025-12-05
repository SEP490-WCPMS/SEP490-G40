package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.CustomerFeedback;
import com.sep490.wcpms.entity.MeterInstallation;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.CustomerFeedbackRepository;
import com.sep490.wcpms.repository.MeterInstallationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service này chứa các tác vụ chạy tự động (Scheduled Tasks)
 * để kiểm tra và bảo trì hệ thống, ví dụ: tìm đồng hồ quá hạn kiểm định.
 */
@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MeterInstallationRepository meterInstallationRepository;
    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final AccountRepository accountRepository;

    /**
     * Tác vụ Tự động: "Trigger" kiểm tra đồng hồ quá hạn kiểm định 5 năm.
     * Chạy vào 2 giờ sáng mỗi ngày (cron = "0 0 2 * * ?").
     *
     * BƯỚC 1 TRONG LUỒNG BẠN HỎI.
     */
    @Scheduled(cron = "0 0 2 * * ?") // Chạy vào 2:00 AM hàng ngày
    // @Scheduled(cron = "0 */1 * * * ?") // Dùng cron này để test (chạy mỗi 1 phút)
    @Transactional
    public void checkForCalibrationDue() {
        System.out.println("SCHEDULER: Đang chạy tác vụ kiểm tra đồng hồ quá hạn 5 năm...");

        // 1. Lấy ngày cách đây 5 năm
//        LocalDate fiveYearsAgo = LocalDate.now().minusYears(5);

        // 2. Tìm một tài khoản SERVICE_STAFF để gán việc
        // (Lấy tài khoản 'dichvu' (ID 5) làm mặc định, hoặc tìm bất kỳ Service Staff nào)
        Optional<Account> serviceStaffAccount = accountRepository.findByUsername("dichvu");
        if (serviceStaffAccount.isEmpty()) {
            System.err.println("SCHEDULER: Không tìm thấy tài khoản 'dichvu' (ID 5) để gán ticket.");
            return; // Dừng nếu không có ai để gán
        }
        Account defaultServiceStaff = serviceStaffAccount.get();

        // 3. Tìm tất cả các bản lắp đặt quá hạn 5 năm VÀ chưa được xử lý
        List<MeterInstallation> overdueInstallations = meterInstallationRepository.findOverdueInstallations();

        System.out.println("SCHEDULER: Tìm thấy " + overdueInstallations.size() + " đồng hồ quá hạn kiểm định.");

        // 4. Lặp qua từng đồng hồ quá hạn và tạo ticket (Yêu cầu Hỗ trợ)
        for (MeterInstallation installation : overdueInstallations) {

            // Tạo một mã ticket duy nhất dựa trên ID lắp đặt và ngày
            String ticketNumber = "CAL-" + installation.getId() + "-" + LocalDate.now().getYear();

            // 5. Kiểm tra xem ticket này đã được tạo hôm nay chưa (tránh lặp lại)
            if (!customerFeedbackRepository.existsByFeedbackNumber(ticketNumber)) {

                // 6. TẠO YÊU CẦU HỖ TRỢ MỚI (Bảng 20)
                CustomerFeedback request = new CustomerFeedback();
                request.setFeedbackNumber(ticketNumber); // Mã ticket
                request.setCustomer(installation.getCustomer()); // Khách hàng của bản lắp đặt đó
                request.setWaterMeter(installation.getWaterMeter());
                request.setFeedbackType(CustomerFeedback.FeedbackType.SUPPORT_REQUEST); // Loại: Yêu cầu

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
                request.setStatus(CustomerFeedback.Status.PENDING); // Trạng thái: Chờ xử lý
                request.setAssignedTo(defaultServiceStaff); // Gán cho NV Dịch Vụ

                // 7. Lưu ticket vào DB (Bảng 20)
                customerFeedbackRepository.save(request);

                System.out.println("SCHEDULER: Đã tạo ticket: " + ticketNumber);
            }
        }
        System.out.println("SCHEDULER: Hoàn thành tác vụ kiểm tra.");
    }
}