package com.sep490.wcpms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // ❌ Tắt CSRF (chặn POST)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/meter-scan/**").permitAll() // ✅ Cho phép API này truy cập công khai
                        .anyRequest().permitAll() // (hoặc authenticated() nếu muốn giữ bảo mật)
                )
                .formLogin(login -> login.disable())
                .httpBasic(basic -> basic.disable());

        return http.build();
    }
}
