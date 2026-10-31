package com.omnispace.dto;
import jakarta.validation.constraints.*;
import java.util.List;
import lombok.Data;
@Data
public class PropertyRequest {
    @NotBlank @Size(max = 160) private String title;
    @Size(max = 10000) private String description;
    @NotBlank @Pattern(regexp = "RESIDENTIAL|COMMERCIAL") private String propertyType;
    @NotBlank @Size(max = 50) private String category;
    @NotNull @Positive private Double price;
    @NotBlank @Pattern(regexp = "INR|USD|EUR|GBP|AED") private String currency;
    @NotBlank @Size(max = 200) private String location;
    @Size(max = 500) private String address;
    @DecimalMin("-90") @DecimalMax("90") private Double latitude;
    @DecimalMin("-180") @DecimalMax("180") private Double longitude;
    @Min(0) @Max(100) private Integer bedrooms;
    @DecimalMin("0") @DecimalMax("100") private Double bathrooms;
    @Positive @Max(10000000) private Double areaSqFt;
    @Size(max = 50) private String furnishingStatus;
    @Size(max = 30) private List<@NotBlank @Size(max = 80) String> amenities = List.of();
    @Size(max = 8) private List<@NotBlank @Size(max = 700000) String> images = List.of();
    @Size(max = 700000) private String floorPlanImage;
    @Size(max = 100) private String ownerContact;
    @NotNull @Pattern(regexp = "DRAFT|PUBLISHED") private String status = "DRAFT";
}
