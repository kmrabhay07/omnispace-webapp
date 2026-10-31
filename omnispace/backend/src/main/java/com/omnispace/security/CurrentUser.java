package com.omnispace.security;
import com.omnispace.model.User;
import com.omnispace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
@Component
@RequiredArgsConstructor
public class CurrentUser {
    private final UserRepository users;
    public User require(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue");
        return users.findByEmailIgnoreCase(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session is no longer valid"));
    }
}
