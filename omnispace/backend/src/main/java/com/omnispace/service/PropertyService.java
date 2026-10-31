package com.omnispace.service;
import com.omnispace.dto.PropertyRequest;
import com.omnispace.model.*;
import com.omnispace.repository.PropertyRepository;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
@Service
@RequiredArgsConstructor
public class PropertyService {
    private final PropertyRepository properties;
    private final MongoTemplate mongoTemplate;
    public List<Property> findFiltered(String type, String category, String location,
            Double minPrice, Double maxPrice, Integer bedrooms, int page, String sort, String currency) {
        if (page < 0 || page > 10000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page");
        List<Criteria> clauses = new ArrayList<>();
        clauses.add(Criteria.where("status").is("PUBLISHED"));
        if (type != null && !type.isBlank()) clauses.add(Criteria.where("propertyType").is(type.toUpperCase(Locale.ROOT)));
        if (category != null && !category.isBlank()) clauses.add(Criteria.where("category").regex("^" + Pattern.quote(category.trim()) + "$", "i"));
        if (location != null && !location.isBlank()) clauses.add(Criteria.where("location").regex(Pattern.quote(location.trim()), "i"));
        if (minPrice != null || maxPrice != null) {
            Criteria price = Criteria.where("price");
            if (minPrice != null) price.gte(minPrice);
            if (maxPrice != null) price.lte(maxPrice);
            clauses.add(price);
        }
        if (currency != null && !currency.isBlank()) clauses.add(Criteria.where("currency").is(currency));
        if (bedrooms != null) clauses.add(Criteria.where("bedrooms").gte(bedrooms));
        Sort order = switch (sort) {
            case "price-asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("id"));
            case "price-desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.desc("id"));
            case "area" -> Sort.by(Sort.Order.desc("areaSqFt"), Sort.Order.desc("id"));
            default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        };
        Query query = new Query(new Criteria().andOperator(clauses)).with(PageRequest.of(page, 24, order));
        query.fields().exclude("images").exclude("floorPlanImage");
        return mongoTemplate.find(query, Property.class);
    }
    public List<Property> mine(User user) { return properties.findByOwnerIdOrderByUpdatedAtDesc(user.getId()); }
    public Property get(String id) {
        return properties.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
    }
    public Property read(String id, User user) {
        Property property = get(id);
        if (!"PUBLISHED".equals(property.getStatus()) && (user == null || !user.getId().equals(property.getOwnerId())))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found");
        return property;
    }
    public Property owned(String id, User user) {
        Property property = get(id);
        if (!user.getId().equals(property.getOwnerId()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found");
        return property;
    }
    public Property create(PropertyRequest input, User user) {
        Property property = new Property();
        property.setOwnerId(user.getId()); property.setOwnerName(user.getName()); property.setCreatedAt(Instant.now());
        apply(property, input);
        return properties.save(property);
    }
    public Property update(String id, PropertyRequest input, User user) {
        Property property = owned(id, user);
        apply(property, input);
        return properties.save(property);
    }
    public void delete(String id, User user) { properties.delete(owned(id, user)); }
    private void apply(Property p, PropertyRequest input) {
        List<String> images = input.getImages() == null ? List.of() : input.getImages();
        images.forEach(ImageData::validate); ImageData.validate(input.getFloorPlanImage());
        if ("PUBLISHED".equals(input.getStatus()) && images.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one property photo before publishing");
        p.setTitle(input.getTitle().trim()); p.setDescription(input.getDescription());
        p.setPropertyType(input.getPropertyType()); p.setCategory(input.getCategory()); p.setPrice(input.getPrice());
        p.setCurrency(input.getCurrency()); p.setCurrencySymbol(Map.of("INR","₹","USD","$","EUR","€","GBP","£","AED","د.إ").get(input.getCurrency()));
        p.setLocation(input.getLocation().trim()); p.setAddress(input.getAddress());
        p.setLatitude(input.getLatitude()); p.setLongitude(input.getLongitude());
        p.setBedrooms(input.getBedrooms()); p.setBathrooms(input.getBathrooms()); p.setAreaSqFt(input.getAreaSqFt());
        p.setFurnishingStatus(input.getFurnishingStatus()); p.setAmenities(input.getAmenities() == null ? List.of() : input.getAmenities());
        p.setImages(images); p.setFeaturedImage(images.isEmpty() ? "" : images.get(0));
        p.setFloorPlanImage(input.getFloorPlanImage()); p.setStatus(input.getStatus());
        p.setOwnerContact(input.getOwnerContact()); p.setUpdatedAt(Instant.now());
    }
}
