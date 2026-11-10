package com.springboot.careercrafter.service;

import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Slf4j
@RequiredArgsConstructor
public class JobDescriptionService {

    private final JobRepository jobRepository;

    @Value("${app.upload.jd-dir}")
    private String uploadDir;

    public void upload(Long jobId, MultipartFile file, String loggedInUsername) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        if (!job.getEmployer().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("This job belongs to another employer");

        if (file.isEmpty() || !"application/pdf".equals(file.getContentType()))
            throw new InvalidCallException("Only PDF files are allowed");

        try {
            Path folder = Paths.get(uploadDir);
            Files.createDirectories(folder);
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), folder.resolve(fileName));

            job.setJdFileName(file.getOriginalFilename());
            job.setJdFilePath(fileName);
            jobRepository.save(job);
        } catch (IOException e) {
            log.error("Could not save the JD file for job {}", jobId, e);
            throw new InvalidCallException("Could not save the file");
        }
    }
}
