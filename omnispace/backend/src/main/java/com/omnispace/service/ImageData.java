package com.omnispace.service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
public final class ImageData {
    private ImageData() {}
    public static void validate(String value) {
        if (value == null || value.isBlank()) return;
        if (value.length() > 700000 || !value.matches("data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload a compressed JPG, PNG or WebP image");
    }
}
