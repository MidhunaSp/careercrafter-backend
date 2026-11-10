package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.SavedJobRespDto;
import com.springboot.careercrafter.service.SavedJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SavedJobController {

    private final SavedJobService savedJobService;

    @PostMapping("/api/savedJob/add/{jobSeekerId}/{jobId}")
    public CreatedRespDto add(@PathVariable Long jobSeekerId,
                              @PathVariable Long jobId,
                              Principal principal) {
        return savedJobService.add(jobSeekerId, jobId, principal.getName());
    }

    @GetMapping("/api/savedJob/jobseeker/{jobSeekerId}")
    public PagedRespDto<SavedJobRespDto> getByJobSeekerId(@PathVariable Long jobSeekerId,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size,
                                                          Principal principal) {
        return savedJobService.getByJobSeekerId(jobSeekerId, page, size, principal.getName());
    }

    @DeleteMapping("/api/savedJob/{id}")
    public void deleteById(@PathVariable Long id, Principal principal) {
        savedJobService.deleteById(id, principal.getName());
    }
}