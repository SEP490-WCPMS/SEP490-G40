package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TUYEN")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tuyen {

    @Id
    @Column(name = "MATUYEN", nullable = false)
    private Long maTuyen;

    @Column(name = "TENTUYEN", length = 64)
    private String tenTuyen;

    @Column(name = "LASTSYNC", nullable = false)
    private LocalDateTime lastSync;
}
