package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TUYENGT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuyenGt {
    @EmbeddedId
    private TuyenGtId id;

    @ManyToOne
    @JoinColumn(name = "MANVG")
    private NhanVienGhi nhanVienGhi;

    @ManyToOne
    @JoinColumn(name = "MANVT")
    private NhanVienThu nhanVienThu;

    @Column(name = "LOCKEDG")
    private Boolean lockedG;

    @Column(name = "LOCKEDT")
    private Boolean lockedT;

    @Column(name = "LASTSYNC")
    private LocalDateTime lastSync;
}
