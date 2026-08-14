package com.omnispace.controller;

import com.omnispace.model.FurnitureItem;
import com.omnispace.repository.FurnitureItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/furniture")
public class FurnitureController {

    @Autowired
    private FurnitureItemRepository furnitureRepository;

    @GetMapping
    public ResponseEntity<List<FurnitureItem>> getAllFurniture() {
        return ResponseEntity.ok(furnitureRepository.findAll());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<FurnitureItem>> getFurnitureByCategory(@PathVariable String category) {
        return ResponseEntity.ok(furnitureRepository.findByCategory(category));
    }

    @PostMapping
    public ResponseEntity<FurnitureItem> createFurniture(@RequestBody FurnitureItem item) {
        return ResponseEntity.ok(furnitureRepository.save(item));
    }
}
