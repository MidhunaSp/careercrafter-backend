package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.ResumeReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.ResumeFileRespDto;
import com.springboot.careercrafter.dto.response.ResumeRespDto;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.ResumeMapper;
import com.springboot.careercrafter.model.JobApplication;
import com.springboot.careercrafter.model.JobSeeker;
import com.springboot.careercrafter.model.Resume;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import com.springboot.careercrafter.repository.JobSeekerRepository;
import com.springboot.careercrafter.repository.ResumeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final JobSeekerRepository jobSeekerRepository;
    private final ResumeMapper resumeMapper;
    private final JobApplicationRepository jobApplicationRepository;

    private static final String RESUME_NOT_FOUND = "Resume not found";

    @Value("${app.upload.resume-dir}")
    private String uploadDir;

    @Transactional
    public CreatedRespDto add(Long jobSeekerId, ResumeReqDto dto, String loggedInUsername) {
        // step 1: fetch jobseeker from db
        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("Job seeker id invalid & Job seeker not found"));

        // step 2: check that the logged-in user owns this jobseeker account
        if (!jobSeeker.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can add resumes only to your own account");

        List<Resume> existing = resumeRepository.findByJobSeekerIdOrderByUploadedAtDesc(jobSeekerId);

        // step 3: the first resume is always the default
        boolean makeDefault = dto.isDefault() || existing.isEmpty();

        // step 4: if this one is the new default, un-default the older ones
        if (makeDefault && !existing.isEmpty()) {
            existing.forEach(r -> r.setDefault(false));
            resumeRepository.saveAll(existing);
        }

        // step 5: map dto to entity, attach jobseeker and save
        Resume resume = resumeMapper.mapDtoToEntity(dto);
        resume.setJobSeeker(jobSeeker);
        resume.setDefault(makeDefault);

        resume = resumeRepository.save(resume);
        return new CreatedRespDto(resume.getId(), "Resume added");
    }

    // jobseeker uploads a pdf: it is saved in the uploads folder and added to the resume database
    @Transactional
    public CreatedRespDto upload(Long jobSeekerId, MultipartFile file, String label, String loggedInUsername) throws IOException {
        // step 1: empty check
        if (file == null || file.isEmpty())
            throw new InvalidCallException("Please upload a valid file");

        // step 2: size check
        if (file.getSize() > 5 * 1024 * 1024)
            throw new InvalidCallException("File too large. Max 5 MB");

        // step 3: extension check and content check
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase().endsWith(".pdf"))
            throw new InvalidCallException("Only pdf files are allowed");

        // step 4: label check
        if (label == null || label.isBlank() || label.length() > 150)
            throw new InvalidCallException("Resume label is required (maximum 150 characters)");

        // step 5: check that the logged-in user owns this jobseeker account
        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("Job seeker id invalid & Job seeker not found"));

        if (!jobSeeker.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can add resumes only to your own account");

        // step 6: save the file in the uploads folder
        String storedFileName = System.currentTimeMillis() + "_" + originalName;
        Files.createDirectories(Paths.get(uploadDir));
        Files.copy(file.getInputStream(), Paths.get(uploadDir, storedFileName),
                StandardCopyOption.REPLACE_EXISTING);

        // step 7: save the file name in the db (the first resume becomes the default)
        return add(jobSeekerId, new ResumeReqDto(originalName, storedFileName, label.trim(), false), loggedInUsername);
    }

    public List<ResumeRespDto> getByJobSeekerId(Long jobSeekerId, String loggedInUsername) {
        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("Job seeker not found"));

        // only the owner can see the resume list
        if (!jobSeeker.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("These resumes belong to another job seeker");

        return resumeRepository.findByJobSeekerIdOrderByUploadedAtDesc(jobSeekerId)
                .stream()
                .map(resumeMapper::mapEntityToDto)
                .toList();
    }

    public ResumeRespDto getById(Long id, String loggedInUsername) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESUME_NOT_FOUND));
        checkOwner(resume, loggedInUsername);
        return resumeMapper.mapEntityToDto(resume);
    }

    @Transactional
    public void makeDefault(Long id, String loggedInUsername) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESUME_NOT_FOUND));
        checkOwner(resume, loggedInUsername);

        // exactly one default per jobseeker: this one true, all others false
        List<Resume> all = resumeRepository
                .findByJobSeekerIdOrderByUploadedAtDesc(resume.getJobSeeker().getId());
        all.forEach(r -> r.setDefault(r.getId().equals(id)));
        resumeRepository.saveAll(all);
    }

    @Transactional
    public void deleteById(Long id, String loggedInUsername) {
        if (jobApplicationRepository.existsByResumeId(id))
            throw new InvalidCallException("This resume is used in a job application, so it cannot be deleted");

        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Resume not found"));

        checkOwner(resume, loggedInUsername);

        Long jobSeekerId = resume.getJobSeeker().getId();
        boolean wasDefault = resume.isDefault();

        resumeRepository.delete(resume);
        log.info("Resume deleted: id={} by {}", id, loggedInUsername);
        resumeRepository.flush();

        if (wasDefault) {
            List<Resume> remaining =
                    resumeRepository.findByJobSeekerIdOrderByUploadedAtDesc(
                            jobSeekerId);

            if (!remaining.isEmpty()) {
                Resume newDefault = remaining.get(0);
                newDefault.setDefault(true);
                resumeRepository.save(newDefault);
            }
        }
    }

    public void update(Long id, ResumeReqDto dto, String loggedInUsername) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESUME_NOT_FOUND));
        checkOwner(resume, loggedInUsername);

        resume.setFileName(dto.fileName());
        resume.setFilePath(dto.filePath());
        resume.setLabel(dto.label());
        resumeRepository.save(resume);
    }

    // employer opens the resume attached to an application of his own job
    public ResumeRespDto getByApplicationId(Long jobApplicationId, String loggedInUsername) {
        JobApplication application = jobApplicationRepository.findById(jobApplicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found"));

        if (!application.getJob().getEmployer().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("Only the employer of this job can view the applicant's resume");

        return resumeMapper.mapEntityToDto(application.getResume());
    }

    // the jobseeker opens the pdf of his own resume
    public ResumeFileRespDto getFile(Long id, String loggedInUsername) throws IOException {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESUME_NOT_FOUND));
        checkOwner(resume, loggedInUsername);
        return readFile(resume);
    }

    // the employer opens the pdf of the resume attached to an application of his own job
    public ResumeFileRespDto getFileByApplicationId(Long jobApplicationId, String loggedInUsername) throws IOException {
        JobApplication application = jobApplicationRepository.findById(jobApplicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Job application not found"));

        if (!application.getJob().getEmployer().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("Only the employer of this job can view the applicant's resume");

        return readFile(application.getResume());
    }

    private ResumeFileRespDto readFile(Resume resume) throws IOException {
        Path folder = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path file = folder.resolve(resume.getFilePath()).normalize();

        if (!file.startsWith(folder) || !Files.isRegularFile(file)) {
            log.warn("Resume file not found. Looking for: {}", file);
            throw new ResourceNotFoundException("Resume file is not available on the server");
        }

        return new ResumeFileRespDto(resume.getFileName(), Files.readAllBytes(file));
    }

    private void checkOwner(Resume resume, String loggedInUsername) {
        // compare the resume owner's username with the logged-in username
        if (!resume.getJobSeeker().getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("This resume belongs to another job seeker");
    }

    // jobseeker turns sharing on/off for one of his own resumes
    @Transactional
    public void setShared(Long id, boolean shared, String loggedInUsername) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESUME_NOT_FOUND));
        checkOwner(resume, loggedInUsername);
        resume.setShared(shared);
        resumeRepository.save(resume);
    }

    // employer sees only the resumes the candidate has chosen to share
    public List<ResumeRespDto> getSharedByJobSeekerId(Long jobSeekerId) {
        return resumeRepository.findByJobSeekerIdAndSharedTrueOrderByUploadedAtDesc(jobSeekerId)
                .stream()
                .map(resumeMapper::mapEntityToDto)
                .toList();
    }

    // employer opens a shared pdf; a private resume is refused
    public ResumeFileRespDto getSharedFile(Long id) throws IOException {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESUME_NOT_FOUND));
        if (!resume.isShared())
            throw new OwnershipException("This resume is not shared with employers");
        return readFile(resume);
    }

}