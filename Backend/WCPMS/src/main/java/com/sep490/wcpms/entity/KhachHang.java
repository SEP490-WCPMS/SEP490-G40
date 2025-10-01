package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "KHACHHANG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhachHang {

    @Id
    @Column(name = "MAKH", nullable = false)
    private Long maKhachHang;

    @Column(name = "TENKH", length = 64)
    private String tenKhachHang;

    @Column(name = "orgTENKH", length = 40)
    private String orgTenKhachHang;

    @Column(name = "DIENTHOAI", length = 20)
    private String dienThoai;

    @Column(name = "X")
    private Double x;

    @Column(name = "Y")
    private Double y;

    @Lob
    @Column(name = "HINH")
    private String hinh;

    @Column(name = "LASTSYNC", nullable = false)
    private LocalDateTime lastSync;

    @ManyToOne
    @JoinColumn(name = "MALKH", nullable = false)
    private LoaiKhachHang loaiKhachHang;
}
