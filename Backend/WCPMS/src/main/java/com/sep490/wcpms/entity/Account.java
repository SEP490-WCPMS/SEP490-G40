package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100, nullable = false, unique = true)
    private String username;

    @Column(length = 255, nullable = false)
    private String password;

    @Column(length = 100, unique = true)
    private String email;

    @Column(length = 20, unique = true)
    private String phone;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", foreignKey = @ForeignKey(name = "fk_accounts_roles"))
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Department department;

    @Column(name = "customer_code", length = 50)
    private String customerCode;

    @Column
    private Boolean status;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Staff liên kết đến hợp đồng
    @OneToMany(mappedBy = "serviceStaff")
    private List<Contract> serviceContracts;

    @OneToMany(mappedBy = "technicalStaff")
    private List<Contract> technicalContracts;

    // Enum
    public enum Department {
        CASHIER, ACCOUNTING, SERVICE, TECHNICAL
    }
}
