package com.sep490.wcpms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

    private Status status;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private T data;

    @Builder.Default
    private Meta meta = new Meta();

    // ================== INNER CLASSES ==================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Status {
        private int code;         // HTTP status code (200, 404, 500...)
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String errorCode; // Error code như "PHONE_EXIST", "EMAIL_EXIST"
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Meta {
        @Builder.Default
        private Instant timestamp = Instant.now();
        private String requestId;                  // trace/debug id
        private String path;                       // endpoint

        // Pagination fields
        private Integer page;
        private Integer size;
        private Long totalElements;
        private Integer totalPages;
    }

    // ================== UTILITY METHODS ==================

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(200)
                        .message("Success")
                        .build())
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(200)
                        .message(message)
                        .build())
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> created(T data, String message) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(201)
                        .message(message)
                        .build())
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(code)
                        .message(message)
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> error(int code, String message, String path) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(code)
                        .message(message)
                        .build())
                .meta(Meta.builder()
                        .path(path)
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> errorWithCode(int code, String errorCode, String message) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(code)
                        .errorCode(errorCode)
                        .message(message)
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> errorWithCode(int code, String errorCode, String message, String path) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(code)
                        .errorCode(errorCode)
                        .message(message)
                        .build())
                .meta(Meta.builder()
                        .path(path)
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> successWithPagination(T data, String message,
                                                           Integer page, Integer size,
                                                           Long totalElements, Integer totalPages) {
        return ApiResponse.<T>builder()
                .status(Status.builder()
                        .code(200)
                        .message(message)
                        .build())
                .data(data)
                .meta(Meta.builder()
                        .page(page)
                        .size(size)
                        .totalElements(totalElements)
                        .totalPages(totalPages)
                        .build())
                .build();
    }
}
