
# TH Spedition – Spring Boot Backend

## Projekt starten
1. `src/main/resources/application.yml` anpassen (MySQL Zugang).
2. **MySQL DDL** unten in Workbench ausführen (Schema + Tabellen + AUTO_INCREMENT).
3. `mvn spring-boot:run` starten.
4. Default-User werden beim ersten Start erzeugt:
   - admin / admin123 (ADMIN)
   - user / user123 (MITARBEITER)

## MySQL DDL
```sql
CREATE DATABASE IF NOT EXISTS th_spedition CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE th_spedition;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(120) NOT NULL,
  role ENUM('ADMIN','MITARBEITER') NOT NULL DEFAULT 'MITARBEITER'
);

CREATE TABLE IF NOT EXISTS orders (
  order_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  auftragsgeber VARCHAR(120) NOT NULL,
  ladedatum DATE NULL,
  von_plz VARCHAR(10) NULL,
  entladedatum DATE NULL,
  nach_plz VARCHAR(10) NULL,
  preis_kunde DECIMAL(12,2) NULL,
  preis_ff DECIMAL(12,2) NULL,
  frachtfuehrer VARCHAR(120) NULL,
  ldm DECIMAL(6,2) NULL,
  gewicht DECIMAL(12,2) NULL,
  bemerkung TEXT NULL,
  details TEXT NULL,
  status ENUM('OPEN','IN_PROGRESS','CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE orders AUTO_INCREMENT = 10000000;
```

> IDs sind dadurch **einzigartig, 8-stellig** (Start bei 10 Mio.) und werden nach Löschen nicht neu vergeben.

## API
- `POST /api/auth/login` → `{token, role, username}`
- `GET /api/orders?status=OPEN|IN_PROGRESS|CLOSED`
- `GET /api/orders/{id}`
- `POST /api/orders` (erstellen)
- `PUT /api/orders/{id}` (bearbeiten)
- `DELETE /api/orders/{id}` (nur ADMIN)
