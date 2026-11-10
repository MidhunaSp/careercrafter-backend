package com.springboot.careercrafter.dto.response;

public record JobApplicantCountDto(
        String jobTitle,
        Long applicants
) {
}