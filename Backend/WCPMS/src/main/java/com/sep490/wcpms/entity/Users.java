package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "USERS")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Users {

    @Id
    @Column(name = "USERID", nullable = false)
    private Long userId;

    @Column(name = "USERNAME", length = 50, nullable = false, unique = true)
    private String username;

    @Column(name = "PASSWORDHASH", nullable = false, length = 255)
    private String passwordHash;

    @ManyToOne
    @JoinColumn(name = "ROLEID", nullable = false)
    private Roles role;
}
