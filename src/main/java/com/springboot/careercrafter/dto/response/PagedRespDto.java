package com.springboot.careercrafter.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

// one page of records + the pagination info (same idea as FilterDto in the helpdesk project)
public record PagedRespDto<T>(
        List<T> content,
        PaginationDto paginationInfo
) {
    // converts a spring Page into content + pagination info
    public static <T> PagedRespDto<T> of(Page<T> page) {
        return new PagedRespDto<>(page.getContent(),
                new PaginationDto(page.getTotalPages(), page.getTotalElements(), page.getNumberOfElements()));
    }
}
