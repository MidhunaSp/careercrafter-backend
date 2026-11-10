package com.springboot.careercrafter.mapper;

import com.springboot.careercrafter.dto.request.ResumeReqDto;
import com.springboot.careercrafter.dto.response.ResumeRespDto;
import com.springboot.careercrafter.model.Resume;
import org.springframework.stereotype.Component;

@Component
public class ResumeMapper {

    public Resume mapDtoToEntity(ResumeReqDto dto) {
        Resume resume = new Resume();
        resume.setFileName(dto.fileName());
        resume.setFilePath(dto.filePath());
        resume.setLabel(dto.label());
        resume.setDefault(dto.isDefault());
        return resume;
    }

    public ResumeRespDto mapEntityToDto(Resume r) {
        return new ResumeRespDto(
                r.getId(),
                r.getJobSeeker().getId(),
                r.getFileName(),
                r.getFilePath(),
                r.getLabel(),
                r.isDefault(),
                r.getUploadedAt(),
                r.isShared()
        );
    }
}