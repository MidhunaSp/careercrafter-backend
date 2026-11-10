package com.springboot.careercrafter.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "resumes")
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private JobSeeker jobSeeker;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(nullable = false, length = 150)
    private String label;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "is_shared", nullable = false, columnDefinition = "boolean default false")
    private boolean shared;

    @PrePersist
    void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}