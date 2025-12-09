package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.ContractAnnulTransferRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class ContractAnnulTransferRequestSpecs {

    public static Specification<ContractAnnulTransferRequest> contractIdEq(Integer contractId) {
        return (root, cq, cb) ->
                contractId == null ? null : cb.equal(root.get("contract").get("id"), contractId);
    }

    public static Specification<ContractAnnulTransferRequest> typeEq(String requestType) {
        return (root, cq, cb) ->
                (requestType == null || requestType.isBlank())
                        ? null
                        : cb.equal(cb.lower(root.get("requestType")), requestType.toLowerCase());
    }

    public static Specification<ContractAnnulTransferRequest> statusEq(String status) {
        return (root, cq, cb) ->
                (status == null || status.isBlank())
                        ? null
                        : cb.equal(cb.lower(root.get("approvalStatus")), status.toLowerCase());
    }

    public static Specification<ContractAnnulTransferRequest> requestDateGte(LocalDate from) {
        return (root, cq, cb) ->
                from == null ? null : cb.greaterThanOrEqualTo(root.get("requestDate"), from);
    }

    public static Specification<ContractAnnulTransferRequest> requestDateLte(LocalDate to) {
        return (root, cq, cb) ->
                to == null ? null : cb.lessThanOrEqualTo(root.get("requestDate"), to);
    }

    public static Specification<ContractAnnulTransferRequest> qLike(String q) {
        return (root, cq, cb) -> {
            if (q == null || q.isBlank()) return null;
            String like = "%" + q.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("requestNumber")), like),
                    cb.like(cb.lower(root.get("reason")), like),
                    cb.like(cb.lower(root.get("notes")), like)
            );
        };
    }

    public static Specification<ContractAnnulTransferRequest> serviceStaffEq(Integer serviceStaffId) {
        return (root, cq, cb) ->
                serviceStaffId == null ? null : cb.equal(root.get("contract").get("serviceStaff").get("id"), serviceStaffId);
    }
}
