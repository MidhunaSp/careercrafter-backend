package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.EmployerReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.EmployerRespDto;
import com.springboot.careercrafter.enums.Role;
import com.springboot.careercrafter.enums.VerificationStatus;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.EmployerMapper;
import com.springboot.careercrafter.model.Employer;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.EmployerRepository;
import com.springboot.careercrafter.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class EmployerServiceTest {

    @InjectMocks
    private EmployerService employerService;
    @Mock
    private EmployerRepository employerRepository;
    @Mock
    private EmployerMapper employerMapper;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserService userService;

    // ---- Valid Test----
    @Test
    void getByVerificationStatusTest() {
        Employer employer1 = new Employer();
        employer1.setId(1L);
        Employer employer2 = new Employer();
        employer2.setId(2L);
        Employer employer3 = new Employer();
        employer3.setId(3L);

        EmployerRespDto dto1 = new EmployerRespDto(1L, 11L, "employer1", "ABC", "9876543210", VerificationStatus.VERIFIED, "emp1",true);
        EmployerRespDto dto2 = new EmployerRespDto(2L, 12L, "employer2", "shine tech", "9876543211", VerificationStatus.VERIFIED, "emp2",true);
        EmployerRespDto dto3 = new EmployerRespDto(3L, 13L, "employer3", "bright solutions", "9876543212", VerificationStatus.PENDING, "emp3",true);


        when(employerRepository.findByVerificationStatus(VerificationStatus.VERIFIED))
                .thenReturn(List.of(employer1, employer2));
        when(employerRepository.findByVerificationStatus(VerificationStatus.PENDING))
                .thenReturn(List.of(employer3));


        when(employerMapper.mapEntityToDto(employer1)).thenReturn(dto1);
        when(employerMapper.mapEntityToDto(employer2)).thenReturn(dto2);
        when(employerMapper.mapEntityToDto(employer3)).thenReturn(dto3);

        // call the real service and check sizes
        assertEquals(2, employerService.getByVerificationStatus(VerificationStatus.VERIFIED).size()); // 2 verified employers
        assertEquals(1, employerService.getByVerificationStatus(VerificationStatus.PENDING).size()); // 1 pending employer

        // verify that each mock method was called exactly once with these arguments (num of method invocations)
        verify(employerRepository, times(1)).findByVerificationStatus(VerificationStatus.VERIFIED);
        verify(employerRepository, times(1)).findByVerificationStatus(VerificationStatus.PENDING);

        verify(employerMapper, times(1)).mapEntityToDto(employer1);
        verify(employerMapper, times(1)).mapEntityToDto(employer2);
        verify(employerMapper, times(1)).mapEntityToDto(employer3);

        // no more calls (only wantedNumberOfInvocations called) .. and this guards against unexpected extra DB calls
        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(employerMapper);
    }

    // ---Invalid Test---
    @Test
    void getByIdTest_Invalid() {

        when(employerRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> employerService.getById(7L));

        // verify: the employer lookup happened once
        verify(employerRepository, times(1)).findById(7L);

        // verify: mapper was NEVER called (service stopped at validation).
        verify(employerMapper, times(0)).mapEntityToDto(any(Employer.class));

        // no more calls..
        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(employerMapper);
    }

    @Test
    void saveTest() {

        // mock
        EmployerReqDto employerReqDto = new EmployerReqDto("John", "ABC", "9876543210", "john", "john123");

        User user = new User();
        user.setUsername("john");

        // the employer that mapper gives back (id is given by db after save)
        Employer employer = new Employer();
        employer.setId(1L);

        when(userService.createUser("john", "john123", Role.EMPLOYER)).thenReturn(user);
        when(employerMapper.mapDtoToEntity(employerReqDto)).thenReturn(employer);

        // when this save method is call, don't go to DB and save, just assume it saved and give back the employer
        when(employerRepository.save(any(Employer.class))).thenReturn(employer);

        // actual call
        CreatedRespDto response = employerService.add(employerReqDto);

        assertEquals(1L, response.id());
        assertEquals("Employer created", response.message());

        // Tip: once u mock - it won't go to db but it still make a call.
        // verify if calls are happening only once
        verify(userService, times(1)).createUser("john", "john123", Role.EMPLOYER);
        verify(employerMapper, times(1)).mapDtoToEntity(employerReqDto);
        verify(employerRepository, times(1)).save(any(Employer.class));
    }

    @Test
    void getByUsernameTest_Invalid() {
        when(employerRepository.findByUserUsername("nobody")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> employerService.getByUsername("nobody"));
    }

    // ---- getAll ----
    @Test
    void getAllTest() {
        Employer employer1 = new Employer();
        employer1.setId(1L);
        Employer employer2 = new Employer();
        employer2.setId(2L);

        EmployerRespDto dto1 = new EmployerRespDto(1L, 11L, "employer1", "ABC", "9876543210", VerificationStatus.VERIFIED, "emp1",true);
        EmployerRespDto dto2 = new EmployerRespDto(2L, 12L, "employer2", "shine tech", "9876543211", VerificationStatus.PENDING, "emp2",true);

        when(employerRepository.findAll()).thenReturn(List.of(employer1, employer2));
        when(employerMapper.mapEntityToDto(employer1)).thenReturn(dto1);
        when(employerMapper.mapEntityToDto(employer2)).thenReturn(dto2);

        assertEquals(2, employerService.getAll().size());

        verify(employerRepository, times(1)).findAll();
        verify(employerMapper, times(1)).mapEntityToDto(employer1);
        verify(employerMapper, times(1)).mapEntityToDto(employer2);

        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(employerMapper);
    }

    // ---- filter : one page + pagination info ----
    @Test
    void filterTest() {
        Employer employer = new Employer();
        employer.setId(1L);
        EmployerRespDto dto = new EmployerRespDto(1L, 1L, "Ravi", "TCS", "9876543210",
                VerificationStatus.PENDING, "ravi", true);

        when(employerRepository.filterEmployers(VerificationStatus.PENDING, "tcs", null,
                org.springframework.data.domain.PageRequest.of(0, 5)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(employer),
                        org.springframework.data.domain.PageRequest.of(0, 5), 11));
        when(employerMapper.mapEntityToDto(employer)).thenReturn(dto);

        com.springboot.careercrafter.dto.response.PagedRespDto<EmployerRespDto> result =
                employerService.filter(VerificationStatus.PENDING, " tcs ", "", 0, 5);

        assertEquals(1, result.content().size());
        assertEquals(3, result.paginationInfo().totalPages()); // 11 employers, 5 per page
        assertEquals(11L, result.paginationInfo().totalRecords());
        assertEquals(1, result.paginationInfo().numRecordsInPage());
    }
}
