
package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.CustomerDTO;
import com.sep490.wcpms.entity.Customer;
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

    @Override
    public List<CustomerDTO> findCustomers(String customerName, String identityNumber) {
        // Nếu cả 2 param đều null hoặc rỗng, trả về danh sách rỗng
        if ((customerName == null || customerName.trim().isEmpty()) &&
                (identityNumber == null || identityNumber.trim().isEmpty())) {
            return customerRepository.findAll().stream()
                    .map(CustomerDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        List<Customer> customers = customerRepository.findByCustomerNameAndIdentityNumber(
                customerName != null && !customerName.trim().isEmpty() ? customerName.trim() : null,
                identityNumber != null && !identityNumber.trim().isEmpty() ? identityNumber.trim() : null
        );

        return customers.stream()
                .map(CustomerDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
