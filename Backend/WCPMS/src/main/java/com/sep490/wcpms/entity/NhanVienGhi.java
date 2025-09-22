package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "NHANVIENGHI")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhanVienGhi {
    @Id
    @Column(name = "MANVG")
    private Long maNvg;

    @Column(name = "TENNVG")
    private String tenNvg;

    @Column(name = "NVG_USER")
    private String nvgUser;

    @Column(name = "NVG_PASS")
    private String nvgPass;

    @Column(name = "LASTSYNC")
    private LocalDateTime lastSync;
}
