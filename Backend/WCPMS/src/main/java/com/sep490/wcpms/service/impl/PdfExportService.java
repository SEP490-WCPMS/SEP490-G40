package com.sep490.wcpms.service.impl;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final SpringTemplateEngine templateEngine;

    private static final DateTimeFormatter TS_FMT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    public byte[] renderPdf(String templateName, Map<String, Object> model) {
        Context ctx = new Context();
        model.forEach(ctx::setVariable);

        String html;
        try {
            html = templateEngine.process(templateName, ctx);
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new RuntimeException("Thymeleaf error with template: " + templateName + " - " + ex.getMessage(), ex);
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = getPdfRendererBuilder(html);

            builder.toStream(baos);
            builder.run();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error generating PDF from template " + templateName, e);
        }
    }

    private static PdfRendererBuilder getPdfRendererBuilder(String html) throws Exception {
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useFastMode();

        // --- FIX: FONT LOAD AN TOAN KHI RUN TRONG FILE JAR (Windows Server / Linux) ---
        builder.useFont(
                loadFontFromResource("fonts/times.ttf"),
                "Times New Roman",
                400,
                BaseRendererBuilder.FontStyle.NORMAL,
                true
        );
        builder.useFont(
                loadFontFromResource("fonts/timesbd.ttf"),
                "Times New Roman",
                700,
                BaseRendererBuilder.FontStyle.NORMAL,
                true
        );
        builder.useFont(
                loadFontFromResource("fonts/timesi.ttf"),
                "Times New Roman",
                400,
                BaseRendererBuilder.FontStyle.ITALIC,
                true
        );
        builder.useFont(
                loadFontFromResource("fonts/timesbi.ttf"),
                "Times New Roman",
                700,
                BaseRendererBuilder.FontStyle.ITALIC,
                true
        );

        // baseURL trỏ tới thư mục pdf-assets để img src="logo.png"/"signature.png" hoạt động
        String baseUrl = ensurePdfAssetsOnDiskAndGetBaseUrl();
        builder.withHtmlContent(html, baseUrl);
        return builder;
    }

    private static volatile String PDF_ASSETS_BASE_URL;

    /**
     * Khi chạy từ JAR (Windows Server), URL kiểu jar:file:... có thể làm OpenHTMLtoPDF không load được ảnh.
     * Giải pháp: copy pdf-assets ra temp folder và dùng baseUrl kiểu file:///
     */
    private static String ensurePdfAssetsOnDiskAndGetBaseUrl() throws Exception {
        if (PDF_ASSETS_BASE_URL != null) return PDF_ASSETS_BASE_URL;

        synchronized (PdfExportService.class) {
            if (PDF_ASSETS_BASE_URL != null) return PDF_ASSETS_BASE_URL;

            Path dir = Paths.get(System.getProperty("java.io.tmpdir", "."), "wcpms-pdf-assets");
            Files.createDirectories(dir);

            copyIfMissing("pdf-assets/logo.png", dir.resolve("logo.png"));
            copyIfMissing("pdf-assets/signature.png", dir.resolve("signature.png"));

            PDF_ASSETS_BASE_URL = dir.toUri().toString(); // file:///C:/.../wcpms-pdf-assets/
            return PDF_ASSETS_BASE_URL;
        }
    }

    private static void copyIfMissing(String classpath, Path target) throws Exception {
        if (Files.exists(target)) return;

        ClassPathResource resource = new ClassPathResource(classpath);
        if (!resource.exists()) {
            throw new IllegalStateException("Resource not found: " + classpath);
        }
        try (InputStream is = resource.getInputStream()) {
            Files.copy(is, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    // --- ĐỌC FILE FONT TỪ JAR RA FILE TẠM ---
    private static File loadFontFromResource(String path) throws Exception {
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            throw new IllegalStateException("Font not found in resources: " + path);
        }

        String safeName = path.replaceAll("/", "_");
        File tempFile = File.createTempFile("font_" + safeName + "_", ".ttf");
        tempFile.deleteOnExit();

        try (InputStream inputStream = resource.getInputStream()) {
            Files.copy(inputStream, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
        return tempFile;
    }

    public String renderPdfToFile(String templateName,
                                  Map<String, Object> model,
                                  String baseDir,
                                  String filePrefix) {

        byte[] pdfBytes = renderPdf(templateName, model);

        File dir = new File(baseDir);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new RuntimeException("Cannot create directory: " + baseDir);
        }

        String ts = LocalDateTime.now().format(TS_FMT);
        File outFile = new File(dir, filePrefix + "-" + ts + ".pdf");

        try (FileOutputStream fos = new FileOutputStream(outFile)) {
            fos.write(pdfBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error writing PDF file: " + outFile.getName(), e);
        }

        // Khuyến nghị: trả về absolute path để đọc lại ổn định trên Windows Server
        return outFile.getAbsolutePath();
    }
}