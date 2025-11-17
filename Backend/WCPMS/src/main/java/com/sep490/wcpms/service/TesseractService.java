package com.sep490.wcpms.service;

import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.*;
import java.io.*;
import java.util.Base64;

@Service
public class TesseractService {

    @Value("${app.tesseract.tessdata-path}")
    private String tessDataPath;

    @Value("${app.tesseract.language:eng}")
    private String language;

    public String doOCRFromBase64(String base64) throws IOException, TesseractException {
        // 1. decode base64
        byte[] imageBytes = Base64.getDecoder().decode(base64);
        InputStream is = new ByteArrayInputStream(imageBytes);
        BufferedImage img = ImageIO.read(is);
        if (img == null) throw new IOException("Invalid image data");

        // 2. tiền xử lý (grayscale + resize + threshold)
        BufferedImage pre = preprocessImage(img);

        // 3. config tess4j
        ITesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath);          // đường dẫn tới folder tessdata
        tesseract.setLanguage(language);              // "eng" hoặc "vie" nếu có
        tesseract.setTessVariable("tessedit_char_whitelist", "0123456789"); // CHỈ đọc số
        tesseract.setPageSegMode(6); // Assume a single uniform block of text (thử PSM phù hợp)
        // tesseract.setOcrEngineMode(1); // tùy chọn

        // 4. OCR
        String raw = tesseract.doOCR(pre);
        return raw;
    }

    private BufferedImage preprocessImage(BufferedImage src) {
        // Convert to grayscale
        BufferedImage gray = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = gray.createGraphics();
        g.drawImage(src, 0, 0, null);
        g.dispose();

        // Resize if too small (tăng kích thước giúp OCR)
        int width = gray.getWidth(), height = gray.getHeight();
        int maxDim = Math.max(width, height);
        if (maxDim < 800) { // nếu ảnh nhỏ thì scale lên
            double scale = 800.0 / maxDim;
            int newW = (int) (width * scale);
            int newH = (int) (height * scale);
            Image tmp = gray.getScaledInstance(newW, newH, Image.SCALE_SMOOTH);
            BufferedImage resized = new BufferedImage(newW, newH, BufferedImage.TYPE_BYTE_GRAY);
            Graphics2D g2 = resized.createGraphics();
            g2.drawImage(tmp, 0, 0, null);
            g2.dispose();
            gray = resized;
        }

        // Binarize bằng Otsu threshold (rất cơ bản)
        BufferedImage bin = new BufferedImage(gray.getWidth(), gray.getHeight(), BufferedImage.TYPE_BYTE_BINARY);
        WritableRaster raster = gray.getRaster();
        int w = gray.getWidth(), h = gray.getHeight();
        int[] pix = new int[w*h];
        raster.getPixels(0, 0, w, h, pix);
        int threshold = otsuThreshold(pix);
        // apply threshold
        for (int y=0;y<h;y++) {
            for (int x=0;x<w;x++) {
                int p = gray.getRaster().getSample(x, y, 0);
                int v = (p > threshold) ? 255 : 0;
                bin.getRaster().setSample(x, y, 0, v==255?1:0);
            }
        }

        return bin;
    }

    // Otsu threshold (input: grayscale pixels 0..255)
    private int otsuThreshold(int[] pixels) {
        int[] hist = new int[256];
        for (int p : pixels) hist[p]++;
        int total = pixels.length;
        float sum = 0;
        for (int t=0;t<256;t++) sum += t * hist[t];
        float sumB = 0;
        int wB = 0;
        int wF;
        float varMax = 0;
        int threshold = 0;
        for (int t=0;t<256;t++) {
            wB += hist[t];
            if (wB == 0) continue;
            wF = total - wB;
            if (wF == 0) break;
            sumB += (float) (t * hist[t]);
            float mB = sumB / wB;
            float mF = (sum - sumB) / wF;
            float varBetween = (float) wB * (float) wF * (mB - mF) * (mB - mF);
            if (varBetween > varMax) {
                varMax = varBetween;
                threshold = t;
            }
        }
        return threshold;
    }
}
