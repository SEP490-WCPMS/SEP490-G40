package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false)
    private RoleName roleName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum RoleName {
        admin, customer, cashier_staff, accounting_staff, service_staff, technical_staff, guest
    }

    public enum Status {
        active, inactive
    }
}
