package com.springboot.careercrafter.config;

import com.springboot.careercrafter.dto.response.ErrorRespDto;
import com.springboot.careercrafter.exception.InactiveUserException;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorRespDto> handleResourceNotFoundException(ResourceNotFoundException e) {
        log.warn("Resource not found: {}", e.getMessage());
        return ResponseEntity.badRequest().body(
                new ErrorRespDto(e.getMessage(),
                        "ID is not in DB",
                        Instant.now()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException e
    ) {
        Map<String, String> map = new HashMap<>();

        BindingResult bindingResult = e.getBindingResult();
        List<FieldError> list = bindingResult.getFieldErrors();
        list.forEach(fieldError -> {
            map.put(fieldError.getField(), fieldError.getDefaultMessage());
            log.warn("Field {} failed validation: {}", fieldError.getField(), fieldError.getDefaultMessage());
        });

        return ResponseEntity
                .badRequest()
                .body(map);
    }

    @ExceptionHandler(InvalidCallException.class)
    public ResponseEntity<ErrorRespDto> handleInvalidCallException(InvalidCallException e) {
        log.warn("Invalid call: {}", e.getMessage());
        return ResponseEntity
                .badRequest()
                .body(
                        new ErrorRespDto(e.getMessage(),
                                "Call is Invalid due to malformed data",
                                Instant.now())
                );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorRespDto> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        log.warn("Unreadable request body: {}", e.getMostSpecificCause().getMessage());
        return ResponseEntity
                .badRequest()
                .body(new ErrorRespDto("Request body is invalid",
                        e.getMostSpecificCause().getMessage(),
                        Instant.now()));
    }

    @ExceptionHandler(OwnershipException.class)
    public ResponseEntity<ErrorRespDto> handleOwnershipException(OwnershipException e) {
        log.warn("Ownership violation: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorRespDto(e.getMessage(),
                        "You are not allowed to access this resource",
                        Instant.now()));
    }

    @ExceptionHandler(InactiveUserException.class)
    public ResponseEntity<ErrorRespDto> handleInactiveUserException(InactiveUserException e) {
        log.warn("Inactive user: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorRespDto(e.getMessage(),
                        "Your account is suspended. Please contact the admin",
                        Instant.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorRespDto> handleAll(Exception e) {
        log.error("Unexpected error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorRespDto("Something went wrong. Please try again later.",
                        "Unexpected server error", Instant.now()));
    }
}
