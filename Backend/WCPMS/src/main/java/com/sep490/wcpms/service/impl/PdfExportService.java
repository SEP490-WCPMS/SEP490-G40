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
import java.io.IOException;
import java.net.URL;
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
            // LOG chi tiết nguyên nhân Thymeleaf
            ex.printStackTrace(); // xem trong console IntelliJ
            throw new RuntimeException("Thymeleaf error with template: " + templateName + " - " + ex.getMessage(), ex);
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PdfRendererBuilder builder = getPdfRendererBuilder(html);

            builder.toStream(baos);
            builder.run();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF from template " + templateName, e);
        }
    }

    private static PdfRendererBuilder getPdfRendererBuilder(String html) throws IOException {
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useFastMode();

        // --- ĐĂNG KÝ FONT TIMES NEW ROMAN ---
        ClassPathResource times      = new ClassPathResource("fonts/times.ttf");
        ClassPathResource timesBold  = new ClassPathResource("fonts/timesbd.ttf");
        ClassPathResource timesIt    = new ClassPathResource("fonts/timesi.ttf");
        ClassPathResource timesBi    = new ClassPathResource("fonts/timesbi.ttf");

        builder.useFont(
                times.getFile(),
                "Times New Roman",
                400,
                BaseRendererBuilder.FontStyle.NORMAL,
                true
        );
        builder.useFont(
                timesBold.getFile(),
                "Times New Roman",
                700,
                BaseRendererBuilder.FontStyle.NORMAL,
                true
        );
        builder.useFont(
                timesIt.getFile(),
                "Times New Roman",
                400,
                BaseRendererBuilder.FontStyle.ITALIC,
                true
        );
        builder.useFont(
                timesBi.getFile(),
                "Times New Roman",
                700,
                BaseRendererBuilder.FontStyle.ITALIC,
                true
        );

        // baseURL trỏ tới thư mục pdf-assets để img src="logo.png"/"signature.png" hoạt động
        URL baseUrl = new ClassPathResource("pdf-assets/").getURL();
        builder.withHtmlContent(html, baseUrl.toString());
        return builder;
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
        return baseDir + "/" + outFile.getName();
    }
}
