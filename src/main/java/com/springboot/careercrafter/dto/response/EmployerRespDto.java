package com.springboot.careercrafter.dto.response;

import com.springboot.careercrafter.enums.VerificationStatus;

public record EmployerRespDto(
        Long id,
        Long userId,
        String fullName,
        String companyName,
        String phone,
        VerificationStatus verificationStatus,
        String username,
        Boolean active
) {
}