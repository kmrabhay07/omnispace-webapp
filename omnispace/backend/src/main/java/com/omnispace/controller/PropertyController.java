package com.omnispace.controller;
import com.omnispace.dto.PropertyRequest;
import com.omnispace.dto.PublicProperty;
import com.omnispace.model.User;
import com.omnispace.service.ImageData;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import com.omnispace.model.*;
import com.omnispace.service.PropertyService;
import com.omnispace.security.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService properties;
    private final CurrentUser currentUser;
    @GetMapping
    public List<PublicProperty> list(@RequestParam(required=false) String type, @RequestParam(required=false) String category,
            @RequestParam(required=false) String location, @RequestParam(required=false) Double minPrice,
            @RequestParam(required=false) Double maxPrice, @RequestParam(required=false) Integer bedrooms,
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="newest") String sort,
            @RequestParam(required=false) String currency) {
        return properties.findFiltered(type, category, location, minPrice, maxPrice, bedrooms, page, sort, currency)
            .stream().map(property -> PublicProperty.from(property, false)).toList();
    }
    @GetMapping("/mine") public List<Property> mine(Authentication auth) { return properties.mine(currentUser.require(auth)); }
    @GetMapping("/{id}") public ResponseEntity<?> get(@PathVariable String id, Authentication auth) {
        User user = auth == null ? null : currentUser.require(auth);
        Property property = properties.read(id, user);
        Object body = user != null && user.getId().equals(property.getOwnerId())
            ? property : PublicProperty.from(property, true);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }
    @GetMapping("/{id}/cover")
    public ResponseEntity<byte[]> cover(@PathVariable String id) {
        ImageData.Image cover = properties.publicCover(id).flatMap(ImageData::decode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cover not found"));
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).contentType(cover.type()).body(cover.bytes());
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Property create(@Valid @RequestBody PropertyRequest input, Authentication auth) { return properties.create(input, currentUser.require(auth)); }
    @PutMapping("/{id}")
    public Property update(@PathVariable String id, @Valid @RequestBody PropertyRequest input, Authentication auth) { return properties.update(id, input, currentUser.require(auth)); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, Authentication auth) { properties.delete(id, currentUser.require(auth)); }
}
