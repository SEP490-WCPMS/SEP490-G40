package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ROLES")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Roles {

    @Id
    @Column(name = "ROLEID", nullable = false)
    private Long roleId;

    @Column(name = "ROLENAME", length = 50, nullable = false)
    private String roleName;
}
