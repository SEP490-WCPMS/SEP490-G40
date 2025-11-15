package com.sep490.wcpms.dto;
import lombok.Data;
import com.sep490.wcpms.entity.MeterInstallation;

@Data
public class InstallationDetailDTO {
    private Integer id;
    private String installationImageBase64;
    // (Thêm các trường khác nếu Khách hàng cần xem)

    public InstallationDetailDTO(MeterInstallation entity) {
        this.id = entity.getId();
        this.installationImageBase64 = entity.getInstallationImageBase64();
    }
}