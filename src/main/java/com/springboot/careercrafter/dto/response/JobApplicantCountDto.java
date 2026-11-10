package com.springboot.careercrafter.dto.response;

public record JobApplicantCountDto(
        Long jobId,
        String jobTitle,
        Long applicants
) {
}