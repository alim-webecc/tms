
package com.thspedition.repo;
import com.thspedition.entity.Order;
import com.thspedition.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderRepository extends JpaRepository<Order, Integer> {
  List<Order> findByStatusOrderByOrderIdDesc(OrderStatus status);
  List<Order> findAllByOrderByOrderIdDesc();
}
