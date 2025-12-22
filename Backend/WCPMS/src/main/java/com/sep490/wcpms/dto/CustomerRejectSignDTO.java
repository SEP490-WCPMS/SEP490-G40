package com.sep490.wcpms.dto;

import lombok.Data;

/**
 * Request body for customer reject-sign action.
 * Kept minimal to avoid impacting existing flows.
 */
@Data
public class CustomerRejectSignDTO {
    private String reason;
}