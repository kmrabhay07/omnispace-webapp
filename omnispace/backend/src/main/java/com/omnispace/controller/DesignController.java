package com.omnispace.controller;

import com.omnispace.model.DesignProject;
import com.omnispace.repository.DesignProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/designs")
public class DesignController {

    @Autowired
    private DesignProjectRepository designRepository;

    @GetMapping
    public ResponseEntity<List<DesignProject>> getAllDesigns(@RequestParam(required = false) String userId) {
        if (userId != null && !userId.isEmpty()) {
            return ResponseEntity.ok(designRepository.findByUserId(userId));
        }
        return ResponseEntity.ok(designRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DesignProject> getDesignById(@PathVariable String id) {
        return designRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DesignProject> createDesign(@RequestBody DesignProject design) {
        design.setCreatedAt(Instant.now());
        design.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(designRepository.save(design));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DesignProject> updateDesign(@PathVariable String id, @RequestBody DesignProject design) {
        return designRepository.findById(id)
                .map(existing -> {
                    design.setId(id);
                    design.setCreatedAt(existing.getCreatedAt());
                    design.setUpdatedAt(Instant.now());
                    return ResponseEntity.ok(designRepository.save(design));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDesign(@PathVariable String id) {
        if (designRepository.existsById(id)) {
            designRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Design deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}
