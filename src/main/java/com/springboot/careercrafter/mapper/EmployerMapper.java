package com.springboot.careercrafter.mapper;

import com.springboot.careercrafter.dto.request.EmployerReqDto;
import com.springboot.careercrafter.dto.response.EmployerRespDto;
import com.springboot.careercrafter.model.Employer;
import org.springframework.stereotype.Component;

@Component
public class EmployerMapper {

    public Employer mapDtoToEntity(EmployerReqDto dto) {
        Employer employer = new Employer();
        employer.setFullName(dto.fullName());
        employer.setCompanyName(dto.companyName());
        employer.setPhone(dto.phone());
        return employer;
    }

    public EmployerRespDto mapEntityToDto(Employer employer) {
        return new EmployerRespDto(
                employer.getId(),
                employer.getUser().getId(),
                employer.getFullName(),
                employer.getCompanyName(),
                employer.getPhone(),
                employer.getVerificationStatus(),
                employer.getUser().getUsername(),
                employer.getUser().isActive()
        );
    }
}