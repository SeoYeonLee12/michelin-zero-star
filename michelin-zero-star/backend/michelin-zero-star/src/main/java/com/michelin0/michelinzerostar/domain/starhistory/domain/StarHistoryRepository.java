package com.michelin0.michelinzerostar.domain.starhistory.domain;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StarHistoryRepository extends JpaRepository<StarHistory, Long> {

    int countByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);
}
