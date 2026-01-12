package com.sep490.wcpms.service;

import org.springframework.core.io.Resource;

/**
 * Service cung cấp các file template (Excel/Word/...) để tải về.
 * Hỗ trợ 2 chế độ:
 * 1) Ưu tiên đọc từ thư mục ngoài (filesystem) nếu cấu hình app.templates.dir và file tồn tại.
 * 2) Fallback đọc từ classpath (đóng gói sẵn trong jar).
 */
public interface TemplateFileService {

    /**
     * Bảng tham khảo chi phí vật liệu (Excel) dùng cho bước Khảo sát/Báo giá của kỹ thuật.
     */
    Resource getMaterialCostExcel();
}