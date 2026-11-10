package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.NotificationReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.NotificationRespDto;
import com.springboot.careercrafter.enums.NotificationType;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.model.Notification;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.NotificationRepository;
import com.springboot.careercrafter.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @InjectMocks
    private NotificationService notificationService; // real service, mocks below are injected into it
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;

    // ---- add : valid ----
    @Test
    void addTest() {
        User user = new User();
        user.setId(1L);
        NotificationReqDto dto = new NotificationReqDto("Welcome to CareerCrafter", NotificationType.SYSTEM);

        Notification savedNotification = new Notification();
        savedNotification.setId(4L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        CreatedRespDto response = notificationService.add(1L, dto);

        assertEquals(4L, response.id());
        assertEquals("Notification created", response.message());

        verify(userRepository, times(1)).findById(1L);
        verify(notificationRepository, times(1)).save(any(Notification.class));

        verifyNoMoreInteractions(userRepository);
        verifyNoMoreInteractions(notificationRepository);
    }

    // ---- add : user not found ----
    @Test
    void addTest_UserNotFound() {
        NotificationReqDto dto = new NotificationReqDto("Welcome", NotificationType.SYSTEM);

        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.add(99L, dto));

        verify(userRepository, times(1)).findById(99L);
        verifyNoMoreInteractions(notificationRepository);
    }

    // ---- getByUserId : valid ----
    @Test
    void getByUserIdTest() {
        User user = new User();
        user.setId(1L);
        user.setUsername("john");

        NotificationRespDto dto1 = new NotificationRespDto(1L, 1L, "Message 1", NotificationType.SYSTEM, false, Instant.now());
        NotificationRespDto dto2 = new NotificationRespDto(2L, 1L, "Message 2", NotificationType.NEW_MESSAGE, false, Instant.now());

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.getByUserId(1L)).thenReturn(List.of(dto1, dto2));

        assertEquals(2, notificationService.getByUserId(1L, "john").size());

        verify(userRepository, times(1)).findById(1L);
        verify(notificationRepository, times(1)).getByUserId(1L);

        verifyNoMoreInteractions(userRepository);
        verifyNoMoreInteractions(notificationRepository);
    }

    // ---- getByUserId : reading someone else's notifications ----
    @Test
    void getByUserIdTest_NotOwner() {
        User user = new User();
        user.setId(1L);
        user.setUsername("john");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(OwnershipException.class,
                () -> notificationService.getByUserId(1L, "someoneElse"));

        verifyNoMoreInteractions(notificationRepository);
    }

    // ---- markRead : valid ----
    @Test
    void markReadTest() {
        User user = new User();
        user.setUsername("john");
        Notification notification = new Notification();
        notification.setId(3L);
        notification.setUser(user);
        notification.setRead(false);

        when(notificationRepository.findById(3L)).thenReturn(Optional.of(notification));

        notificationService.markRead(3L, "john");

        // notification must be marked as read
        assertTrue(notification.isRead());

        verify(notificationRepository, times(1)).findById(3L);
        verify(notificationRepository, times(1)).save(notification);

        verifyNoMoreInteractions(notificationRepository);
    }

    // ---- markRead : not the owner ----
    @Test
    void markReadTest_NotOwner() {
        User user = new User();
        user.setUsername("john");
        Notification notification = new Notification();
        notification.setId(3L);
        notification.setUser(user);

        when(notificationRepository.findById(3L)).thenReturn(Optional.of(notification));

        assertThrows(OwnershipException.class,
                () -> notificationService.markRead(3L, "someoneElse"));

        verify(notificationRepository, times(0)).save(notification);
    }

    // ---- markRead : not found ----
    @Test
    void markReadTest_NotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationService.markRead(99L, "john"));

        verify(notificationRepository, times(1)).findById(99L);
        verifyNoMoreInteractions(notificationRepository);
    }

    // ---- deleteById : valid ----
    @Test
    void deleteByIdTest() {
        User user = new User();
        user.setUsername("john");
        Notification notification = new Notification();
        notification.setId(3L);
        notification.setUser(user);

        when(notificationRepository.findById(3L)).thenReturn(Optional.of(notification));

        notificationService.deleteById(3L, "john");

        verify(notificationRepository, times(1)).findById(3L);
        verify(notificationRepository, times(1)).delete(notification);

        verifyNoMoreInteractions(notificationRepository);
    }

    // ---- deleteById : not the owner ----
    @Test
    void deleteByIdTest_NotOwner() {
        User user = new User();
        user.setUsername("john");
        Notification notification = new Notification();
        notification.setId(3L);
        notification.setUser(user);

        when(notificationRepository.findById(3L)).thenReturn(Optional.of(notification));

        assertThrows(OwnershipException.class,
                () -> notificationService.deleteById(3L, "someoneElse"));

        verify(notificationRepository, times(0)).delete(notification);
    }

    // ---- notifyUser ----
    @Test
    void notifyUserTest() {
        User user = new User();
        user.setId(1L);

        notificationService.notifyUser(user, "Your employer account is verified", NotificationType.SYSTEM);

        verify(notificationRepository, times(1)).save(any(Notification.class));

        verifyNoMoreInteractions(notificationRepository);
    }

    @Test
    void deleteByIdTest_NotFound() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> notificationService.deleteById(1L, "john"));
        verify(notificationRepository, times(0)).delete(any(Notification.class));
    }
}