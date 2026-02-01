package com.michelin0.michelinzerostar.domain.user.repository;

import com.michelin0.michelinzerostar.domain.user.entity.UserFavoriteCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserFavoriteCategoryRepository extends JpaRepository<UserFavoriteCategory, Long> {

    List<UserFavoriteCategory> findAllByUserId(Long userId);

    void deleteByUserId(Long userId);
}