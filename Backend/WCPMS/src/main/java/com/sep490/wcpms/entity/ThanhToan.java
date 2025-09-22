package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "THANHTOAN")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThanhToan {

    @Id
    @Column(name = "MATHANHTOAN", nullable = false)
    private Long maThanhToan;

    @ManyToOne
    @JoinColumn(name = "MAHOADON", nullable = false)
    private HoaDon hoaDon;

    @Column(name = "SOTIENDA_THANHTOAN", nullable = false)
    private Double soTienDaThanhToan;

    @Column(name = "PHUONGTHUCTHANHTOAN", length = 50, nullable = false)
    private String phuongThucThanhToan;

    @Column(name = "NGAYTHANHTOAN", nullable = false)
    private LocalDateTime ngayThanhToan;
}
