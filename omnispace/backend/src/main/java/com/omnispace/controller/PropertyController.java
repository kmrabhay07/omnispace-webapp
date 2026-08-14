package com.omnispace.controller;

import com.omnispace.model.Property;
import com.omnispace.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    @Autowired
    private PropertyRepository propertyRepository;

    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer bedrooms
    ) {
        List<Property> properties = propertyRepository.findAll();

        if (type != null && !type.isEmpty()) {
            properties = properties.stream()
                    .filter(p -> p.getPropertyType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
        }
        if (category != null && !category.isEmpty()) {
            properties = properties.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }
        if (location != null && !location.isEmpty()) {
            properties = properties.stream()
                    .filter(p -> p.getLocation() != null && p.getLocation().toLowerCase().contains(location.toLowerCase()))
                    .collect(Collectors.toList());
        }
        if (minPrice != null) {
            properties = properties.stream()
                    .filter(p -> p.getPrice() != null && p.getPrice() >= minPrice)
                    .collect(Collectors.toList());
        }
        if (maxPrice != null) {
            properties = properties.stream()
                    .filter(p -> p.getPrice() != null && p.getPrice() <= maxPrice)
                    .collect(Collectors.toList());
        }
        if (bedrooms != null) {
            properties = properties.stream()
                    .filter(p -> p.getBedrooms() != null && p.getBedrooms() >= bedrooms)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(properties);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Property> getPropertyById(@PathVariable String id) {
        return propertyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Property> createProperty(@RequestBody Property property) {
        property.setCreatedAt(Instant.now());
        property.setUpdatedAt(Instant.now());
        Property saved = propertyRepository.save(property);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Property> updateProperty(@PathVariable String id, @RequestBody Property property) {
        return propertyRepository.findById(id)
                .map(existing -> {
                    property.setId(id);
                    property.setCreatedAt(existing.getCreatedAt());
                    property.setUpdatedAt(Instant.now());
                    return ResponseEntity.ok(propertyRepository.save(property));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable String id) {
        if (propertyRepository.existsById(id)) {
            propertyRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Property deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}
