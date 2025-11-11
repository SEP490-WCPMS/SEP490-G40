package com.sep490.wcpms.config;

import com.sep490.wcpms.security.jwt.JwtAuthEntryPoint; // <-- Lớp xử lý lỗi 401
import com.sep490.wcpms.security.jwt.JwtAuthTokenFilter; // <-- Lớp lọc token
import com.sep490.wcpms.security.services.UserDetailsServiceImpl; // <-- Service load user
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // <-- Cần cho requestMatchers OPTIONS
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy; // <-- Cần cho STATELESS
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // <-- Cần cho addFilterBefore

@Configuration
@EnableMethodSecurity // Bật kiểm tra quyền (ví dụ @PreAuthorize nếu dùng)
public class SecurityConfig {

    @Autowired
    UserDetailsServiceImpl userDetailsService; // Service để load UserDetails

    @Autowired
    private JwtAuthEntryPoint unauthorizedHandler; // Xử lý lỗi khi chưa xác thực

    /**
     * Bean để tạo JwtAuthTokenFilter.
     * Spring sẽ tự động inject JwtUtils và UserDetailsServiceImpl vào filter này.
     * @return JwtAuthTokenFilter
     */
    @Bean
    public JwtAuthTokenFilter authenticationJwtTokenFilter() {
        return new JwtAuthTokenFilter();
    }

    /**
     * Bean cung cấp cách Spring Security tìm user và kiểm tra password.
     * @return DaoAuthenticationProvider
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService); // Dùng service của bạn
        authProvider.setPasswordEncoder(passwordEncoder()); // Dùng BCrypt
        return authProvider;
    }

    /**
     * Bean quản lý quá trình xác thực (được AuthService sử dụng).
     * @param authConfig Cấu hình xác thực mặc định của Spring Boot.
     * @return AuthenticationManager
     * @throws Exception
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * Bean định nghĩa bộ mã hóa mật khẩu.
     * @return PasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Bean cấu hình chuỗi bộ lọc bảo mật chính.
     * @param http Đối tượng HttpSecurity để cấu hình.
     * @return SecurityFilterChain
     * @throws Exception
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Tắt CSRF vì dùng API stateless
                .csrf(csrf -> csrf.disable())

                // Cấu hình xử lý lỗi khi truy cập trái phép
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))

                // Cấu hình quản lý session: STATELESS (không dùng session)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Cấu hình phân quyền truy cập
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // Cho phép CORS Preflight Requests (OPTIONS) đi qua
                                // Trong SecurityConfig.java -> filterChain() -> authorizeHttpRequests()

// ... (permitAll cho OPTIONS, /api/auth, /api/meter-scan, /, /about) ...
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers("/", "/about").permitAll()
                                .requestMatchers("/api/water-price-types/**").permitAll()
                                .requestMatchers("/api/water-prices/**").permitAll()
                                .requestMatchers("/api/contract-request/**").permitAll()
                                .requestMatchers("/api/reading-routes/**").permitAll()
                                // Allow public GET access to accounting reading-routes (so frontend can call existing path)
                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/accounting/reading-routes/**").permitAll()
                                .requestMatchers("/api/change-password/**").permitAll()
                                .requestMatchers("/api/v1/contracts/**").permitAll()
                                .requestMatchers("/api/v1/contract-requests/**").permitAll()

//// --- PHÂN QUYỀN ĐÚNG ---
                                .requestMatchers("/api/technical/**").hasAuthority("TECHNICAL_STAFF")
                                .requestMatchers("/api/readings/**").hasAuthority("CASHIER_STAFF")
                                .requestMatchers("/api/meter-scan/**").hasAuthority("CASHIER_STAFF")
                                .requestMatchers("/api/service/**").hasAuthority("SERVICE_STAFF")

                                // --- THÊM 2 DÒNG NÀY ---
                                .requestMatchers("/api/feedback/customer/**").hasAuthority("CUSTOMER") // Cho phép Customer tạo
                                .requestMatchers("/api/feedback/service").hasAuthority("SERVICE_STAFF") // Cho phép Service Staff tạo
                                .requestMatchers("/api/feedback/customer/my-active-meters/**").hasAuthority("SERVICE_STAFF")
                                // --- HẾT PHẦN THÊM ---
                                // --- THÊM MỚI: BẢO VỆ API ADMIN ---
                                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

                                // --- THÊM DÒNG NÀY ---
                                .requestMatchers("/api/accounting/**").hasAuthority("ACCOUNTING_STAFF")
                                // --- HẾT PHẦN THÊM ---

                                // --- THÊM DÒNG NÀY ---
                                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                                // --- HẾT PHẦN THÊM ---

                                .requestMatchers("/profile", "/contract-request/**", "/my-requests").permitAll()
                                .requestMatchers("/staff/profile").hasAnyAuthority("TECHNICAL_STAFF", "CASHIER_STAFF", "SERVICE_STAFF")
//// --- HẾT PHÂN QUYỀN ĐÚNG ---

                                .anyRequest().authenticated() // Mọi thứ khác cần đăng nhập
                )
                .formLogin(login -> login.disable())
                .httpBasic(basic -> basic.disable());

        // Đăng ký AuthenticationProvider đã cấu hình ở trên
        http.authenticationProvider(authenticationProvider());

        // Thêm bộ lọc JWT vào đúng vị trí trong chuỗi filter
        // Nó sẽ chạy trước bộ lọc kiểm tra username/password mặc định
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        // Build cấu hình
        return http.build();
    }
}