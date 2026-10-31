package com.omnispace.service;
import com.omnispace.model.*;
import com.omnispace.repository.DesignProjectRepository;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
@Service
@RequiredArgsConstructor
public class DesignService {
    private final DesignProjectRepository designs;
    private final PropertyService properties;
    public List<DesignProject> list(User user) { return designs.findByUserIdOrderByUpdatedAtDesc(user.getId()); }
    public DesignProject owned(String id, User user) {
        return designs.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Design not found"));
    }
    public DesignProject save(String id, DesignProject input, User user) {
        DesignProject existing = id == null ? null : owned(id, user);
        if (existing != null && !Objects.equals(input.getVersion(), existing.getVersion()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Design changed in another session. Reload before saving.");
        if (input.getPropertyId() != null && !input.getPropertyId().isBlank()) properties.read(input.getPropertyId(), user);
        else input.setPropertyId(null);
        ImageData.validate(input.getRoomPhoto());
        if (input.getPlacedFurniture() == null) input.setPlacedFurniture(new ArrayList<>());
        long photos = input.getPlacedFurniture().stream().filter(p -> p.getImageData() != null && !p.getImageData().isEmpty()).count();
        if (photos > 5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use at most five furniture photos");
        input.getPlacedFurniture().forEach(p -> ImageData.validate(p.getImageData()));
        input.setId(id);
        input.setUserId(user.getId());
        input.setVersion(existing == null ? null : existing.getVersion());
        input.setCreatedAt(existing == null ? Instant.now() : existing.getCreatedAt());
        input.setUpdatedAt(Instant.now());
        return designs.save(input);
    }
    public void delete(String id, User user) { designs.delete(owned(id, user)); }
}
