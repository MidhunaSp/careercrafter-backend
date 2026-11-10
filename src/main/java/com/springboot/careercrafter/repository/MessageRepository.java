package com.springboot.careercrafter.repository;

import com.springboot.careercrafter.dto.response.MessageRespDto;
import com.springboot.careercrafter.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // m = message, s = sender, r = receiver, ja = job application (optional, so LEFT JOIN)

    // messages received by the user
    @Query("""
            select new com.springboot.careercrafter.dto.response.MessageRespDto(
                m.id, s.id, s.username, r.id, r.username, m.content, m.isRead, m.sentAt, ja.id)
            from Message m
            JOIN m.sender s
            JOIN m.receiver r
            LEFT JOIN m.jobApplication ja
            where r.id = ?1
            order by m.sentAt desc
            """)
    List<MessageRespDto> getInbox(Long userId);

    // messages sent by the user
    @Query("""
            select new com.springboot.careercrafter.dto.response.MessageRespDto(
                m.id, s.id, s.username, r.id, r.username, m.content, m.isRead, m.sentAt, ja.id)
            from Message m
            JOIN m.sender s
            JOIN m.receiver r
            LEFT JOIN m.jobApplication ja
            where s.id = ?1
            order by m.sentAt desc
            """)
    List<MessageRespDto> getSent(Long userId);

    // chat between two users, oldest first
    @Query("""
            select new com.springboot.careercrafter.dto.response.MessageRespDto(
                m.id, s.id, s.username, r.id, r.username, m.content, m.isRead, m.sentAt, ja.id)
            from Message m
            JOIN m.sender s
            JOIN m.receiver r
            LEFT JOIN m.jobApplication ja
            where (s.id = ?1 and r.id = ?2) or (s.id = ?2 and r.id = ?1)
            order by m.sentAt asc
            """)
    List<MessageRespDto> getConversation(Long user1, Long user2);

    @Modifying
    @Query("update Message m set m.jobApplication = null where m.jobApplication.id = ?1")
    void detachFromApplication(Long jobApplicationId);
}