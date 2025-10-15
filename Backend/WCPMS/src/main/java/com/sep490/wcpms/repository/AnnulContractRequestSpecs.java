package com.sep490.wcpms.repository;

import com.sep490.wcpms.entity.AnnulContractRequest;
import com.sep490.wcpms.util.Constant;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class AnnulContractRequestSpecs {

    public static Specification<AnnulContractRequest> contractIdEq(Integer contractId) {
        return (root, cq, cb) -> contractId == null ? null : cb.equal(root.get("contract").get("id"), contractId);
    }

    public static Specification<AnnulContractRequest> statusEq(Constant.ApprovalStatus status) {
        return (root, cq, cb) -> status == null ? null : cb.equal(root.get("approvalStatus"), status);
    }

    public static Specification<AnnulContractRequest> requestDateGte(LocalDate from) {
        return (root, cq, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("requestDate"), from);
    }

    public static Specification<AnnulContractRequest> requestDateLte(LocalDate to) {
        return (root, cq, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("requestDate"), to);
    }

    public static Specification<AnnulContractRequest> qLike(String q) {
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
}