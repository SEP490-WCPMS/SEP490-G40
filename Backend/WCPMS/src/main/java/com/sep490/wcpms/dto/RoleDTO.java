package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.Role;
import lombok.Data;

@Data
public class RoleDTO {
    private Integer id;
    private String roleName;

    public RoleDTO(Role role) {
        this.id = role.getId();
        this.roleName = role.getRoleName().name();
    }
}