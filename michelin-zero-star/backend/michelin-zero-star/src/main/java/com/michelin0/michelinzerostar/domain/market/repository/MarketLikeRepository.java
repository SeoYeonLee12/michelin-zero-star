package com.michelin0.michelinzerostar.domain.market.repository;

import com.michelin0.michelinzerostar.domain.market.entity.MarketLike;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface MarketLikeRepository extends JpaRepository<MarketLike, Long> {

    Optional<MarketLike> findByUserAndMarketPost(User user, MarketPost marketPost);

    long countByMarketPost(MarketPost marketPost);

    // 내가 찜한 목록 조회 (최신순)
    @Query("SELECT ml FROM MarketLike ml " +
            "JOIN FETCH ml.marketPost mp " +
            "WHERE ml.user.id = :userId " +
            "AND mp.deletedAt IS NULL " +
            "ORDER BY ml.createdAt DESC")
    List<MarketLike> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}