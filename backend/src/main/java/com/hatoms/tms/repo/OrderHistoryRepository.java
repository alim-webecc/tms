package com.hatoms.tms.repo;

import com.hatoms.tms.entity.OrderHistory;
import com.hatoms.tms.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderHistoryRepository extends JpaRepository<OrderHistory, Long> {

  List<OrderHistory> findByOrderOrderIdOrderByTimestampDesc(Integer orderId);

  List<OrderHistory> findByUsernameAndTimestampBetweenOrderByTimestampDesc(
      String username, OffsetDateTime from, OffsetDateTime to);

  // ! NEU: "neuester" IN_PROGRESS-Eintrag = aktueller Owner
  Optional<OrderHistory> findFirstByOrderOrderIdAndStatusOrderByTimestampDesc(
      Integer orderId, OrderStatus status);
}
