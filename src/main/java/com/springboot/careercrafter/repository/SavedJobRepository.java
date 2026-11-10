package com.springboot.careercrafter.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.springboot.careercrafter.dto.response.SavedJobRespDto;
import com.springboot.careercrafter.model.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    // derived query: select count(*)>0 from SavedJob sj where sj.jobSeeker.id=?1 and sj.job.id=?2
    boolean existsByJobSeekerIdAndJobId(Long jobSeekerId, Long jobId);

    // sj = saved job, j = sj.job, e = j.employer
    @Query("""
            select new com.springboot.careercrafter.dto.response.SavedJobRespDto(
                sj.id, sj.savedAt, j.id, j.title, e.companyName, j.location)
            from SavedJob sj
            JOIN sj.job j
            JOIN j.employer e
            where sj.jobSeeker.id = ?1
            order by sj.savedAt desc
            """)
    Page<SavedJobRespDto> getByJobSeekerId(Long jobSeekerId, Pageable pageable);

    void deleteByJobId(Long jobId);
}