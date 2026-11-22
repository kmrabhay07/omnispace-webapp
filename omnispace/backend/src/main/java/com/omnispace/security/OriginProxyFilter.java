package com.omnispace.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.web.filter.OncePerRequestFilter;

/** Origin protection supplements JWT/ownership checks; it never authenticates a user. */
public class OriginProxyFilter extends OncePerRequestFilter {
    private final boolean required;
    private final byte[] secret;

    public OriginProxyFilter(boolean required, String secret) {
        if (required && secret.length() < 32) throw new IllegalArgumentException("Origin proxy protection requires a secret of at least 32 characters");
        this.required = required;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path.isEmpty()) path = request.getRequestURI().substring(request.getContextPath().length());
        return !required || !(path.equals("/api") || path.startsWith("/api/"));
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String provided = request.getHeader("X-Omnispace-Proxy");
        if (provided == null || !MessageDigest.isEqual(secret, provided.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(404); response.setContentType("application/json");
            response.setHeader("Cache-Control", "no-store");
            response.getWriter().write("{\"message\":\"Not found\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
