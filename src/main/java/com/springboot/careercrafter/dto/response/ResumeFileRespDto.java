package com.springboot.careercrafter.dto.response;

public record ResumeFileRespDto(
        String fileName,
        byte[] content
) {
}