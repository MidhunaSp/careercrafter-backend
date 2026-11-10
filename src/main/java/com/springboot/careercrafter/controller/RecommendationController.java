package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.response.RecommendedJobRespDto;
import com.springboot.careercrafter.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/api/job/recommended/{jobSeekerId}")
    public List<RecommendedJobRespDto> getRecommendedJobs(@PathVariable Long jobSeekerId,
                                                          @RequestParam(defaultValue = "10") int limit,
                                                          Principal principal) {
        return recommendationService.getRecommendedJobs(jobSeekerId, limit, principal.getName());
    }
}