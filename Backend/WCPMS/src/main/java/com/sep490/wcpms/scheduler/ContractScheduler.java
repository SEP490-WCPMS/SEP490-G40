package com.sep490.wcpms.scheduler;

import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractScheduler {

    private final ServiceStaffContractService contractService;

    // Chạy mỗi ngày vào lúc 00:00:00 (nửa đêm)
    @Scheduled(cron = "0 0 0 * * ?")
    public void scheduleContractExpirationTask() {
        log.info("Starting scheduled task: scanAndExpireContracts");
        contractService.scanAndExpireContracts();
        log.info("Finished scheduled task: scanAndExpireContracts");
    }
}