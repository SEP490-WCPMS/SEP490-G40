package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reading_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "route_code", length = 50, nullable = false, unique = true)
    private String routeCode;

    @Column(name = "route_name", length = 100, nullable = false)
    private String routeName;

    @Lob
    private String description;

    @Lob
    @Column(name = "area_coverage")
    private String areaCoverage;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum Status { ACTIVE, INACTIVE }
}
