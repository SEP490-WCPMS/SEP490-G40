package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "KYHD")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Kyhd {

    @Id
    @Column(name = "MAKYHD", nullable = false)
    private Long maKyhd;

    @Column(name = "TENKYHD", length = 7)
    private String tenKyhd;

    @Column(name = "NAM", nullable = false)
    private Integer nam;

    @Column(name = "THANG", nullable = false)
    private Integer thang;
}
