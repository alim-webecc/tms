package com.hatoms.tms.web;

import com.hatoms.tms.entity.Order;
import com.hatoms.tms.entity.OrderHistory;
import com.hatoms.tms.model.OrderStatus;
import com.hatoms.tms.repo.OrderHistoryRepository;
import com.hatoms.tms.repo.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

  private final OrderRepository orders;
  private final OrderHistoryRepository histories;

  public OrderController(OrderRepository orders, OrderHistoryRepository histories) {
    this.orders = orders;
    this.histories = histories;
  }

  @GetMapping
  public List<Order> list(@RequestParam(value="status", required=false) OrderStatus status){
    if (status == null) return orders.findAllByOrderByOrderIdDesc();
    return orders.findByStatusOrderByOrderIdDesc(status);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Order> get(@PathVariable Integer id){
    return orders.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<Order> create(@Valid @RequestBody Order input, Principal principal){
    input.setOrderId(null);
    if (input.getStatus() == null) input.setStatus(OrderStatus.OPEN);
    Order saved = orders.save(input);
    histories.save(OrderHistory.of(saved, saved.getStatus(), principal!=null?principal.getName():"system", "CREATED"));
    return ResponseEntity.created(URI.create("/api/orders/" + saved.getOrderId())).body(saved);
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(@PathVariable Integer id,
                                  @Valid @RequestBody Order input,
                                  Principal principal,
                                  Authentication auth){
    return orders.findById(id).map(existing -> {
      final String currentUser = principal != null ? principal.getName() : "system";
      final boolean isAdmin = auth != null && auth.getAuthorities().stream()
          .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()));

      final OrderStatus beforeStatus = existing.getStatus();

      // --- Nicht-Admins: Regeln je Status ---
      if (!isAdmin) {
        if (beforeStatus == OrderStatus.CLOSED) {
          return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Geschlossene Aufträge dürfen nur Admins ändern.");
        }
        if (beforeStatus == OrderStatus.IN_PROGRESS) {
          var ownerOpt = histories.findFirstByOrderOrderIdAndStatusOrderByTimestampDesc(id, OrderStatus.IN_PROGRESS);
          if (ownerOpt.isEmpty() || ownerOpt.get().getUsername()==null
              || !ownerOpt.get().getUsername().equalsIgnoreCase(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bearbeitung nicht erlaubt (nicht Besitzer).");
          }
          // Statuswechsel durch Nicht-Admin auch als Owner NICHT zulassen
          if (input.getStatus()!=null && input.getStatus()!=beforeStatus) {
            input.setStatus(beforeStatus);
          }
        }
        // before = OPEN -> ok
      }

      // --- Vorher/Nachher vergleichen (für Aktionsermittlung) ---
      boolean changedNonStatus =
          !Objects.equals(existing.getAuftragsgeber(), input.getAuftragsgeber()) ||
          !Objects.equals(existing.getLadedatum(), input.getLadedatum()) ||
          !Objects.equals(existing.getVonPlz(), input.getVonPlz()) ||
          !Objects.equals(existing.getEntladedatum(), input.getEntladedatum()) ||
          !Objects.equals(existing.getNachPlz(), input.getNachPlz()) ||
          !Objects.equals(existing.getPreisKunde(), input.getPreisKunde()) ||
          !Objects.equals(existing.getPreisFf(), input.getPreisFf()) ||
          !Objects.equals(existing.getFrachtfuehrer(), input.getFrachtfuehrer()) ||
          !Objects.equals(existing.getLdm(), input.getLdm()) ||
          !Objects.equals(existing.getGewicht(), input.getGewicht()) ||
          !Objects.equals(existing.getBemerkung(), input.getBemerkung()) ||
          !Objects.equals(existing.getDetails(), input.getDetails());

      boolean wantedStatusChange = input.getStatus()!=null && input.getStatus()!=beforeStatus;

      // --- Felder übernehmen ---
      existing.setAuftragsgeber(input.getAuftragsgeber());
      existing.setLadedatum(input.getLadedatum());
      existing.setVonPlz(input.getVonPlz());
      existing.setEntladedatum(input.getEntladedatum());
      existing.setNachPlz(input.getNachPlz());
      existing.setPreisKunde(input.getPreisKunde());
      existing.setPreisFf(input.getPreisFf());
      existing.setFrachtfuehrer(input.getFrachtfuehrer());
      existing.setLdm(input.getLdm());
      existing.setGewicht(input.getGewicht());
      existing.setBemerkung(input.getBemerkung());
      existing.setDetails(input.getDetails());

      if (input.getStatus()!=null && input.getStatus()!=existing.getStatus()) {
        // Admin immer; Mitarbeiter nur wenn vorher OPEN (s. Regeln oben)
        if (isAdmin || beforeStatus==OrderStatus.OPEN) {
          existing.setStatus(input.getStatus());
        }
      }

      Order saved = orders.save(existing);

      // --- Aktion bestimmen ---
      boolean statusChanged = beforeStatus != saved.getStatus();
      String action = statusChanged && changedNonStatus ? "EDITED"
          : statusChanged ? "STATUS_CHANGED"
          : changedNonStatus ? "UPDATED"
          : "UPDATED";

      histories.save(OrderHistory.of(saved, saved.getStatus(), currentUser, action));
      return ResponseEntity.ok(saved);
    }).orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> delete(@PathVariable Integer id){
    if (!orders.existsById(id)) return ResponseEntity.notFound().build();
    orders.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
