package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.request.AdminReqDto;
import com.springboot.careercrafter.dto.request.UserStatusReqDto;
import com.springboot.careercrafter.dto.response.AdminRespDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/api/admin/add")
    public CreatedRespDto add(@Valid @RequestBody AdminReqDto adminReqDto) {
        return adminService.add(adminReqDto);
    }

    @PutMapping("/api/employer/verify/{adminId}/{employerId}")
    public void verifyEmployer(@PathVariable Long adminId,
                               @PathVariable Long employerId,
                               Principal principal) {
        adminService.verifyEmployer(adminId, employerId, principal.getName());
    }

    @GetMapping("/api/admin/by-username")
    public AdminRespDto getByUsername(@RequestParam("username") String username) {
        return adminService.getByUsername(username);
    }

    // admin closes (moderates) any job listing
    @PutMapping("/api/admin/job/{jobId}/close")
    public void closeJob(@PathVariable Long jobId) {
        adminService.closeJob(jobId);
    }
    // employer/verify/1/1

    @PutMapping("/api/admin/user-status")
    public void updateUserStatus(@Valid @RequestBody UserStatusReqDto dto, Principal principal) {
        adminService.updateUserStatus(dto, principal.getName());
    }
}