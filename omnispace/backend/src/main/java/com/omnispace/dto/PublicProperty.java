package com.omnispace.dto;

import com.omnispace.model.Property;
import java.time.Instant;
import java.util.List;

public record PublicProperty(
        String id, String title, String description, String propertyType, String category,
        Double price, String currency, String currencySymbol, String location, Integer bedrooms,
        Double bathrooms, Double areaSqFt, String furnishingStatus, List<String> amenities,
        String status, String ownerName, List<String> images, String featuredImage, String floorPlanImage,
        Instant createdAt, Instant updatedAt) {
    public static PublicProperty from(Property property, boolean detail) {
        return new PublicProperty(property.getId(), property.getTitle(), property.getDescription(),
                property.getPropertyType(), property.getCategory(), property.getPrice(), property.getCurrency(),
                property.getCurrencySymbol(), property.getLocation(), property.getBedrooms(), property.getBathrooms(),
                property.getAreaSqFt(), property.getFurnishingStatus(), property.getAmenities(),
                property.getStatus(), property.getOwnerName(), detail ? property.getImages() : List.of(),
                detail ? property.getFeaturedImage() : null, detail ? property.getFloorPlanImage() : null,
                property.getCreatedAt(), property.getUpdatedAt());
    }
}
