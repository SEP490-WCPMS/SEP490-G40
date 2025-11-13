package com.sep490.wcpms.config;

import org.apache.http.HttpHeaders;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.util.Arrays;

@Configuration
@EnableTransactionManagement // ✅ FIX LỖI #4: Enable transactional event listener
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.addAllowedOrigin("http://localhost:5173");
        corsConfiguration.addAllowedOrigin("http://localhost:5174");
        corsConfiguration.setAllowedHeaders(Arrays.asList(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE, HttpHeaders.ACCEPT));
        corsConfiguration.setAllowedMethods(Arrays.asList(HttpMethod.GET.name(), HttpMethod.POST.name(), HttpMethod.PUT.name(), HttpMethod.PATCH.name(), HttpMethod.DELETE.name(), HttpMethod.OPTIONS.name()));
        corsConfiguration.setMaxAge(3600L);
//        corsConfiguration.setAllowCredentials(true);
        source.registerCorsConfiguration("/**", corsConfiguration);
        return new CorsFilter(source);
    }
}
