package com.michelin0.michelinzerostar.domain.market.repository;

import com.michelin0.michelinzerostar.domain.market.entity.MarketComment;
import com.michelin0.michelinzerostar.domain.market.entity.MarketPost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketCommentRepository extends JpaRepository<MarketComment, Long> {

    List<MarketComment> findByMarketPostAndParentIsNullOrderByCreatedAtAsc(MarketPost marketPost);
}
