package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.ReadingRoute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReadingRouteRepository extends JpaRepository<ReadingRoute, Integer> {
    Optional<ReadingRoute> findByRouteCode(String routeCode);
    List<ReadingRoute> findAllByStatus(ReadingRoute.Status status);
}

