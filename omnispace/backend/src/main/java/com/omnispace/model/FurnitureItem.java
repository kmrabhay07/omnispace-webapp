package com.omnispace.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "furniture_items")
public class FurnitureItem {
    @Id
    private String id;
    
    private String name;
    private String category; // Living Room, Bedroom, Kitchen, Bathroom, Office, Decor
    private String iconSvg;
    private Double defaultWidth;  // in feet or relative units
    private Double defaultHeight; // in feet or relative units
    private String defaultColor;
    private String description;
    private Double price;
}
