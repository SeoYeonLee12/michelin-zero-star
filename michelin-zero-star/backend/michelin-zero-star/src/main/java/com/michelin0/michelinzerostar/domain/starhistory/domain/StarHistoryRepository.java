package com.michelin0.michelinzerostar.domain.starhistory.domain;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StarHistoryRepository extends JpaRepository<StarHistory, Long> {

    default long countByUserAndDateBetween(User user) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        return countByUserAndCreatedAtBetween(user, startOfDay, endOfDay);
    }

    long countByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);
}
