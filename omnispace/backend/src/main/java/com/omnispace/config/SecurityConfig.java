package com.omnispace.config;
import com.omnispace.security.JwtAuthFilter;
import com.omnispace.security.OriginProxyFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import com.omnispace.security.ApiRequestLimits;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.DispatcherType;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean public OriginProxyFilter originProxyFilter(
            @Value("${app.proxy.required:false}") boolean required,
            @Value("${app.proxy.secret:}") String secret) { return new OriginProxyFilter(required, secret); }
    @Bean public FilterRegistrationBean<OriginProxyFilter> originProxyRegistration(OriginProxyFilter filter) {
        FilterRegistrationBean<OriginProxyFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false); return registration;
    }
    @Bean public JwtAuthFilter jwtAuthFilter() { return new JwtAuthFilter(); }
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    @Bean public SecurityFilterChain filterChain(HttpSecurity http, OriginProxyFilter proxyFilter) throws Exception {
        return http.cors(cors -> {}).csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(401); res.setContentType("application/json");
                    res.getWriter().write("{\"message\":\"Sign in to continue\"}");
                })
                .accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(403); res.setContentType("application/json");
                    res.getWriter().write("{\"message\":\"Access denied\"}");
                }))
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers("/api/properties/mine").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/properties", "/api/properties/*", "/api/properties/*/cover", "/api/furniture/**").permitAll()
                .requestMatchers("/api/admin/**", "/api/furniture/**").hasRole("ADMIN")
                .requestMatchers("/api/properties/**", "/api/designs/**", "/api/conversations/**", "/api/auth/me").authenticated()
                .anyRequest().denyAll())
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(proxyFilter, JwtAuthFilter.class)
            .addFilterAfter(new ApiRequestLimits(), AuthorizationFilter.class).build();
    }
}
