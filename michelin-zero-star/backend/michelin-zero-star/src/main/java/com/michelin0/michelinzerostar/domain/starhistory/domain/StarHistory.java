package com.michelin0.michelinzerostar.domain.starhistory.domain;

import com.michelin0.michelinzerostar.domain.starhistory.domain.enums.GainType;
import com.michelin0.michelinzerostar.domain.user.entity.User;
import com.michelin0.michelinzerostar.global.domain.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(name = "star_history")
@Entity
public class StarHistory extends BaseDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "star_history_id")
    private Long historyId;

    @ManyToOne
    @JoinColumn(name = "users_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    GainType type;

    @Column(name = "amount", nullable = false)
    Double starAmount;

    public StarHistory(User user, GainType type, Double starAmount) {
        this.user = user;
        this.type = type;
        this.starAmount = starAmount;
    }
}
