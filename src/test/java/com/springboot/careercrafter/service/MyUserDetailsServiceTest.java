package com.springboot.careercrafter.service;

import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MyUserDetailsServiceTest {

    @InjectMocks
    private MyUserDetailsService myUserDetailsService; // real service, mock below is injected into it
    @Mock
    private UserRepository userRepository;

    // ---- loadUserByUsername : valid ----
    @Test
    public void loadUserByUsernameTest() {
        User user = new User();
        user.setUsername("john");
        user.setPassword("pass2");

        when(userRepository.loadUserByUsername("john")).thenReturn(user);

        UserDetails result = myUserDetailsService.loadUserByUsername("john");

        assertEquals("john", result.getUsername());
        assertEquals("pass2", result.getPassword());

        verify(userRepository, times(1)).loadUserByUsername("john");
        verifyNoMoreInteractions(userRepository);
    }
}