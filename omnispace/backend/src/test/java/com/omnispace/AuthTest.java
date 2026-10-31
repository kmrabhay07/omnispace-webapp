package com.omnispace;
import com.omnispace.controller.AuthController;
import com.omnispace.dto.*;
import com.omnispace.model.User;
import com.omnispace.repository.UserRepository;
import com.omnispace.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class AuthTest {
    AuthenticationManager manager=mock(AuthenticationManager.class);UserRepository users=mock(UserRepository.class);
    PasswordEncoder encoder=mock(PasswordEncoder.class);JwtTokenProvider tokens=mock(JwtTokenProvider.class);CurrentUser current=mock(CurrentUser.class);
    AuthController controller=new AuthController(manager,users,encoder,tokens,current);
    @Test void wrongPasswordNeverCreatesSession() {
        when(manager.authenticate(any())).thenThrow(new BadCredentialsException("Wrong password"));
        AuthRequest.Login input=new AuthRequest.Login();input.setEmail("user@example.com");input.setPassword("wrong");
        assertThatThrownBy(() -> controller.login(input)).isInstanceOf(BadCredentialsException.class);
        verifyNoInteractions(tokens);
    }
    @Test void registrationReturnsServerIdentityAndToken() {
        Authentication authentication=new UsernamePasswordAuthenticationToken("user@example.com","ignored");
        User user=OwnershipTest.user("database-user");user.setEmail("user@example.com");
        when(manager.authenticate(any())).thenReturn(authentication);when(current.require(authentication)).thenReturn(user);
        when(tokens.generateToken(authentication)).thenReturn("server-signed-token");
        AuthRequest.Register input=new AuthRequest.Register();input.setName("User");input.setEmail("USER@example.com");input.setPassword("strongpassword");
        AuthResponse response=controller.register(input);
        assertThat(response.getId()).isEqualTo("database-user");assertThat(response.getToken()).isEqualTo("server-signed-token");
        verify(users).existsByEmailIgnoreCase("user@example.com");
    }
}
