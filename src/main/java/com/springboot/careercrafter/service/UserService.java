package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.response.DetailsDto;
import com.springboot.careercrafter.enums.Role;
import com.springboot.careercrafter.exception.InactiveUserException;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String USER_NOT_FOUND = "User not found";

    public User createUser(String username, String password, Role role) {
        if (userRepository.existsByUsername(username))
            throw new InvalidCallException("Username already taken");

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        log.info("User created: username={}, role={}", username, role);
        return userRepository.save(user);
    }

    public User getByUsername(String username) {
        return userRepository.loadUserByUsername(username);
    }

    public DetailsDto getUserDetails(String loggedInUsername) {
        DetailsDto detailsDto = userRepository.getUserDetails(loggedInUsername);
        if (detailsDto == null)
            throw new ResourceNotFoundException(USER_NOT_FOUND);
        if(!detailsDto.isActive())
            throw new InactiveUserException("User is disabled");
        return detailsDto;
    }

    public void updateUserStatus(String username, boolean active) {
        User user = userRepository.loadUserByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException(USER_NOT_FOUND);
        }
        user.setActive(active);
        userRepository.save(user);
    }

    // suspending stores the reason (shown to the user on login), activating clears it
    public void updateUserStatus(String username, boolean active, String reason) {
        User user = userRepository.loadUserByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException(USER_NOT_FOUND);
        }
        user.setActive(active);
        user.setSuspensionReason(active ? null : reason);
        userRepository.save(user);
    }
}
