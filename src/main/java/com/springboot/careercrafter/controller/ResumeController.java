package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.request.ResumeReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.ResumeFileRespDto;
import com.springboot.careercrafter.dto.response.ResumeRespDto;
import com.springboot.careercrafter.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/api/resume/add/{jobSeekerId}")
    public CreatedRespDto add(@PathVariable Long jobSeekerId,
                              @Valid @RequestBody ResumeReqDto dto,
                              Principal principal) {
        return resumeService.add(jobSeekerId, dto, principal.getName());
    }

    @GetMapping("/api/resume/jobseeker/{jobSeekerId}")
    public List<ResumeRespDto> getByJobSeekerId(@PathVariable Long jobSeekerId, Principal principal) {
        return resumeService.getByJobSeekerId(jobSeekerId, principal.getName());
    }

    @GetMapping("/api/resume/{id}")
    public ResumeRespDto getById(@PathVariable Long id, Principal principal) {
        return resumeService.getById(id, principal.getName());
    }

    @PutMapping("/api/resume/{id}/default")
    public void makeDefault(@PathVariable Long id, Principal principal) {
        resumeService.makeDefault(id, principal.getName());
    }

    @PutMapping("/api/resume/{id}")
    public void update(@PathVariable Long id, @Valid @RequestBody ResumeReqDto dto, Principal principal) {
        resumeService.update(id, dto, principal.getName());
    }

    @GetMapping("/api/resume/application/{jobApplicationId}")
    public ResumeRespDto getByApplicationId(@PathVariable Long jobApplicationId, Principal principal) {
        return resumeService.getByApplicationId(jobApplicationId, principal.getName());
    }

    @PostMapping("/api/resume/upload/{jobSeekerId}")
    public CreatedRespDto upload(@PathVariable Long jobSeekerId,
                                 @RequestParam("file") MultipartFile file,
                                 @RequestParam("label") String label,
                                 Principal principal) throws IOException {
        return resumeService.upload(jobSeekerId, file, label, principal.getName());
    }

    @DeleteMapping("/api/resume/{id}")
    public void deleteById(@PathVariable Long id, Principal principal) {
        resumeService.deleteById(id, principal.getName());
    }


    @GetMapping("/api/resume/{id}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable Long id, Principal principal) throws IOException {
        return pdfResponse(resumeService.getFile(id, principal.getName()));
    }

    @GetMapping("/api/resume/application/{jobApplicationId}/file")
    public ResponseEntity<byte[]> getFileByApplicationId(@PathVariable Long jobApplicationId,
                                                         Principal principal) throws IOException {
        return pdfResponse(resumeService.getFileByApplicationId(jobApplicationId, principal.getName()));
    }

    private ResponseEntity<byte[]> pdfResponse(ResumeFileRespDto file) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.fileName()).build().toString())
                .body(file.content());
    }

    @PutMapping("/api/resume/{id}/share")
    public void share(@PathVariable Long id, @RequestParam boolean shared, Principal principal) {
        resumeService.setShared(id, shared, principal.getName());
    }

    @GetMapping("/api/resume/shared/jobseeker/{jobSeekerId}")
    public List<ResumeRespDto> getShared(@PathVariable Long jobSeekerId) {
        return resumeService.getSharedByJobSeekerId(jobSeekerId);
    }

    @GetMapping("/api/resume/shared/{id}/file")
    public ResponseEntity<byte[]> getSharedFile(@PathVariable Long id) throws IOException {
        return pdfResponse(resumeService.getSharedFile(id));
    }
}