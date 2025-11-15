package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.ReadingRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingRouteRepository extends JpaRepository<ReadingRoute, Integer> {
    Optional<ReadingRoute> findByRouteCode(String routeCode);
    List<ReadingRoute> findAllByStatus(ReadingRoute.Status status);
    /**
     * Tìm tất cả các tuyến đọc (Bảng 4) được gán cho một NV Thu ngân (Account).
     */
    List<ReadingRoute> findAllByAssignedReader(Account cashier);
}

