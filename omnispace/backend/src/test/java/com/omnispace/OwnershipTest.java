package com.omnispace;
import com.omnispace.dto.PropertyRequest;
import com.omnispace.model.*;
import com.omnispace.repository.*;
import com.omnispace.service.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class OwnershipTest {
    PropertyRepository properties = mock(PropertyRepository.class);
    MongoTemplate mongo = mock(MongoTemplate.class);
    PropertyService service = new PropertyService(properties, mongo);
    User owner = user("owner"), other = user("other");
    static User user(String id) { User user = new User(); user.setId(id); user.setName(id); return user; }
    Property property(String status) { Property p = new Property(); p.setId("p1"); p.setOwnerId("owner"); p.setStatus(status); return p; }
    @Test void strangersCannotReadDraftOrChangeOrDeleteSomeoneElsesListing() {
        when(properties.findById("p1")).thenReturn(Optional.of(property("DRAFT")));
        assertThatThrownBy(() -> service.read("p1", other)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.read("p1", null)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.update("p1", new PropertyRequest(), other)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.delete("p1", other)).isInstanceOf(ResponseStatusException.class);
        verify(properties, never()).save(any()); verify(properties, never()).delete(any(Property.class));
    }
    @Test void ownerCanReadDraftAndPublicCanReadPublished() {
        when(properties.findById("p1")).thenReturn(Optional.of(property("DRAFT")));
        assertThat(service.read("p1",owner).getId()).isEqualTo("p1");
        when(properties.findById("p1")).thenReturn(Optional.of(property("PUBLISHED")));
        assertThat(service.read("p1",null).getId()).isEqualTo("p1");
    }
    @Test void publicationRequiresRealUploadedPhoto() {
        PropertyRequest input = new PropertyRequest(); input.setStatus("PUBLISHED");
        assertThatThrownBy(() -> service.create(input,owner)).isInstanceOf(ResponseStatusException.class);
        verify(properties,never()).save(any());
    }
    @Test void createdListingUsesAuthenticatedOwnerAndExplicitAmenities() {
        PropertyRequest input = new PropertyRequest(); input.setTitle("Home"); input.setLocation("Bengaluru");
        input.setCurrency("INR"); input.setStatus("DRAFT"); input.setAmenities(List.of("Lift"));
        when(properties.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        Property saved = service.create(input,owner);
        assertThat(saved.getOwnerId()).isEqualTo("owner");
        assertThat(saved.getAmenities()).containsExactly("Lift");
        assertThat(saved.getFeaturedImage()).isEmpty();
    }
    @Test void designPhotosAndCeilingSurviveSaveAndOwnershipIsServerControlled() {
        DesignProjectRepository repo = mock(DesignProjectRepository.class);
        DesignService designs = new DesignService(repo,service);
        DesignProject input = new DesignProject(); input.setId("injected"); input.setUserId("other");
        input.setName("Room"); input.setRoomPhoto("data:image/webp;base64,AAAA"); input.setCeilingHeight(12.0);
        DesignProject.PlacedFurniture item = new DesignProject.PlacedFurniture(); item.setImageData("data:image/png;base64,AAAA");
        input.setPlacedFurniture(List.of(item));
        when(repo.save(any())).thenAnswer(call -> call.getArgument(0));
        DesignProject saved = designs.save(null,input,owner);
        assertThat(saved.getId()).isNull(); assertThat(saved.getUserId()).isEqualTo("owner");
        assertThat(saved.getRoomPhoto()).isEqualTo(input.getRoomPhoto());
        assertThat(saved.getCeilingHeight()).isEqualTo(12.0);
        assertThat(saved.getPlacedFurniture().get(0).getImageData()).isEqualTo(item.getImageData());
    }
    @Test void otherUsersCannotReadUpdateOrDeleteDesigns() {
        DesignProjectRepository repo = mock(DesignProjectRepository.class);
        DesignService designs = new DesignService(repo,service);
        when(repo.findByIdAndUserId("d1","other")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> designs.owned("d1",other)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> designs.save("d1",new DesignProject(),other)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> designs.delete("d1",other)).isInstanceOf(ResponseStatusException.class);
        verify(repo,never()).save(any()); verify(repo,never()).delete(any(DesignProject.class));
    }
    @Test void concurrentDesignSaveReturnsConflict() {
        DesignProjectRepository repo = mock(DesignProjectRepository.class);
        DesignProject existing = new DesignProject(); existing.setVersion(3L);
        when(repo.findByIdAndUserId("d1","owner")).thenReturn(Optional.of(existing));
        DesignProject stale = new DesignProject(); stale.setVersion(2L);
        assertThatThrownBy(() -> new DesignService(repo,service).save("d1",stale,owner))
            .isInstanceOf(ResponseStatusException.class).hasMessageContaining("409");
        verify(repo,never()).save(any());
    }
    @Test void svgAndRemoteImagesAreRejected() {
        assertThatThrownBy(() -> ImageData.validate("data:image/svg+xml;base64,AAAA")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> ImageData.validate("https://untrusted.invalid/photo")).isInstanceOf(ResponseStatusException.class);
    }
}
