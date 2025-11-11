package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CreateStaffRequestDTO;
import com.sep490.wcpms.dto.RoleDTO;
import com.sep490.wcpms.dto.StaffAccountResponseDTO;
import com.sep490.wcpms.dto.UpdateStaffRequestDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Role;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.exception.DuplicateResourceException; // (Bạn có thể cần tạo class Exception này)
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.RoleRepository;
import com.sep490.wcpms.service.AccountManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Tự động inject các biến final
public class AccountManagementServiceImpl implements AccountManagementService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder; // Inject bộ mã hóa

    @Override
    public List<RoleDTO> getAssignableRoles() {
        // Lọc bỏ CUSTOMER và GUEST
        List<Role.RoleName> excludedRoles = Arrays.asList(Role.RoleName.CUSTOMER, Role.RoleName.GUEST);
        return roleRepository.findByRoleNameNotIn(excludedRoles).stream()
                .map(RoleDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<StaffAccountResponseDTO> getAllStaffAccounts() {
        // Lọc bỏ CUSTOMER và GUEST
        List<Role.RoleName> excludedRoles = Arrays.asList(Role.RoleName.CUSTOMER, Role.RoleName.GUEST);
        return accountRepository.findByRole_RoleNameNotIn(excludedRoles).stream()
                .map(StaffAccountResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public StaffAccountResponseDTO getStaffAccountById(Integer accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));
        return new StaffAccountResponseDTO(account);
    }

    @Override
    @Transactional
    public StaffAccountResponseDTO createStaffAccount(CreateStaffRequestDTO requestDTO) {
        // Kiểm tra trùng lặp
        if (accountRepository.existsByUsername(requestDTO.getUsername())) {
            throw new DuplicateResourceException("Tên đăng nhập đã tồn tại.");
        }
        if (accountRepository.existsByEmail(requestDTO.getEmail())) {
            throw new DuplicateResourceException("Email đã tồn tại.");
        }

        // Tìm vai trò (Role)
        Role role = roleRepository.findById(requestDTO.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò với ID: " + requestDTO.getRoleId()));

        // Không cho phép tạo tài khoản CUSTOMER/GUEST qua API này
        if (role.getRoleName() == Role.RoleName.CUSTOMER || role.getRoleName() == Role.RoleName.GUEST) {
            throw new IllegalArgumentException("Không thể tạo tài khoản CUSTOMER hoặc GUEST qua API này.");
        }

        Account account = new Account();
        account.setUsername(requestDTO.getUsername());
        account.setPassword(passwordEncoder.encode(requestDTO.getPassword())); // Mã hóa mật khẩu
        account.setFullName(requestDTO.getFullName());
        account.setEmail(requestDTO.getEmail());
        account.setPhone(requestDTO.getPhone());
        account.setRole(role);
        account.setDepartment(requestDTO.getDepartment());
        account.setStatus(requestDTO.getStatus());

        Account savedAccount = accountRepository.save(account);
        return new StaffAccountResponseDTO(savedAccount);
    }

    @Override
    @Transactional
    public StaffAccountResponseDTO updateStaffAccount(Integer accountId, UpdateStaffRequestDTO requestDTO) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));

        // Kiểm tra trùng lặp (chỉ khi thay đổi và không phải là chính nó)
        if (accountRepository.findByUsername(requestDTO.getUsername()).filter(a -> !a.getId().equals(accountId)).isPresent()) {
            throw new DuplicateResourceException("Tên đăng nhập đã tồn tại.");
        }
        if (accountRepository.findByEmail(requestDTO.getEmail()).filter(a -> !a.getId().equals(accountId)).isPresent()) {
            throw new DuplicateResourceException("Email đã tồn tại.");
        }

        // Tìm vai trò (Role)
        Role role = roleRepository.findById(requestDTO.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò với ID: " + requestDTO.getRoleId()));

        // Cập nhật thông tin
        account.setUsername(requestDTO.getUsername());
        account.setFullName(requestDTO.getFullName());
        account.setEmail(requestDTO.getEmail());
        account.setPhone(requestDTO.getPhone());
        account.setRole(role);
        account.setDepartment(requestDTO.getDepartment());
        account.setStatus(requestDTO.getStatus());

        // Chỉ cập nhật mật khẩu nếu nó được cung cấp (không rỗng)
        if (requestDTO.getPassword() != null && !requestDTO.getPassword().isBlank()) {
            account.setPassword(passwordEncoder.encode(requestDTO.getPassword()));
        }

        Account updatedAccount = accountRepository.save(account);
        return new StaffAccountResponseDTO(updatedAccount);
    }

    @Override
    @Transactional
    public StaffAccountResponseDTO setAccountStatus(Integer accountId, Integer status) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));

        if (status != 0 && status != 1) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ. Chỉ chấp nhận 0 (Inactive) hoặc 1 (Active).");
        }

        account.setStatus(status);
        Account updatedAccount = accountRepository.save(account);
        return new StaffAccountResponseDTO(updatedAccount);
    }
}