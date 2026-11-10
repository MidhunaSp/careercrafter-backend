package com.springboot.careercrafter.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.SavedJobRespDto;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.model.SavedJob;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.JobRepository;
import com.springboot.careercrafter.repository.JobSeekerRepository;
import com.springboot.careercrafter.repository.SavedJobRepository;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedJobServiceTest {

    @InjectMocks
    private SavedJobService savedJobService;
    @Mock
    private SavedJobRepository savedJobRepository;
    @Mock
    private JobSeekerRepository jobSeekerRepository;
    @Mock
    private JobRepository jobRepository;

    private JobSeeker jobSeeker(String username) {
        User user = new User();
        user.setUsername(username);
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        js.setUser(user);
        return js;
    }

    // ---- add ----
    @Test
    void addTest() {
        SavedJob saved = new SavedJob();
        saved.setId(10L);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker("john")));
        when(jobRepository.findById(2L)).thenReturn(Optional.of(new Job()));
        when(savedJobRepository.existsByJobSeekerIdAndJobId(1L, 2L)).thenReturn(false);
        when(savedJobRepository.save(any(SavedJob.class))).thenReturn(saved);

        CreatedRespDto response = savedJobService.add(1L, 2L, "john");

        assertEquals(10L, response.id());
        assertEquals("Job saved", response.message());
        verify(savedJobRepository, times(1)).save(any(SavedJob.class));
    }

    @Test
    void addTest_JobSeekerNotFound() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> savedJobService.add(1L, 2L, "john"));
        verify(savedJobRepository, times(0)).save(any(SavedJob.class));
    }

    @Test
    void addTest_JobNotFound() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker("john")));
        when(jobRepository.findById(2L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> savedJobService.add(1L, 2L, "john"));
        verify(savedJobRepository, times(0)).save(any(SavedJob.class));
    }

    @Test
    void addTest_NotOwner() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker("john")));
        when(jobRepository.findById(2L)).thenReturn(Optional.of(new Job()));
        assertThrows(OwnershipException.class, () -> savedJobService.add(1L, 2L, "someoneelse"));
        verify(savedJobRepository, times(0)).save(any(SavedJob.class));
    }

    @Test
    void addTest_AlreadySaved() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker("john")));
        when(jobRepository.findById(2L)).thenReturn(Optional.of(new Job()));
        when(savedJobRepository.existsByJobSeekerIdAndJobId(1L, 2L)).thenReturn(true);
        assertThrows(InvalidCallException.class, () -> savedJobService.add(1L, 2L, "john"));
        verify(savedJobRepository, times(0)).save(any(SavedJob.class));
    }

    // ---- getByJobSeekerId ----
    @Test
    void getByJobSeekerIdTest() {
        SavedJobRespDto dto = new SavedJobRespDto(1L, Instant.now(), 2L, "Java Developer", "TCS", "Chennai");
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker("john")));
        when(savedJobRepository.getByJobSeekerId(1L, PageRequest.of(0, 5)))
                .thenReturn(new PageImpl<>(List.of(dto), PageRequest.of(0, 5), 1));

        PagedRespDto<SavedJobRespDto> result = savedJobService.getByJobSeekerId(1L, 0, 5, "john");
        assertEquals(1, result.content().size());
        assertEquals(1, result.paginationInfo().totalPages());
        assertEquals(1L, result.paginationInfo().totalRecords());
        verify(savedJobRepository, times(1)).getByJobSeekerId(1L, PageRequest.of(0, 5));
    }

    @Test
    void getByJobSeekerIdTest_NotFound() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> savedJobService.getByJobSeekerId(1L, 0, 5, "john"));
        verifyNoInteractions(savedJobRepository);
    }

    @Test
    void getByJobSeekerIdTest_NotOwner() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker("john")));
        assertThrows(OwnershipException.class, () -> savedJobService.getByJobSeekerId(1L, 0, 5, "someoneelse"));
        verifyNoInteractions(savedJobRepository);
    }

    // ---- deleteById ----
    @Test
    void deleteByIdTest() {
        SavedJob savedJob = new SavedJob();
        savedJob.setJobSeeker(jobSeeker("john"));
        when(savedJobRepository.findById(1L)).thenReturn(Optional.of(savedJob));

        savedJobService.deleteById(1L, "john");

        verify(savedJobRepository, times(1)).delete(savedJob);
    }

    @Test
    void deleteByIdTest_NotOwner() {
        SavedJob savedJob = new SavedJob();
        savedJob.setJobSeeker(jobSeeker("john"));
        when(savedJobRepository.findById(1L)).thenReturn(Optional.of(savedJob));
        assertThrows(OwnershipException.class, () -> savedJobService.deleteById(1L, "someoneelse"));
        verify(savedJobRepository, times(0)).delete(any(SavedJob.class));
    }
}