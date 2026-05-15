-- Миграция: order_items.product_id ON DELETE SET NULL
--
-- Проблема: при попытке удалить товар который был в заказах — Postgres
-- бросает foreign_key_violation (код 23503), API возвращает 409, UI
-- показывает "Товар нельзя удалить — он есть в существующих заказах".
--
-- Решение: меняем FK constraint так чтобы при удалении товара ссылка в
-- order_items.product_id обнулилась, а текстовые product_name/article/photo
-- (которые мы сохраняем в order_items копией для историчности) остались.
--
-- Безопасно: история заказов целая, продавец видит что Иванов купил
-- "Тумба ЛДСП 140*60*70см беж" даже после удаления товара из каталога.

-- 1. Снять старый constraint
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- 2. Создать новый с ON DELETE SET NULL
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- 3. Проверка
SELECT conname, confdeltype FROM pg_constraint
WHERE conrelid = 'order_items'::regclass
  AND conname = 'order_items_product_id_fkey';
-- Должно вернуть confdeltype='n' (SET NULL). Расшифровка:
--   'a' = NO ACTION (по умолчанию)
--   'r' = RESTRICT
--   'c' = CASCADE
--   'n' = SET NULL
--   'd' = SET DEFAULT
