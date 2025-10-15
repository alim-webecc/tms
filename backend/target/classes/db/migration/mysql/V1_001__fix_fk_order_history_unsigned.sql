-- Align order_history.order_id (INT UNSIGNED) und FK korrekt setzen

-- ggf. bestehenden FK-Namen ermitteln
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_history'
    AND COLUMN_NAME = 'order_id'
    AND REFERENCED_TABLE_NAME = 'orders'
  LIMIT 1
);

-- FK droppen, falls vorhanden
SET @sql := IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE order_history DROP FOREIGN KEY ', @fk));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Spaltentyp angleichen
ALTER TABLE order_history
  MODIFY COLUMN order_id INT UNSIGNED NOT NULL;

-- FK wieder anlegen
ALTER TABLE order_history
  ADD CONSTRAINT fk_order_history_order
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
