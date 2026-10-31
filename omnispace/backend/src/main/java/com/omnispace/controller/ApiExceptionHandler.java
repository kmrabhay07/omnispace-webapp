package com.omnispace.controller;
import java.util.Map;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> authentication(AuthenticationException ex) {
        return ResponseEntity.status(401).body(Map.of("message", "Email or password is incorrect"));
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> status(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason() == null ? "Request failed" : ex.getReason()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage()).findFirst().orElse("Invalid request");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
    @ExceptionHandler({DuplicateKeyException.class, OptimisticLockingFailureException.class})
    public ResponseEntity<?> conflict(Exception ex) {
        return ResponseEntity.status(409).body(Map.of("message", "This record changed or already exists. Reload and try again."));
    }
}
