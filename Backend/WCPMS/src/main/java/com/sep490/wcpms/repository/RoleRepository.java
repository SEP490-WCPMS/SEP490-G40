package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    // Phương thức tìm Role theo tên RoleName (Enum)
    Optional<Role> findByRoleName(Role.RoleName roleName);
}