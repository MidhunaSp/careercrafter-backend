package com.springboot.careercrafter.service;

import com.springboot.careercrafter.enums.Role;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    // ---- Valid Test ----
    @Test
    public void createUserTest() {
        User savedUser = new User();
        savedUser.setUsername("john");
        savedUser.setPassword("pass2");
        savedUser.setRole(Role.JOB_SEEKER);

        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(passwordEncoder.encode("pass1")).thenReturn("pass2");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = userService.createUser("john", "pass1", Role.JOB_SEEKER);

        assertEquals("john", result.getUsername());
        assertEquals("pass2", result.getPassword());
        assertEquals(Role.JOB_SEEKER, result.getRole());

        verify(userRepository, times(1)).existsByUsername("john");
        verify(passwordEncoder, times(1)).encode("pass1");
        verify(userRepository, times(1)).save(any(User.class));

        verifyNoMoreInteractions(userRepository);
        verifyNoMoreInteractions(passwordEncoder);
    }

    // ---- Invalid Test ----
    @Test
    public void createUserTest_UsernameTaken() {
        when(userRepository.existsByUsername("john")).thenReturn(true);

        assertThrows(InvalidCallException.class,
                () -> userService.createUser("john", "pass1", Role.JOB_SEEKER));

        verify(userRepository, times(1)).existsByUsername("john");

        // password must not be encoded and user must not be saved
        verify(passwordEncoder, times(0)).encode("pass1");
        verify(userRepository, times(0)).save(any(User.class));

        verifyNoMoreInteractions(userRepository);
        verifyNoMoreInteractions(passwordEncoder);
    }
}
