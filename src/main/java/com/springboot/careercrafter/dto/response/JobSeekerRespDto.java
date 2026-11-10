package com.springboot.careercrafter.dto.response;

public record JobSeekerRespDto(
        Long id,
        Long userId,
        String fullName,
        String phone,
        String location,
        String education,
        String experience,
        String skills,
        String username,
        Boolean active
) {
}