package com.omnispace;
import com.omnispace.controller.AuthController;
import com.omnispace.dto.*;
import com.omnispace.model.User;
import com.omnispace.repository.UserRepository;
import com.omnispace.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.*;
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
    @Test void registrationNormalizesEmailWithoutIssuingSession() {
        AuthRequest.Register input = registration();
        when(encoder.encode("strongpassword")).thenReturn("hash");
        controller.register(input);
        verify(users).insert(argThat((User user) -> user.getEmail().equals("user@example.com")
            && user.getRole().equals("USER") && user.getPassword().equals("hash")));
        verifyNoInteractions(manager, tokens);
    }

    @Test void duplicateRegistrationDoesNotReplaceAccountOrIssueSession() {
        when(users.existsByEmailIgnoreCase("user@example.com")).thenReturn(true);
        controller.register(registration());
        verify(users, never()).insert(any(User.class));
        verifyNoInteractions(manager, tokens);
    }

    private AuthRequest.Register registration() {
        AuthRequest.Register input = new AuthRequest.Register();
        input.setName("User");
        input.setEmail("USER@example.com");
        input.setPassword("strongpassword");
        return input;
    }
}
