package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.request.JobSeekerReqDto;
import com.springboot.careercrafter.dto.request.JobSeekerUpdateDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.JobSeekerRespDto;
import com.springboot.careercrafter.service.JobSeekerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class JobSeekerController {

    private final JobSeekerService jobSeekerService;

    @PostMapping("/api/jobseeker/add")
    public CreatedRespDto add(@Valid @RequestBody JobSeekerReqDto jobSeekerReqDto) {
        return jobSeekerService.add(jobSeekerReqDto);
    }

    @GetMapping("/api/jobseeker/all")
    public List<JobSeekerRespDto> getAll() {
        return jobSeekerService.getAll();
    }

    @GetMapping("/api/jobseeker/by-username")
    public JobSeekerRespDto getByUsername(@RequestParam("username") String username) {
        return jobSeekerService.getByUsername(username);
    }

    @GetMapping("/api/jobseeker/{id}")
    public JobSeekerRespDto getById(@PathVariable Long id) {
        return jobSeekerService.getById(id);
    }

    @GetMapping("/api/jobseeker/filter")
    public PagedRespDto<JobSeekerRespDto> filter(
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "skills", required = false) String skills,
            @RequestParam(value = "education", required = false) String education,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return jobSeekerService.filter(fullName, location, skills, education, page, size);
    }

    @PutMapping("/api/jobseeker/{id}")
    public void update(@PathVariable Long id,
                       @Valid @RequestBody JobSeekerUpdateDto dto,
                       Principal principal) {
        jobSeekerService.update(id, dto, principal.getName());
    }

    @DeleteMapping("/api/jobseeker/{id}")
    public void deleteById(@PathVariable Long id, Principal principal) {
        jobSeekerService.deleteById(id, principal.getName());
    }
}