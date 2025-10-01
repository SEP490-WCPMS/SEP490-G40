package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "LOAIKH")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiKhachHang {

    @Id
    @Column(name = "MALKH", nullable = false)
    private Long maLoaiKhachHang;

    @Column(name = "TENLKH", length = 30)
    private String tenLoaiKhachHang;

    @Column(name = "LASTSYNC", nullable = false)
    private LocalDateTime lastSync;
}
