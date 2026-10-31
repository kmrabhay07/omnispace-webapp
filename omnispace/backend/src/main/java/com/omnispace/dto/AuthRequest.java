package com.omnispace.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
public class AuthRequest {
    @Data public static class Login {
        @NotBlank @Email @Size(max = 254) private String email;
        @NotBlank @Size(max = 72) private String password;
    }
    @Data public static class Register {
        @NotBlank @Size(max = 100) private String name;
        @NotBlank @Email @Size(max = 254) private String email;
        @NotBlank @Size(min = 8, max = 72) private String password;
    }
}
