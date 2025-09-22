package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "NHANVIENTHU")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhanVienThu {
    @Id
    @Column(name = "MANVT")
    private Long maNvt;

    @Column(name = "TENNVT")
    private String tenNvt;

    @Column(name = "NVT_USER")
    private String nvtUser;

    @Column(name = "NVT_PASS")
    private String nvtPass;

    @Column(name = "LASTSYNC")
    private LocalDateTime lastSync;
}
