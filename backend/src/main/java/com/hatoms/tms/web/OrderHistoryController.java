package com.hatoms.tms.web;

import com.hatoms.tms.entity.OrderHistory;
import com.hatoms.tms.repo.OrderHistoryRepository;
import com.hatoms.tms.repo.OrderRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderHistoryController {

  private final OrderRepository orders;
  private final OrderHistoryRepository histories;

  public OrderHistoryController(OrderRepository orders, OrderHistoryRepository histories) {
    this.orders = orders;
    this.histories = histories;
  }

  public record HistoryDto(Integer orderId, String action, String status, OffsetDateTime timestamp, String username) {
    static HistoryDto from(OrderHistory h){
      return new HistoryDto(
          h.getOrder().getOrderId(),
          h.getAction(),
          h.getStatus() != null ? h.getStatus().name() : null,
          h.getTimestamp(),
          h.getUsername()
      );
    }
  }

  // History einer Order
  @GetMapping("/orders/{id}/history")
  public ResponseEntity<List<HistoryDto>> byOrder(@PathVariable Integer id){
    if (!orders.existsById(id)) return ResponseEntity.notFound().build();
    var list = histories.findByOrderOrderIdOrderByTimestampDesc(id).stream()
        .map(HistoryDto::from).toList();
    return ResponseEntity.ok(list);
  }

  // Admin: Historie eines Mitarbeiters im Zeitraum
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/admin/history")
  public ResponseEntity<List<HistoryDto>> byUserAndRange(
      @RequestParam String username,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
  ) {
    // Defaults: aktueller Monat (1. Tag 00:00 bis jetzt)
    if (from == null && to == null) {
      var now = OffsetDateTime.now();
      from = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
      to = now;
    } else if (from != null && to == null) {
      to = OffsetDateTime.now();
    } else if (from == null) {
      // nur 'to' gesetzt -> vom Monatsanfang des 'to'-Monats bis 'to'
      from = to.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
    }

    var list = histories
        .findByUsernameAndTimestampBetweenOrderByTimestampDesc(username, from, to)
        .stream().map(HistoryDto::from).toList();
    return ResponseEntity.ok(list);
  }
}
