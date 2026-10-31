package com.omnispace.controller;
import com.omnispace.model.*;
import com.omnispace.service.ConversationService;
import com.omnispace.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversations;
    private final CurrentUser currentUser;
    public record Start(@NotBlank @Size(max=100) String propertyId) {}
    public record Send(@NotBlank @Size(max=4000) String content) {}
    @GetMapping public List<Conversation> list(Authentication auth) { return conversations.list(currentUser.require(auth)); }
    @PostMapping public Conversation start(@Valid @RequestBody Start input, Authentication auth) { return conversations.start(input.propertyId(), currentUser.require(auth)); }
    @GetMapping("/{id}/messages")
    public List<Message> messages(@PathVariable String id, @RequestParam(defaultValue="0") int page, Authentication auth) { return conversations.messages(id, page, currentUser.require(auth)); }
    @PostMapping("/{id}/messages") @ResponseStatus(HttpStatus.CREATED)
    public Message send(@PathVariable String id, @Valid @RequestBody Send input, Authentication auth) { return conversations.send(id, input.content(), currentUser.require(auth)); }
}
