package com.springboot.careercrafter.model;

import jakarta.persistence.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "job_seekers")
public class JobSeeker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, length = 10)
    private String phone;

    @Column(length = 150)
    private String location;

    @Column(nullable = false,columnDefinition = "TEXT")
    private String education;

    @Column(nullable = false, length=1000)
    private String skills;

    @Column(nullable = false,columnDefinition = "TEXT")
    private String experience;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

}