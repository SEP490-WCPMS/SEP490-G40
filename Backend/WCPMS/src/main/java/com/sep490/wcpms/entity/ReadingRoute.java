package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "reading_routes")
@Getter
@Setter
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

    // --- LOGIC MỚI (SERVICE STAFF - MANY TO MANY) ---
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "route_service_assignments",
            joinColumns = @JoinColumn(name = "route_id"),
            inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    // Bỏ @ToString.Exclude ở đây nếu dùng @Getter/@Setter, nhưng giữ lại cũng không sao
    private Set<Account> serviceStaffs = new HashSet<>();

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

    // --- QUAN TRỌNG: SỬA EQUALS VÀ HASHCODE ---
    // Chỉ so sánh dựa trên ID để Set hoạt động đúng với Hibernate
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ReadingRoute)) return false;
        ReadingRoute that = (ReadingRoute) o;
        return getId() != null && Objects.equals(getId(), that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}