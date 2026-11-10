package com.springboot.careercrafter.repository;

import org.springframework.data.domain.Page;
import com.springboot.careercrafter.dto.response.EmployerJobCountDto;
import com.springboot.careercrafter.dto.response.IndustryCountDto;
import com.springboot.careercrafter.dto.response.JobApplicantCountDto;
import com.springboot.careercrafter.dto.response.JobRespDto;
import com.springboot.careercrafter.enums.EmploymentType;
import com.springboot.careercrafter.model.Job;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("""
            select new com.springboot.careercrafter.dto.response.JobApplicantCountDto(j.id, j.title, count(ja.id))
            j.id, j.title, j.description, j.qualifications, j.location, j.industry,
            j.employmentType, j.minSalary, j.maxSalary, j.applicationInstructions,
            j.active, j.createdAt, e.id, e.companyName)
            from Job j
            join j.employer e
            where j.active = true
            order by j.createdAt desc
            """)
    List<JobRespDto> getActiveJobs(Pageable pageable);

    @Query("""
            select new com.springboot.careercrafter.dto.response.JobRespDto(
            j.id, j.title, j.description, j.qualifications, j.location, j.industry,
            j.employmentType, j.minSalary, j.maxSalary, j.applicationInstructions,
            j.active, j.createdAt, e.id, e.companyName)
            from Job j
            join j.employer e
            where j.id = ?1
            """)
    Optional<JobRespDto> getJobDetailsById(Long id);

    @Query("""
            select new com.springboot.careercrafter.dto.response.JobRespDto(
            j.id, j.title, j.description, j.qualifications, j.location, j.industry,
            j.employmentType, j.minSalary, j.maxSalary, j.applicationInstructions,
            j.active, j.createdAt, e.id, e.companyName)
            from Job j
            join j.employer e
            where e.id = ?1
            order by j.createdAt desc
            """)
    Page<JobRespDto> getJobsByEmployerId(Long employerId, Pageable pageable);

    @Query("""
            select new com.springboot.careercrafter.dto.response.JobRespDto(
            j.id, j.title, j.description, j.qualifications, j.location, j.industry,
            j.employmentType, j.minSalary, j.maxSalary, j.applicationInstructions,
            j.active, j.createdAt, e.id, e.companyName)
            from Job j
            join j.employer e
            where j.active = true
            and (?1 is null or lower(j.location) like lower(concat('%', ?1, '%')))
            and (?2 is null or lower(j.industry) like lower(concat('%', ?2, '%')))
            and (?3 is null or j.employmentType = ?3)
            and (?4 is null or j.maxSalary >= ?4)
            and (?5 is null or lower(j.title) like lower(concat('%', ?5, '%'))
                 or lower(e.companyName) like lower(concat('%', ?5, '%')))
            order by j.createdAt desc
            """)
    Page<JobRespDto> filterJobs(String location, String industry, EmploymentType employmentType,
                                Double minSalary, String keyword, Pageable pageable);


    @Query("""
            select new com.springboot.careercrafter.dto.response.JobApplicantCountDto(j.title, count(ja.id))
            from JobApplication ja
            join ja.job j
            group by j.id, j.title
            """)
    List<JobApplicantCountDto> getApplicantCountPerJob();

    @Query("""
            select new com.springboot.careercrafter.dto.response.EmployerJobCountDto(e.companyName, count(j.id))
            from Job j
            join j.employer e
            group by e.id, e.companyName
            """)
    List<EmployerJobCountDto> getJobCountPerEmployer();

    @Query("""
            select new com.springboot.careercrafter.dto.response.IndustryCountDto(j.industry, count(j.id))
            from Job j
            group by j.industry
            """)
    List<IndustryCountDto> getJobCountByIndustry();

    @Query("""
        select new com.springboot.careercrafter.dto.response.JobRespDto(
        j.id, j.title, j.description, j.qualifications, j.location, j.industry,
        j.employmentType, j.minSalary, j.maxSalary, j.applicationInstructions,
        j.active, j.createdAt, e.id, e.companyName)
        from Job j
        join j.employer e
        where j.active = true
        """)
    List<JobRespDto> getAllActiveJobs();

    @Query("""
        select new com.springboot.careercrafter.dto.response.JobApplicantCountDto(j.title, count(ja.id))
        from Job j
        left join JobApplication ja on ja.job = j
        where j.employer.user.username = ?1
        group by j.id, j.title
        """)
    List<JobApplicantCountDto> getApplicantCountPerJobByEmployer(String username);
}
