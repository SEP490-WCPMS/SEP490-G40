package com.sep490.wcpms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // REST API
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/contracts/**").permitAll()   // mở tạm để test
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults()); // có thể giữ hoặc bỏ, không ảnh hưởng khi permitAll
        return http.build();
    }
}
