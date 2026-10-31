package com.omnispace;
import com.omnispace.config.*;
import com.omnispace.controller.*;
import com.omnispace.repository.UserRepository;
import com.omnispace.security.*;
import com.omnispace.service.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@WebMvcTest({PropertyController.class, DesignController.class, ConversationController.class})
@Import({SecurityConfig.class, CorsConfig.class, CurrentUser.class})
class ApiSecurityTest {
    @Autowired MockMvc mvc;
    @MockBean PropertyService properties;
    @MockBean DesignService designs;
    @MockBean ConversationService conversations;
    @MockBean UserRepository users;
    @MockBean UserDetailsServiceImpl userDetails;
    @MockBean JwtTokenProvider tokens;
    @Test void publicCanBrowseListings() throws Exception {
        mvc.perform(get("/api/properties")).andExpect(status().isOk());
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
    @Test void legacyMessageApiIsClosed() throws Exception {
        mvc.perform(get("/api/messages")).andExpect(status().isUnauthorized());
    }
}
