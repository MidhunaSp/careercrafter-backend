package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.ApplicationStatusHistoryReqDto;
import com.springboot.careercrafter.dto.response.ApplicationStatusHistoryRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.EmployerApplicationHistoryRespDto;
import com.springboot.careercrafter.enums.ApplicationStatus;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.ApplicationStatusHistoryMapper;
import com.springboot.careercrafter.model.ApplicationStatusHistory;
import com.springboot.careercrafter.model.Employer;
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.model.JobApplication;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.ApplicationStatusHistoryRepository;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ApplicationStatusHistoryServiceTest {

    @InjectMocks
    private ApplicationStatusHistoryService historyService; // real service, mocks below are injected into it
    @Mock
    private ApplicationStatusHistoryRepository historyRepository;
    @Mock
    private JobApplicationRepository jobApplicationRepository;
    @Mock
    private ApplicationStatusHistoryMapper historyMapper;
    @Mock
    private NotificationService  notificationService;

    // ---- add : valid ----
    @Test
    public void addTest() {
        User employerUser = new User();
        employerUser.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(employerUser);
        Job job = new Job();
        job.setEmployer(employer);
        job.setTitle("Java Developer");

        User applicantUser = new User();
        applicantUser.setUsername("john");
        JobSeeker applicant = new JobSeeker();
        applicant.setUser(applicantUser);

        JobApplication application = new JobApplication();
        application.setId(1L);
        application.setJob(job);
        application.setApplicant(applicant);
        application.setStatus(ApplicationStatus.APPLIED);

        ApplicationStatusHistoryReqDto dto = new ApplicationStatusHistoryReqDto(ApplicationStatus.SHORTLISTED, "Good profile");
        ApplicationStatusHistory history = new ApplicationStatusHistory();
        ApplicationStatusHistory savedHistory = new ApplicationStatusHistory();
        savedHistory.setId(5L);

        when(jobApplicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(historyMapper.mapDtoToEntity(dto)).thenReturn(history);
        when(historyRepository.save(history)).thenReturn(savedHistory);

        CreatedRespDto response = historyService.add(1L, dto, "techcorp");

        assertEquals(5L, response.id());
        assertEquals("Status history added", response.message());

        // application status must be updated to the new status
        assertEquals(ApplicationStatus.SHORTLISTED, application.getStatus());

        verify(jobApplicationRepository, times(1)).findById(1L);
        verify(jobApplicationRepository, times(1)).save(application);
        verify(historyMapper, times(1)).mapDtoToEntity(dto);
        verify(historyRepository, times(1)).save(history);
        // the applicant must be told about the change
        verify(notificationService, times(1)).notifyUser(eq(applicantUser), anyString(), any());

        verifyNoMoreInteractions(jobApplicationRepository);
        verifyNoMoreInteractions(historyMapper);
        verifyNoMoreInteractions(historyRepository);
    }

    // ---- add : application not found ----
    @Test
    public void addTest_ApplicationNotFound() {
        ApplicationStatusHistoryReqDto dto = new ApplicationStatusHistoryReqDto(ApplicationStatus.SHORTLISTED, "Good profile");

        when(jobApplicationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> historyService.add(99L, dto, "techcorp"));

        verify(jobApplicationRepository, times(1)).findById(99L);

        verifyNoMoreInteractions(jobApplicationRepository);
        verifyNoMoreInteractions(historyRepository);
    }

    // ---- add : logged in user is not the employer of the job ----
    @Test
    public void addTest_NotEmployer() {
        User employerUser = new User();
        employerUser.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(employerUser);
        Job job = new Job();
        job.setEmployer(employer);
        JobApplication application = new JobApplication();
        application.setId(1L);
        application.setJob(job);
        application.setStatus(ApplicationStatus.APPLIED);

        ApplicationStatusHistoryReqDto dto = new ApplicationStatusHistoryReqDto(ApplicationStatus.SHORTLISTED, "Good profile");

        when(jobApplicationRepository.findById(1L)).thenReturn(Optional.of(application));

        assertThrows(OwnershipException.class,
                () -> historyService.add(1L, dto, "someoneElse"));

        // status must not change and nothing is saved
        assertEquals(ApplicationStatus.APPLIED, application.getStatus());
        verify(jobApplicationRepository, times(0)).save(application);
        verifyNoMoreInteractions(historyRepository);
    }

    // ---- add : application already in the same status ----
    @Test
    public void addTest_SameStatus() {
        User employerUser = new User();
        employerUser.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(employerUser);
        Job job = new Job();
        job.setEmployer(employer);
        JobApplication application = new JobApplication();
        application.setId(1L);
        application.setJob(job);
        application.setStatus(ApplicationStatus.APPLIED);

        ApplicationStatusHistoryReqDto dto = new ApplicationStatusHistoryReqDto(ApplicationStatus.APPLIED, "Same");

        when(jobApplicationRepository.findById(1L)).thenReturn(Optional.of(application));

        assertThrows(InvalidCallException.class,
                () -> historyService.add(1L, dto, "techcorp"));

        verify(jobApplicationRepository, times(0)).save(application);
        verifyNoMoreInteractions(historyRepository);
    }

    // ---- getTimeline : valid ----
    @Test
    public void getTimelineTest() {
        User applicantUser = new User();
        applicantUser.setUsername("john");
        JobSeeker applicant = new JobSeeker();
        applicant.setUser(applicantUser);

        User employerUser = new User();
        employerUser.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(employerUser);
        Job job = new Job();
        job.setEmployer(employer);

        JobApplication application = new JobApplication();
        application.setId(1L);
        application.setApplicant(applicant);
        application.setJob(job);

        ApplicationStatusHistory history1 = new ApplicationStatusHistory();
        history1.setId(1L);
        ApplicationStatusHistory history2 = new ApplicationStatusHistory();
        history2.setId(2L);

        ApplicationStatusHistoryRespDto dto1 = new ApplicationStatusHistoryRespDto(1L, ApplicationStatus.APPLIED, "Applied", Instant.now());
        ApplicationStatusHistoryRespDto dto2 = new ApplicationStatusHistoryRespDto(2L, ApplicationStatus.SHORTLISTED, "Good", Instant.now());

        when(jobApplicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(historyRepository.findByJobApplicationIdOrderByChangedAtAsc(1L)).thenReturn(List.of(history1, history2));
        when(historyMapper.mapEntityToDto(history1)).thenReturn(dto1);
        when(historyMapper.mapEntityToDto(history2)).thenReturn(dto2);

        assertEquals(2, historyService.getTimeline(1L, "john").size());

        verify(jobApplicationRepository, times(1)).findById(1L);
        verify(historyRepository, times(1)).findByJobApplicationIdOrderByChangedAtAsc(1L);
        verify(historyMapper, times(1)).mapEntityToDto(history1);
        verify(historyMapper, times(1)).mapEntityToDto(history2);

        verifyNoMoreInteractions(jobApplicationRepository);
        verifyNoMoreInteractions(historyRepository);
        verifyNoMoreInteractions(historyMapper);
    }

    // ---- getTimeline : application not found ----
    @Test
    public void getTimelineTest_NotFound() {
        when(jobApplicationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> historyService.getTimeline(99L, "john"));

        verify(jobApplicationRepository, times(1)).findById(99L);
        verifyNoMoreInteractions(historyRepository);
    }

    // ---- getTimeline : user is neither the applicant nor the employer ----
    @Test
    public void getTimelineTest_NotOwner() {
        User applicantUser = new User();
        applicantUser.setUsername("john");
        JobSeeker applicant = new JobSeeker();
        applicant.setUser(applicantUser);

        User employerUser = new User();
        employerUser.setUsername("techcorp");
        Employer employer = new Employer();
        employer.setUser(employerUser);
        Job job = new Job();
        job.setEmployer(employer);

        JobApplication application = new JobApplication();
        application.setId(1L);
        application.setApplicant(applicant);
        application.setJob(job);

        when(jobApplicationRepository.findById(1L)).thenReturn(Optional.of(application));

        assertThrows(OwnershipException.class,
                () -> historyService.getTimeline(1L, "someoneElse"));

        verifyNoMoreInteractions(historyRepository);
    }

    // ---- getAllEmployerHistories : valid ----
    @Test
    public void getAllEmployerHistoriesTest() {
        JobApplication application = new JobApplication();
        application.setId(1L);
        ApplicationStatusHistory history = new ApplicationStatusHistory();
        history.setId(1L);

        ApplicationStatusHistoryRespDto historyDto = new ApplicationStatusHistoryRespDto(1L, ApplicationStatus.APPLIED, "Applied", Instant.now());
        EmployerApplicationHistoryRespDto employerDto = new EmployerApplicationHistoryRespDto(1L, 1L, "Java Developer",
                1L, "John Doe", ApplicationStatus.APPLIED, Instant.now(), List.of(historyDto));

        when(jobApplicationRepository.findAllByEmployerUsername("techcorp")).thenReturn(List.of(application));
        when(historyRepository.findByJobApplicationIdOrderByChangedAtAsc(1L)).thenReturn(List.of(history));
        when(historyMapper.mapEntityToDto(history)).thenReturn(historyDto);
        when(historyMapper.mapToEmployerHistoryDto(application, List.of(historyDto))).thenReturn(employerDto);

        List<EmployerApplicationHistoryRespDto> result = historyService.getAllEmployerHistories("techcorp");

        assertEquals(1, result.size());
        assertEquals("Java Developer", result.get(0).jobTitle());

        verify(jobApplicationRepository, times(1)).findAllByEmployerUsername("techcorp");
        verify(historyRepository, times(1)).findByJobApplicationIdOrderByChangedAtAsc(1L);
    }
}