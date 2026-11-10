package com.springboot.careercrafter.dto.request;

import jakarta.validation.constraints.*;

public record JobSeekerReqDto(
        @NotBlank(message = "Full name is required")
        @Size(max = 255)
        String fullName,
        @Size(min=10,max = 10, message = "Phone number must be 10 digits")
        String phone,
        @Size(max = 150)
        String location,
        @NotBlank
        String education,
        @NotBlank
        String experience,
        @NotBlank
        @Size(max = 1000)
        String skills,
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 150, message = "Username should be 3 to 150 characters")
        String username,
        @NotBlank(message = "Password is required")
        String password
) {
}
