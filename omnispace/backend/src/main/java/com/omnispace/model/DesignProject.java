package com.omnispace.model;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.*;
@Data
@Document(collection = "design_projects")
public class DesignProject {
    @Id private String id;
    @Version private Long version;
    @NotBlank @Size(max = 160) private String name;
    private String userId;
    private String propertyId;
    @NotNull @DecimalMin("4") @DecimalMax("100") private Double roomWidth = 20.0;
    @NotNull @DecimalMin("4") @DecimalMax("100") private Double roomHeight = 16.0;
    @NotNull @DecimalMin("6") @DecimalMax("30") private Double ceilingHeight = 10.0;
    @Pattern(regexp = "RECTANGLE") private String roomShape = "RECTANGLE";
    @NotNull @Pattern(regexp = "#[0-9A-Fa-f]{6}") private String wallColor = "#F5F5F7";
    @Pattern(regexp = "#[0-9A-Fa-f]{6}") private String floorColor = "#E2D4C3";
    @NotNull @Pattern(regexp = "WOOD|TILE|CARPET|CONCRETE") private String floorTexture = "WOOD";
    @Size(max = 700000) private String roomPhoto;
    @Size(max = 100) @Valid private List<PlacedFurniture> placedFurniture = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
    @Data
    public static class PlacedFurniture {
        @NotBlank @Size(max = 100) private String instanceId;
        @NotBlank @Size(max = 100) private String furnitureId;
        @NotBlank @Size(max = 160) private String name;
        @Size(max = 50) private String category;
        @NotNull @DecimalMin("0") @DecimalMax("100") private Double x;
        @NotNull @DecimalMin("0") @DecimalMax("100") private Double y;
        @NotNull @DecimalMin("0.1") @DecimalMax("100") private Double width;
        @NotNull @DecimalMin("0.1") @DecimalMax("100") private Double height;
        @NotNull @DecimalMin("-360") @DecimalMax("360") private Double rotation;
        @Pattern(regexp = "#[0-9A-Fa-f]{6}") private String color;
        @Pattern(regexp = "TOP_DOWN|FRONT") private String viewMode;
        @Size(max = 700000) private String imageData;
    }
}
