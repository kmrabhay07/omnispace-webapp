package com.omnispace.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> rootStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "OmniSpace Real Estate & 2D Interior Design API",
                "version", "1.0.0",
                "propertiesEndpoint", "/api/properties",
                "furnitureEndpoint", "/api/furniture"
        ));
    }
}
