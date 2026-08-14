package com.omnispace.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "design_projects")
public class DesignProject {
    @Id
    private String id;
    
    private String name;
    private String userId;
    private String propertyId; // Optional link to a property
    
    private Double roomWidth = 20.0;
    private Double roomHeight = 15.0;
    private String roomShape = "RECTANGLE"; // RECTANGLE, L_SHAPED
    private String wallColor = "#F5F5F7";
    private String floorColor = "#E2D4C3";
    private String floorTexture = "WOOD"; // WOOD, TILE, CARPET, CONCRETE
    
    private List<PlacedFurniture> placedFurniture = new ArrayList<>();
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlacedFurniture {
        private String instanceId;
        private String furnitureId;
        private String name;
        private String category;
        private Double x;
        private Double y;
        private Double width;
        private Double height;
        private Double rotation; // in degrees
        private String color;
        private String viewMode; // TOP_DOWN, FRONT
    }
}
