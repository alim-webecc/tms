package com.hatoms.tms.entity;

import com.hatoms.tms.model.OrderStatus;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "order_history")
public class OrderHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OrderStatus status;

  @Column(nullable = false)
  private OffsetDateTime timestamp;

  @Column(nullable = false, length = 100)
  private String username;

  @Column(length = 64)
  private String action; // CREATED | UPDATED | STATUS_CHANGED

  // --- Convenience-Factory ---
  public static OrderHistory of(Order o, OrderStatus s, String user, String action) {
    OrderHistory h = new OrderHistory();
    h.setOrder(o);
    h.setStatus(s != null ? s : OrderStatus.OPEN);
    h.setUsername(user != null ? user : "system");
    h.setAction(action);
    h.setTimestamp(OffsetDateTime.now());
    return h;
  }

  // --- Getter/Setter ---
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Order getOrder() { return order; }
  public void setOrder(Order order) { this.order = order; }

  public OrderStatus getStatus() { return status; }
  public void setStatus(OrderStatus status) { this.status = status; }

  public OffsetDateTime getTimestamp() { return timestamp; }
  public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public String getAction() { return action; }
  public void setAction(String action) { this.action = action; }
}
