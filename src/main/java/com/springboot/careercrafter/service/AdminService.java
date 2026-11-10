package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.AdminReqDto;
import com.springboot.careercrafter.dto.request.UserStatusReqDto;
import com.springboot.careercrafter.dto.response.AdminRespDto;
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
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.AdminRepository;
import com.springboot.careercrafter.repository.EmployerRepository;
import com.springboot.careercrafter.repository.JobRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserService userService;
    private final AdminMapper adminMapper;
    private final AdminRepository adminRepository;
    private final EmployerRepository employerRepository;
    private final NotificationService notificationService;
    private final JobRepository jobRepository;

    public CreatedRespDto add(@Valid AdminReqDto adminReqDto) {
        User user = userService.createUser(adminReqDto.username(),adminReqDto.password(),Role.ADMIN);
        Admin admin = adminMapper.mapDtoToEntity(adminReqDto);
        admin.setUser(user);
        admin = adminRepository.save(admin);
        return new CreatedRespDto(admin.getId(),"Admin created");
    }

    public void verifyEmployer(Long adminId, Long employerId, String loggedInUsername) {
        // step 1: fetch admin from db using adminId
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin id invalid & Admin not found"));

        // step 2: check that the logged-in user is this admin
        if (!admin.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can verify employers only with your own admin id");

        // step 3: fetch employer from db using employerId
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer id invalid & Employer not found"));

        // step 4: an employer cannot be verified twice
        if (employer.getVerificationStatus() == VerificationStatus.VERIFIED)
            throw new InvalidCallException("Employer is already verified");

        // step 5: mark as verified and save
        employer.setVerificationStatus(VerificationStatus.VERIFIED);
        employerRepository.save(employer);
        log.info("Admin {} verified employer {} ({})", loggedInUsername, employerId, employer.getCompanyName());

        // step 6: notify employer that his/her acc is verified and they can post jobs
        notificationService.notifyUser(employer.getUser(),
                "Your employer account for " + employer.getCompanyName()
                        + " has been verified. You can now post jobs.",
                NotificationType.SYSTEM);
    }

    public AdminRespDto getByUsername(String username) {
        Admin admin = adminRepository.findByUserUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));
        return new AdminRespDto(admin.getId(), admin.getName(), username);
    }

    public void closeJob(Long jobId) {
        // step 1: fetch job from db using jobId
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        // step 2: a closed job cannot be closed again
        if (!job.isActive())
            throw new InvalidCallException("Job is already closed");

        // step 3: mark the job as closed and save
        job.setActive(false);
        jobRepository.save(job);
        log.info("Admin closed job: id={}", jobId);

        // step 4: tell the employer why the job disappeared
        notificationService.notifyUser(job.getEmployer().getUser(),
                "Your job '" + job.getTitle() + "' was closed by the admin",
                NotificationType.SYSTEM);
    }

    public void updateUserStatus(UserStatusReqDto dto, String adminUsername) {
        boolean active = dto.active();
        String reason = dto.reason() == null ? "" : dto.reason().trim();

        // step 1: a suspension must always have a written reason (it is shown to the user and audited)
        if (!active && reason.length() < 10)
            throw new InvalidCallException("Please give a reason of at least 10 characters to suspend an account");
        if (active && reason.isEmpty())
            reason = "Account reactivated by admin";

        // step 2: fetch the user, throw exception if not found
        User user = userService.getByUsername(dto.username());
        if (user == null)
            throw new ResourceNotFoundException("User not found");

        // step 3: admin accounts cannot be suspended
        if (user.getRole() == Role.ADMIN)
            throw new InvalidCallException("Admin accounts cannot be suspended");

        // step 4: nothing to do if the account is already in that state
        if (user.isActive() == active)
            throw new InvalidCallException(active ? "Account is already active" : "Account is already suspended");

        // step 5: change the status (the reason is stored on the user, the login page shows it)
        userService.updateUserStatus(dto.username(), active, reason);

        // the audit trail is the log (who, whom, why)
        log.info("Account {}: username={}, by admin={}, reason={}",
                active ? "reactivated" : "suspended", dto.username(), adminUsername, reason);
    }
}