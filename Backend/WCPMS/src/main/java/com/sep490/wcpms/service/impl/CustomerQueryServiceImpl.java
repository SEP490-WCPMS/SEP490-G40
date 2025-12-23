
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

        // Tìm kiếm với các tham số đã cho
        List<Customer> customers = customerRepository.findByCustomerNameIdentityAndPhone(
                !emptyName ? customerName.trim() : null,
                !emptyId ? identityNumber.trim() : null,
                !emptyPhone ? phone.trim() : null
        );

        // Chuyển đổi sang DTO và trả về
        return customers.stream().map(CustomerDTO::fromEntity).collect(Collectors.toList());
    }

    @Override
    public CustomerDTO findById(Integer id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        return CustomerDTO.fromEntity(c);
    }
}
