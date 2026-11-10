package com.springboot.careercrafter.dto.response;

public record PaginationDto(
        int totalPages,
        Long totalRecords,
        Integer numRecordsInPage
) {
}
