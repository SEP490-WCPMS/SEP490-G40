package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.Invoice;

public interface LeakDetectionNotificationService {

    void checkAndSendLeakWarning(Invoice currentWaterInvoice);
}

