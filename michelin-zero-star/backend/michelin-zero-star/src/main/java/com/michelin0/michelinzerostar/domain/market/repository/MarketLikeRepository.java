package com.michelin0.michelinzerostar.domain.market.repository;

import com.michelin0.michelinzerostar.domain.market.entity.MarketLike;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketLikeRepository extends JpaRepository<MarketLike, Long> {

    Optional<MarketLike> findByUserAndMarketPost(User user, MarketPost marketPost);

    long countByMarketPost(MarketPost marketPost);
}