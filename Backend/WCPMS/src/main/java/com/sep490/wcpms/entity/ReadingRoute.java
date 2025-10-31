package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_reader_id",
            foreignKey = @ForeignKey(name = "fk_reading_routes_accounts"))
    private Account assignedReader;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status { ACTIVE, INACTIVE }
}
