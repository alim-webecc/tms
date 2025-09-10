
package com.thspedition.entity;

import com.thspedition.model.OrderStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity @Table(name="orders")
public class Order {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name="order_id")
  private Integer orderId;

  @Column(nullable=false, length=120) private String auftragsgeber;
  private LocalDate ladedatum;
  @Column(name="von_plz", length=10) private String vonPlz;
  private LocalDate entladedatum;
  @Column(name="nach_plz", length=10) private String nachPlz;
  @Column(name="preis_kunde", precision=12, scale=2) private BigDecimal preisKunde;
  @Column(name="preis_ff", precision=12, scale=2) private BigDecimal preisFf;
  @Column(length=120) private String frachtfuehrer;
  @Column(precision=6, scale=2) private BigDecimal ldm;
  @Column(precision=12, scale=2) private BigDecimal gewicht;
  @Column(columnDefinition="text") private String bemerkung;
  @Column(columnDefinition="text") private String details;
  @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private OrderStatus status = OrderStatus.OPEN;
  private OffsetDateTime createdAt; private OffsetDateTime updatedAt;

  @PrePersist public void prePersist(){ createdAt = OffsetDateTime.now(); updatedAt = createdAt; }
  @PreUpdate public void preUpdate(){ updatedAt = OffsetDateTime.now(); }

  public Integer getOrderId() { return orderId; } public void setOrderId(Integer orderId) { this.orderId = orderId; }
  public String getAuftragsgeber() { return auftragsgeber; } public void setAuftragsgeber(String auftragsgeber) { this.auftragsgeber = auftragsgeber; }
  public LocalDate getLadedatum() { return ladedatum; } public void setLadedatum(LocalDate ladedatum) { this.ladedatum = ladedatum; }
  public String getVonPlz() { return vonPlz; } public void setVonPlz(String vonPlz) { this.vonPlz = vonPlz; }
  public LocalDate getEntladedatum() { return entladedatum; } public void setEntladedatum(LocalDate entladedatum) { this.entladedatum = entladedatum; }
  public String getNachPlz() { return nachPlz; } public void setNachPlz(String nachPlz) { this.nachPlz = nachPlz; }
  public BigDecimal getPreisKunde() { return preisKunde; } public void setPreisKunde(BigDecimal preisKunde) { this.preisKunde = preisKunde; }
  public BigDecimal getPreisFf() { return preisFf; } public void setPreisFf(BigDecimal preisFf) { this.preisFf = preisFf; }
  public String getFrachtfuehrer() { return frachtfuehrer; } public void setFrachtfuehrer(String frachtfuehrer) { this.frachtfuehrer = frachtfuehrer; }
  public BigDecimal getLdm() { return ldm; } public void setLdm(BigDecimal ldm) { this.ldm = ldm; }
  public BigDecimal getGewicht() { return gewicht; } public void setGewicht(BigDecimal gewicht) { this.gewicht = gewicht; }
  public String getBemerkung() { return bemerkung; } public void setBemerkung(String bemerkung) { this.bemerkung = bemerkung; }
  public String getDetails() { return details; } public void setDetails(String details) { this.details = details; }
  public OrderStatus getStatus() { return status; } public void setStatus(OrderStatus status) { this.status = status; }
  public OffsetDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
  public OffsetDateTime getUpdatedAt() { return updatedAt; } public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
