package com.sep490.wcpms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NameValueDTO {
    private String name;
    private long value;
}

