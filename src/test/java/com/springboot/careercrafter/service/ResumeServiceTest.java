package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.ResumeReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.ResumeMapper;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.model.Resume;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import com.springboot.careercrafter.repository.JobSeekerRepository;
import com.springboot.careercrafter.repository.ResumeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeServiceTest {

    @InjectMocks
    private ResumeService resumeService; // real service, mocks below are injected into it
    @Mock
    private ResumeRepository resumeRepository;
    @Mock
    private JobSeekerRepository jobSeekerRepository;
    @Mock
    private ResumeMapper resumeMapper;
    @Mock
    private JobApplicationRepository jobApplicationRepository;

    // ---- add : first resume always becomes the default ----
    @Test
    void addTest_FirstResumeBecomesDefault() {
        User user = new User();
        user.setUsername("john");
        JobSeeker jobSeeker = new JobSeeker();
        jobSeeker.setId(1L);
        jobSeeker.setUser(user);

        ResumeReqDto dto = new ResumeReqDto("cv.pdf", "/files/cv.pdf", "Java CV", false);

        List<Resume> existing = List.of();
        Resume resume = new Resume();
        Resume savedResume = new Resume();
        savedResume.setId(5L);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker));
        when(resumeRepository.findByJobSeekerIdOrderByUploadedAtDesc(1L)).thenReturn(existing);
        when(resumeMapper.mapDtoToEntity(dto)).thenReturn(resume);
        when(resumeRepository.save(resume)).thenReturn(savedResume);

        CreatedRespDto response = resumeService.add(1L, dto, "john");

        assertEquals(5L, response.id());
        assertEquals("Resume added", response.message());

        // dto said isDefault=false, but it is the first resume so it must be the default
        assertTrue(resume.isDefault());

        verify(jobSeekerRepository, times(1)).findById(1L);
        verify(resumeRepository, times(1)).findByJobSeekerIdOrderByUploadedAtDesc(1L);
        verify(resumeMapper, times(1)).mapDtoToEntity(dto);
        verify(resumeRepository, times(1)).save(resume);
        // nothing to un-default
        verify(resumeRepository, times(0)).saveAll(existing);

        verifyNoMoreInteractions(resumeRepository);
        verifyNoMoreInteractions(resumeMapper);
    }

    // ---- add : new resume marked default -> old default is turned off ----
    @Test
    void addTest_NewDefaultReplacesOldDefault() {
        User user = new User();
        user.setUsername("john");
        JobSeeker jobSeeker = new JobSeeker();
        jobSeeker.setId(1L);
        jobSeeker.setUser(user);

        ResumeReqDto dto = new ResumeReqDto("cv2.pdf", "/files/cv2.pdf", "Python CV", true);

        Resume oldResume = new Resume();
        oldResume.setId(1L);
        oldResume.setDefault(true);
        List<Resume> existing = List.of(oldResume);

        Resume resume = new Resume();
        Resume savedResume = new Resume();
        savedResume.setId(2L);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker));
        when(resumeRepository.findByJobSeekerIdOrderByUploadedAtDesc(1L)).thenReturn(existing);
        when(resumeMapper.mapDtoToEntity(dto)).thenReturn(resume);
        when(resumeRepository.save(resume)).thenReturn(savedResume);

        CreatedRespDto response = resumeService.add(1L, dto, "john");

        assertEquals(2L, response.id());

        // old default is turned off, new one is the default
        assertFalse(oldResume.isDefault());
        assertTrue(resume.isDefault());

        verify(resumeRepository, times(1)).saveAll(existing);
        verify(resumeRepository, times(1)).save(resume);
    }

    // ---- add : Invalid Test (not the owner) ----
    @Test
    void addTest_NotOwner() {
        User user = new User();
        user.setUsername("john");
        JobSeeker jobSeeker = new JobSeeker();
        jobSeeker.setId(1L);
        jobSeeker.setUser(user);

        ResumeReqDto dto = new ResumeReqDto("cv.pdf", "/files/cv.pdf", "Java CV", false);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(jobSeeker));

        assertThrows(OwnershipException.class,
                () -> resumeService.add(1L, dto, "someoneElse"));

        verify(jobSeekerRepository, times(1)).findById(1L);
        verify(resumeRepository, times(0)).save(any(Resume.class));

        verifyNoMoreInteractions(resumeRepository);
        verifyNoMoreInteractions(resumeMapper);
    }

    // ---- deleteById : default resume deleted -> next resume becomes the default ----
    @Test
    void deleteByIdTest_DefaultResume_NextOneBecomesDefault() {
        User user = new User();
        user.setUsername("john");
        JobSeeker jobSeeker = new JobSeeker();
        jobSeeker.setId(1L);
        jobSeeker.setUser(user);

        Resume resume1 = new Resume();
        resume1.setId(1L);
        resume1.setJobSeeker(jobSeeker);
        resume1.setDefault(true);

        Resume resume3 = new Resume();
        resume3.setId(3L);
        resume3.setJobSeeker(jobSeeker);
        resume3.setDefault(false);

        // existsByResumeId is not stubbed -> the mock returns false (resume not used in an application)
        when(resumeRepository.findById(1L)).thenReturn(Optional.of(resume1));
        when(resumeRepository.findByJobSeekerIdOrderByUploadedAtDesc(1L)).thenReturn(List.of(resume3));

        resumeService.deleteById(1L, "john");

        assertTrue(resume3.isDefault());

        verify(jobApplicationRepository, times(1)).existsByResumeId(1L);
        verify(resumeRepository, times(1)).findById(1L);
        verify(resumeRepository, times(1)).delete(resume1);
        verify(resumeRepository, times(1)).flush();
        verify(resumeRepository, times(1)).findByJobSeekerIdOrderByUploadedAtDesc(1L);
        verify(resumeRepository, times(1)).save(resume3);

        verifyNoMoreInteractions(resumeRepository);
    }

    // ---- deleteById : Invalid Test (resume is used in a job application) ----
    @Test
    void deleteByIdTest_UsedInApplication() {
        when(jobApplicationRepository.existsByResumeId(1L)).thenReturn(true);

        assertThrows(InvalidCallException.class,
                () -> resumeService.deleteById(1L, "john"));

        verify(jobApplicationRepository, times(1)).existsByResumeId(1L);
        verifyNoInteractions(resumeRepository);
    }

    // ---- deleteById : Invalid Test (not found) ----
    @Test
    void deleteByIdTest_NotFound() {
        when(resumeRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> resumeService.deleteById(9L, "john"));

        verify(resumeRepository, times(1)).findById(9L);
        verify(resumeRepository, times(0)).delete(any(Resume.class));

        verifyNoMoreInteractions(resumeRepository);
    }

    // ---- deleteById : Invalid Test (not the owner) ----
    @Test
    void deleteByIdTest_NotOwner() {
        User user = new User();
        user.setUsername("john");
        JobSeeker jobSeeker = new JobSeeker();
        jobSeeker.setId(1L);
        jobSeeker.setUser(user);

        Resume resume = new Resume();
        resume.setId(1L);
        resume.setJobSeeker(jobSeeker);

        when(resumeRepository.findById(1L)).thenReturn(Optional.of(resume));

        assertThrows(OwnershipException.class,
                () -> resumeService.deleteById(1L, "someoneElse"));

        verify(resumeRepository, times(1)).findById(1L);
        verify(resumeRepository, times(0)).delete(any(Resume.class));

        verifyNoMoreInteractions(resumeRepository);
    }

    // ---- makeDefault : only the chosen resume stays default ----
    @Test
    void makeDefaultTest() {
        User user = new User();
        user.setUsername("john");
        JobSeeker jobSeeker = new JobSeeker();
        jobSeeker.setId(1L);
        jobSeeker.setUser(user);

        Resume resume1 = new Resume();
        resume1.setId(1L);
        resume1.setJobSeeker(jobSeeker);
        resume1.setDefault(true);

        Resume resume2 = new Resume();
        resume2.setId(2L);
        resume2.setJobSeeker(jobSeeker);
        resume2.setDefault(false);

        List<Resume> all = List.of(resume1, resume2);

        when(resumeRepository.findById(2L)).thenReturn(Optional.of(resume2));
        when(resumeRepository.findByJobSeekerIdOrderByUploadedAtDesc(1L)).thenReturn(all);

        resumeService.makeDefault(2L, "john");

        assertFalse(resume1.isDefault());
        assertTrue(resume2.isDefault());

        verify(resumeRepository, times(1)).saveAll(all);
    }

    @Test
    void getByJobSeekerIdTest_NotFound() {
        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> resumeService.getByJobSeekerId(1L, "john"));
    }

    @Test
    void getByIdTest_NotFound() {
        when(resumeRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> resumeService.getById(1L, "john"));
    }

}