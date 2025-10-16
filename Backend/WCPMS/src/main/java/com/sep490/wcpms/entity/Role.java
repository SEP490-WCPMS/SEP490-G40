package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", length = 50, nullable = false)
    private RoleName roleName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "role")
    private List<Account> accounts;

    public enum RoleName {
        ADMIN, CUSTOMER, CASHIER_STAFF, ACCOUNTING_STAFF, SERVICE_STAFF, TECHNICAL_STAFF, GUEST
    }

    public enum Status {
        ACTIVE, INACTIVE
    }
}
