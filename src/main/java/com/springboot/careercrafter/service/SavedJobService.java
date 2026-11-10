package com.springboot.careercrafter.service;

import org.springframework.data.domain.PageRequest;
import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.SavedJobRespDto;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.model.SavedJob;
import com.springboot.careercrafter.repository.JobRepository;
import com.springboot.careercrafter.repository.JobSeekerRepository;
import com.springboot.careercrafter.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobSeekerRepository jobSeekerRepository;
    private final JobRepository jobRepository;

    public CreatedRespDto add(Long jobSeekerId, Long jobId, String loggedInUsername) {

        // step 1: fetch job seeker and job from db
        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("Job seeker id invalid & Job seeker not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job id invalid & Job not found"));

        // step 2: check that the logged-in user is this jobseeker
        if (!jobSeeker.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can save jobs only to your own account");

        // step 3: the same job cannot be saved twice by the same jobseeker
        if (savedJobRepository.existsByJobSeekerIdAndJobId(jobSeekerId, jobId))
            throw new InvalidCallException("Job already saved");

        // step 4: attach both to savedjob and save
        SavedJob savedJob = new SavedJob();
        savedJob.setJobSeeker(jobSeeker);
        savedJob.setJob(job);

        savedJob = savedJobRepository.save(savedJob);

        log.info("Job saved: jobSeekerId={}, jobId={}", jobSeekerId, jobId);

        return new CreatedRespDto(savedJob.getId(), "Job saved");
    }

    public PagedRespDto<SavedJobRespDto> getByJobSeekerId(Long jobSeekerId, int page, int size, String loggedInUsername) {
        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("Job seeker not found"));

        // only the owner can see his saved jobs
        if (!jobSeeker.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("These saved jobs belong to another job seeker");

        return PagedRespDto.of(savedJobRepository.getByJobSeekerId(jobSeekerId, PageRequest.of(page, size)));
    }

    public void deleteById(Long id, String loggedInUsername) {
        SavedJob savedJob = savedJobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Saved job not found"));

        // only the owner can remove a saved job
        if (!savedJob.getJobSeeker().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("This saved job belongs to another job seeker");

        savedJobRepository.delete(savedJob);
        log.info("Saved job removed: id={} by {}", id, loggedInUsername);
    }
}