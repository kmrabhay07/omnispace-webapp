package com.omnispace;
import com.omnispace.config.*;
import com.omnispace.controller.*;
import com.omnispace.repository.UserRepository;
import com.omnispace.model.Property;
import com.omnispace.security.*;
import com.omnispace.service.*;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@WebMvcTest({PropertyController.class, DesignController.class, ConversationController.class})
@Import({SecurityConfig.class, CorsConfig.class, CurrentUser.class})
class ApiSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean PropertyService properties;
    @MockitoBean DesignService designs;
    @MockitoBean ConversationService conversations;
    @MockitoBean UserRepository users;
    @MockitoBean UserDetailsServiceImpl userDetails;
    @MockitoBean JwtTokenProvider tokens;
    @Test void publicCanBrowseListings() throws Exception {
        mvc.perform(get("/api/properties")).andExpect(status().isOk());
    }
    @Test void publicListingResponsesOmitPrivateFieldsAndKeepCoverSeparate() throws Exception {
        Property property = new Property();
        property.setId("p1");
        property.setStatus("PUBLISHED");
        property.setOwnerId("owner");
        property.setOwnerContact("private");
        property.setAddress("private");
        property.setLatitude(12.0);
        property.setLongitude(77.0);
        property.setFeaturedImage("data:image/png;base64,AAAA");
        when(properties.findFiltered(null, null, null, null, null, null, 0, "newest", null))
            .thenReturn(List.of(property));
        when(properties.read("p1", null)).thenReturn(property);
        when(properties.publicCover("p1")).thenReturn(Optional.of(property.getFeaturedImage()));

        mvc.perform(get("/api/properties")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].featuredImage").doesNotExist())
            .andExpect(jsonPath("$[0].ownerContact").doesNotExist());
        mvc.perform(get("/api/properties/p1")).andExpect(status().isOk())
            .andExpect(jsonPath("$.ownerId").doesNotExist())
            .andExpect(jsonPath("$.ownerContact").doesNotExist())
            .andExpect(jsonPath("$.address").doesNotExist())
            .andExpect(jsonPath("$.latitude").doesNotExist())
            .andExpect(jsonPath("$.longitude").doesNotExist());
        mvc.perform(get("/api/properties/p1/cover")).andExpect(status().isOk())
            .andExpect(content().contentType("image/png"));
        mvc.perform(get("/api/properties/draft/cover")).andExpect(status().isNotFound());
    }

    @Test void oversizedLoginIsRejectedBeforeBinding() throws Exception {
        mvc.perform(post("/api/auth/login").with(request -> {
            request.setRemoteAddr("192.0.2.11");
            return request;
        }).contentType("application/json").content("x".repeat(8193)))
            .andExpect(status().isPayloadTooLarge());
    }

    @Test void repeatedLoginRequestsAreThrottledByClient() throws Exception {
        for (int attempt = 0; attempt < 30; attempt++) {
            mvc.perform(post("/api/auth/login").with(request -> {
                request.setRemoteAddr("192.0.2.10");
                return request;
            })).andExpect(status().isNotFound());
        }
        mvc.perform(post("/api/auth/login").with(request -> {
            request.setRemoteAddr("192.0.2.10");
            return request;
        })).andExpect(status().isTooManyRequests());
    }

    @Test void anonymousCannotWriteOrReadPrivateData() throws Exception {
        for (String path : List.of("/api/properties", "/api/designs", "/api/conversations"))
            mvc.perform(post(path).contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        for (String path : List.of("/api/properties/mine", "/api/designs", "/api/designs/d1", "/api/conversations", "/api/conversations/c1/messages"))
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/properties/p1").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/properties/p1")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/designs/d1")).andExpect(status().isUnauthorized());
        verifyNoInteractions(properties, designs, conversations);
    }
    @Test void invalidBearerDoesNotAuthenticate() throws Exception {
        when(tokens.validateJwtToken("invalid")).thenReturn(false);
        mvc.perform(get("/api/designs").header("Authorization", "Bearer invalid")).andExpect(status().isUnauthorized());
    }
    @Test void arbitraryOriginsAreRejected() throws Exception {
        mvc.perform(options("/api/designs").header("Origin","https://untrusted.invalid")
            .header("Access-Control-Request-Method","GET")).andExpect(status().isForbidden());
    }
    @Test void deployedFrontendCanPreflightRegistration() throws Exception {
        mvc.perform(options("/api/auth/register")
            .header("Origin", "https://omnispace-webapp-x3xh.vercel.app")
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "content-type"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "https://omnispace-webapp-x3xh.vercel.app"));
    }
    @Test void lookalikeFrontendIsRejected() throws Exception {
        mvc.perform(options("/api/auth/register")
            .header("Origin", "https://omnispace-webapp-x3xh.vercel.app.attacker.invalid")
            .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isForbidden());
    }
    @Test void legacyMessageApiIsClosed() throws Exception {
        mvc.perform(get("/api/messages")).andExpect(status().isUnauthorized());
    }
}
