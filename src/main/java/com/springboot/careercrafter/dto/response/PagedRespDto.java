package com.springboot.careercrafter.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

public record PagedRespDto<T>(
        List<T> content,
        PaginationDto paginationInfo
) {

    public static <T> PagedRespDto<T> of(Page<T> page) {
        return new PagedRespDto<>(page.getContent(),
                new PaginationDto(page.getTotalPages(), page.getTotalElements(), page.getNumberOfElements()));
    }
}
