package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CustomerDTO;
import com.sep490.wcpms.entity.Customer;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.CustomerQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerQueryServiceImpl implements CustomerQueryService {

    private final CustomerRepository customerRepository;

    // Tìm kiếm khách hàng theo tên, số CMND/CCCD và số điện thoại
    @Override
    public List<CustomerDTO> findCustomers(String customerName, String identityNumber, String phone) {
        boolean emptyName = (customerName == null || customerName.trim().isEmpty());
        boolean emptyId = (identityNumber == null || identityNumber.trim().isEmpty());
        boolean emptyPhone = (phone == null || phone.trim().isEmpty());

        if (emptyName && emptyId && emptyPhone) {
            // Nếu không có tham số tìm kiếm, trả về tất cả khách hàng
            return customerRepository.findAllWithAccount().stream()
                    .map(CustomerDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        // Normalize phone để search được cả trường hợp lưu "0xxx" / "84xxx" / "+84xxx".
        // Chiến lược: lấy phần "tail" của số (bỏ +, khoảng trắng, ký tự lạ; bỏ prefix 0/84 nếu có)
        // rồi dùng LIKE '%tail%'.
        String normalizedPhone = null;
        if (!emptyPhone) {
            String raw = phone.trim();
            String digits = raw.replaceAll("\\D", "");

            if (!digits.isEmpty()) {
                if (digits.startsWith("84") && digits.length() > 2) {
                    digits = digits.substring(2);
                }
                if (digits.startsWith("0") && digits.length() > 1) {
                    digits = digits.substring(1);
                }
                normalizedPhone = digits;
            } else {
                // fallback: nếu không extract được digits thì vẫn search theo raw
                normalizedPhone = raw;
            }
        }

        List<Customer> customers = customerRepository.findByCustomerNameIdentityAndPhone(
                !emptyName ? customerName.trim() : null,
                !emptyId ? identityNumber.trim() : null,
                normalizedPhone
        );

        return customers.stream().map(CustomerDTO::fromEntity).collect(Collectors.toList());
    }

    @Override
    public CustomerDTO findById(Integer id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        return CustomerDTO.fromEntity(c);
    }
}