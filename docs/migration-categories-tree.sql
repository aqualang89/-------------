-- Миграция: плоские категории → дерево
-- Выполнить в SQL Editor Supabase

-- 1. Добавляем колонки для дерева
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- 2. Добавляем флаг is_new для товаров
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE;

-- 3. Все существующие категории становятся корневыми (level 1)
UPDATE categories SET parent_id = NULL, level = 1 WHERE parent_id IS NULL AND level IS NULL;

-- 4. Индекс для скорости поиска по parent_id
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
