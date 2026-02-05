package com.michelin0.michelinzerostar.domain.user.repository;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.domain.user.entity.UserFavoriteCategory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserFavoriteCategoryRepository extends JpaRepository<UserFavoriteCategory, Long> {

    List<UserFavoriteCategory> findAllByUserId(Long userId);

    void deleteByUserId(Long userId);

    @Query("SELECT ufc.category.categoryName  FROM UserFavoriteCategory ufc WHERE ufc.user = :user")
    List<String> findCategoryNamesByUser(@Param("user") User user);
}