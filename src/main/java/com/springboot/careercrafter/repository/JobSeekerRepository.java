package com.springboot.careercrafter.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.springboot.careercrafter.model.JobSeeker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface JobSeekerRepository extends JpaRepository<JobSeeker, Long> {

    Optional<JobSeeker> findByUserUsername(String username);

    @Query("""
            select js from JobSeeker js
            where (?1 is null or lower(js.fullName) like lower(concat('%', ?1, '%'))
                   or lower(js.user.username) like lower(concat('%', ?1, '%')))
            and (?2 is null or lower(js.location) like lower(concat('%', ?2, '%')))
            and (?3 is null or lower(js.skills) like lower(concat('%', ?3, '%')))
            and (?4 is null or lower(js.education) like lower(concat('%', ?4, '%')))
            order by js.id desc
            """)
    Page<JobSeeker> filterJobSeekers(String fullName, String location, String skills, String education, Pageable pageable);
}