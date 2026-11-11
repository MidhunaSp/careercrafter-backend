package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.request.EmployerReqDto;
import com.springboot.careercrafter.dto.request.EmployerUpdateDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.EmployerRespDto;
import com.springboot.careercrafter.enums.VerificationStatus;
import com.springboot.careercrafter.service.EmployerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EmployerController {

    private final EmployerService employerService;

    @PostMapping("/api/employer/add")
    public CreatedRespDto add(@Valid @RequestBody EmployerReqDto employerReqDto) {
        return employerService.add(employerReqDto);
    }

    @GetMapping("/api/employer/all")
    public List<EmployerRespDto> getAllEmployers() {
        return employerService.getAll();
    }

    @GetMapping("/api/employer/filter")
    public PagedRespDto<EmployerRespDto> filter(
            @RequestParam(value = "status", required = false) VerificationStatus status,
            @RequestParam(value = "companyName", required = false) String companyName,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return employerService.filter(status, companyName, fullName, page, size);
    }

    @GetMapping("/api/employer/by-username")
    public EmployerRespDto getByUsername(@RequestParam("username") String username) {
        return employerService.getByUsername(username);
    }

    // v1: Get employers by verification status
    @GetMapping("/api/employer/verification/v1")
    public List<EmployerRespDto> getByVerificationStatus(
            @RequestParam("status") VerificationStatus status) {
        return employerService.getByVerificationStatus(status);
    }

    // v1: Get employer by ID
    @GetMapping("/api/employer/v1/{id}")
    public EmployerRespDto getById(@PathVariable Long id) {
        return employerService.getById(id);
    }

    @PutMapping("/api/employer/{id}")
    public void update(@PathVariable Long id,
                       @Valid @RequestBody EmployerUpdateDto dto,
                       Principal principal) {
        employerService.update(id, dto, principal.getName());
    }

    @DeleteMapping("/api/employer/{id}")
    public void deleteById(@PathVariable Long id, Principal principal) {
        employerService.deleteById(id, principal.getName());
    }
}