package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TuyenGtId implements Serializable {
    @Column(name = "MAKYHD")
    private Long maKyhd;

    @Column(name = "MATUYEN")
    private Long maTuyen;
}
