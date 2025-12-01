package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subject_type", nullable = false)
    private String subjectType;

    @Column(name = "subject_id", nullable = false)
    private String subjectId;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "actor_type")
    private String actorType;

    @Column(name = "actor_id")
    private Integer actorId;

    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "initiator_type")
    private String initiatorType;

    @Column(name = "initiator_id")
    private Integer initiatorId;

    @Column(name = "initiator_name")
    private String initiatorName;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
