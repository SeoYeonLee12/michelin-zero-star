package com.michelin0.michelinzerostar.domain.market.repository;

import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MarketPostRepository extends JpaRepository<MarketPost, Long> {

    // 기존 메서드들 유지
    List<MarketPost> findAllByOrderByCreatedAtDesc();

    @Query(value = "SELECT * FROM market_posts WHERE market_posts_id = :id", nativeQuery = true)
    Optional<MarketPost> findByIdIncludeDeleted(@Param("id") Long id);

    // 반경 N 미터 이내 게시글 조회 (Native Query)
    // ST_Distance_Sphere(점1, 점2) : 두 지점 사이의 구면 거리(단위: m)를 반환
    // POINT(경도, 위도) 순서 주의
    @Query(value = "SELECT * FROM market_posts " +
            "WHERE ST_Distance_Sphere(POINT(longitude, latitude), POINT(:myLon, :myLat)) <= :radius "
            +
            "AND deleted_at IS NULL " + // 삭제된 글은 제외
            "ORDER BY created_at DESC",
            nativeQuery = true)
    List<MarketPost> findNearbyPosts(@Param("myLat") Double myLat,
            @Param("myLon") Double myLon,
            @Param("radius") Double radius);
}