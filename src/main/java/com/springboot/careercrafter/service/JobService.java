package com.springboot.careercrafter.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.request.JobReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.JobRespDto;
import com.springboot.careercrafter.enums.EmploymentType;
import com.springboot.careercrafter.enums.VerificationStatus;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.JobMapper;
import com.springboot.careercrafter.model.Employer;
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.repository.EmployerRepository;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import com.springboot.careercrafter.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import com.springboot.careercrafter.repository.SavedJobRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final EmployerRepository employerRepository;
    private final SavedJobRepository savedJobRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobMatchService jobMatchService;

    private static final String EMPLOYER_NOT_FOUND = "Employer not found";
    private static final String JOB_NOT_FOUND = "Job not found";

    public CreatedRespDto add(Long employerId, JobReqDto dto, String loggedInUsername) {
        // step 1: fetch employer from db using employerid
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer id invalid & Employer not found"));

        // step 2: check that the logged-in user owns this employer account
        if (!employer.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can post jobs only for your own employer account");

        // step 3: only verified employers are allowed to post jobs
        if (employer.getVerificationStatus() != VerificationStatus.VERIFIED)
            throw new InvalidCallException("Employer is not verified yet");

        // step 4: validate that minsalary is not greater than maxsalary
        checkSalaryRange(dto);

        // step 5: map jobreqdto to job entity
        Job job = JobMapper.mapDtoToEntity(dto);

        // step 6: attach the employer to job and mark the job as active
        job.setEmployer(employer);
        job.setActive(true);

        // step 7: save job and return id with message
        job = jobRepository.save(job);
        log.info("Job posted: id={}, employerId={}, title={}", job.getId(), employerId, job.getTitle());
        jobMatchService.notifyMatchingSeekers(job);
        return new CreatedRespDto(job.getId(), "Job posted");
    }

    public List<JobRespDto> getActiveJobs(int page, int size) {
        return jobRepository.getActiveJobs(PageRequest.of(page, size));
    }

    public JobRespDto getById(Long id) {
        // step 1: fetch job details from db using id, throw exception if not found
        return jobRepository.getJobDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(JOB_NOT_FOUND));
    }

    public PagedRespDto<JobRespDto> filter(String location, String industry, EmploymentType employmentType,
                                           Double minSalary, String keyword, int page, int size) {
        // step 1: create pageable with page number and size
        Pageable pageable = PageRequest.of(page, size);

        // step 2: run the custom filter query (all filters are optional, blank text = no filter)
        Page<JobRespDto> jobPage = jobRepository.filterJobs(
                blankToNull(location), blankToNull(industry), employmentType, minSalary,
                blankToNull(keyword), pageable);

        // step 3: return the jobs of this page with the pagination info
        return PagedRespDto.of(jobPage);
    }

    private String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    public PagedRespDto<JobRespDto> getByEmployerId(Long employerId, int page, int size) {
        // step 1: check that the employer exists, throw exception if not
        if (!employerRepository.existsById(employerId))
            throw new ResourceNotFoundException(EMPLOYER_NOT_FOUND);

        // step 2: fetch the jobs posted by this employer (paginated) and return
        return PagedRespDto.of(jobRepository.getJobsByEmployerId(employerId, PageRequest.of(page, size)));
    }

    public void update(Long id, JobReqDto dto, String loggedInUsername) {
        // step 1: fetch job from db using id, throw exception if not found
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(JOB_NOT_FOUND));

        // step 2: check that the logged-in user is the owner of this job
        checkOwner(job, loggedInUsername);

        // step 3: validate that minsalary is not greater than maxsalary
        checkSalaryRange(dto);

        // step 4: copy the new values from dto into the existing job entity
        JobMapper.updateEntity(job, dto);

        // step 5: save the updated job
        jobRepository.save(job);
    }

    public void close(Long id, String loggedInUsername) {
        // step 1: fetch job from db using id, throw exception if not found
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(JOB_NOT_FOUND));

        // step 2: check that the logged-in user is the owner of this job
        checkOwner(job, loggedInUsername);

        // step 3: mark the job as inactive (closed) instead of deleting it
        job.setActive(false);

        // step 4: save the job
        jobRepository.save(job);
        log.info("Job closed: id={} by {}", id, loggedInUsername);
    }

    private void checkOwner(Job job, String loggedInUsername) {
        // step 1: compare the job's employer username with the logged-in username
        // step 2: throw exception if they don't match
        if (!job.getEmployer().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("This job belongs to another employer");
    }

    private void checkSalaryRange(JobReqDto dto) {
        if (dto.minSalary() != null && dto.maxSalary() != null && dto.minSalary() > dto.maxSalary())
            throw new InvalidCallException("Min salary cannot be greater than max salary");
    }

    @Transactional
    public void deleteById(Long id, String loggedInUsername) {
        // step 1: fetch job from db using id, throw exception if not found
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(JOB_NOT_FOUND));

        // step 2: check that the logged-in user is the owner of this job
        checkOwner(job, loggedInUsername);

        // step 3: a job that already has applications cannot be deleted
        if (jobApplicationRepository.existsByJobId(id))
            throw new InvalidCallException("This job has applications, so it cannot be deleted. Close the job instead.");

        // step 4: remove the saved-job rows of this job first (foreign key)
        savedJobRepository.deleteByJobId(id);

        // step 5: delete the job from db
        jobRepository.delete(job);
        log.info("Job deleted: id={} by {}", id, loggedInUsername);
    }

    public void reopen(Long id, String loggedInUsername) {
        // step 1: fetch job from db using id, throw exception if not found
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(JOB_NOT_FOUND));

        // step 2: check that the logged-in user is the owner of this job
        checkOwner(job, loggedInUsername);

        // step 3: mark the job as active again
        job.setActive(true);

        // step 4: save the job
        jobRepository.save(job);
        log.info("Job reopened: id={} by {}", id, loggedInUsername);
    }

}