package com.sep490.wcpms.security.jwt;

// --- THAY THẾ BẰNG IMPORT UserDetailsImpl ĐÚNG CỦA BẠN ---
import com.sep490.wcpms.security.services.UserDetailsImpl;
// ---
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException; // Import đúng SignatureException
import jakarta.annotation.PostConstruct; // <-- Thêm import này
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired; // <-- Thêm import này
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment; // <-- Thêm import này
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey; // Import Key từ javax.crypto
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    // --- Inject Environment để đọc biến môi trường ---
    @Autowired
    private Environment environment;

    // --- jwtSecret không dùng @Value nữa ---
    private String jwtSecret;

    // --- jwtExpirationMs vẫn đọc từ application.yml/.properties ---
    @Value("${app.jwtExpirationMs}")
    private int jwtExpirationMs;

    // --- Biến lưu trữ Key đã được tạo ---
    private SecretKey signingKey; // Đổi kiểu từ Key sang SecretKey cho rõ ràng

    /**
     * Hàm này tự động chạy sau khi JwtUtils được tạo.
     * Nó đọc khóa bí mật từ biến môi trường và khởi tạo signingKey.
     */
    @PostConstruct
    private void loadSecretAndInitializeKey() {
        // Đọc giá trị từ biến môi trường có tên 'APP_JWT_SECRET'
        this.jwtSecret = environment.getProperty("APP_JWT_SECRET");

        // Kiểm tra xem biến môi trường có được đặt không
        if (this.jwtSecret == null || this.jwtSecret.isBlank()) {
            // Ném lỗi nghiêm trọng nếu không có secret, ứng dụng không nên khởi động
            logger.error("FATAL ERROR: JWT Secret (APP_JWT_SECRET) is not configured in environment variables!");
            throw new IllegalStateException("JWT Secret (APP_JWT_SECRET) is not configured in environment variables!");
        }

        // Kiểm tra độ dài tối thiểu (ví dụ: Base64 cho 256-bit key thường dài 44 ký tự trở lên)
        if (this.jwtSecret.length() < 44) {
            logger.warn("Warning: JWT Secret seems too short. Ensure it's a strong, base64 encoded key (at least 256 bits).");
        }

        // --- Khởi tạo signingKey một lần khi load secret ---
        try {
            byte[] keyBytes = Decoders.BASE64.decode(this.jwtSecret);
            this.signingKey = Keys.hmacShaKeyFor(keyBytes); // Tạo SecretKey
            logger.info("JWT Secret loaded and signing key initialized successfully.");
        } catch (IllegalArgumentException e) {
            logger.error("FATAL ERROR: Invalid Base64 format for JWT Secret (APP_JWT_SECRET)!", e);
            throw new IllegalStateException("Invalid Base64 format for JWT Secret (APP_JWT_SECRET)!", e);
        }
    }


    /**
     * Tạo JWT token từ đối tượng Authentication.
     * @param authentication Chứa thông tin người dùng đã xác thực.
     * @return Chuỗi JWT token.
     */
    public String generateJwtToken(Authentication authentication) {
        // === SỬA LẠI TÊN UserDetailsImpl NẾU CẦN ===
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername()) // Đặt username làm subject
                .claim("userId", userPrincipal.getId()) // ✅ THÊM userId vào token
                .setIssuedAt(new Date()) // Thời gian phát hành
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs)) // Thời gian hết hạn
                .signWith(this.signingKey, SignatureAlgorithm.HS256) // Ký bằng key đã khởi tạo và thuật toán HS256
                .compact(); // Xây dựng token
    }

    /**
     * Trả về SecretKey đã được khởi tạo (thay vì tạo lại mỗi lần).
     * @return SecretKey dùng để ký và xác thực.
     */
    private SecretKey key() {
        // Chỉ cần trả về key đã được tạo trong @PostConstruct
        if (this.signingKey == null) {
            // Trường hợp hiếm gặp nếu @PostConstruct chưa chạy kịp?
            loadSecretAndInitializeKey();
        }
        return this.signingKey;
    }

    /**
     * Lấy username từ JWT token.
     * @param token Chuỗi JWT token.
     * @return Username.
     */
    public String getUserNameFromJwtToken(String token) {
        // Dùng JwtParserBuilder để parse an toàn hơn
        return Jwts.parserBuilder()
                .setSigningKey(key()) // Chỉ định key để xác thực chữ ký
                .build()              // Xây dựng parser
                .parseClaimsJws(token) // Parse và xác thực token
                .getBody()            // Lấy phần payload (claims)
                .getSubject();         // Lấy subject (username)
    }

    /**
     * ✅ Lấy userId từ JWT token.
     * @param token Chuỗi JWT token.
     * @return UserId (Integer).
     */
    public Integer getUserIdFromJwtToken(String token) {
        // Parse token và lấy claim "userId"
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("userId", Integer.class); // ✅ Lấy userId từ claim
    }

    /**
     * Xác thực JWT token (kiểm tra chữ ký, thời gian hết hạn...).
     * @param authToken Chuỗi JWT token cần kiểm tra.
     * @return true nếu token hợp lệ, false nếu không.
     */
    public boolean validateJwtToken(String authToken) {
        try {
            // Parse và xác thực token bằng key
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            return true; // Hợp lệ nếu không ném exception
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty or invalid: {}", e.getMessage());
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        }
        // Nếu bắt được bất kỳ exception nào ở trên -> token không hợp lệ
        return false;
    }
}