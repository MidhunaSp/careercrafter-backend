package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class JobDescriptionController {

    private final JobDescriptionService jobDescriptionService;

    @PostMapping("/api/job/{id}/jd")
    public void upload(@PathVariable Long id,
                       @RequestParam("file") MultipartFile file,
                       Principal principal) {
        jobDescriptionService.upload(id, file, principal.getName());
    }
}