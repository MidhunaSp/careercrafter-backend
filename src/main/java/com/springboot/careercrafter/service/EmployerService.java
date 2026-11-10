package com.springboot.careercrafter.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import com.springboot.careercrafter.dto.response.PagedRespDto;
import com.springboot.careercrafter.dto.request.EmployerReqDto;
import com.springboot.careercrafter.dto.request.EmployerUpdateDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.EmployerRespDto;
import com.springboot.careercrafter.enums.Role;
import com.springboot.careercrafter.enums.VerificationStatus;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.mapper.EmployerMapper;
import com.springboot.careercrafter.model.Employer;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.EmployerRepository;
import com.springboot.careercrafter.repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployerService {

    private final EmployerRepository employerRepository;
    private final EmployerMapper employerMapper;
    private final UserRepository userRepository;
    private final UserService userService;

    private static final String EMPLOYER_NOT_FOUND = "Employer not found";

    public CreatedRespDto add(@Valid EmployerReqDto employerReqDto) {
        // step 1: prepare user object and save it in db
        User user = userService.createUser(employerReqDto.username(),employerReqDto.password(),Role.EMPLOYER);

        // step 2: map employerreqdto to employer entity
        Employer employer = employerMapper.mapDtoToEntity(employerReqDto);

        // step 3: attach the user to employer
        employer.setUser(user);

        // step 4: set verification status as pending (admin will verify later)
        employer.setVerificationStatus(VerificationStatus.PENDING);

        // step 5: save employer and return id with message
        employer = employerRepository.save(employer);
        log.info("Employer registered: id={}, company={}", employer.getId(), employer.getCompanyName());
        return new CreatedRespDto(employer.getId(),"Employer created");
    }

    public EmployerRespDto getById(long employerId) {
        // step 1: fetch employer from db using employerid, throw exception if not found
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(()-> new ResourceNotFoundException(EMPLOYER_NOT_FOUND));

        // step 2: map employer entity to employerrespdto and return
        return employerMapper.mapEntityToDto(employer);
    }


    public List<EmployerRespDto> getByVerificationStatus(VerificationStatus status) {
        return employerRepository.findByVerificationStatus(status)
                .stream()
                .map(employerMapper::mapEntityToDto)
                .toList();
    }

    public EmployerRespDto getByUsername(String username) {
        Employer employer = employerRepository.findByUserUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employer not found with username: " + username));
        return employerMapper.mapEntityToDto(employer);
    }

    public List<EmployerRespDto> getAll() {
        return employerRepository.findAll()
                .stream()
                .map(employerMapper::mapEntityToDto)
                .toList();
    }

    public PagedRespDto<EmployerRespDto> filter(VerificationStatus status, String companyName, String fullName,
                                                int page, int size) {
        // blank text means "no filter"
        Page<EmployerRespDto> employerPage = employerRepository
                .filterEmployers(status,
                        StringUtils.hasText(companyName) ? companyName.trim() : null,
                        StringUtils.hasText(fullName) ? fullName.trim() : null,
                        PageRequest.of(page, size))
                .map(employerMapper::mapEntityToDto);
        return PagedRespDto.of(employerPage);
    }

    public void update(Long id, EmployerUpdateDto dto, String loggedInUsername) {
        Employer employer = employerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(EMPLOYER_NOT_FOUND));

        // check that the logged-in user owns this employer account
        if (!employer.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can update only your own employer account");

        boolean flag = false;

        if (StringUtils.hasText(dto.fullName())) {
            employer.setFullName(dto.fullName());
            flag = true;
        }
        if (StringUtils.hasText(dto.companyName())) {
            employer.setCompanyName(dto.companyName());
            flag = true;
        }
        if (StringUtils.hasText(dto.phone())) {
            employer.setPhone(dto.phone());
            flag = true;
        }

        if (!flag)
            throw new InvalidCallException("Update op terminated");

        employerRepository.save(employer);
    }

    @Transactional
    public void deleteById(Long id, String loggedInUsername) {
        Employer employer = employerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(EMPLOYER_NOT_FOUND));

        // check that the logged-in user owns this employer account
        if (!employer.getUser().getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can delete only your own employer account");

        User user = employer.getUser();

        employerRepository.delete(employer);
        userRepository.delete(user);
        userRepository.flush();
        log.info("Employer account deleted: id={}, username={}", id, loggedInUsername);
    }
}