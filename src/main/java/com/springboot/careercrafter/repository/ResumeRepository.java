package com.springboot.careercrafter.repository;

import com.springboot.careercrafter.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    // select r from Resume r where r.jobSeeker.id = ?1 order by r.uploadedAt desc
    List<Resume> findByJobSeekerIdOrderByUploadedAtDesc(Long jobSeekerId);

    // default resume of a jobseeker (used when resumeId is not given while applying)
    @Query("select r from Resume r where r.jobSeeker.id = ?1 and r.isDefault = true")
    Optional<Resume> findDefaultResume(Long jobSeekerId);

    List<Resume> findByJobSeekerIdAndSharedTrueOrderByUploadedAtDesc(Long jobSeekerId);
}