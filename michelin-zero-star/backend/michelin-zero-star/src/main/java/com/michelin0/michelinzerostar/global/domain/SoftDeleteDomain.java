package com.michelin0.michelinzerostar.global.domain;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

// BaseDomain을 상속받아 시간 정보에 더해 삭제일시(deletedAt) 를 추가로 관리하는 클래스
@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class SoftDeleteDomain extends BaseDomain {

    private LocalDateTime deletedAt;
}
