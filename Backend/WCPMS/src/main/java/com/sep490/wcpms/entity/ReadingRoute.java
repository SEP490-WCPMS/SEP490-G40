package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reading_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String routeCode;
    private String routeName;
    private String description;
    private String areaCoverage;

    @Enumerated(EnumType.STRING)
    private Status status = Status.active;

    private LocalDateTime createdAt;

    public enum Status {
        active, inactive
    }
}
