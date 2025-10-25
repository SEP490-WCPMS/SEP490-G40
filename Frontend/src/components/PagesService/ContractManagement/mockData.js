export const mockContracts = [
    {
        id: 1,
        contractNumber: "HD001",
        customerName: "Nguyễn Văn A",
        customerCode: "KH001",
        contractStatus: "DRAFT",
        startDate: "2025-10-01",
        endDate: "2026-10-01",
        notes: "Hợp đồng mới"
    },
    {
        id: 2,
        contractNumber: "HD002",
        customerName: "Trần Thị B",
        customerCode: "KH002",
        contractStatus: "PENDING",
        startDate: "2025-09-15",
        endDate: "2026-09-15",
        notes: "Đang chờ xử lý"
    },
    {
        id: 3,
        contractNumber: "HD003",
        customerName: "Lê Văn C",
        customerCode: "KH003",
        contractStatus: "PENDING_SURVEY_REVIEW",
        startDate: "2025-08-20",
        endDate: "2026-08-20",
        surveyDate: "2025-08-15",
        notes: "Đang chờ kết quả khảo sát"
    },
    {
        id: 4,
        contractNumber: "HD004",
        customerName: "Phạm Thị D",
        customerCode: "KH004",
        contractStatus: "ACTIVE",
        startDate: "2025-07-01",
        endDate: "2026-07-01",
        installationDate: "2025-06-28",
        notes: "Hợp đồng đang hoạt động"
    },
    {
        id: 5,
        contractNumber: "HD005",
        customerName: "Hoàng Văn E",
        customerCode: "KH005",
        contractStatus: "SUSPENDED",
        startDate: "2025-06-01",
        endDate: "2026-06-01",
        notes: "Tạm ngưng do khách hàng yêu cầu"
    }
];

export const mockTransferRequests = [
    {
        id: 1,
        contractNumber: "HD004",
        currentCustomer: "Phạm Thị D",
        newCustomer: "Nguyễn Văn X",
        requestDate: "2025-10-20",
        status: "PENDING",
        reason: "Chuyển nhượng do chuyển nhà"
    },
    {
        id: 2,
        contractNumber: "HD002",
        currentCustomer: "Trần Thị B",
        newCustomer: "Lê Văn Y",
        requestDate: "2025-10-18",
        status: "APPROVED",
        reason: "Chuyển nhượng do thay đổi chủ sở hữu"
    }
];

export const mockAnnulRequests = [
    {
        id: 1,
        contractNumber: "HD005",
        customerName: "Hoàng Văn E",
        requestDate: "2025-10-15",
        status: "PENDING",
        reason: "Không có nhu cầu sử dụng"
    },
    {
        id: 2,
        contractNumber: "HD003",
        customerName: "Lê Văn C",
        requestDate: "2025-10-10",
        status: "REJECTED",
        reason: "Chuyển đi nơi khác"
    }
];

export const mockTechnicalStaff = [
    {
        id: 1,
        fullName: "Nguyễn Kỹ Thuật A",
        code: "NV001",
        phone: "0901234567"
    },
    {
        id: 2,
        fullName: "Trần Kỹ Thuật B",
        code: "NV002",
        phone: "0909876543"
    }
];