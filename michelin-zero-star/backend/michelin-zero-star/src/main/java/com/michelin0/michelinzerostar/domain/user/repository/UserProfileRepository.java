package com.michelin0.michelinzerostar.domain.user.repository;

import com.michelin0.michelinzerostar.domain.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

}