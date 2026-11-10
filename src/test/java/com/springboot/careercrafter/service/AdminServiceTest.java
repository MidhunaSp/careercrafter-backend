package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.AdminReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.enums.NotificationType;
import com.springboot.careercrafter.enums.Role;
import com.springboot.careercrafter.enums.VerificationStatus;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.AdminMapper;
import com.springboot.careercrafter.model.Admin;
import com.springboot.careercrafter.model.Employer;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.AdminRepository;
import com.springboot.careercrafter.repository.EmployerRepository;
import com.springboot.careercrafter.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminServiceTest {

    @InjectMocks
    private AdminService adminService;
    @Mock
    private UserService userService;
    @Mock
    private AdminMapper adminMapper;
    @Mock
    private AdminRepository adminRepository;
    @Mock
    private EmployerRepository employerRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private JobRepository jobRepository;

    // ---- add : valid ----
    @Test
    void addTest() {
        AdminReqDto dto = new AdminReqDto("Admin1", "admin1", "pass1");

        User user = new User();
        user.setUsername("admin1");

        Admin admin = new Admin();

        Admin savedAdmin = new Admin();
        savedAdmin.setId(1L);

        when(userService.createUser("admin1", "pass1", Role.ADMIN)).thenReturn(user);
        when(adminMapper.mapDtoToEntity(dto)).thenReturn(admin);
        when(adminRepository.save(admin)).thenReturn(savedAdmin);

        CreatedRespDto response = adminService.add(dto);

        assertEquals(1L, response.id());
        assertEquals("Admin created", response.message());

        // user must be attached to the admin before saving
        assertEquals(user, admin.getUser());

        verify(userService, times(1)).createUser("admin1", "pass1", Role.ADMIN);
        verify(adminMapper, times(1)).mapDtoToEntity(dto);
        verify(adminRepository, times(1)).save(admin);

        verifyNoMoreInteractions(userService);
        verifyNoMoreInteractions(adminMapper);
        verifyNoMoreInteractions(adminRepository);
    }

    // ---- add : username already taken ----
    @Test
    void addTest_UsernameTaken() {
        AdminReqDto dto = new AdminReqDto("Admin One", "admin1", "pass1");

        when(userService.createUser("admin1", "pass1", Role.ADMIN))
                .thenThrow(new InvalidCallException("Username already taken"));

        assertThrows(InvalidCallException.class, () -> adminService.add(dto));

        verify(userService, times(1)).createUser("admin1", "pass1", Role.ADMIN);

        // nothing should be mapped or saved
        verifyNoMoreInteractions(adminMapper);
        verifyNoMoreInteractions(adminRepository);
    }

    // ---- verifyEmployer : valid ----
    @Test
    void verifyEmployerTest() {
        User adminUser = new User();
        adminUser.setUsername("admin1");
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setUser(adminUser);

        User employerUser = new User();
        employerUser.setUsername("emp1");
        Employer employer = new Employer();
        employer.setId(2L);
        employer.setUser(employerUser);
        employer.setCompanyName("TechCorp");
        employer.setVerificationStatus(VerificationStatus.PENDING);

        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(employerRepository.findById(2L)).thenReturn(Optional.of(employer));

        adminService.verifyEmployer(1L, 2L, "admin1");

        // employer status must be changed to VERIFIED
        assertEquals(VerificationStatus.VERIFIED, employer.getVerificationStatus());

        verify(adminRepository, times(1)).findById(1L);
        verify(employerRepository, times(1)).findById(2L);
        verify(employerRepository, times(1)).save(employer);
        verify(notificationService, times(1)).notifyUser(employerUser,
                "Your employer account for TechCorp has been verified. You can now post jobs.",
                NotificationType.SYSTEM);

        verifyNoMoreInteractions(adminRepository);
        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(notificationService);
    }

    // ---- verifyEmployer : admin not found ----
    @Test
    void verifyEmployerTest_AdminNotFound() {
        when(adminRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> adminService.verifyEmployer(7L, 2L, "admin1"));

        verify(adminRepository, times(1)).findById(7L);

        // nothing else should be called
        verifyNoMoreInteractions(adminRepository);
        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(notificationService);
    }

    // ---- verifyEmployer : logged in user is not this admin ----
    @Test
    void verifyEmployerTest_NotOwner() {
        User adminUser = new User();
        adminUser.setUsername("admin1");
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setUser(adminUser);

        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThrows(OwnershipException.class,
                () -> adminService.verifyEmployer(1L, 2L, "someoneElse"));

        verify(adminRepository, times(1)).findById(1L);

        // employer is not touched and nobody is notified
        verifyNoMoreInteractions(adminRepository);
        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(notificationService);
    }

    // ---- verifyEmployer : employer not found ----
    @Test
    void verifyEmployerTest_EmployerNotFound() {
        User adminUser = new User();
        adminUser.setUsername("admin1");
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setUser(adminUser);

        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(employerRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> adminService.verifyEmployer(1L, 9L, "admin1"));

        verify(adminRepository, times(1)).findById(1L);
        verify(employerRepository, times(1)).findById(9L);

        // employer is not saved and nobody is notified
        verifyNoMoreInteractions(adminRepository);
        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(notificationService);
    }

    // ---- verifyEmployer : employer already verified ----
    @Test
    void verifyEmployerTest_AlreadyVerified() {
        User adminUser = new User();
        adminUser.setUsername("admin1");
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setUser(adminUser);

        Employer employer = new Employer();
        employer.setId(2L);
        employer.setVerificationStatus(VerificationStatus.VERIFIED);

        when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(employerRepository.findById(2L)).thenReturn(Optional.of(employer));

        assertThrows(InvalidCallException.class,
                () -> adminService.verifyEmployer(1L, 2L, "admin1"));

        verify(adminRepository, times(1)).findById(1L);
        verify(employerRepository, times(1)).findById(2L);

        // employer is not saved again and nobody is notified
        verifyNoMoreInteractions(adminRepository);
        verifyNoMoreInteractions(employerRepository);
        verifyNoMoreInteractions(notificationService);
    }


}
