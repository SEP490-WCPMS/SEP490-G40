package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.service.TemplateFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class TemplateFileServiceImpl implements TemplateFileService {

    /**
     * Nếu deploy Windows Server muốn thay template mà không build lại jar,
     * có thể trỏ tới thư mục ngoài bằng cấu hình (ví dụ):
     *   app.templates.dir=C:/wcpms/templates
     */
    @Value("${app.templates.dir:}")
    private String templatesDir;

    private static final String MATERIAL_COST_FILE_NAME = "Bang_tham_khao_chi_phi_vat_lieu.xlsx";
    private static final String CLASSPATH_LOCATION = "file-templates/" + MATERIAL_COST_FILE_NAME;

    @Override
    public Resource getMaterialCostExcel() {
        // 1) Ưu tiên file ngoài
        if (templatesDir != null && !templatesDir.trim().isEmpty()) {
            Path externalPath = Paths.get(templatesDir).resolve(MATERIAL_COST_FILE_NAME);
            if (Files.exists(externalPath) && Files.isRegularFile(externalPath)) {
                return new FileSystemResource(externalPath.toFile());
            }
        }

        // 2) Fallback: classpath (đóng gói trong jar)
        Resource classpathRes = new ClassPathResource(CLASSPATH_LOCATION);
        if (!classpathRes.exists()) {
            throw new ResourceNotFoundException("Template file not found: " + MATERIAL_COST_FILE_NAME);
        }
        return classpathRes;
    }
}