package com.springboot.careercrafter.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.springboot.careercrafter.enums.VerificationStatus;
import com.springboot.careercrafter.model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EmployerRepository extends JpaRepository<Employer, Long> {

    List<Employer> findByVerificationStatus(VerificationStatus status);

    // select e from Employer e where e.user.username = ?1
    Optional<Employer> findByUserUsername(String username);

    @Query("""
            select e from Employer e
            where (?1 is null or e.verificationStatus = ?1)
            and (?2 is null or lower(e.companyName) like lower(concat('%', ?2, '%')))
            and (?3 is null or lower(e.fullName) like lower(concat('%', ?3, '%')))
            order by e.id desc
            """)
    Page<Employer> filterEmployers(VerificationStatus status, String companyName, String fullName, Pageable pageable);
}