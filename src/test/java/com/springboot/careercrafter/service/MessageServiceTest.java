package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.MessageReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.MessageRespDto;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.model.Message;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import com.springboot.careercrafter.repository.MessageRepository;
import com.springboot.careercrafter.repository.UserRepository;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @InjectMocks
    private MessageService messageService;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JobApplicationRepository jobApplicationRepository;
    @Mock
    private NotificationService notificationService;

    private User user(String name) {
        User u = new User();
        u.setUsername(name);
        return u;
    }

    private Message message(User sender, User receiver) {
        Message m = new Message();
        m.setSender(sender);
        m.setReceiver(receiver);
        return m;
    }

    // ---- add ----
    @Test
    void addTest() {
        MessageReqDto dto = new MessageReqDto("Hello");
        Message saved = new Message();
        saved.setId(5L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user("john")));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user("mary")));
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        CreatedRespDto response = messageService.add(1L, 2L, null, dto, "john");

        assertEquals(5L, response.id());
        assertEquals("Message sent", response.message());
        verify(messageRepository, times(1)).save(any(Message.class));
        verify(notificationService, times(1)).notifyUser(any(User.class), anyString(), any());
        verifyNoInteractions(jobApplicationRepository);
    }

    @Test
    void addTest_SenderNotFound() {
        MessageReqDto dto = new MessageReqDto("Hello");
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> messageService.add(1L, 2L, null, dto, "john"));
        verify(messageRepository, times(0)).save(any(Message.class));
    }

    // ---- getInbox / getSent ----
    @Test
    void getInboxTest() {
        MessageRespDto dto = new MessageRespDto(1L, 2L, "mary", 1L, "john", "Hi", false, Instant.now(), null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user("john")));
        when(messageRepository.getInbox(1L)).thenReturn(List.of(dto));

        assertEquals(1, messageService.getInbox(1L, "john").size());
        verify(messageRepository, times(1)).getInbox(1L);
    }

    @Test
    void getSentTest() {
        MessageRespDto dto = new MessageRespDto(1L, 1L, "john", 2L, "mary", "Hi", false, Instant.now(), null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user("john")));
        when(messageRepository.getSent(1L)).thenReturn(List.of(dto));

        assertEquals(1, messageService.getSent(1L, "john").size());
        verify(messageRepository, times(1)).getSent(1L);
    }

    // ---- getConversation ----
    @Test
    void getConversationTest() {
        MessageRespDto dto = new MessageRespDto(1L, 1L, "john", 2L, "mary", "Hi", false, Instant.now(), null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user("john")));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user("mary")));
        when(messageRepository.getConversation(1L, 2L)).thenReturn(List.of(dto));

        assertEquals(1, messageService.getConversation(1L, 2L, "john").size());
    }

    // ---- deleteById ----
    @Test
    void deleteByIdTest() {
        Message m = message(user("john"), user("mary"));
        when(messageRepository.findById(1L)).thenReturn(Optional.of(m));

        messageService.deleteById(1L, "john");

        verify(messageRepository, times(1)).delete(m);
    }

    // ---- markRead : valid ----
    @Test
    void markReadTest() {
        Message m = message(user("john"), user("mary"));
        when(messageRepository.findById(1L)).thenReturn(Optional.of(m));

        messageService.markRead(1L, "mary"); // receiver marks it read

        assertTrue(m.isRead());
        verify(messageRepository, times(1)).save(m);
    }
}
