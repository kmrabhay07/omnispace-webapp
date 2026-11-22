package com.omnispace;

import com.omnispace.security.OriginProxyFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import static org.assertj.core.api.Assertions.*;

class OriginProxyTest {
    static final String SECRET = "test-only-origin-secret-never-used-in-production";
    @Test void missingOrSpoofedSecretCannotReachApi() throws Exception {
        for (String secret : new String[]{"", "spoofed"}) {
            var request = new MockHttpServletRequest("GET", "/api/designs");
            request.addHeader("X-Omnispace-Proxy", secret);
            var response = new MockHttpServletResponse();
            boolean[] reached = {false};
            new OriginProxyFilter(true, SECRET).doFilter(request, response, (a,b)->reached[0]=true);
            assertThat(reached[0]).isFalse(); assertThat(response.getStatus()).isEqualTo(404);
            assertThat(response.getContentAsString()).doesNotContain(SECRET);
        }
    }
    @Test void trustedProxyContinuesToTheExistingAuthenticationChain() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/designs"); request.addHeader("X-Omnispace-Proxy", SECRET);
        boolean[] reached = {false};
        new OriginProxyFilter(true, SECRET).doFilter(request,new MockHttpServletResponse(),(a,b)->reached[0]=true);
        assertThat(reached[0]).isTrue();
    }
    @Test void enabledGuardCannotStartWithMissingSecret() {
        assertThatThrownBy(()->new OriginProxyFilter(true, "")).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void localDevelopmentDoesNotRequireAProxyAndHealthRemainsAvailable() throws Exception {
        boolean[] reached={false};
        new OriginProxyFilter(false, "").doFilter(new MockHttpServletRequest("GET","/api/properties"),new MockHttpServletResponse(),(a,b)->reached[0]=true);
        assertThat(reached[0]).isTrue();
        reached[0]=false;
        new OriginProxyFilter(true, SECRET).doFilter(new MockHttpServletRequest("GET","/"),new MockHttpServletResponse(),(a,b)->reached[0]=true);
        assertThat(reached[0]).isTrue();
    }
}
