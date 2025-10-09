package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String wardCode;
    private String wardName;
    private String district;

    @Enumerated(EnumType.STRING)
    private Status status = Status.active;

    private LocalDateTime createdAt;

    public enum Status {
        active, inactive
    }
}
