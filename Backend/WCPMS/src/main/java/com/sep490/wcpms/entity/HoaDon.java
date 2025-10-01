package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "HOADON")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoaDon {

    @Id
    @Column(name = "MAHOADON", nullable = false)
    private Long maHoaDon;

    @Column(name = "MAKYHD", nullable = false)
    private Long maKyHD;

    @ManyToOne
    @JoinColumn(name = "MAKHACHHANG", nullable = false)
    private KhachHang khachHang;

    @Column(name = "SOTIEN", nullable = false)
    private Double soTien;

    @Column(name = "NGAYLAP", nullable = false)
    private LocalDateTime ngayLap;

    @Column(name = "NGAYHETHAN", nullable = false)
    private LocalDateTime ngayHetHan;

    @Column(name = "TRANGTHAI", length = 30, nullable = false)
    private String trangThai;
}
