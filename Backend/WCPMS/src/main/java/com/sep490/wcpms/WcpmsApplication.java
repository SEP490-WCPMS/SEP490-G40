package com.sep490.wcpms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling; // <-- 1. THÊM IMPORT NÀY

@SpringBootApplication
@EnableScheduling // <-- 2. THÊM ANNOTATION NÀY
public class WcpmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(WcpmsApplication.class, args);
    }

}
