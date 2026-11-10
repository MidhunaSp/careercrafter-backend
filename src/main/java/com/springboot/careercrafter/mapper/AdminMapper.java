package com.springboot.careercrafter.mapper;

import com.springboot.careercrafter.dto.request.AdminReqDto;
import com.springboot.careercrafter.model.Admin;
import org.springframework.stereotype.Component;

@Component
public class AdminMapper {

    public Admin mapDtoToEntity(AdminReqDto dto) {
        Admin admin = new Admin();
        admin.setName(dto.name());
        return admin;
    }
}