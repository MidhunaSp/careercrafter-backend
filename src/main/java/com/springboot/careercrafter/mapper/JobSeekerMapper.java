package com.springboot.careercrafter.mapper;

import com.springboot.careercrafter.dto.request.JobSeekerReqDto;
import com.springboot.careercrafter.dto.response.JobSeekerRespDto;
import com.springboot.careercrafter.model.JobSeeker;
import org.springframework.stereotype.Component;

@Component
public class JobSeekerMapper {

    public JobSeeker mapDtoToEntity(JobSeekerReqDto dto) {
        JobSeeker jobSeeker = new JobSeeker();
        jobSeeker.setFullName(dto.fullName());
        jobSeeker.setPhone(dto.phone());
        jobSeeker.setLocation(dto.location());
        jobSeeker.setEducation(dto.education());
        jobSeeker.setExperience(dto.experience());
        jobSeeker.setSkills(dto.skills());
        return jobSeeker;
    }

    public JobSeekerRespDto mapEntityToDto(JobSeeker js) {
        return new JobSeekerRespDto(
                js.getId(),
                js.getUser().getId(),
                js.getFullName(),
                js.getPhone(),
                js.getLocation(),
                js.getEducation(),
                js.getExperience(),
                js.getSkills(),
                js.getUser().getUsername(),
                js.getUser().isActive()
        );
    }
}