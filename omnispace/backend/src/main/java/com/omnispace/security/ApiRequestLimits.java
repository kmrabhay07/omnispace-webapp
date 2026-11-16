package com.omnispace.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.filter.OncePerRequestFilter;

public final class ApiRequestLimits extends OncePerRequestFilter {
    private static final long WINDOW = Duration.ofMinutes(1).toNanos();
    private final Budget login = new Budget(30, 240);
    private final Budget signup = new Budget(12, 120);
    private final Budget browse = new Budget(240, 2400);
    private final Budget write = new Budget(30, 180);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        String method = request.getMethod();
        Budget budget = null;
        int maxBody = 0;
        if ("POST".equals(method) && "/api/auth/login".equals(path)) {
            budget = login;
            maxBody = 8192;
        } else if ("POST".equals(method) && "/api/auth/register".equals(path)) {
            budget = signup;
            maxBody = 8192;
        } else if ("GET".equals(method) && matches(path, "/api/properties")) {
            budget = browse;
        } else if (("POST".equals(method) || "PUT".equals(method))
                && (matches(path, "/api/properties") || matches(path, "/api/designs"))) {
            budget = write;
            maxBody = 7_000_000;
        }

        if (budget != null && !budget.allow(request.getRemoteAddr())) {
            response.setHeader("Retry-After", "60");
            reject(response, 429, "Too many requests. Try again in a minute.");
            return;
        }
        if (maxBody == 0) {
            chain.doFilter(request, response);
            return;
        }
        if (request.getContentLengthLong() > maxBody) {
            reject(response, 413, "Request body is too large.");
            return;
        }
        byte[] body = request.getInputStream().readNBytes(maxBody + 1);
        if (body.length > maxBody) {
            reject(response, 413, "Request body is too large.");
            return;
        }
        chain.doFilter(new HttpServletRequestWrapper(request) {
            private final ByteArrayInputStream bytes = new ByteArrayInputStream(body);
            private final ServletInputStream stream = new ServletInputStream() {
                @Override public int read() { return bytes.read(); }
                @Override public int read(byte[] target, int offset, int length) {
                    return bytes.read(target, offset, length);
                }
                @Override public boolean isFinished() { return bytes.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) {
                    throw new UnsupportedOperationException("Asynchronous reads are unavailable");
                }
            };
            @Override public ServletInputStream getInputStream() { return stream; }
        }, response);
    }

    private static boolean matches(String path, String base) {
        return path.equals(base) || path.startsWith(base + "/");
    }

    private static void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }

    private static final class Budget {
        private final Map<String, Integer> clients = new HashMap<>();
        private final int clientLimit;
        private final int totalLimit;
        private long windowStarted = System.nanoTime();
        private int total;

        Budget(int clientLimit, int totalLimit) {
            this.clientLimit = clientLimit;
            this.totalLimit = totalLimit;
        }

        synchronized boolean allow(String address) {
            long now = System.nanoTime();
            if (now - windowStarted >= WINDOW) {
                clients.clear();
                total = 0;
                windowStarted = now;
            }
            int count = clients.getOrDefault(address, 0);
            if (total >= totalLimit || count >= clientLimit) return false;
            clients.put(address, count + 1);
            total++;
            return true;
        }
    }
}
