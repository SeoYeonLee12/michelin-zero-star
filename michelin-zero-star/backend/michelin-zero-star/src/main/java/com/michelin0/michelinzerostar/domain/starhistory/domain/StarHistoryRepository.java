package com.michelin0.michelinzerostar.domain.starhistory.domain;

import com.michelin0.michelinzerostar.domain.user.entity.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StarHistoryRepository extends JpaRepository<StarHistory, Long> {

    default long countByUserAndDateBetween(User user) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        return countByUserAndCreatedAtBetween(user, startOfDay, endOfDay);
    }

    long countByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(sh.starAmount), 0) FROM StarHistory sh WHERE sh.user.id = :userId AND sh.createdAt BETWEEN :start AND :end")
    double sumRewardAmountByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    default double sumRewardAmountByUserAndDateBetween(User user) {
        // KST 기준 현재 날짜 가져오기
        LocalDate todayKst = LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
        
        // KST 기준 하루 시작/끝 시간 (00:00:00 ~ 23:59:59.999999999)
        java.time.ZonedDateTime startOfDayKst = todayKst.atStartOfDay(java.time.ZoneId.of("Asia/Seoul"));
        java.time.ZonedDateTime endOfDayKst = todayKst.atTime(LocalTime.MAX).atZone(java.time.ZoneId.of("Asia/Seoul"));
        
        // 검색용 LocalDateTime으로 변환 (DB가 UTC라면 여기서 변환된 값을 사용해야 함. 
        // 하지만 JPA가 LocalDateTime을 그대로 보내면 DB 설정에 따름. 
        // 보통 'Timestamp'는 UTC 저장이 표준. 
        // 안전하게 toLocalDateTime()만 쓰면 '값'만 가져가므로, Zone 정보를 소실하고 서버 기본 시간대로 해석됨.
        // 따라서, DB에 UTC로 저장된다고 가정하면, KST 시간을 UTC Instant로 변환해서 비교하는 것이 가장 정확함.
        // 그러나 여기선 Repository 정의가 LocalDateTime을 받으므로, KST ZoneDateTime을 
        // 로컬 서버의 시스템 Zone에 맞는 LocalDateTime으로 '시각적' 변환을 하거나,
        // 아니면 그냥 KST 시간을 LocalDateTime으로 넘기고 DB 세션이 KST이길 기대해야 함.
        
        // !중요! 가장 확실한 방법: Repository 메서드를 LocalDateTime 대신 timestamp 비교나 ZonedDateTime 지원으로 바꾸는 것.
        // 하지만 코드 수정을 최소화하기 위해, 여기서는 "서버가 UTC라면" 가정하에 KST 00:00을 UTC LocalDateTime으로 변환해 넘깁니다.
        
        // Local environment usually stores @CreatedDate in system timezone (KST).
        // Converting to UTC might cause mismatches if the DB isn't strictly UTC.
        // We will query using the KST LocalDateTime values directly.
        LocalDateTime startKstLocal = startOfDayKst.toLocalDateTime();
        LocalDateTime endKstLocal = endOfDayKst.toLocalDateTime();
        
        System.out.println("DEBUG: Calculating stars for user " + user.getId());
        System.out.println("DEBUG: Querying DB with range: " + startKstLocal + " ~ " + endKstLocal);

        return sumRewardAmountByUserIdAndCreatedAtBetween(user.getId(), startKstLocal, endKstLocal);
    }
}
