package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "NHANVIENpermission")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhanVienPermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "nvpID")
    private Integer nvpId;

    @Column(name = "uID")
    private Integer uId;

    @ManyToOne
    @JoinColumn(name = "MANVG")
    private NhanVienGhi nhanVienGhi;

    @ManyToOne
    @JoinColumn(name = "MANVT")
    private NhanVienThu nhanVienThu;

    @Column(name = "isChecked")
    private Boolean isChecked;
}
