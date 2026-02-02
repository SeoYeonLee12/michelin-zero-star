package com.michelin0.michelinzerostar.domain.market.repository;

import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MarketPostRepository extends JpaRepository<MarketPost, Long> {

    List<MarketPost> findAllByOrderByCreatedAtDesc();

    @Query("SELECT p FROM MarketPost p JOIN FETCH p.writer WHERE p.id = :id")
    Optional<MarketPost> findByIdWithWriter(@Param("id") Long id);

    @Query(value = "SELECT * FROM market_posts WHERE market_posts_id = :id", nativeQuery = true)
    Optional<MarketPost> findByIdIncludeDeleted(@Param("id") Long id);

    @Query(value = "SELECT * FROM market_posts " +
            "WHERE ST_Distance_Sphere(POINT(longitude, latitude), POINT(:myLon, :myLat)) <= :radius " +
            "AND deleted_at IS NULL " +
            "ORDER BY created_at DESC",
            nativeQuery = true)
    List<MarketPost> findNearbyPosts(@Param("myLat") BigDecimal myLat,
            @Param("myLon") BigDecimal myLon,
            @Param("radius") Double radius);

    @Query("SELECT p FROM MarketPost p " +
            "JOIN MarketLike l ON p.id = l.marketPost.id " +
            "WHERE l.user.id = :userId " +
            "ORDER BY l.createdAt DESC")
    List<MarketPost> findLikedPostsByUserId(@Param("userId") Long userId);
}