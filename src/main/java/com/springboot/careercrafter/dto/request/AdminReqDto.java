package com.springboot.careercrafter.dto.request;

import jakarta.validation.constraints.*;

public record AdminReqDto(
        @NotBlank(message = "Full name is required")
        @Size(max = 150)
        String name,
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 150, message = "Username should be 3 to 150 characters")
        String username,
        @NotBlank(message = "Password is required")
        String password
) {
}
