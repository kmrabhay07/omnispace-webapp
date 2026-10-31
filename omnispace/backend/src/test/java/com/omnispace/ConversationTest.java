package com.omnispace;
import com.omnispace.model.*;
import com.omnispace.repository.*;
import com.omnispace.service.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class ConversationTest {
    ConversationRepository conversations = mock(ConversationRepository.class);
    MessageRepository messages = mock(MessageRepository.class);
    PropertyService properties = mock(PropertyService.class);
    UserRepository users = mock(UserRepository.class);
    ConversationService service = new ConversationService(conversations,messages,properties,users);
    Conversation fixture() { Conversation c=new Conversation();c.setId("c1");c.setPropertyId("p1");c.setOwnerId("owner");c.setBuyerId("buyer");c.setBuyerName("Buyer");c.setOwnerName("Owner");return c; }
    @Test void strangerCannotReadOrSendInConversation() {
        when(conversations.findById("c1")).thenReturn(Optional.of(fixture()));
        User stranger=OwnershipTest.user("stranger");
        assertThatThrownBy(() -> service.messages("c1",0,stranger)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.send("c1","Hello",stranger)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(messages);
    }
    @Test void senderAndReceiverComeFromParticipantsNotClientIdentity() {
        when(conversations.findById("c1")).thenReturn(Optional.of(fixture()));
        when(messages.save(any())).thenAnswer(call -> call.getArgument(0));
        Message sent=service.send("c1","Hello",OwnershipTest.user("buyer"));
        assertThat(sent.getSenderId()).isEqualTo("buyer");assertThat(sent.getReceiverId()).isEqualTo("owner");
        assertThat(sent.isOwner()).isFalse();assertThat(sent.getConversationId()).isEqualTo("c1");
        Message reply=service.send("c1","Hi",OwnershipTest.user("owner"));
        assertThat(reply.getReceiverId()).isEqualTo("buyer");assertThat(reply.isOwner()).isTrue();
    }
    @Test void buyersOnSamePropertyGetDifferentConversations() {
        Property property=new Property();property.setId("p1");property.setOwnerId("owner");property.setStatus("PUBLISHED");
        when(properties.read(eq("p1"),any())).thenReturn(property);
        when(users.findById("owner")).thenReturn(Optional.of(OwnershipTest.user("owner")));
        when(conversations.insert(any(Conversation.class))).thenAnswer(call -> call.getArgument(0));
        Conversation first=service.start("p1",OwnershipTest.user("buyer-a"));
        Conversation second=service.start("p1",OwnershipTest.user("buyer-b"));
        assertThat(first.getId()).isNotEqualTo(second.getId());
    }
}
