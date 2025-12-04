package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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

    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_accounts_roles"))
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "department", length = 50)
    private Department department;

    @Column(name = "customer_code", length = 50)
    private String customerCode;

    @Column(name = "status")
    private Integer status = 1;  // 1=Active, 0=Inactive

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "password_reset_token")
    private String passwordResetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    // --- THÊM 2 TRƯỜNG NÀY ---
    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "token_expiry_date")
    private LocalDateTime tokenExpiryDate;

    // Staff relationships
    @OneToMany(mappedBy = "serviceStaff")
    private List<Contract> serviceContracts;

    @OneToMany(mappedBy = "technicalStaff")
    private List<Contract> technicalContracts;

    // Account xử lý nhiều feedback
    @OneToMany(mappedBy = "assignedTo")
    private List<CustomerFeedback> assignedFeedbacks;

    public enum Department {
        CASHIER, ACCOUNTING, SERVICE, TECHNICAL
    }
}