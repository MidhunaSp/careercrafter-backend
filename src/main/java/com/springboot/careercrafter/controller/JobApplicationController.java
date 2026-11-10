package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.JobApplicationRespDto;
import com.springboot.careercrafter.enums.ApplicationStatus;
import com.springboot.careercrafter.service.JobApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;

    // resumeId is optional (default resume is used if not given)  ->  /api/jobApplication/add/1/1?resumeId=1
    // with resume    ->  /api/jobApplication/add/1/1?resumeId=1 ( adds the exact resume)
    // without resume ->  /api/jobApplication/add/1/1 ( if resume id is not given then default resume is added to apply for the job)
    @PostMapping("/api/jobApplication/add/{jobId}/{applicantId}")
    public CreatedRespDto apply(@PathVariable Long jobId,
                                @PathVariable Long applicantId,
                                @RequestParam(value = "resumeId", required = false) Long resumeId,
                                Principal principal) {
        return jobApplicationService.apply(jobId, applicantId, resumeId, principal.getName());
    }

    @GetMapping("/api/jobApplication/applicant/{jobSeekerId}")
    public PagedRespDto<JobApplicationRespDto> getByApplicantId(@PathVariable Long jobSeekerId,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size,
                                                                Principal principal) {
        return jobApplicationService.getByApplicantId(jobSeekerId, page, size, principal.getName());
    }

    @GetMapping("/api/jobApplication/job/{jobId}")
    public PagedRespDto<JobApplicationRespDto> getByJobId(@PathVariable Long jobId,
                                                          @RequestParam(value = "status", required = false) ApplicationStatus status,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size,
                                                          Principal principal) {
        return jobApplicationService.getByJobId(jobId, status, page, size, principal.getName());
    }

    @GetMapping("/api/jobApplication/{id}")
    public JobApplicationRespDto getById(@PathVariable Long id, Principal principal) {
        return jobApplicationService.getById(id, principal.getName());
    }

    @DeleteMapping("/api/jobApplication/{id}")
    public void withdraw(@PathVariable Long id, Principal principal) {
        jobApplicationService.withdraw(id, principal.getName());
    }
}