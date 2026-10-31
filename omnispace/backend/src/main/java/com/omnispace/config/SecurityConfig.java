package com.omnispace.config;
import com.omnispace.security.JwtAuthFilter;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    @Bean public JwtAuthFilter jwtAuthFilter() { return new JwtAuthFilter(); }
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    @Bean public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http.cors(cors -> {}).csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((req, res, ex) -> res.sendError(401, "Sign in to continue"))
                .accessDeniedHandler((req, res, ex) -> res.sendError(403, "Access denied")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers("/api/properties/mine").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/properties", "/api/properties/*", "/api/furniture/**").permitAll()
                .requestMatchers("/api/furniture/**").hasRole("ADMIN")
                .requestMatchers("/api/properties/**", "/api/designs/**", "/api/conversations/**", "/api/auth/me").authenticated()
                .anyRequest().denyAll())
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class).build();
    }
}
