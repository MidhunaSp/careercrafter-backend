package com.springboot.careercrafter.service;

import org.springframework.data.domain.PageImpl;
import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.JobApplicationRespDto;
import com.springboot.careercrafter.enums.ApplicationStatus;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.JobApplicationMapper;
import com.springboot.careercrafter.model.*;
import com.springboot.careercrafter.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class JobApplicationServiceTest {

    @InjectMocks
    private JobApplicationService jobApplicationService;
    @Mock
    private JobApplicationRepository jobApplicationRepository;
    @Mock
    private JobRepository jobRepository;
    @Mock
    private JobApplicationMapper jobApplicationMapper;
    @Mock
    private JobSeekerRepository jobSeekerRepository;
    @Mock
    private ResumeRepository resumeRepository;
    @Mock
    private ApplicationStatusHistoryRepository historyRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private MessageRepository messageRepository;

    // ---- Valid Test----
    @Test
    void getByApplicantIdTest() {
        JobApplicationRespDto dto1 = new JobApplicationRespDto(1L, ApplicationStatus.APPLIED, Instant.now(), Instant.now(), 1L, "Java Developer", "TCS", 1L, "john", null);
        JobApplicationRespDto dto2 = new JobApplicationRespDto(2L, ApplicationStatus.SHORTLISTED, Instant.now(), Instant.now(), 2L, "Tester", "Infosys", 1L, "john", null);

        User user = new User();
        user.setUsername("john");
        JobSeeker applicant = new JobSeeker();
        applicant.setId(1L);
        applicant.setUser(user);

        JobApplication application1 = new JobApplication();
        application1.setId(1L);
        JobApplication application2 = new JobApplication();
        application2.setId(2L);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(applicant));

        when(jobApplicationRepository.findByApplicantIdWithDetails(1L, PageRequest.of(0, 5)))
                .thenReturn(new PageImpl<>(List.of(application1, application2), PageRequest.of(0, 5), 2));

        when(jobApplicationMapper.mapEntityToDto(application1)).thenReturn(dto1);
        when(jobApplicationMapper.mapEntityToDto(application2)).thenReturn(dto2);

        PagedRespDto<JobApplicationRespDto> result = jobApplicationService.getByApplicantId(1L, 0, 5, "john");
        assertEquals(2, result.content().size()); // applicant 1 has 2 applications
        assertEquals(1, result.paginationInfo().totalPages());
        assertEquals(2L, result.paginationInfo().totalRecords());
        assertEquals(2, result.paginationInfo().numRecordsInPage());

        // verify that each mock method was called exactly once with these arguments (num of method invocations)
        verify(jobSeekerRepository, times(1)).findById(1L);
        verify(jobApplicationRepository, times(1)).findByApplicantIdWithDetails(1L, PageRequest.of(0, 5));
        verify(jobApplicationMapper, times(1)).mapEntityToDto(application1);
        verify(jobApplicationMapper, times(1)).mapEntityToDto(application2);

        // no more calls (only wantedNumberOfInvocations called) .. and this guards against unexpected extra DB calls
        verifyNoMoreInteractions(jobSeekerRepository);
        verifyNoMoreInteractions(jobApplicationRepository);
        verifyNoMoreInteractions(jobApplicationMapper);
    }

    // ---Invalid Test---
    @Test
    void getByApplicantIdTest_Invalid() {
        // findById(7) returns empty -> job seeker not found
        when(jobSeekerRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> jobApplicationService.getByApplicantId(7L, 0, 5, "john"));

        verify(jobSeekerRepository, times(1)).findById(7L);

        verify(jobApplicationRepository, times(0)).findByApplicantIdWithDetails(7L,
                PageRequest.of(0, 5));

        // no more calls
        verifyNoMoreInteractions(jobSeekerRepository);
        verifyNoMoreInteractions(jobApplicationRepository);
    }

    @Test
    void saveTest() {
        // mock
        Long jobId = 1L;
        Long applicantId = 1L;
        String loggedInUsername = "john";

        Job job = job("techcorp", true);

        User user = new User();
        user.setUsername("john");
        JobSeeker applicant = new JobSeeker();
        applicant.setId(1L);
        applicant.setUser(user);

        // resumeId is null in apply(), so the service looks for the applicant's default resume
        Resume resume = new Resume();
        resume.setId(1L);

        JobApplication savedApplication = new JobApplication();
        savedApplication.setId(10L);

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(jobSeekerRepository.findById(applicantId)).thenReturn(Optional.of(applicant));
        when(jobApplicationRepository.existsByJobIdAndApplicantId(jobId, applicantId)).thenReturn(false);
        when(resumeRepository.findDefaultResume(applicantId)).thenReturn(Optional.of(resume));

        when(jobApplicationRepository.save(any(JobApplication.class))).thenReturn(savedApplication);

        CreatedRespDto response = jobApplicationService.apply(jobId, applicantId, null, loggedInUsername);

        assertEquals(10L, response.id());
        assertEquals("Applied successfully", response.message());

        // verify if repo calls are happening only once
        verify(jobRepository, times(1)).findById(jobId);
        verify(jobSeekerRepository, times(1)).findById(applicantId);
        verify(jobApplicationRepository, times(1)).existsByJobIdAndApplicantId(jobId, applicantId);
        verify(resumeRepository, times(1)).findDefaultResume(applicantId);
        verify(jobApplicationRepository, times(1)).save(any(JobApplication.class));
        verify(historyRepository, times(1)).save(any(ApplicationStatusHistory.class));

        verifyNoMoreInteractions(resumeRepository);
    }

    private JobSeeker seeker(Long id, String username) {
        User user = new User();
        user.setUsername(username);
        JobSeeker js = new JobSeeker();
        js.setId(id);
        js.setUser(user);
        return js;
    }

    private Job job(String employerUsername, boolean active) {
        User user = new User();
        user.setUsername(employerUsername);
        Employer employer = new Employer();
        employer.setUser(user);
        Job j = new Job();
        j.setId(1L);
        j.setEmployer(employer);
        j.setActive(active);
        return j;
    }

    // ---- apply ----
    @Test
    void saveTest_JobNotFound() {
        when(jobRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> jobApplicationService.apply(1L, 1L, null, "john"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    void saveTest_ApplicantNotFound() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> jobApplicationService.apply(1L, 1L, null, "john"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    void saveTest_NotOwner() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        assertThrows(OwnershipException.class, () -> jobApplicationService.apply(1L, 1L, null, "someoneelse"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    public void saveTest_JobNotActive() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", false)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        assertThrows(InvalidCallException.class, () -> jobApplicationService.apply(1L, 1L, null, "john"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    void saveTest_AlreadyApplied() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        when(jobApplicationRepository.existsByJobIdAndApplicantId(1L, 1L)).thenReturn(true);
        assertThrows(InvalidCallException.class, () -> jobApplicationService.apply(1L, 1L, null, "john"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    void saveTest_NoDefaultResume() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        when(jobApplicationRepository.existsByJobIdAndApplicantId(1L, 1L)).thenReturn(false);
        when(resumeRepository.findDefaultResume(1L)).thenReturn(Optional.empty());
        assertThrows(InvalidCallException.class, () -> jobApplicationService.apply(1L, 1L, null, "john"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    void saveTest_ResumeNotFound() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        when(jobApplicationRepository.existsByJobIdAndApplicantId(1L, 1L)).thenReturn(false);
        when(resumeRepository.findById(5L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> jobApplicationService.apply(1L, 1L, 5L, "john"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    void saveTest_ResumeOfAnotherApplicant() {
        Resume resume = new Resume();
        resume.setJobSeeker(seeker(2L, "mary")); // belongs to job seeker 2

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        when(jobApplicationRepository.existsByJobIdAndApplicantId(1L, 1L)).thenReturn(false);
        when(resumeRepository.findById(5L)).thenReturn(Optional.of(resume));
        assertThrows(InvalidCallException.class, () -> jobApplicationService.apply(1L, 1L, 5L, "john"));
        verify(jobApplicationRepository, times(0)).save(any(JobApplication.class));
    }

    @Test
    void saveTest_WithResumeId() {
        Resume resume = new Resume();
        resume.setJobSeeker(seeker(1L, "john"));
        JobApplication saved = new JobApplication();
        saved.setId(10L);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        when(jobApplicationRepository.existsByJobIdAndApplicantId(1L, 1L)).thenReturn(false);
        when(resumeRepository.findById(5L)).thenReturn(Optional.of(resume));
        when(jobApplicationRepository.save(any(JobApplication.class))).thenReturn(saved);

        CreatedRespDto response = jobApplicationService.apply(1L, 1L, 5L, "john");

        assertEquals(10L, response.id());
        verify(resumeRepository, times(0)).findDefaultResume(1L); // default resume NOT used
        verify(historyRepository, times(1)).save(any(ApplicationStatusHistory.class));
    }

    // ---- getByApplicantId : not owner ----
    @Test
    void getByApplicantIdTest_NotOwner() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(seeker(1L, "john")));
        assertThrows(OwnershipException.class,
                () -> jobApplicationService.getByApplicantId(1L, 0, 5, "someoneelse"));
        verifyNoInteractions(jobApplicationRepository);
    }

    // ---- getByJobId ----
    @Test
    void getByJobIdTest() {
        JobApplication a1 = new JobApplication();
        JobApplication a2 = new JobApplication();
        JobApplicationRespDto dto = new JobApplicationRespDto(1L, ApplicationStatus.APPLIED, Instant.now(), Instant.now(), 1L, "Java Developer", "TCS", 1L, "john", null);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job("techcorp", true)));
        when(jobApplicationRepository.findByJobIdWithDetails(1L, null, PageRequest.of(0, 5)))
                .thenReturn(new PageImpl<>(List.of(a1, a2), PageRequest.of(0, 5), 12));
        when(jobApplicationMapper.mapEntityToDto(any(JobApplication.class))).thenReturn(dto);

        PagedRespDto<JobApplicationRespDto> result = jobApplicationService.getByJobId(1L, null, 0, 5, "techcorp");
        assertEquals(2, result.content().size());
        assertEquals(3, result.paginationInfo().totalPages()); // 12 records, 5 per page -> 3 pages
        assertEquals(12L, result.paginationInfo().totalRecords());
        assertEquals(2, result.paginationInfo().numRecordsInPage());
    }

    @Test
    void getByJobIdTest_NotFound() {
        when(jobRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> jobApplicationService.getByJobId(1L, null, 0, 5, "techcorp"));
        verifyNoInteractions(jobApplicationRepository);
    }

    // ---- getById ----
    private JobApplication applicationOf(String applicantUsername, String employerUsername) {
        JobApplication ja = new JobApplication();
        ja.setId(1L);
        ja.setApplicant(seeker(1L, applicantUsername));
        ja.setJob(job(employerUsername, true));
        return ja;
    }

    @Test
    void getByIdTest() {
        JobApplication ja = applicationOf("john", "techcorp");
        JobApplicationRespDto dto = new JobApplicationRespDto(1L, ApplicationStatus.APPLIED, Instant.now(), Instant.now(), 1L, "Java Developer", "TCS", 1L, "john", null);

        when(jobApplicationRepository.findDetailsById(1L)).thenReturn(Optional.of(ja));
        when(jobApplicationMapper.mapEntityToDto(ja)).thenReturn(dto);

        assertEquals(1L, jobApplicationService.getById(1L, "john").id());      // applicant
        assertEquals(1L, jobApplicationService.getById(1L, "techcorp").id());  // employer
    }


    // ---- withdraw ----
    @Test
     void withdrawTest() {
        JobApplication ja = applicationOf("john", "techcorp");
        when(jobApplicationRepository.findById(1L)).thenReturn(Optional.of(ja));

        jobApplicationService.withdraw(1L, "john");

        verify(historyRepository, times(1)).deleteByJobApplicationId(1L);
        verify(jobApplicationRepository, times(1)).delete(ja);
    }

}