package com.springboot.careercrafter.dto.response;

import java.time.LocalDateTime;

public record ResumeRespDto(
        Long id,
        Long jobSeekerId,
        String fileName,
        String filePath,
        String label,
        boolean isDefault,
        LocalDateTime uploadedAt,
        boolean shared
) {
}