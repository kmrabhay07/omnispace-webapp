package com.omnispace.service;
import java.util.Base64;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.server.ResponseStatusException;
public final class ImageData {
    private ImageData() {}
    public static void validate(String value) {
        if (value == null || value.isBlank()) return;
        if (value.length() > 700000 || !value.matches("data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload a compressed JPG, PNG or WebP image");
    }
    public record Image(MediaType type, byte[] bytes) {}

    public static Optional<Image> decode(String value) {
        try {
            validate(value);
            int separator = value.indexOf(',');
            if (separator < 0) return Optional.empty();
            MediaType type = MediaType.parseMediaType(value.substring(5, separator - ";base64".length()));
            byte[] bytes = Base64.getDecoder().decode(value.substring(separator + 1));
            return bytes.length == 0 ? Optional.empty() : Optional.of(new Image(type, bytes));
        } catch (IllegalArgumentException | ResponseStatusException ex) {
            return Optional.empty();
        }
    }
}
