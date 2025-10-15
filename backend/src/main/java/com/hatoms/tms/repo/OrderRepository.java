
package com.hatoms.tms.repo;
import com.hatoms.tms.entity.Order;
import com.hatoms.tms.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderRepository extends JpaRepository<Order, Integer> {
  List<Order> findByStatusOrderByOrderIdDesc(OrderStatus status);
  List<Order> findAllByOrderByOrderIdDesc();
}
