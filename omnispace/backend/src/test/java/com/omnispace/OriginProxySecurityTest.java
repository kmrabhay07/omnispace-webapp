package com.omnispace;

import com.omnispace.config.*;
import com.omnispace.controller.*;
import com.omnispace.repository.UserRepository;
import com.omnispace.security.*;
import com.omnispace.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;

@WebMvcTest({PropertyController.class,DesignController.class})
@Import({SecurityConfig.class,CorsConfig.class,CurrentUser.class})
@TestPropertySource(properties={"app.proxy.required=true","app.proxy.secret=test-only-origin-key-not-a-real-secret-12345"})
class OriginProxySecurityTest {
    static final String SECRET="test-only-origin-key-not-a-real-secret-12345";
    @Autowired MockMvc mvc;
    @MockBean PropertyService properties;
    @MockBean DesignService designs;
    @MockBean UserRepository users;
    @MockBean UserDetailsServiceImpl userDetails;
    @MockBean JwtTokenProvider tokens;

    @Test void directOriginRequestsCannotReachPublicOrPrivateControllers() throws Exception {
        for(String path:new String[]{"/api/properties","/api/designs"})
            mvc.perform(get(path)).andExpect(status().isNotFound());
        mvc.perform(get("/api/properties").header("X-Omnispace-Proxy","spoofed")).andExpect(status().isNotFound());
        verifyNoInteractions(properties,designs);
    }
    @Test void trustedProxyDoesNotReplaceUserAuthentication() throws Exception {
        mvc.perform(get("/api/properties").header("X-Omnispace-Proxy",SECRET)).andExpect(status().isOk());
        mvc.perform(get("/api/designs").header("X-Omnispace-Proxy",SECRET)).andExpect(status().isUnauthorized());
        verifyNoInteractions(designs);
    }
}
