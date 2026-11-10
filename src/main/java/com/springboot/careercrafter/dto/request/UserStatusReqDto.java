package com.springboot.careercrafter.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserStatusReqDto(
        @NotBlank(message = "Username is required")
        String username,
        @NotNull(message = "Active flag is required")
        Boolean active,
        // mandatory when suspending (checked in AdminService)
        @Size(max = 500, message = "Reason can be max 500 characters")
        String reason
) {
}
