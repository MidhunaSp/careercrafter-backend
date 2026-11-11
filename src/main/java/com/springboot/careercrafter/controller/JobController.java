package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.request.JobReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.JobRespDto;
import com.springboot.careercrafter.enums.EmploymentType;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class JobController {

    private final JobService jobService;

    @PostMapping("/api/job/add/{employerId}")
    public CreatedRespDto add(@PathVariable Long employerId,
                              @Valid @RequestBody JobReqDto dto,
                              Principal principal) {
        return jobService.add(employerId, dto, principal.getName());
    }

    @GetMapping("/api/job/all")
    public List<JobRespDto> getActiveJobs(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        return jobService.getActiveJobs(page, size);
    }

    // v1: Filter jobs
    @GetMapping("/api/job/filter/v1")
    public PagedRespDto<JobRespDto> filter(@RequestParam(value = "location", required = false) String location,
                                           @RequestParam(value = "industry", required = false) String industry,
                                           @RequestParam(value = "employmentType", required = false) EmploymentType employmentType,
                                           @RequestParam(value = "minSalary", required = false) Double minSalary,
                                           @RequestParam(value = "keyword", required = false) String keyword,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return jobService.filter(location, industry, employmentType, minSalary, keyword, page, size);
    }

    @GetMapping("/api/job/employer/{employerId}")
    public PagedRespDto<JobRespDto> getByEmployerId(@PathVariable Long employerId,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        return jobService.getByEmployerId(employerId, page, size);
    }

    // v1: Get job by ID
    @GetMapping("/api/job/v1/{id}")
    public JobRespDto getById(@PathVariable Long id) {
        return jobService.getById(id);
    }

    // v2: Get job by ID (closed jobs are not returned)
    @GetMapping("/api/job/v2/{id}")
    public JobRespDto getActiveById(@PathVariable Long id) {
        JobRespDto job = jobService.getById(id);
        if (!job.active()) {
            throw new ResourceNotFoundException("This job is closed");
        }
        return job;
    }

    @PutMapping("/api/job/{id}")
    public void update(@PathVariable Long id,
                       @Valid @RequestBody JobReqDto dto,
                       Principal principal) {
        jobService.update(id, dto, principal.getName());
    }

    @PutMapping("/api/job/{id}/close")
    public void close(@PathVariable Long id, Principal principal) {
        jobService.close(id, principal.getName());
    }

    @DeleteMapping("/api/job/{id}")
    public void deleteById(@PathVariable Long id, Principal principal) {
        jobService.deleteById(id, principal.getName());
    }

    @PutMapping("/api/job/{id}/reopen")
    public void reopen(@PathVariable Long id, Principal principal) {
        jobService.reopen(id, principal.getName());
    }
}