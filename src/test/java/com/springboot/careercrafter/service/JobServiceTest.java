package com.springboot.careercrafter.service;

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
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.EmployerRepository;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import com.springboot.careercrafter.repository.JobRepository;
import com.springboot.careercrafter.repository.SavedJobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @InjectMocks
    private JobService jobService; // real service, mocks below are injected into it
    @Mock
    private JobRepository jobRepository;
    @Mock
    private EmployerRepository employerRepository;
    @Mock
    private JobMapper jobMapper;
    @Mock
    private SavedJobRepository savedJobRepository;
    @Mock
    private JobApplicationRepository jobApplicationRepository;

    // ---- add : valid ----
    @Test
    void addTest() {
        User user = new User();
        user.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setId(1L);
        employer.setUser(user);
        employer.setVerificationStatus(VerificationStatus.VERIFIED);

        JobReqDto dto = new JobReqDto("Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 30000.0, 60000.0, "Apply by email");

        Job savedJob = new Job();
        savedJob.setId(10L);

        when(employerRepository.findById(1L)).thenReturn(Optional.of(employer));
        when(jobRepository.save(any(Job.class))).thenReturn(savedJob);

        CreatedRespDto response = jobService.add(1L, dto, "techcorp");

        assertEquals(10L, response.id());
        assertEquals("Job posted", response.message());

        verify(employerRepository, times(1)).findById(1L);
        verify(jobRepository, times(1)).save(any(Job.class));
    }

    // ---- add : employer not found ----
    @Test
    void addTest_EmployerNotFound() {
        JobReqDto dto = new JobReqDto("Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 30000.0, 60000.0, "Apply by email");

        when(employerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobService.add(99L, dto, "techcorp"));

        verify(employerRepository, times(1)).findById(99L);
        verify(jobRepository, times(0)).save(any(Job.class));
    }

    // ---- add : employer not verified ----
    @Test
    void addTest_EmployerNotVerified() {
        User user = new User();
        user.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setId(1L);
        employer.setUser(user);
        employer.setVerificationStatus(VerificationStatus.PENDING);

        JobReqDto dto = new JobReqDto("Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 30000.0, 60000.0, "Apply by email");

        when(employerRepository.findById(1L)).thenReturn(Optional.of(employer));

        assertThrows(InvalidCallException.class, () -> jobService.add(1L, dto, "techcorp"));

        verify(jobRepository, times(0)).save(any(Job.class));
    }

    // ---- add : logged in user is not the employer owner ----
    @Test
    void addTest_WrongOwner() {
        User user = new User();
        user.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setId(1L);
        employer.setUser(user);
        employer.setVerificationStatus(VerificationStatus.VERIFIED);

        JobReqDto dto = new JobReqDto("Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 30000.0, 60000.0, "Apply by email");

        when(employerRepository.findById(1L)).thenReturn(Optional.of(employer));

        assertThrows(OwnershipException.class, () -> jobService.add(1L, dto, "someoneelse"));

        verify(jobRepository, times(0)).save(any(Job.class));
    }

    // ---- add : min salary greater than max salary ----
    @Test
    void addTest_InvalidSalary() {
        User user = new User();
        user.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setId(1L);
        employer.setUser(user);
        employer.setVerificationStatus(VerificationStatus.VERIFIED);

        JobReqDto dto = new JobReqDto("Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 90000.0, 20000.0, "Apply by email");

        when(employerRepository.findById(1L)).thenReturn(Optional.of(employer));

        assertThrows(InvalidCallException.class, () -> jobService.add(1L, dto, "techcorp"));

        verify(jobRepository, times(0)).save(any(Job.class));
    }

    // ---- getById : valid ----
    @Test
    void getByIdTest() {
        JobRespDto jobRespDto = new JobRespDto(1L, "Java Developer", "Build REST APIs", "BE", "Chennai",
                "IT", EmploymentType.FULL_TIME, 30000.0, 60000.0, "Apply by email", true,
                LocalDateTime.now(), 1L, "TechCorp");

        when(jobRepository.getJobDetailsById(1L)).thenReturn(Optional.of(jobRespDto));

        JobRespDto result = jobService.getById(1L);

        assertEquals(1L, result.id());
        assertEquals("Java Developer", result.title());

        verify(jobRepository, times(1)).getJobDetailsById(1L);
    }

    // ---- getById : invalid ----
    @Test
    void getByIdTest_Invalid() {
        when(jobRepository.getJobDetailsById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobService.getById(99L));

        verify(jobRepository, times(1)).getJobDetailsById(99L);
    }

    // ---- getByEmployerId : employer not found ----
    @Test
    void getByEmployerIdTest_Invalid() {
        when(employerRepository.existsById(99L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> jobService.getByEmployerId(99L, 0, 5));

        verify(employerRepository, times(1)).existsById(99L);
    }

    // ---- close : valid ----
    @Test
    void closeTest() {
        User user = new User();
        user.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(user);
        Job job = new Job();
        job.setId(5L);
        job.setActive(true);
        job.setEmployer(employer);

        when(jobRepository.findById(5L)).thenReturn(Optional.of(job));

        jobService.close(5L, "techcorp");

        // job must be inactive now
        assertFalse(job.isActive());

        verify(jobRepository, times(1)).findById(5L);
        verify(jobRepository, times(1)).save(job);
    }

    // ---- close : wrong owner ----
    @Test
    void closeTest_WrongOwner() {
        User user = new User();
        user.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(user);
        Job job = new Job();
        job.setId(5L);
        job.setActive(true);
        job.setEmployer(employer);

        when(jobRepository.findById(5L)).thenReturn(Optional.of(job));

        assertThrows(OwnershipException.class, () -> jobService.close(5L, "someoneelse"));

        verify(jobRepository, times(0)).save(any(Job.class));
    }

    // ---- deleteById : valid ----
    @Test
    void deleteByIdTest() {
        User user = new User();
        user.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(user);
        Job job = new Job();
        job.setId(5L);
        job.setEmployer(employer);

        when(jobRepository.findById(5L)).thenReturn(Optional.of(job));

        jobService.deleteById(5L, "techcorp");

        verify(jobRepository, times(1)).findById(5L);
        verify(jobRepository, times(1)).delete(job);
    }

    // ---- deleteById : job not found ----
    @Test
    void deleteByIdTest_Invalid() {
        when(jobRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobService.deleteById(99L, "techcorp"));

        verify(jobRepository, times(0)).delete(any(Job.class));
    }

    // ---- getActiveJobs ----
    @Test
    void getActiveJobsTest() {
        JobRespDto dto = new JobRespDto(1L, "Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 30000.0, 60000.0, "Apply by email", true, null, 1L, "TCS");
        when(jobRepository.getActiveJobs(PageRequest.of(0, 5))).thenReturn(List.of(dto));

        assertEquals(1, jobService.getActiveJobs(0, 5).size());
        verify(jobRepository, times(1)).getActiveJobs(PageRequest.of(0, 5));
    }

    // ---- getByEmployerId : valid, returns one page + pagination info ----
    @Test
    void getByEmployerIdTest() {
        JobRespDto dto = new JobRespDto(1L, "Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 30000.0, 60000.0, null, true, LocalDateTime.now(), 1L, "TCS");

        when(employerRepository.existsById(1L)).thenReturn(true);
        when(jobRepository.getJobsByEmployerId(1L, PageRequest.of(1, 5)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(dto), PageRequest.of(1, 5), 6));

        com.springboot.careercrafter.dto.response.PagedRespDto<JobRespDto> result = jobService.getByEmployerId(1L, 1, 5);

        assertEquals(1, result.content().size());
        assertEquals(2, result.paginationInfo().totalPages()); // 6 jobs, 5 per page
        assertEquals(6L, result.paginationInfo().totalRecords());
        assertEquals(1, result.paginationInfo().numRecordsInPage());
        verify(jobRepository, times(1)).getJobsByEmployerId(1L, PageRequest.of(1, 5));
    }

    // ---- filter : blank text is treated as "no filter" ----
    @Test
    void filterTest() {
        JobRespDto dto = new JobRespDto(1L, "Java Developer", "Build REST APIs", "BE", "Chennai", "IT",
                EmploymentType.FULL_TIME, 30000.0, 60000.0, null, true, LocalDateTime.now(), 1L, "TCS");

        when(jobRepository.filterJobs(null, "IT", null, null, "java", PageRequest.of(0, 5)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(dto), PageRequest.of(0, 5), 7));

        com.springboot.careercrafter.dto.response.PagedRespDto<JobRespDto> result =
                jobService.filter("   ", " IT ", null, null, " java ", 0, 5);

        assertEquals(1, result.content().size());
        assertEquals(2, result.paginationInfo().totalPages());
        assertEquals(7L, result.paginationInfo().totalRecords());
        verify(jobRepository, times(1)).filterJobs(null, "IT", null, null, "java", PageRequest.of(0, 5));
    }
}
