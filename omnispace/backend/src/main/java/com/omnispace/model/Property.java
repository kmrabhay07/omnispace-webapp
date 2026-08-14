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
@Document(collection = "properties")
public class Property {
    @Id
    private String id;
    
    private String title;
    private String description;
    private String propertyType; // RESIDENTIAL, COMMERCIAL
    private String category; // Apartment, Villa, Office, Retail, Studio, Penthouse
    private Double price;
    private String currency; // INR, USD, EUR, GBP, AED
    private String currencySymbol; // ₹, $, €, £, د.إ
    private String location;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double areaSqFt;
    private String furnishingStatus; // Furnished, Semi-Furnished, Unfurnished
    private List<String> amenities = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private String featuredImage;
    private String ownerId;
    private String ownerName;
    private String ownerContact;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}
