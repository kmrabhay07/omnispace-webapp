package com.omnispace.controller;
import com.omnispace.dto.*;
import com.omnispace.model.User;
import com.omnispace.repository.UserRepository;
import com.omnispace.security.*;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final CurrentUser currentUser;
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest.Login input) {
        return authenticate(input.getEmail().trim().toLowerCase(Locale.ROOT), input.getPassword());
    }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody AuthRequest.Register input) {
        String email = input.getEmail().trim().toLowerCase(Locale.ROOT);
        if (input.getPassword().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
        if (users.existsByEmailIgnoreCase(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        User user = new User();
        user.setName(input.getName().trim()); user.setEmail(email);
        user.setPassword(passwordEncoder.encode(input.getPassword())); user.setRole("USER");
        users.save(user);
        return authenticate(email, input.getPassword());
    }
    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        User user = currentUser.require(authentication);
        return new AuthResponse(null, "Bearer", user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
    private AuthResponse authenticate(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        User user = currentUser.require(authentication);
        return new AuthResponse(tokenProvider.generateToken(authentication), "Bearer",
            user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
