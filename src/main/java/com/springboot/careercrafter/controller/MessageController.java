package com.springboot.careercrafter.controller;

import com.springboot.careercrafter.dto.request.MessageReqDto;
import com.springboot.careercrafter.dto.response.CreatedRespDto;
import com.springboot.careercrafter.dto.response.MessageRespDto;
import com.springboot.careercrafter.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MessageController {

    private final MessageService messageService;

    // jobApplicationId is optional  ->  /api/message/add/2/5?jobApplicationId=1
    @PostMapping("/api/message/add/{senderId}/{receiverId}")
    public CreatedRespDto add(@PathVariable Long senderId,
                              @PathVariable Long receiverId,
                              @RequestParam(value = "jobApplicationId", required = false) Long jobApplicationId,
                              @Valid @RequestBody MessageReqDto dto,
                              Principal principal) {
        return messageService.add(senderId,receiverId,jobApplicationId,dto,principal.getName());
    }

    @GetMapping("/api/message/inbox/{userId}")
    public List<MessageRespDto> getInbox(@PathVariable Long userId, Principal principal) {
        return messageService.getInbox(userId, principal.getName());
    }

    @GetMapping("/api/message/sent/{userId}")
    public List<MessageRespDto> getSent(@PathVariable Long userId, Principal principal) {
        return messageService.getSent(userId, principal.getName());
    }

    @GetMapping("/api/message/conversation")
    public List<MessageRespDto> getConversation(@RequestParam("user1") Long user1,
                                                @RequestParam("user2") Long user2,
                                                Principal principal) {
        return messageService.getConversation(user1, user2, principal.getName());
    }

    @PutMapping("/api/message/{id}/read")
    public void markRead(@PathVariable Long id, Principal principal) {
        messageService.markRead(id, principal.getName());
    }

    @DeleteMapping("/api/message/{id}")
    public void deleteById(@PathVariable Long id, Principal principal) {
        messageService.deleteById(id, principal.getName());
    }
}