
package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.CustomerDTO;

import java.util.List;

public interface CustomerQueryService {
    List<CustomerDTO> findCustomers(String customerName, String identityNumber, String phone);

    CustomerDTO findById(Integer id);
}
