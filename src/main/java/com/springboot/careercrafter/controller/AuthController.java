package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.response.DetailsDto;
import com.springboot.careercrafter.dto.response.TokenDto;
import com.springboot.careercrafter.exception.InactiveUserException;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.service.UserService;
import com.springboot.careercrafter.utility.JwtUtility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final JwtUtility jwtUtility;
    private final UserService userService;

    /* This api is authenticated by Spring. If the control reaches this method,
     * Spring has already checked the credentials and it can share the username */
    @GetMapping("/api/auth/login")
    public TokenDto login(Principal principal) {
        String loggedInUsername = principal.getName();

        User user = userService.getByUsername(loggedInUsername);
        if (user != null && !user.isActive()) {
            throw new InactiveUserException("Your account is suspended. Reason: "
                    + (user.getSuspensionReason() == null ? "not specified" : user.getSuspensionReason()));
        }

        String token = jwtUtility.generateToken(loggedInUsername);
        log.info("User logged in: {}", loggedInUsername);
        return new TokenDto(token,
                jwtUtility.extractExpiration(token),
                LocalDateTime.now().toString());
    }

    @GetMapping("/api/auth/user-details")
    public DetailsDto getUserDetails(Principal principal){
        String loggedInUsername = principal.getName();
        return userService.getUserDetails(loggedInUsername);
    }
}
