package com.springboot.careercrafter.service;

import com.springboot.careercrafter.enums.NotificationType;
import com.springboot.careercrafter.model.Job;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.repository.JobSeekerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobMatchService {

    private final JobSeekerRepository jobSeekerRepository;
    private final NotificationService notificationService;

    // tells every active job seeker whose skills appear in the new job
    public void notifyMatchingSeekers(Job job) {
        try {
            String text = ((job.getTitle() == null ? "" : job.getTitle()) + " "
                    + (job.getDescription() == null ? "" : job.getDescription()) + " "
                    + (job.getQualifications() == null ? "" : job.getQualifications())).toLowerCase();

            int notified = 0;
            for (JobSeeker js : jobSeekerRepository.findAll()) {
                if (!js.getUser().isActive() || js.getSkills() == null || js.getSkills().isBlank())
                    continue;

                List<String> matched = Arrays.stream(js.getSkills().split(","))
                        .map(String::trim)
                        .map(String::toLowerCase)
                        .filter(s -> !s.isEmpty())
                        .filter(text::contains)
                        .toList();

                if (matched.isEmpty())
                    continue;

                notificationService.notifyUser(js.getUser(),
                        "New job matching your skills: " + job.getTitle() + " at "
                                + job.getEmployer().getCompanyName() + " (" + String.join(", ", matched) + ")",
                        NotificationType.NEW_JOB_MATCH);
                notified++;
            }
            log.info("Job match alerts sent: jobId={}, seekers={}", job.getId(), notified);
        }
        catch (Exception e) {
            // posting the job must never fail because of an alert
            log.warn("Could not send job match alerts for jobId={}: {}", job.getId(), e.getMessage());
        }
    }
}