// InvalidCredentialsException.java
package com.sep490.wcpms.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Mặc định sẽ trả về HTTP 400 Bad Request (hoặc 401 tùy vào cấu hình Security chi tiết)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidCredentialsException extends RuntimeException {

    // Constructor mặc định
    public InvalidCredentialsException() {
        super("Invalid username or password.");
    }

    // Constructor cho phép truyền vào thông báo lỗi custom
    public InvalidCredentialsException(String message) {
        super(message);
    }
}