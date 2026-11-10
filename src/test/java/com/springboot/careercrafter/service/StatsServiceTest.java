package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.response.ApplicationStatusStatDto;
import com.springboot.careercrafter.dto.response.EmployerJobCountDto;
import com.springboot.careercrafter.dto.response.IndustryCountDto;
import com.springboot.careercrafter.dto.response.JobApplicantCountDto;
import com.springboot.careercrafter.enums.ApplicationStatus;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import com.springboot.careercrafter.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @InjectMocks
    private StatsService statsService; // real service, mocks below are injected into it
    @Mock
    private JobRepository jobRepository;
    @Mock
    private JobApplicationRepository jobApplicationRepository;

    @Test
    void getApplicantCountPerJobTest() {
        JobApplicantCountDto dto1 = new JobApplicantCountDto("Java Developer", 5L);
        JobApplicantCountDto dto2 = new JobApplicantCountDto("Tester", 3L);

        when(jobRepository.getApplicantCountPerJob()).thenReturn(List.of(dto1, dto2));

        List<JobApplicantCountDto> result = statsService.getApplicantCountPerJob();

        assertEquals(2, result.size());
        assertEquals("Java Developer", result.get(0).jobTitle());
        assertEquals(5L, result.get(0).applicants());

        verify(jobRepository, times(1)).getApplicantCountPerJob();
        verifyNoMoreInteractions(jobRepository);
    }

    @Test
    void getJobCountPerEmployerTest() {
        EmployerJobCountDto dto1 = new EmployerJobCountDto("TechCorp", 4L);
        EmployerJobCountDto dto2 = new EmployerJobCountDto("Infosys", 2L);

        when(jobRepository.getJobCountPerEmployer()).thenReturn(List.of(dto1, dto2));

        List<EmployerJobCountDto> result = statsService.getJobCountPerEmployer();

        assertEquals(2, result.size());
        assertEquals("TechCorp", result.get(0).companyName());
        assertEquals(4L, result.get(0).jobs());

        verify(jobRepository, times(1)).getJobCountPerEmployer();
        verifyNoMoreInteractions(jobRepository);
    }

    @Test
    void getJobCountByIndustryTest() {
        IndustryCountDto dto1 = new IndustryCountDto("IT", 10L);
        IndustryCountDto dto2 = new IndustryCountDto("Banking", 3L);

        when(jobRepository.getJobCountByIndustry()).thenReturn(List.of(dto1, dto2));

        List<IndustryCountDto> result = statsService.getJobCountByIndustry();

        assertEquals(2, result.size());
        assertEquals("IT", result.get(0).industry());
        assertEquals(10L, result.get(0).jobs());

        verify(jobRepository, times(1)).getJobCountByIndustry();
        verifyNoMoreInteractions(jobRepository);
    }

    @Test
    void getApplicationStatusStatTest() {
        ApplicationStatusStatDto dto1 = new ApplicationStatusStatDto(ApplicationStatus.APPLIED, 6L);
        ApplicationStatusStatDto dto2 = new ApplicationStatusStatDto(ApplicationStatus.HIRED, 1L);

        when(jobApplicationRepository.getApplicationStatusStat()).thenReturn(List.of(dto1, dto2));

        List<ApplicationStatusStatDto> result = statsService.getApplicationStatusStat();

        assertEquals(2, result.size());
        assertEquals(ApplicationStatus.APPLIED, result.get(0).status());
        assertEquals(6L, result.get(0).count());

        verify(jobApplicationRepository, times(1)).getApplicationStatusStat();
        verifyNoMoreInteractions(jobApplicationRepository);
    }

    // ---- no data in db -> empty list ----
    @Test
    void getJobCountByIndustryTest_NoData() {
        when(jobRepository.getJobCountByIndustry()).thenReturn(List.of());

        assertEquals(0, statsService.getJobCountByIndustry().size());

        verify(jobRepository, times(1)).getJobCountByIndustry();
    }
}