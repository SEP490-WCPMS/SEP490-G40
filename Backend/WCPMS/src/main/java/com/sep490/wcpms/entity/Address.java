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
@Table(name = "addresses", indexes = {
    @Index(name = "idx_customer_id", columnList = "customer_id"),
    @Index(name = "idx_ward_id", columnList = "ward_id"),
    @Index(name = "idx_is_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết với customer
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_addresses_customers"))
    private Customer customer;

    // Địa chỉ chi tiết
    @NotNull
    @Column(name = "street", length = 100, nullable = false)
    private String street; // Số nhà, tên đường

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ward_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_addresses_wards"))
    private Ward ward;

    @Column(name = "address", length = 255)
    private String address; // Địa chỉ đầy đủ (có thể concat từ street + ward)

    // Metadata
    @Column(name = "is_active", columnDefinition = "TINYINT DEFAULT 1")
    private Integer isActive = 1; // 1: Đang dùng, 0: Không dùng nữa

    // Ghi chú
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; // Ghi chú về địa chỉ (landmark, hướng dẫn đường đi...)

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "address")
    private List<Contract> contracts;

    @OneToMany(mappedBy = "address")
    private List<WaterServiceContract> waterServiceContracts;

    @OneToMany(mappedBy = "address")
    private List<ContractAnnulTransferRequest> annulTransferRequests;
}
