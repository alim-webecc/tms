-- SCHEMA: Basis-Tabellen (portabel für PG)
-- Datentyp-Entscheidungen:
-- - IDs als BIGSERIAL (alias: BIGINT + identity); in JPA als Long.
-- - Zeit: TIMESTAMPTZ (UTC).
-- - Geld: NUMERIC(12,2).
-- - Strings: VARCHAR(...) oder TEXT.

CREATE TABLE IF NOT EXISTS users (
  id           BIGSERIAL PRIMARY KEY,
  username     VARCHAR(100) NOT NULL UNIQUE,
  email        VARCHAR(255),
  password_hash TEXT        NOT NULL,
  roles        VARCHAR(255) NOT NULL DEFAULT 'USER',
  active       BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  order_id     BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT       REFERENCES customers(id),
  status       VARCHAR(50)  NOT NULL DEFAULT 'OPEN',
  load_date    TIMESTAMPTZ,
  unload_date  TIMESTAMPTZ,
  from_zip     VARCHAR(10),
  to_zip       VARCHAR(10),
  price_customer NUMERIC(12,2),
  price_carrier  NUMERIC(12,2),
  carrier      VARCHAR(255),
  ldm          NUMERIC(8,2),
  weight       NUMERIC(12,3),
  note         TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_history (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT      NOT NULL REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  status       VARCHAR(50) NOT NULL,
  action       VARCHAR(100),
  at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  by_user      BIGINT      REFERENCES users(id)
);

-- Indizes (Performance)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id);
