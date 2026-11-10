package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.request.NotificationReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.NotificationRespDto;
import com.springboot.careercrafter.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationService notificationService;

    // only ADMIN can reach this API (SecurityConfig)
    @PostMapping("/api/notification/add/{userId}")
    public CreatedRespDto add(@PathVariable Long userId,
                              @Valid @RequestBody NotificationReqDto dto) {
        return notificationService.add(userId, dto);
    }

    @GetMapping("/api/notification/user/{userId}")
    public List<NotificationRespDto> getByUserId(@PathVariable Long userId, Principal principal) {
        return notificationService.getByUserId(userId, principal.getName());
    }

    @PutMapping("/api/notification/{id}/read")
    public void markRead(@PathVariable Long id, Principal principal) {
        notificationService.markRead(id, principal.getName());
    }

    @DeleteMapping("/api/notification/{id}")
    public void deleteById(@PathVariable Long id, Principal principal) {
        notificationService.deleteById(id, principal.getName());
    }
}