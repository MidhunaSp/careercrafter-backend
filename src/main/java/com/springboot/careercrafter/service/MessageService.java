package com.springboot.careercrafter.service;

import com.springboot.careercrafter.dto.request.MessageReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.MessageRespDto;
import com.springboot.careercrafter.enums.NotificationType;
import com.springboot.careercrafter.exception.InvalidCallException;
import com.springboot.careercrafter.exception.OwnershipException;
import com.springboot.careercrafter.exception.ResourceNotFoundException;
import com.springboot.careercrafter.model.JobApplication;
import com.springboot.careercrafter.model.Message;
import com.springboot.careercrafter.model.User;
import com.springboot.careercrafter.repository.JobApplicationRepository;
import com.springboot.careercrafter.repository.MessageRepository;
import com.springboot.careercrafter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final NotificationService notificationService;

    private static final String USER_NOT_FOUND = "User not found";

    public CreatedRespDto add(Long senderId, Long receiverId, Long jobApplicationId,
                              MessageReqDto dto, String loggedInUsername) {

        // step 1: sender and receiver must be two different users
        if (senderId.equals(receiverId))
            throw new InvalidCallException("Sender and receiver cannot be the same user");

        // step 2: fetch sender and receiver from db
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender id invalid & User not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver id invalid & User not found"));

        // step 3: check that the logged-in user is the sender
        if (!sender.getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can send messages only as yourself");

        // step 4: job application is optional, fetch it only if the id is given
        JobApplication jobApplication = null;
        if (jobApplicationId != null) {
            jobApplication = jobApplicationRepository.findById(jobApplicationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Job application id invalid & Application not found"));
        }

        // step 5: prepare message entity, mark it unread and save it
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setJobApplication(jobApplication);
        message.setContent(dto.content());
        message.setRead(false); // Lombok: boolean isRead -> setRead()

        notificationService.notifyUser(receiver,
                "New message from " + sender.getUsername(),
                NotificationType.NEW_MESSAGE);

        message = messageRepository.save(message);
        log.info("Message sent: from={} to={}", senderId, receiverId);
        return new CreatedRespDto(message.getId(), "Message sent");
    }

    public List<MessageRespDto> getInbox(Long userId, String loggedInUsername) {
        checkUser(userId, loggedInUsername);
        return messageRepository.getInbox(userId);
    }

    public List<MessageRespDto> getSent(Long userId, String loggedInUsername) {
        checkUser(userId, loggedInUsername);
        return messageRepository.getSent(userId);
    }

    public List<MessageRespDto> getConversation(Long user1, Long user2, String loggedInUsername) {
        User first = userRepository.findById(user1)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));
        User second = userRepository.findById(user2)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));

        // the logged-in user must be one of the two people in the chat
        if (!first.getUsername().equals(loggedInUsername) && !second.getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can read only your own conversations");

        return messageRepository.getConversation(user1, user2);
    }

    public void markRead(Long id, String loggedInUsername) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        // only the receiver can mark a message as read
        if (!message.getReceiver().getUsername().equals(loggedInUsername))
            throw new OwnershipException("Only the receiver can mark a message as read");

        message.setRead(true);
        messageRepository.save(message);
    }

    public void deleteById(Long id, String loggedInUsername) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        // only the sender or the receiver can delete a message
        if (!message.getSender().getUsername().equals(loggedInUsername)
                && !message.getReceiver().getUsername().equals(loggedInUsername))
            throw new OwnershipException("This message does not belong to you");

        messageRepository.delete(message);
        log.info("Message deleted: id={} by {}", id, loggedInUsername);
    }

    private void checkUser(Long userId, String loggedInUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));
        if (!user.getUsername().equals(loggedInUsername))
            throw new OwnershipException("You can read only your own messages");
    }
}