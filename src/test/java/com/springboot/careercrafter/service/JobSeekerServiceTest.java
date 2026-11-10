package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.JobSeekerReqDto;
import com.springboot.careercrafter.dto.request.JobSeekerUpdateDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.JobSeekerRespDto;
import com.springboot.careercrafter.enums.Role;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.JobSeekerMapper;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.JobSeekerRepository;
import com.springboot.careercrafter.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JobSeekerServiceTest {

    @InjectMocks
    private JobSeekerService jobSeekerService; // real service, mocks below are injected into it
    @Mock
    private JobSeekerRepository jobSeekerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JobSeekerMapper jobSeekerMapper;
    @Mock
    private UserService userService;

    // ---- add : valid ----
    @Test
    void addTest() {
        JobSeekerReqDto dto = new JobSeekerReqDto("John Doe", "9876543210", "Chennai", "BE", "2 years", "Java", "john", "pass1");

        User user = new User();
        user.setUsername("john");
        JobSeeker jobSeeker = new JobSeeker();
        JobSeeker savedJobSeeker = new JobSeeker();
        savedJobSeeker.setId(1L);

        when(userService.createUser("john", "pass1", Role.JOB_SEEKER)).thenReturn(user);
        when(jobSeekerMapper.mapDtoToEntity(dto)).thenReturn(jobSeeker);
        when(jobSeekerRepository.save(jobSeeker)).thenReturn(savedJobSeeker);

        CreatedRespDto response = jobSeekerService.add(dto);

        assertEquals(1L, response.id());
        assertEquals("JobSeeker created", response.message());

        // user must be attached to the job seeker before saving
        assertEquals(user, jobSeeker.getUser());

        verify(userService, times(1)).createUser("john", "pass1", Role.JOB_SEEKER);
        verify(jobSeekerMapper, times(1)).mapDtoToEntity(dto);
        verify(jobSeekerRepository, times(1)).save(jobSeeker);

        verifyNoMoreInteractions(userService);
        verifyNoMoreInteractions(jobSeekerMapper);
        verifyNoMoreInteractions(jobSeekerRepository);
    }

    // ---- add : username already taken ----
    @Test
    void addTest_UsernameTaken() {
        JobSeekerReqDto dto = new JobSeekerReqDto("John Doe", "9876543210", "Chennai", "BE", "2 years", "Java", "john", "pass1");

        when(userService.createUser("john", "pass1", Role.JOB_SEEKER))
                .thenThrow(new InvalidCallException("Username already taken"));

        assertThrows(InvalidCallException.class, () -> jobSeekerService.add(dto));

        verify(userService, times(1)).createUser("john", "pass1", Role.JOB_SEEKER);

        // nothing should be mapped or saved
        verifyNoMoreInteractions(jobSeekerMapper);
        verifyNoMoreInteractions(jobSeekerRepository);
    }

    // ---- getAll ----
    @Test
    void getAllTest() {
        JobSeeker js1 = new JobSeeker();
        js1.setId(1L);
        JobSeeker js2 = new JobSeeker();
        js2.setId(2L);

        JobSeekerRespDto dto1 = new JobSeekerRespDto(1L, 1L, "John Doe", "9876543210", "Chennai", "BE", "2 years", "Java", "john",true);
        JobSeekerRespDto dto2 = new JobSeekerRespDto(2L, 2L, "Mary Ann", "9876543211", "Pune", "BSc", "1 year", "Python", "mary",true);

        when(jobSeekerRepository.findAll()).thenReturn(List.of(js1, js2));
        when(jobSeekerMapper.mapEntityToDto(js1)).thenReturn(dto1);
        when(jobSeekerMapper.mapEntityToDto(js2)).thenReturn(dto2);

        assertEquals(2, jobSeekerService.getAll().size());

        verify(jobSeekerRepository, times(1)).findAll();
        verify(jobSeekerMapper, times(1)).mapEntityToDto(js1);
        verify(jobSeekerMapper, times(1)).mapEntityToDto(js2);
    }

    // ---- getById : valid ----
    @Test
    void getByIdTest() {
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        JobSeekerRespDto dto = new JobSeekerRespDto(1L, 1L, "John Doe", "9876543210", "Chennai", "BE", "2 years", "Java", "john",true);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(js));
        when(jobSeekerMapper.mapEntityToDto(js)).thenReturn(dto);

        JobSeekerRespDto result = jobSeekerService.getById(1L);

        assertEquals("John Doe", result.fullName());

        verify(jobSeekerRepository, times(1)).findById(1L);
        verify(jobSeekerMapper, times(1)).mapEntityToDto(js);
    }

    // ---- getById : invalid ----
    @Test
    void getByIdTest_Invalid() {
        when(jobSeekerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobSeekerService.getById(99L));

        verify(jobSeekerRepository, times(1)).findById(99L);
        verifyNoMoreInteractions(jobSeekerMapper);
    }

    // ---- getByUsername : valid ----
    @Test
    void getByUsernameTest() {
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        JobSeekerRespDto dto = new JobSeekerRespDto(1L, 1L, "John Doe", "9876543210", "Chennai", "BE", "2 years", "Java", "john",true);

        when(jobSeekerRepository.findByUserUsername("john")).thenReturn(Optional.of(js));
        when(jobSeekerMapper.mapEntityToDto(js)).thenReturn(dto);

        JobSeekerRespDto result = jobSeekerService.getByUsername("john");

        assertEquals("john", result.username());

        verify(jobSeekerRepository, times(1)).findByUserUsername("john");
    }

    // ---- getByUsername : invalid ----
    @Test
    void getByUsernameTest_Invalid() {
        when(jobSeekerRepository.findByUserUsername("nobody")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobSeekerService.getByUsername("nobody"));

        verifyNoMoreInteractions(jobSeekerMapper);
    }

    // ---- update : valid ----
    @Test
    void updateTest() {
        User user = new User();
        user.setUsername("john");
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        js.setUser(user);
        js.setFullName("John Doe");
        js.setLocation("Chennai");
        js.setSkills("Java");

        // only full name and skills are sent, others are null
        JobSeekerUpdateDto dto = new JobSeekerUpdateDto("John D", null, null, null, null, "Java, Spring");

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(js));

        jobSeekerService.update(1L, dto, "john");

        assertEquals("John D", js.getFullName());
        assertEquals("Java, Spring", js.getSkills());
        // location was not sent, so it stays same
        assertEquals("Chennai", js.getLocation());

        verify(jobSeekerRepository, times(1)).findById(1L);
        verify(jobSeekerRepository, times(1)).save(js);
    }

    // ---- update : not the owner ----
    @Test
    void updateTest_NotOwner() {
        User user = new User();
        user.setUsername("john");
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        js.setUser(user);

        JobSeekerUpdateDto dto = new JobSeekerUpdateDto("John D", null, null, null, null, null);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(js));

        assertThrows(OwnershipException.class,
                () -> jobSeekerService.update(1L, dto, "someoneElse"));

        verify(jobSeekerRepository, times(0)).save(js);
    }

    // ---- update : nothing to update ----
    @Test
    void updateTest_NothingToUpdate() {
        User user = new User();
        user.setUsername("john");
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        js.setUser(user);

        JobSeekerUpdateDto dto = new JobSeekerUpdateDto(null, null, null, null, null, null);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(js));

        assertThrows(InvalidCallException.class,
                () -> jobSeekerService.update(1L, dto, "john"));

        verify(jobSeekerRepository, times(0)).save(js);
    }

    // ---- deleteById : valid ----
    @Test
    void deleteByIdTest() {
        User user = new User();
        user.setUsername("john");
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        js.setUser(user);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(js));

        jobSeekerService.deleteById(1L, "john");

        verify(jobSeekerRepository, times(1)).findById(1L);
        verify(jobSeekerRepository, times(1)).delete(js);
        verify(userRepository, times(1)).delete(user);
        verify(userRepository, times(1)).flush();

        verifyNoMoreInteractions(jobSeekerRepository);
        verifyNoMoreInteractions(userRepository);
    }

    // ---- deleteById : not the owner ----
    @Test
    void deleteByIdTest_NotOwner() {
        User user = new User();
        user.setUsername("john");
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        js.setUser(user);

        when(jobSeekerRepository.findById(1L)).thenReturn(Optional.of(js));

        assertThrows(OwnershipException.class,
                () -> jobSeekerService.deleteById(1L, "someoneElse"));

        verify(jobSeekerRepository, times(0)).delete(js);
        verifyNoMoreInteractions(userRepository);
    }

    // ---- deleteById : not found ----
    @Test
    void deleteByIdTest_NotFound() {
        when(jobSeekerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> jobSeekerService.deleteById(99L, "john"));

        verifyNoMoreInteractions(userRepository);
    }

    // ---- filter : one page + pagination info ----
    @Test
    void filterTest() {
        JobSeeker js = new JobSeeker();
        js.setId(1L);
        JobSeekerRespDto dto = new JobSeekerRespDto(1L, 1L, "John", "9876543210", "Chennai", "BE",
                "2 years", "java, spring", "john", true);

        when(jobSeekerRepository.filterJobSeekers(null, "chennai", "java", null,
                org.springframework.data.domain.PageRequest.of(0, 5)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(js),
                        org.springframework.data.domain.PageRequest.of(0, 5), 1));
        when(jobSeekerMapper.mapEntityToDto(js)).thenReturn(dto);

        com.springboot.careercrafter.dto.response.PagedRespDto<JobSeekerRespDto> result =
                jobSeekerService.filter(" ", "chennai", "java", null, 0, 5);

        assertEquals(1, result.content().size());
        assertEquals(1, result.paginationInfo().totalPages());
        assertEquals(1L, result.paginationInfo().totalRecords());
    }
}
