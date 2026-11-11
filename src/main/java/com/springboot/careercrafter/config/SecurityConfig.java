package com.springboot.careercrafter.config;

import com.springboot.careercrafter.service.MyUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final MyUserDetailsService myUserDetailsService;
    private final JwtFilter jwtFilter;

    public static final String EMPLOYER = "EMPLOYER";
    private static final String JOB_SEEKER = "JOB_SEEKER";
    private static final String ADMIN = "ADMIN";

    @Bean
    public SecurityFilterChain defaultFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // onboarding APIs (Registration)
                        .requestMatchers(HttpMethod.POST, "/api/jobseeker/add").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/employer/add").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/admin/add").permitAll()

                        // login API and user details API
                        .requestMatchers(HttpMethod.GET, "/api/auth/login").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/auth/user-details").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/job/all", "/api/job/filter/v1", "/api/job/v1/{id}", "/api/job/v2/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/jobseeker/filter/v1", "/api/jobseeker/filter/v2").hasAnyAuthority(ADMIN, EMPLOYER)

                        // anyone can browse the jobs
                        .requestMatchers(HttpMethod.GET, "/api/job/all", "/api/job/filter/v1", "/api/job/v1/{id}").permitAll()

                        // EMPLOYER stats
                        .requestMatchers(HttpMethod.GET, "/api/stats/employer/**").hasAuthority(EMPLOYER)

                        // ADMIN
                        .requestMatchers(HttpMethod.PUT, "/api/employer/verify/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/stats/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/employer/all", "/api/employer/filter",
                                "/api/employer/verification/v1", "/api/jobseeker/all").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/notification/add/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/admin/by-username").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/admin/user-status", "/api/admin/job/**").hasAuthority(ADMIN)

                        // ADMIN OR EMPLOYER (employer searches the candidates)
                        .requestMatchers(HttpMethod.GET, "/api/jobseeker/filter/v1").hasAnyAuthority(ADMIN, EMPLOYER)

                        // EMPLOYER
                        .requestMatchers(HttpMethod.POST, "/api/job/add/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.POST, "/api/job/*/jd").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.GET, "/api/job/employer/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.PUT, "/api/job/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.DELETE, "/api/job/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.GET, "/api/jobApplication/job/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.POST, "/api/applicationStatusHistory/add/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.GET, "/api/applicationStatusHistory/employer/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.PUT, "/api/employer/{id}").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.DELETE, "/api/employer/{id}").hasAuthority(EMPLOYER)
                        // employer views the applicant's resume
                        .requestMatchers(HttpMethod.GET, "/api/resume/application/**").hasAuthority(EMPLOYER)
                        .requestMatchers(HttpMethod.GET, "/api/resume/shared/**").hasAuthority(EMPLOYER)

                        // JOB_SEEKER
                        .requestMatchers(HttpMethod.POST, "/api/jobApplication/add/**").hasAuthority(JOB_SEEKER)
                        .requestMatchers(HttpMethod.GET, "/api/jobApplication/applicant/**").hasAuthority(JOB_SEEKER)
                        .requestMatchers(HttpMethod.DELETE, "/api/jobApplication/**").hasAuthority(JOB_SEEKER)
                        .requestMatchers("/api/resume/**").hasAuthority(JOB_SEEKER)
                        .requestMatchers("/api/savedJob/**").hasAuthority(JOB_SEEKER)
                        .requestMatchers(HttpMethod.PUT, "/api/jobseeker/{id}").hasAuthority(JOB_SEEKER)
                        .requestMatchers(HttpMethod.DELETE, "/api/jobseeker/{id}").hasAuthority(JOB_SEEKER)
                        .requestMatchers(HttpMethod.GET, "/api/job/recommended/**").hasAuthority(JOB_SEEKER)

                        // JOB_SEEKER or EMPLOYER
                        .requestMatchers(HttpMethod.GET, "/api/jobApplication/{id}").hasAnyAuthority(JOB_SEEKER, EMPLOYER)
                        .requestMatchers(HttpMethod.GET, "/api/applicationStatusHistory/**").hasAnyAuthority(JOB_SEEKER, EMPLOYER)
                        .requestMatchers("/api/message/**").hasAnyAuthority(JOB_SEEKER, EMPLOYER)

                        // everything else (notifications, get employer / jobseeker...) needs a login
                        .anyRequest().authenticated()
                );
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        http.httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    public AuthenticationProvider getProvider() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(myUserDetailsService);
        authenticationProvider.setPasswordEncoder(getEncoder());
        return authenticationProvider;
    }

    @Bean
    public PasswordEncoder getEncoder() {
        return new BCryptPasswordEncoder();
    }
}
