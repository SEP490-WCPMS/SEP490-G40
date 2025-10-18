package com.sep490.wcpms.util;

public final class Constant {
    public static final class ContractStatus {
        public static final String DRAFT = "draft";
        public static final String PENDING = "pending";
        public static final String APPROVE = "approved";
        public static final String ACTIVE = "active";
        public static final String EXPIRED = "expired";
        public static final String TERMINATED = "terminated";
        public static final String SUSPENDED = "suspended";
        public static final String DELETED = "deleted";
    }

    public static final class PaymentMethod {
        public static final String CASH = "cash";
        public static final String BANK_TRANSFER = "bank_transfer";
        public static final String INSTALLMENT = "installment";
    }

    public static final class RequestType {
        public static final String ANNUL = "annul";
        public static final String TRANSFER = "transfer";
    }

    public static final class ApprovalStatus {
        public static final String PENDING = "pending";
        public static final String APPROVED = "approved";
        public static final String REJECTED = "rejected";
    }
}
