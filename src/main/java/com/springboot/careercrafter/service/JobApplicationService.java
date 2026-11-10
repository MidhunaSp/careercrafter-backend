package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.JobApplicationRespDto;
import com.springboot.careercrafter.enums.ApplicationStatus;
import com.springboot.careercrafter.enums.NotificationType;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.JobApplicationMapper;
import com.springboot.careercrafter.model.ApplicationStatusHistory;
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.model.JobApplication;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.model.Resume;
import com.springboot.careercrafter.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final JobRepository jobRepository;
    private final JobApplicationMapper jobApplicationMapper;
    private final JobSeekerRepository jobSeekerRepository;
    private final ResumeRepository resumeRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final NotificationService notificationService;
    private final MessageRepository messageRepository;

    @Transactional
    public CreatedRespDto apply(Long jobId, Long applicantId, Long resumeId, String loggedInUsername) {
        // step 1: fetch job and applicant
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job id invalid & Job not found"));
        JobSeeker applicant = jobSeekerRepository.findById(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("Job seeker id invalid & Job seeker not found"));

        // step 2: check that the logged-in user is this applicant
        if (!applicant.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can apply only with your own job seeker account");

        // step 3: validations
        if (!job.isActive())
            throw new InvalidCallException("Job is no longer active");
        if (jobApplicationRepository.existsByJobIdAndApplicantId(jobId, applicantId))
            throw new InvalidCallException("Already applied to this job");

        // step 4: if resumeId is given it must belong to the applicant,
        // else use the default resume of the applicant
        Resume resume;
        if (resumeId != null) {
            resume = resumeRepository.findById(resumeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Resume id invalid & Resume not found"));
            if (!resume.getJobSeeker().getId().equals(applicantId))
                throw new InvalidCallException("Resume does not belong to this applicant");
        } else {
            resume = resumeRepository.findDefaultResume(applicantId)
                    .orElseThrow(() -> new InvalidCallException("Upload a resume before applying"));
        }

        // step 5: build application with status APPLIED and save
        JobApplication application = new JobApplication();
        application.setJob(job);
        application.setApplicant(applicant);
        application.setResume(resume);
        application.setStatus(ApplicationStatus.APPLIED);
        application = jobApplicationRepository.save(application);

        // step 6: first row in the status timeline
        ApplicationStatusHistory history = new ApplicationStatusHistory();
        history.setJobApplication(application);
        history.setStatus(ApplicationStatus.APPLIED);
        history.setNote("Application submitted");
        historyRepository.save(history);

        log.info("Job application submitted: applicationId={}, jobId={}, applicantId={}",
                application.getId(), jobId, applicantId);

        // step 7: tell the employer that a new application has come
        notificationService.notifyUser(job.getEmployer().getUser(),
                applicant.getFullName() + " applied for " + job.getTitle(),
                NotificationType.NEW_APPLICATION_RECEIVED);

        return new CreatedRespDto(application.getId(), "Applied successfully");
    }

    public PagedRespDto<JobApplicationRespDto> getByApplicantId(Long applicantId, int page, int size, String loggedInUsername) {
        JobSeeker applicant = jobSeekerRepository.findById(applicantId)
                .orElseThrow(() -> new ResourceNotFoundException("Job seeker not found"));

        // only the applicant can see his own applications
        if (!applicant.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("These applications belong to another job seeker");

        return PagedRespDto.of(jobApplicationRepository
                .findByApplicantIdWithDetails(applicantId, PageRequest.of(page, size))
                .map(jobApplicationMapper::mapEntityToDto));
    }

    public PagedRespDto<JobApplicationRespDto> getByJobId(Long jobId, ApplicationStatus status, int page, int size,
                                                          String loggedInUsername) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        // only the employer who posted the job can see its applicants
        if (!job.getEmployer().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("This job belongs to another employer");

        return PagedRespDto.of(jobApplicationRepository
                .findByJobIdWithDetails(jobId, status, PageRequest.of(page, size))
                .map(jobApplicationMapper::mapEntityToDto));
    }

    public JobApplicationRespDto getById(Long id, String loggedInUsername) {
        JobApplication ja = jobApplicationRepository.findDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found"));

        // only the applicant and the employer of the job can see an application
        String applicantUsername = ja.getApplicant().getUser().getUsername();
        String employerUsername = ja.getJob().getEmployer().getUser().getUsername();
        if (!loggedInUsername.equals(applicantUsername) && !loggedInUsername.equals(employerUsername))
            throw new OwnershipException("This application does not belong to you");

        return jobApplicationMapper.mapEntityToDto(ja);
    }

    @Transactional
    public void withdraw(Long id, String loggedInUsername) {
        JobApplication application = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found"));

        // only the applicant can withdraw his application
        if (!application.getApplicant().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can withdraw only your own applications");

        // read what the notification needs before the application is deleted
        String applicantName = application.getApplicant().getFullName();
        String jobTitle = application.getJob().getTitle();
        var employerUser = application.getJob().getEmployer().getUser();

        messageRepository.detachFromApplication(id);
        historyRepository.deleteByJobApplicationId(id);
        jobApplicationRepository.delete(application);
        log.info("Job application withdrawn: id={} by {}", id, loggedInUsername);

        // tell the employer that the applicant has withdrawn
        notificationService.notifyUser(employerUser,
                applicantName + " withdrew their application for " + jobTitle,
                NotificationType.APPLICATION_STATUS_CHANGE);
    }
}